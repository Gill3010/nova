"""
anonymizer.py

Análisis de anonimato del manuscrito: detecta y elimina
nombres de autores, correos electrónicos, instituciones
y metadatos de identidad antes de enviar el texto a Bedrock.

Esto protege la integridad del proceso de doble ciego.
"""

import re
import logging

logger = logging.getLogger(__name__)

# ─── Patrones de Detección ────────────────────────────────────────────────────

# Correos electrónicos
_EMAIL_RE = re.compile(
    r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b"
)

# URLs y sitios web
_URL_RE = re.compile(
    r"https?://[^\s]+"
    r"|www\.[^\s]+"
    r"|\b(?:orcid\.org|researchgate\.net|academia\.edu)/[^\s]+",
    re.IGNORECASE
)

# DOIs
_DOI_RE = re.compile(
    r"\b10\.\d{4,9}/[^\s]+",
    re.IGNORECASE
)

# ORCID iDs
_ORCID_RE = re.compile(
    r"\b\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b"
)

# Palabras clave de afiliación institucional (líneas que las contienen)
_AFFILIATION_KEYWORDS = re.compile(
    r"^.*\b("
    r"universidad|university|instituto|institute|college|school|faculty|"
    r"departamento|department|laboratorio|laboratory|centro|center|"
    r"hospital|fundación|foundation|ministerio|ministry|"
    r"correspondencia|correspondence|email|e-mail|contact"
    r")\b.*$",
    re.IGNORECASE | re.MULTILINE
)

# Secciones de "Agradecimientos" / "Financiamiento" que suelen revelar identidades
_ACKNOWLEDGEMENT_SECTION = re.compile(
    r"(agradecimiento[s]?|acknowledgement[s]?|financiamiento|funding|"
    r"conflicto de interés|conflict of interest).*?(?=\n{2,}|\Z)",
    re.IGNORECASE | re.DOTALL
)


# ─── API Pública ──────────────────────────────────────────────────────────────

class AnonymityReport:
    """Resultado del análisis de anonimato."""

    def __init__(self):
        self.emails_found: list[str] = []
        self.urls_found: list[str] = []
        self.orcids_found: list[str] = []
        self.affiliations_found: list[str] = []
        self.is_anonymous: bool = True

    @property
    def risk_level(self) -> str:
        total = (
            len(self.emails_found)
            + len(self.urls_found)
            + len(self.orcids_found)
            + len(self.affiliations_found)
        )
        if total == 0:
            return "bajo"
        if total <= 3:
            return "medio"
        return "alto"

    def to_dict(self) -> dict:
        return {
            "is_anonymous": self.is_anonymous,
            "risk_level": self.risk_level,
            "emails_found": self.emails_found,
            "urls_found": self.urls_found,
            "orcids_found": self.orcids_found,
            "affiliations_lines": self.affiliations_found,
        }


def analyze_and_anonymize(text: str) -> tuple[str, AnonymityReport]:
    """
    Analiza el texto en busca de elementos de identidad y los reemplaza
    con marcadores neutros para garantizar la revisión doble ciego.

    Args:
        text: Texto extraído del manuscrito.

    Returns:
        Tupla (texto_anonimizado, reporte_de_anonimato).
    """
    report = AnonymityReport()
    anonymized = text

    # 1. Detectar y eliminar correos electrónicos
    emails = _EMAIL_RE.findall(anonymized)
    if emails:
        report.emails_found = list(set(emails))
        report.is_anonymous = False
        anonymized = _EMAIL_RE.sub("[CORREO_REDACTADO]", anonymized)
        logger.info(f"Anonimizador: {len(emails)} correo(s) detectado(s) y redactado(s).")

    # 2. Detectar y eliminar URLs / perfiles académicos
    urls = _URL_RE.findall(anonymized)
    if urls:
        report.urls_found = list(set(urls))
        report.is_anonymous = False
        anonymized = _URL_RE.sub("[URL_REDACTADA]", anonymized)
        logger.info(f"Anonimizador: {len(urls)} URL(s) detectada(s) y redactada(s).")

    # 3. Detectar y eliminar ORCID iDs
    orcids = _ORCID_RE.findall(anonymized)
    if orcids:
        report.orcids_found = list(set(orcids))
        report.is_anonymous = False
        anonymized = _ORCID_RE.sub("[ORCID_REDACTADO]", anonymized)
        logger.info(f"Anonimizador: {len(orcids)} ORCID(s) detectado(s).")

    # 4. Eliminar líneas con afiliaciones institucionales
    affil_matches = _AFFILIATION_KEYWORDS.findall(anonymized)
    if affil_matches:
        report.affiliations_found = list(set(affil_matches))
        report.is_anonymous = False
        anonymized = _AFFILIATION_KEYWORDS.sub("[AFILIACIÓN_REDACTADA]", anonymized)
        logger.info(f"Anonimizador: {len(affil_matches)} línea(s) de afiliación redactada(s).")

    # 5. Eliminar secciones de agradecimientos (revelan financiadores/colaboradores)
    anonymized = _ACKNOWLEDGEMENT_SECTION.sub("[SECCIÓN_REDACTADA_PARA_REVISIÓN_CIEGA]", anonymized)

    # 6. Eliminar DOIs (pueden identificar publicaciones previas del autor)
    anonymized = _DOI_RE.sub("[DOI_REDACTADO]", anonymized)

    logger.info(
        f"Anonimizador: Análisis completado. "
        f"Nivel de riesgo: {report.risk_level}. "
        f"¿Anónimo: {report.is_anonymous}"
    )

    return anonymized, report
