#!/usr/bin/env python3
"""
test_local.py

Script de prueba local para el Orquestador de Revisión Preliminar.
Permite probar cada módulo de forma aislada o el flujo completo
sin necesidad de Docker, AWS SAM ni despliegue en la nube.

Uso:
  # Probar solo extracción de texto con un archivo local
  python3 test_local.py --module extractor --file /ruta/al/archivo.pdf

  # Probar anonimizador sobre el texto extraído
  python3 test_local.py --module anonymizer --file /ruta/al/archivo.pdf

  # Probar Bedrock (requiere credenciales AWS configuradas)
  python3 test_local.py --module bedrock --file /ruta/al/archivo.pdf

  # Probar conexión con Nova local
  python3 test_local.py --module nova --envio-id 1

  # Probar OJS (requiere API Key real)
  python3 test_local.py --module ojs

  # Correr el flujo completo con un archivo local (sin descargar de OJS)
  python3 test_local.py --module full --file /ruta/al/archivo.pdf --envio-id 1

  # Correr el flujo completo real (consulta OJS + Bedrock + Nova)
  python3 test_local.py --module handler
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from dotenv import load_dotenv  # pip install python-dotenv

# ── Configurar path para importar módulos ─────────────────────────────────────
LAMBDA_DIR = Path(__file__).parent
sys.path.insert(0, str(LAMBDA_DIR))

# ── Cargar variables de entorno desde .env.local ─────────────────────────────
env_path = LAMBDA_DIR / ".env.local"
if env_path.exists():
    load_dotenv(env_path)
    print(f"✅ Variables cargadas desde {env_path}")
else:
    print(f"⚠️  No se encontró {env_path}. Usando variables del sistema.")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("test_local")

# ─────────────────────────────────────────────────────────────────────────────
# Colores para la consola
# ─────────────────────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):   print(f"{GREEN}✅ {msg}{RESET}")
def warn(msg): print(f"{YELLOW}⚠️  {msg}{RESET}")
def err(msg):  print(f"{RED}❌ {msg}{RESET}")
def info(msg): print(f"{CYAN}ℹ️  {msg}{RESET}")
def header(msg): print(f"\n{BOLD}{CYAN}{'─'*60}\n  {msg}\n{'─'*60}{RESET}")


# ─────────────────────────────────────────────────────────────────────────────
# Pruebas individuales de módulos
# ─────────────────────────────────────────────────────────────────────────────

def test_extractor(file_path: str):
    header("MÓDULO: Extractor de Texto")
    from modules.extractor import extract_text

    path = Path(file_path)
    if not path.exists():
        err(f"Archivo no encontrado: {file_path}")
        return None

    info(f"Procesando: {path.name} ({path.stat().st_size / 1024:.1f} KB)")
    file_bytes = path.read_bytes()

    try:
        text = extract_text(file_bytes, path.name)
        if text:
            ok(f"Texto extraído: {len(text)} caracteres, ~{len(text.split())} palabras")
            print(f"\n{BOLD}Primeras 500 caracteres:{RESET}")
            print("─" * 40)
            print(text[:500])
            print("─" * 40)
        else:
            warn("El texto extraído está vacío.")
        return text
    except Exception as e:
        err(f"Error en extractor: {e}")
        return None


def test_anonymizer(file_path: str):
    header("MÓDULO: Anonimizador")
    text = test_extractor(file_path)
    if not text:
        return

    from modules.anonymizer import analyze_and_anonymize
    try:
        anonymized, report = analyze_and_anonymize(text)
        print(f"\n{BOLD}Reporte de anonimato:{RESET}")
        report_dict = report.to_dict()
        print(json.dumps(report_dict, indent=2, ensure_ascii=False))

        if report.is_anonymous:
            ok("El manuscrito parece anónimo (sin identidades detectadas).")
        else:
            warn(f"Se detectaron elementos de identidad. Nivel de riesgo: {report.risk_level.upper()}")
    except Exception as e:
        err(f"Error en anonimizador: {e}")


def test_bedrock(file_path: str):
    header("MÓDULO: Amazon Bedrock (Claude 3.5 Sonnet)")

    # Verificar credenciales AWS
    if not (os.environ.get("AWS_ACCESS_KEY_ID") or _aws_cli_configured()):
        err("Credenciales AWS no configuradas. Ejecuta: aws configure")
        warn("Para probar sin Bedrock, usa: --module anonymizer")
        return

    text = test_extractor(file_path)
    if not text:
        return

    from modules.anonymizer import analyze_and_anonymize
    from modules.bedrock_client import BedrockClient

    anonymized, _ = analyze_and_anonymize(text)

    titulo = Path(file_path).stem.replace("_", " ").replace("-", " ").title()
    info(f"Enviando a Bedrock con título: '{titulo}'")
    info(f"Modelo: {os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')}")
    info(f"Texto a evaluar: {len(anonymized)} caracteres")

    try:
        client = BedrockClient()
        evaluation = client.evaluate_manuscript(
            texto_anonimizado=anonymized,
            titulo=titulo,
            resumen="(Resumen de prueba local — sin resumen disponible)",
        )
        ok("Evaluación de Bedrock completada:")
        print(json.dumps(evaluation, indent=2, ensure_ascii=False))
    except Exception as e:
        err(f"Error en Bedrock: {e}")


def test_nova(envio_id: int):
    header("MÓDULO: Cliente Nova")
    from modules.nova_client import NovaClient

    nova_url = os.environ.get("NOVA_API_URL", "http://localhost:3001")
    info(f"Conectando a Nova en: {nova_url}")

    try:
        client = NovaClient()

        # 1. Verificar si existe un reporte
        info(f"Verificando si existe reporte para envío #{envio_id}...")
        exists = client.report_exists(envio_id)
        if exists:
            ok(f"Ya existe un reporte para el envío #{envio_id}.")
        else:
            warn(f"No existe reporte para el envío #{envio_id}.")

        # 2. Enviar un reporte de prueba
        info("Enviando reporte de PRUEBA a Nova...")
        dummy_evaluation = {
            "score_scientific": 8,
            "score_originality": 7,
            "score_presentation": 9,
            "comments": "Este es un comentario de prueba local generado por test_local.py. En producción, este texto proviene de Claude 3.5 Sonnet via Amazon Bedrock.",
            "preliminary_recommendation": "REVISAR_MENOR",
            "key_strengths": ["Metodología sólida", "Buena revisión bibliográfica"],
            "key_weaknesses": ["Conclusiones poco desarrolladas"],
        }
        dummy_anonymity = {"risk_level": "bajo"}

        saved = client.save_report(envio_id, dummy_evaluation, dummy_anonymity)
        if saved:
            ok(f"Reporte de prueba guardado correctamente para envío #{envio_id}.")
            info("Revisa el panel del Revisor en la aplicación Nova para ver el resultado.")
        else:
            err("No se pudo guardar el reporte de prueba.")

    except Exception as e:
        err(f"Error al conectar con Nova: {e}")
        info("¿El servidor Nova está corriendo? Verifica: node index.js en /server")


def test_ojs():
    header("MÓDULO: Cliente OJS")
    from modules.ojs_client import OJSClient

    info(f"Conectando a OJS en: {os.environ.get('OJS_BASE_URL')}")
    info(f"Journal path: {os.environ.get('OJS_JOURNAL_PATH')}")

    try:
        client = OJSClient()
        submissions = client.get_submissions_in_review()

        if not submissions:
            warn("No hay envíos en revisión en este momento.")
            return

        ok(f"{len(submissions)} envío(s) en revisión encontrado(s):")
        for sub in submissions:
            meta = client.get_submission_metadata(sub)
            print(f"  • #{meta['ojs_submission_id']}: {meta['titulo'][:60]}...")

    except Exception as e:
        err(f"Error al conectar con OJS: {e}")
        info("Verifica OJS_BASE_URL, OJS_API_KEY y OJS_JOURNAL_PATH en .env.local")


def test_full_pipeline(file_path: str, envio_id: int):
    """
    Flujo completo con archivo local (sin descargar de OJS).
    Ideal para probar toda la cadena antes de integrar OJS real.
    """
    header("FLUJO COMPLETO (archivo local → Bedrock → Nova)")

    # Paso 1: Extraer texto
    info("Paso 1/4: Extrayendo texto del archivo...")
    from modules.extractor import extract_text
    path = Path(file_path)
    if not path.exists():
        err(f"Archivo no encontrado: {file_path}")
        return
    text = extract_text(path.read_bytes(), path.name)
    if not text:
        err("No se pudo extraer texto del archivo.")
        return
    ok(f"Texto extraído: {len(text)} caracteres")

    # Paso 2: Anonimizar
    info("Paso 2/4: Analizando anonimato...")
    from modules.anonymizer import analyze_and_anonymize
    anonymized, anon_report = analyze_and_anonymize(text)
    ok(f"Anonimato — riesgo: {anon_report.risk_level}")

    # Paso 3: Bedrock
    info("Paso 3/4: Evaluando con Amazon Bedrock...")
    if not (os.environ.get("AWS_ACCESS_KEY_ID") or _aws_cli_configured()):
        warn("Credenciales AWS no disponibles — se usará evaluación simulada.")
        evaluation = {
            "score_scientific": 0,
            "score_originality": 0,
            "score_presentation": 0,
            "comments": "[SIMULADO] Esta es una evaluación de prueba. Configura credenciales AWS para obtener la evaluación real de Claude.",
            "preliminary_recommendation": "REVISAR_MENOR",
            "key_strengths": ["[Simulado]"],
            "key_weaknesses": ["[Simulado]"],
        }
        warn("Evaluación simulada — los scores son 0 (no reales).")
    else:
        from modules.bedrock_client import BedrockClient
        try:
            titulo = path.stem.replace("_", " ").title()
            evaluation = BedrockClient().evaluate_manuscript(anonymized, titulo, "")
            ok("Evaluación de Bedrock completada.")
        except Exception as e:
            err(f"Error en Bedrock: {e}")
            return

    print(json.dumps({
        "scores": {
            "scientific": evaluation.get("score_scientific"),
            "originality": evaluation.get("score_originality"),
            "presentation": evaluation.get("score_presentation"),
        },
        "recommendation": evaluation.get("preliminary_recommendation"),
    }, indent=2))

    # Paso 4: Enviar a Nova
    info(f"Paso 4/4: Guardando reporte en Nova para envío #{envio_id}...")
    from modules.nova_client import NovaClient
    try:
        saved = NovaClient().save_report(envio_id, evaluation, anon_report.to_dict())
        if saved:
            ok(f"¡Flujo completo exitoso! Reporte guardado en Nova para envío #{envio_id}.")
            info("Abre el panel del Revisor en Nova y selecciona ese envío para ver el resultado.")
        else:
            err("Nova no pudo guardar el reporte.")
    except Exception as e:
        err(f"Error al guardar en Nova: {e}")


def test_handler():
    """Ejecuta el handler completo simulando el evento de EventBridge."""
    header("HANDLER COMPLETO (simula invocación de EventBridge)")
    import handler

    class FakeContext:
        aws_request_id = "local-test-001"

    event = json.loads((LAMBDA_DIR / "events" / "test_event.json").read_text())
    info("Invocando lambda_handler con evento de prueba...")
    result = handler.lambda_handler(event, FakeContext())
    print(json.dumps(result, indent=2, ensure_ascii=False))


def _aws_cli_configured() -> bool:
    """Verifica si AWS CLI tiene credenciales configuradas."""
    aws_dir = Path.home() / ".aws" / "credentials"
    return aws_dir.exists()


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="🧪 Prueba local del Orquestador Lambda Nova × OJS × Bedrock",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument(
        "--module",
        choices=["extractor", "anonymizer", "bedrock", "nova", "ojs", "full", "handler"],
        required=True,
        help="Módulo a probar"
    )
    parser.add_argument(
        "--file",
        help="Ruta al archivo PDF o DOCX local para pruebas (requerido para: extractor, anonymizer, bedrock, full)"
    )
    parser.add_argument(
        "--envio-id",
        type=int,
        default=1,
        help="ID del envío en Nova para la prueba (default: 1)"
    )

    args = parser.parse_args()

    if args.module in ("extractor", "anonymizer", "bedrock", "full") and not args.file:
        # Si no se pasa --file, usar el docx de ejemplo si existe
        default_file = str(Path.home() / "Downloads" / "Propuesta_Tecnica_Arquitectura_Hibrida_OJS_AWS.docx")
        if Path(default_file).exists():
            warn(f"No se pasó --file. Usando archivo por defecto: {default_file}")
            args.file = default_file
        else:
            err(f"El módulo '{args.module}' requiere --file /ruta/al/archivo.pdf")
            sys.exit(1)

    if args.module == "extractor":
        test_extractor(args.file)
    elif args.module == "anonymizer":
        test_anonymizer(args.file)
    elif args.module == "bedrock":
        test_bedrock(args.file)
    elif args.module == "nova":
        test_nova(args.envio_id)
    elif args.module == "ojs":
        test_ojs()
    elif args.module == "full":
        test_full_pipeline(args.file, args.envio_id)
    elif args.module == "handler":
        test_handler()


if __name__ == "__main__":
    main()
