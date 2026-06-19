"""
nova_client.py

Cliente HTTP para la API interna de Nova.
Envía el reporte de revisión preliminar del sistema
al endpoint POST /api/revisiones/sistema y verifica
si ya existe un reporte para evitar reprocesar.
"""

import os
import logging
import requests

logger = logging.getLogger(__name__)

# Timeout para llamadas a Nova (segundos)
REQUEST_TIMEOUT = 30


class NovaClient:
    """Cliente para la API interna del servidor Nova (Node.js)."""

    def __init__(self):
        self.base_url = os.environ["NOVA_API_URL"].rstrip("/")
        self.api_key = os.environ["NOVA_INTERNAL_API_KEY"]
        self.session = requests.Session()
        self.session.headers.update({
            "x-nova-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        })

    def report_exists(self, envio_id: int) -> bool:
        """
        Verifica si ya existe un reporte del sistema para este envío.
        Usa el endpoint público (JWT) — aquí usamos la API Key para simplicidad
        en el contexto de Lambda.

        Returns:
            True si ya existe un reporte, False si no.
        """
        url = f"{self.base_url}/api/revisiones/sistema/{envio_id}"
        try:
            response = self.session.get(url, timeout=REQUEST_TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                exists = data.get("success") and data.get("data") is not None
                if exists:
                    logger.info(f"Nova: Reporte ya existe para envío #{envio_id}. Se omite reprocesamiento.")
                return exists
            return False
        except requests.RequestException as e:
            # Si Nova no responde, asumimos que no existe y procesamos
            logger.warning(f"Nova: No se pudo verificar reporte para #{envio_id}: {e}. Se procesará de todas formas.")
            return False

    def save_report(self, envio_id: int, evaluation: dict, anonymity_report: dict) -> bool:
        """
        Envía el reporte de revisión preliminar a Nova para su persistencia en BD.

        Args:
            envio_id:         ID del envío en la BD de Nova.
            evaluation:       Resultado de Bedrock (puntuaciones + comentarios).
            anonymity_report: Resultado del análisis de anonimato.

        Returns:
            True si se guardó correctamente, False en caso de error.
        """
        url = f"{self.base_url}/api/revisiones/sistema"

        # Construir los comentarios completos incluyendo el análisis de anonimato
        comments = self._build_full_comments(evaluation, anonymity_report)

        payload = {
            "envio_id": envio_id,
            "score_scientific": evaluation.get("score_scientific"),
            "score_originality": evaluation.get("score_originality"),
            "score_presentation": evaluation.get("score_presentation"),
            "comments": comments,
        }

        try:
            response = self.session.post(url, json=payload, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            data = response.json()

            if data.get("success"):
                logger.info(f"Nova: Reporte guardado correctamente para envío #{envio_id}.")
                return True
            else:
                logger.error(f"Nova: Error al guardar reporte: {data.get('error')}")
                return False

        except requests.HTTPError as e:
            logger.error(f"Nova: HTTP Error {e.response.status_code} al guardar reporte: {e}")
            return False
        except requests.RequestException as e:
            logger.error(f"Nova: Error de conexión al guardar reporte: {e}")
            return False

    def _build_full_comments(self, evaluation: dict, anonymity_report: dict) -> str:
        """
        Construye el texto completo de comentarios que se mostrará al revisor,
        combinando la evaluación de Bedrock con el análisis de anonimato.
        """
        lines = []

        # Comentario principal de Bedrock
        main_comment = evaluation.get("comments", "")
        if main_comment:
            lines.append(main_comment)

        # Recomendación preliminar
        recommendation = evaluation.get("preliminary_recommendation", "")
        if recommendation:
            rec_labels = {
                "ACEPTAR": "✅ Recomendación preliminar: ACEPTAR",
                "REVISAR_MENOR": "🔵 Recomendación preliminar: REVISIÓN MENOR",
                "REVISAR_MAYOR": "🟡 Recomendación preliminar: REVISIÓN MAYOR",
                "RECHAZAR": "🔴 Recomendación preliminar: RECHAZAR",
            }
            lines.append(f"\n{rec_labels.get(recommendation, recommendation)}")

        # Fortalezas
        strengths = evaluation.get("key_strengths", [])
        if strengths:
            lines.append("\nFORTALEZAS IDENTIFICADAS:")
            for s in strengths:
                lines.append(f"• {s}")

        # Debilidades
        weaknesses = evaluation.get("key_weaknesses", [])
        if weaknesses:
            lines.append("\nÁREAS DE MEJORA:")
            for w in weaknesses:
                lines.append(f"• {w}")

        # Análisis de anonimato
        risk = anonymity_report.get("risk_level", "bajo")
        if risk != "bajo":
            lines.append(f"\n⚠️ ALERTA DE ANONIMATO: Riesgo {risk.upper()}")
            if anonymity_report.get("emails_found"):
                lines.append(f"  - Correos detectados y redactados: {len(anonymity_report['emails_found'])}")
            if anonymity_report.get("affiliations_lines"):
                lines.append(f"  - Afiliaciones detectadas y redactadas: {len(anonymity_report['affiliations_lines'])}")
            lines.append("  Se recomienda solicitar al autor una versión anónima del manuscrito.")

        return "\n".join(lines)
