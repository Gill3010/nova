"""
extractor.py

Extrae texto limpio de archivos PDF o Word (.docx).
Usa pdfplumber para PDFs y python-docx para Word.
El texto resultante es el que se envía a Amazon Bedrock.
"""

import io
import logging

logger = logging.getLogger(__name__)

# Máximo de caracteres a enviar a Bedrock (~8,000 palabras ≈ 50,000 chars)
MAX_CHARS = 50_000


def extract_text(file_bytes: bytes, file_name: str) -> str:
    """
    Detecta el tipo de archivo por extensión y extrae el texto.

    Args:
        file_bytes: Contenido binario del archivo.
        file_name:  Nombre del archivo (usado para detectar la extensión).

    Returns:
        Texto plano extraído y truncado a MAX_CHARS.

    Raises:
        ValueError: Si el formato del archivo no es soportado.
    """
    lower_name = file_name.lower()

    if lower_name.endswith(".pdf"):
        text = _extract_from_pdf(file_bytes)
    elif lower_name.endswith(".docx"):
        text = _extract_from_docx(file_bytes)
    elif lower_name.endswith(".doc"):
        # .doc (formato antiguo binario) no es soportado directamente.
        # Se registra advertencia y se devuelve texto vacío para no abortar.
        logger.warning(f"Formato .doc antiguo no soportado: {file_name}. Se omite extracción.")
        return ""
    else:
        raise ValueError(f"Formato de archivo no soportado: {file_name}")

    if not text.strip():
        logger.warning(f"No se pudo extraer texto del archivo: {file_name}")
        return ""

    # Truncar para respetar el límite de contexto del modelo
    if len(text) > MAX_CHARS:
        logger.info(f"Texto truncado de {len(text)} a {MAX_CHARS} caracteres para Bedrock.")
        text = text[:MAX_CHARS] + "\n\n[Texto truncado por límite de contexto]"

    logger.info(f"Texto extraído correctamente de '{file_name}' ({len(text)} caracteres).")
    return text


def _extract_from_pdf(file_bytes: bytes) -> str:
    """Extrae texto de un PDF usando pdfplumber."""
    try:
        import pdfplumber
    except ImportError:
        raise RuntimeError("pdfplumber no está instalado. Agregar a requirements.txt.")

    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

    return "\n\n".join(text_parts)


def _extract_from_docx(file_bytes: bytes) -> str:
    """Extrae texto de un archivo Word (.docx) usando python-docx."""
    try:
        from docx import Document
    except ImportError:
        raise RuntimeError("python-docx no está instalado. Agregar a requirements.txt.")

    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)
