"""
ojs_client.py

Cliente de la API REST de OJS (Open Journal Systems).
Consulta manuscritos en etapa de revisión sin modificar
ni la base de datos ni el código fuente de OJS.
"""

import os
import logging
import requests

logger = logging.getLogger(__name__)

# Etapa de revisión en OJS (stageId=3 = External Review)
OJS_REVIEW_STAGE_ID = 3


class OJSClient:
    """Cliente de solo lectura para la API REST de OJS."""

    def __init__(self, base_url=None, api_key=None, journal_path=None):
        self.base_url = (base_url or os.environ.get("OJS_BASE_URL", "")).rstrip("/")
        self.api_key = api_key or os.environ.get("OJS_API_KEY", "")
        self.journal_path = journal_path or os.environ.get("OJS_JOURNAL_PATH", "")
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "User-Agent": "Nova-Lambda-Orchestrator/1.0",
        })

    def _api_url(self, path: str) -> str:
        base = self.base_url
        if "index.php" not in base:
            return f"{base}/index.php/{self.journal_path}/api/v1{path}"
        return f"{base}/{self.journal_path}/api/v1{path}"

    def get_submission(self, submission_id: int) -> dict:
        """
        Obtiene un envío específico por su ID.
        """
        url = self._api_url(f"/submissions/{submission_id}")
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Error al obtener envío #{submission_id}: {e}")
            raise


    def get_submissions_in_review(self) -> list[dict]:
        """
        Obtiene los envíos actualmente en etapa de revisión externa.
        Retorna una lista de objetos de envío de OJS.
        """
        url = self._api_url("/submissions")
        params = {
            "stageIds": OJS_REVIEW_STAGE_ID,
            "status": 1,  # 1 = queued/active
            "count": 100,
            "offset": 0,
        }

        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            submissions = data.get("items", [])
            logger.info(f"OJS: {len(submissions)} envíos en revisión encontrados.")
            return submissions
        except requests.RequestException as e:
            logger.error(f"Error al consultar OJS submissions: {e}")
            raise

    def get_submission_files(self, submission_id: int) -> list[dict]:
        """
        Obtiene la lista de archivos asociados a un envío.
        """
        url = self._api_url(f"/submissions/{submission_id}/files")
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            files = data.get("items", [])
            logger.info(f"OJS: {len(files)} archivos en envío #{submission_id}.")
            return files
        except requests.RequestException as e:
            logger.error(f"Error al obtener archivos del envío #{submission_id}: {e}")
            raise

    def download_file(self, submission_id: int, file_id: int, download_url: str = None, file_name: str = None) -> tuple[bytes, str]:
        """
        Descarga el binario de un archivo del envío a través del Proxy de Nova.
        Esto soluciona el bug de OJS que devuelve 403 en su API REST nativa.
        """
        try:
            resolved_name = file_name or f"archivo_{file_id}"
            
            # Construir URL proxy apuntando al backend de Nova
            nova_api_url = os.environ.get("NOVA_API_URL", "https://eventonexus.com").rstrip("/")
            proxy_url = f"{nova_api_url}/api/ojs-proxy"
            
            # Construir URL Legacy de OJS (la misma que usa el visor web)
            base = self.base_url
            if "index.php" not in base:
                journal_base = f"{base}/index.php/{self.journal_path}"
            else:
                journal_base = f"{base}/{self.journal_path}"
                
            legacy_target_url = f"{journal_base}/$$$call$$$/api/file/file-api/download-file?submissionFileId={file_id}&submissionId={submission_id}&stageId=1"
            
            logger.info(f"OJS: Descargando archivo vía Nova Proxy: {legacy_target_url}")
            
            headers = {
                "x-ojs-target-url": legacy_target_url,
                "Accept": "*/*"
            }
            
            resp = self.session.get(proxy_url, headers=headers, timeout=60)
            
            content_type = resp.headers.get("Content-Type", "").lower()
            if resp.status_code == 200 and "text/html" not in content_type:
                logger.info(f"OJS: Archivo '{resolved_name}' descargado exitosamente vía Proxy ({len(resp.content)} bytes).")
                return resp.content, resolved_name
            else:
                logger.error(f"OJS: Fallo al descargar vía Proxy. Status: {resp.status_code}, Content-Type: {content_type}")
                raise ValueError(f"El proxy devolvió status {resp.status_code} o HTML en lugar del binario.")
                
        except requests.RequestException as e:
            logger.error(f"Error al descargar archivo #{file_id} del envío #{submission_id}: {e}")
            raise

    def get_submission_metadata(self, submission: dict) -> dict:
        """
        Extrae los metadatos relevantes de un objeto de envío de OJS.
        """
        pub = (submission.get("publications") or [{}])[-1]
        title = pub.get("fullTitle", {})
        abstract = pub.get("abstract", {})

        return {
            "ojs_submission_id": submission.get("id"),
            "titulo": (
                title.get("es_ES") or title.get("en_US") or "Sin título"
            ),
            "resumen": (
                abstract.get("es_ES") or abstract.get("en_US") or ""
            ),
            "fecha_envio": submission.get("dateSubmitted", ""),
            "stage_id": submission.get("stageId"),
        }
