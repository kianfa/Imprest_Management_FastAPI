import io
from pathlib import Path
from fastapi import UploadFile
from PIL import Image, ImageOps
import pillow_heif

from app.core.config import settings
from app.core.supabase_client import supabase

# Register HEIC opener with Pillow (iPhone compatibility)
pillow_heif.register_heif_opener()

# Maximum dimension (width or height) for receipts in pixels
MAX_DIMENSION = 1920
WEBP_QUALITY = 80


def process_and_upload_image(record_id: str, file: UploadFile, index: int) -> tuple[str, str]:
    """
    1. Reads uploaded image bytes into memory.
    2. Auto-rotates image based on mobile camera EXIF orientation.
    3. Handles transparency (converts RGBA/P to clean RGB with white background).
    4. Proportionally scales down oversized images to MAX_DIMENSION (1920px).
    5. Encodes to WebP format in RAM (75%+ data savings).
    6. Uploads the WebP file to Supabase Storage bucket 'Imprest_Pics'.
    7. Returns: (file_name, public_cdn_url).
    """
    # 1. Read binary bytes from upload
    file_bytes = file.file.read()

    # 2. Open image in memory (Pillow + pillow_heif handles JPG, PNG, HEIC, etc.)
    with Image.open(io.BytesIO(file_bytes)) as img:
        # Auto-rotate according to mobile EXIF metadata
        img = ImageOps.exif_transpose(img)

        # Handle color modes & alpha channel (white background for receipts)
        if img.mode in ("RGBA", "LA", "P"):
            if img.mode == "RGBA":
                background = Image.new("RGB", img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])  # channel 3 is alpha
                img = background
            else:
                img = img.convert("RGB")
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Proportionally scale down if wider or taller than 1920px
        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)

        # Encode to WebP in memory
        output_buffer = io.BytesIO()
        img.save(output_buffer, format="WEBP", quality=WEBP_QUALITY, method=4)
        upload_bytes = output_buffer.getvalue()

    # 3. Always save with .webp extension
    file_name = f"{index:03d}.webp"
    content_type = "image/webp"
    storage_path = f"{record_id}/{file_name}"

    # 4. Upload to Supabase Storage
    supabase.storage.from_(settings.SUPABASE_BUCKET_NAME).upload(
        path=storage_path,
        file=upload_bytes,
        file_options={"content-type": content_type, "upsert": "true"}
    )

    # 5. Get the public CDN URL
    public_url = supabase.storage.from_(settings.SUPABASE_BUCKET_NAME).get_public_url(storage_path)

    return file_name, public_url