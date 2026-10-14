import io
from pathlib import Path
from fastapi import UploadFile
from PIL import Image
import pillow_heif

from app.core.config import settings
from app.core.supabase_client import supabase

# Register HEIC opener with Pillow
pillow_heif.register_heif_opener()


def process_and_upload_image(record_id: str, file: UploadFile, index: int) -> tuple[str, str]:
    """
    1. Reads the uploaded image bytes.
    2. If it's HEIC/HEIF, converts it to standard JPEG in memory.
    3. Uploads to Supabase Storage bucket 'Imprest_Pics'.
    4. Returns a tuple: (file_name, public_cdn_url).
    """
    raw_filename = file.filename or "receipt.jpg"
    ext = Path(raw_filename).suffix.lower()

    # Read binary bytes from upload
    file_bytes = file.file.read()

    # If it is an iPhone HEIC/HEIF photo, convert to JPEG in memory
    if ext in [".heic", ".heif"]:
        file_name = f"{index:03d}.jpg"
        content_type = "image/jpeg"

        with Image.open(io.BytesIO(file_bytes)) as img:
            buffer = io.BytesIO()
            img.convert("RGB").save(buffer, format="JPEG", quality=90)
            upload_bytes = buffer.getvalue()
    else:
        file_name = f"{index:03d}{ext}"
        content_type = file.content_type or "image/jpeg"
        upload_bytes = file_bytes

    # Path inside Supabase Storage bucket: e.g. "record_uuid/001.jpg"
    storage_path = f"{record_id}/{file_name}"

    # Upload to Supabase Storage
    supabase.storage.from_(settings.SUPABASE_BUCKET_NAME).upload(
        path=storage_path,
        file=upload_bytes,
        file_options={"content-type": content_type, "upsert": "true"}
    )

    # Get the public CDN URL
    public_url = supabase.storage.from_(settings.SUPABASE_BUCKET_NAME).get_public_url(storage_path)

    return file_name, public_url