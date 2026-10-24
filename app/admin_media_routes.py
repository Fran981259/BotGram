"""Upload de imagens para o painel administrativo.

Salva arquivos em MEDIA_DIR (/app/data/media/ por padrão) e retorna a URL pública.
FastAPI serve /media/ via StaticFiles montado em main.py.
"""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from loguru import logger

from app.security import require_api_key

router = APIRouter(prefix="/api/admin", tags=["admin-media"])

MEDIA_DIR = Path(os.getenv("MEDIA_DIR", "/app/data/media"))
MAX_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
EXTENSION_MAP = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    _auth=Depends(require_api_key),
):
    """Faz upload de uma imagem (JPEG/PNG/WebP/GIF, máx 5MB) e retorna a URL pública."""
    content_type = (file.content_type or "").split(";")[0].strip()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Tipo não permitido: '{content_type}'. Use JPEG, PNG, WebP ou GIF.",
        )

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=422,
            detail=f"Arquivo muito grande ({len(content) // 1024} KB). Máximo: 5 MB.",
        )
    if len(content) == 0:
        raise HTTPException(status_code=422, detail="Arquivo vazio.")

    ext = EXTENSION_MAP[content_type]
    filename = f"{uuid.uuid4().hex}{ext}"

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    dest = MEDIA_DIR / filename
    dest.write_bytes(content)

    site_url = os.getenv("SITE_URL", "").rstrip("/")
    url = f"{site_url}/media/{filename}" if site_url else f"/media/{filename}"

    logger.info("upload-image: %s (%d KB)", filename, len(content) // 1024)
    return {"url": url, "filename": filename}
