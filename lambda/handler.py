"""
handler.py

Punto de entrada de la función AWS Lambda.
Activado por Amazon EventBridge cada 15 minutos.

Flujo completo del orquestador:
  1. Consultar OJS → manuscritos en etapa de revisión
  2. Por cada manuscrito nuevo (sin reporte previo en Nova):
     a. Descargar el archivo (PDF o Word)
     b. Extraer texto limpio
     c. Anonimizar (eliminar identidades para doble ciego)
     d. Enviar a Amazon Bedrock (Claude 3.5 Sonnet) → rúbrica científica
     e. Guardar reporte en Nova vía POST /api/revisiones/sistema
"""

import json
import logging
import os
from dataclasses import dataclass, field

from modules.ojs_client import OJSClient
from modules.extractor import extract_text
from modules.anonymizer import analyze_and_anonymize
from modules.bedrock_client import BedrockClient
from modules.nova_client import NovaClient

# Configurar logging estructurado para CloudWatch
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nova.lambda.handler")


# ─── Estructuras de resultado ─────────────────────────────────────────────────

@dataclass
class SubmissionResult:
    ojs_submission_id: int
    titulo: str
    status: str        # "processed" | "skipped" | "error" | "no_file"
    error: str = ""


@dataclass
class LambdaReport:
    total_in_review: int = 0
    processed: int = 0
    skipped: int = 0
    errors: int = 0
    results: list[SubmissionResult] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "total_in_review": self.total_in_review,
            "processed": self.processed,
            "skipped": self.skipped,
            "errors": self.errors,
            "results": [
                {
                    "ojs_submission_id": r.ojs_submission_id,
                    "titulo": r.titulo,
                    "status": r.status,
                    **({"error": r.error} if r.error else {}),
                }
                for r in self.results
            ],
        }


# ─── Utilidades ───────────────────────────────────────────────────────────────

def _find_main_manuscript_file(files: list[dict]) -> dict | None:
    """
    Elige el archivo principal del envío.
    Prioridad: genreId=1 (Article Text) → PDF → DOCX → primero disponible.
    """
    if not files:
        return None

    # 1. Preferir el archivo marcado como "Article Text" en OJS (genreId=1)
    for f in files:
        if f.get("genreId") == 1:
            return f

    # 2. Preferir PDF por mimetype o nombre
    for f in files:
        name = f.get("name", {})
        filename = name.get("es_ES") or name.get("en_US") or ""
        mimetype = (f.get("mimetype") or "").lower()
        if filename.lower().endswith(".pdf") or "pdf" in mimetype:
            return f

    # 3. Preferir DOCX por mimetype o nombre
    for f in files:
        name = f.get("name", {})
        filename = name.get("es_ES") or name.get("en_US") or ""
        mimetype = (f.get("mimetype") or "").lower()
        if filename.lower().endswith(".docx") or "word" in mimetype or "officedocument" in mimetype:
            return f

    # 4. Primer archivo disponible (ignorar videos/audios)
    for f in files:
        mimetype = (f.get("mimetype") or "").lower()
        if "video" not in mimetype and "audio" not in mimetype:
            return f

    return files[0]


def _get_file_name(file_meta: dict) -> str:
    # 1. Priorizar el nombre de archivo original que tiene la extensión real (ej: manuscrito.pdf)
    orig_name = file_meta.get("originalFilename")
    if orig_name:
        return orig_name

    # 2. Intentar buscar en el nombre localizado si ya incluye extensión
    name = file_meta.get("name", {})
    localized_name = name.get("es_ES") or name.get("en_US") or name.get("es") or name.get("en")
    if localized_name and localized_name.lower().endswith((".pdf", ".docx", ".doc")):
        return localized_name

    # 3. Fallback: usar el ID agregando la extensión correspondiente según el mimetype
    file_id = file_meta.get("id", "unknown")
    mimetype = file_meta.get("mimetype", "") or ""
    mimetype_lower = mimetype.lower()

    if "pdf" in mimetype_lower:
        return f"archivo_{file_id}.pdf"
    elif "word" in mimetype_lower or "officedocument" in mimetype_lower:
        return f"archivo_{file_id}.docx"
    elif "msword" in mimetype_lower:
        return f"archivo_{file_id}.doc"

    return f"archivo_{file_id}"


# ─── Handler principal ────────────────────────────────────────────────────────

def lambda_handler(event: dict, context) -> dict:
    """
    Punto de entrada de AWS Lambda.

    Args:
        event:   Evento de EventBridge (puede estar vacío para ejecuciones manuales).
        context: Contexto de ejecución de Lambda (tiempo restante, request ID, etc.).

    Returns:
        Objeto con el resumen de ejecución (serializable a JSON).
    """
    logger.info(f"Orquestador iniciado. Request ID: {getattr(context, 'aws_request_id', 'local')}")

    report = LambdaReport()

    # Ver si viene un envío específico y credenciales en el evento
    single_submission_id = event.get("ojs_submission_id")
    ojs_base_url = event.get("ojs_base_url")
    ojs_api_key = event.get("ojs_api_key")
    ojs_journal_path = event.get("ojs_journal_path")

    # Inicializar clientes
    try:
        ojs = OJSClient(
            base_url=ojs_base_url,
            api_key=ojs_api_key,
            journal_path=ojs_journal_path
        )
        bedrock = BedrockClient()
        nova = NovaClient()
    except KeyError as e:
        msg = f"Variable de entorno faltante: {e}"
        logger.error(msg)
        return {"success": False, "error": msg}

    # 1. Obtener manuscritos en revisión desde OJS
    try:
        if single_submission_id:
            logger.info(f"Modo directo: Procesando envío específico #{single_submission_id}")
            submission = ojs.get_submission(int(single_submission_id))
            submissions = [submission]
        else:
            logger.info("Modo polling: Consultando todos los envíos en revisión de OJS")
            submissions = ojs.get_submissions_in_review()
    except Exception as e:
        msg = f"Error al consultar OJS: {e}"
        logger.error(msg)
        return {"success": False, "error": msg}

    report.total_in_review = len(submissions)
    logger.info(f"Total de envíos en revisión: {report.total_in_review}")

    # 2. Procesar cada envío
    for submission in submissions:
        meta = ojs.get_submission_metadata(submission)
        ojs_id = meta["ojs_submission_id"]
        titulo = meta["titulo"]

        logger.info(f"─── Procesando envío #{ojs_id}: '{titulo}' ───")

        # Verificar si Nova ya tiene un reporte para este envío
        # Usamos el ojs_submission_id para buscar en Nova
        # Nota: Nova mapea ojs_submission_id → id interno en envios_ojs
        if nova.report_exists(ojs_id):
            report.skipped += 1
            report.results.append(SubmissionResult(
                ojs_submission_id=ojs_id, titulo=titulo, status="skipped"
            ))
            continue

        # 2a. Obtener archivos del envío
        try:
            files = ojs.get_submission_files(ojs_id)
        except Exception as e:
            logger.error(f"Envío #{ojs_id}: Error al obtener archivos — {e}")
            report.errors += 1
            report.results.append(SubmissionResult(
                ojs_submission_id=ojs_id, titulo=titulo, status="error", error=str(e)
            ))
            continue

        main_file = _find_main_manuscript_file(files)
        if not main_file:
            logger.warning(f"Envío #{ojs_id}: No se encontró archivo de manuscrito.")
            report.results.append(SubmissionResult(
                ojs_submission_id=ojs_id, titulo=titulo, status="no_file"
            ))
            continue

        file_name = _get_file_name(main_file)
        file_id = main_file.get("id")

        # 2b. Descargar el archivo
        try:
            file_bytes, resolved_name = ojs.download_file(
                submission_id=ojs_id,
                file_id=file_id,
                download_url=main_file.get("url"),
                file_name=file_name
            )
        except Exception as e:
            logger.error(f"Envío #{ojs_id}: Error al descargar '{file_name}' — {e}")
            report.errors += 1
            report.results.append(SubmissionResult(
                ojs_submission_id=ojs_id, titulo=titulo, status="error", error=str(e)
            ))
            continue

        # 2c. Extraer texto
        try:
            raw_text = extract_text(file_bytes, resolved_name or file_name)
        except Exception as e:
            logger.error(f"Envío #{ojs_id}: Error al extraer texto — {e}")
            report.errors += 1
            report.results.append(SubmissionResult(
                ojs_submission_id=ojs_id, titulo=titulo, status="error", error=str(e)
            ))
            continue

        if not raw_text.strip():
            logger.warning(f"Envío #{ojs_id}: Texto extraído vacío. Se omite.")
            report.results.append(SubmissionResult(
                ojs_submission_id=ojs_id, titulo=titulo, status="no_file",
                error="Texto extraído vacío"
            ))
            continue

        # 2d. Anonimizar
        try:
            anonymized_text, anonymity_report = analyze_and_anonymize(raw_text)
            logger.info(
                f"Envío #{ojs_id}: Anonimato — riesgo {anonymity_report.risk_level}"
            )
        except Exception as e:
            logger.error(f"Envío #{ojs_id}: Error en anonimización — {e}")
            # No es crítico: continuar con el texto sin anonimizar
            anonymized_text = raw_text
            anonymity_report = type("AR", (), {"to_dict": lambda s: {"risk_level": "desconocido"}})()

        # 2e. Evaluar con Bedrock (Claude 3.5 Sonnet)
        try:
            evaluation = bedrock.evaluate_manuscript(
                texto_anonimizado=anonymized_text,
                titulo=titulo,
                resumen=meta.get("resumen", ""),
            )
        except Exception as e:
            logger.error(f"Envío #{ojs_id}: Error en Bedrock — {e}")
            report.errors += 1
            report.results.append(SubmissionResult(
                ojs_submission_id=ojs_id, titulo=titulo, status="error", error=str(e)
            ))
            continue

        # 2f. Guardar reporte en Nova
        try:
            saved = nova.save_report(
                envio_id=ojs_id,
                evaluation=evaluation,
                anonymity_report=anonymity_report.to_dict(),
            )
            if saved:
                report.processed += 1
                report.results.append(SubmissionResult(
                    ojs_submission_id=ojs_id, titulo=titulo, status="processed"
                ))
            else:
                report.errors += 1
                report.results.append(SubmissionResult(
                    ojs_submission_id=ojs_id, titulo=titulo, status="error",
                    error="Nova no confirmó el guardado del reporte"
                ))
        except Exception as e:
            logger.error(f"Envío #{ojs_id}: Error al guardar en Nova — {e}")
            report.errors += 1
            report.results.append(SubmissionResult(
                ojs_submission_id=ojs_id, titulo=titulo, status="error", error=str(e)
            ))

    # Resumen final
    logger.info(
        f"Orquestador finalizado. "
        f"Total: {report.total_in_review} | "
        f"Procesados: {report.processed} | "
        f"Omitidos: {report.skipped} | "
        f"Errores: {report.errors}"
    )

    return {
        "success": True,
        "report": report.to_dict(),
    }
