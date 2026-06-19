"""
bedrock_client.py

Integración con Amazon Bedrock (Claude 3.5 Sonnet).
Aplica la rúbrica científica al texto del manuscrito
y retorna una evaluación estructurada con puntuaciones y comentarios.

Garantía de privacidad: AWS Bedrock nunca usa los datos
enviados para entrenar modelos (acuerdo contractual de AWS).
"""

import os
import json
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Modelo Claude 3.5 Sonnet en Bedrock
DEFAULT_MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0"

# Temperatura baja para respuestas consistentes y estructuradas
TEMPERATURE = 0.2
MAX_TOKENS = 2048


# ─── Prompt de Rúbrica Científica ─────────────────────────────────────────────

SYSTEM_PROMPT = """Eres un asistente especializado en revisión científica de artículos académicos para congresos y revistas científicas. Tu rol es proporcionar una evaluación preliminar objetiva, estructurada y constructiva de manuscritos académicos.

IMPORTANTE:
- Tu evaluación es PRELIMINAR y de apoyo al revisor humano, quien tomará la decisión final.
- Evalúa únicamente la calidad académica del contenido presentado.
- Sé específico, justo y constructivo en tus observaciones.
- El manuscrito puede estar en español o inglés. Responde SIEMPRE en español.
- Responde ÚNICAMENTE con el JSON especificado. No incluyas texto adicional fuera del JSON."""

EVALUATION_PROMPT_TEMPLATE = """Evalúa el siguiente manuscrito académico aplicando la rúbrica científica indicada.

--- INFORMACIÓN DEL MANUSCRITO ---
Título: {titulo}
Resumen: {resumen}

--- TEXTO DEL MANUSCRITO (primeras páginas) ---
{texto}

--- RÚBRICA DE EVALUACIÓN ---
Evalúa cada dimensión en una escala de 0 a 10:

1. CALIDAD CIENTÍFICA (score_scientific):
   - Solidez metodológica y rigor del diseño de investigación
   - Validez de los resultados y análisis estadístico
   - Fundamentación teórica y revisión bibliográfica
   - Coherencia entre objetivos, metodología y conclusiones

2. ORIGINALIDAD (score_originality):
   - Novedad del problema o enfoque investigativo
   - Contribución al estado del arte
   - Perspectiva innovadora o diferenciadora

3. CALIDAD DE PRESENTACIÓN (score_presentation):
   - Claridad y coherencia en la escritura académica
   - Estructura lógica del documento (IMRD u otro)
   - Calidad de tablas, figuras y referencias
   - Adecuación al formato de congreso/revista

Responde ÚNICAMENTE con este JSON, sin texto adicional:
{{
  "score_scientific": <número entero 0-10>,
  "score_originality": <número entero 0-10>,
  "score_presentation": <número entero 0-10>,
  "comments": "<párrafo detallado con: fortalezas principales, debilidades identificadas y recomendaciones específicas de mejora. Mínimo 150 palabras.>",
  "preliminary_recommendation": "<ACEPTAR|REVISAR_MAYOR|REVISAR_MENOR|RECHAZAR>",
  "key_strengths": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "key_weaknesses": ["<debilidad 1>", "<debilidad 2>"]
}}"""


class BedrockClient:
    """Cliente para Amazon Bedrock — Claude 3.5 Sonnet."""

    def __init__(self):
        self.model_id = os.environ.get("BEDROCK_MODEL_ID", DEFAULT_MODEL_ID)
        region = os.environ.get("AWS_REGION_NAME", "us-east-1")
        self.client = boto3.client("bedrock-runtime", region_name=region)

    def evaluate_manuscript(
        self,
        texto_anonimizado: str,
        titulo: str,
        resumen: str,
    ) -> dict:
        """
        Envía el manuscrito a Claude 3.5 Sonnet y obtiene la evaluación estructurada.

        Args:
            texto_anonimizado: Texto del manuscrito ya anonimizado.
            titulo:            Título del artículo.
            resumen:           Resumen/abstract del artículo.

        Returns:
            Diccionario con las puntuaciones y comentarios de la evaluación.

        Raises:
            ValueError: Si la respuesta de Bedrock no es JSON válido.
            ClientError: Si hay error en la llamada a Bedrock.
        """
        prompt = EVALUATION_PROMPT_TEMPLATE.format(
            titulo=titulo,
            resumen=resumen[:1000],  # Limitar el resumen
            texto=texto_anonimizado[:45_000],  # Respetar contexto del modelo
        )

        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": MAX_TOKENS,
            "temperature": TEMPERATURE,
            "system": SYSTEM_PROMPT,
            "messages": [
                {"role": "user", "content": prompt}
            ],
        }

        try:
            logger.info(f"Bedrock: Enviando manuscrito '{titulo}' a {self.model_id}...")
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body),
                contentType="application/json",
                accept="application/json",
            )

            response_body = json.loads(response["body"].read())
            raw_text = response_body["content"][0]["text"].strip()

            # Parsear el JSON de la respuesta
            evaluation = json.loads(raw_text)

            # Validar y sanitizar puntuaciones (deben ser 0-10)
            for field in ("score_scientific", "score_originality", "score_presentation"):
                val = evaluation.get(field)
                if val is None or not isinstance(val, (int, float)):
                    evaluation[field] = 5  # Valor neutro si falta
                else:
                    evaluation[field] = max(0, min(10, int(val)))

            logger.info(
                f"Bedrock: Evaluación completada. "
                f"Científica: {evaluation.get('score_scientific')}, "
                f"Originalidad: {evaluation.get('score_originality')}, "
                f"Presentación: {evaluation.get('score_presentation')}"
            )
            return evaluation

        except json.JSONDecodeError as e:
            logger.error(f"Bedrock: La respuesta no es JSON válido: {e}")
            logger.error(f"Respuesta raw: {raw_text[:500]}")
            raise ValueError(f"Bedrock devolvió una respuesta no estructurada: {e}")

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            logger.error(f"Bedrock ClientError ({error_code}): {e}")
            raise
