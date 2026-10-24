from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from app.core.config import settings
from app.api.v1.api_router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from web, desktop, and mobile
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API v1 routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="Imprest Management Backend API",
        routes=app.routes,
    )

    # Force OpenAPI 3.0.3 so Swagger UI renders file upload widgets (Choose File)
    schema["openapi"] = "3.0.3"

    def fix_schema(schema_dict):
        if not isinstance(schema_dict, dict):
            return

        # If anyOf is used for optional files (e.g. UploadFile | None), unwrap it for Swagger UI
        if "anyOf" in schema_dict:
            non_null_schemas = [s for s in schema_dict["anyOf"] if s.get("type") != "null"]
            if len(non_null_schemas) == 1:
                extracted = non_null_schemas[0]
                schema_dict.pop("anyOf")
                schema_dict.update(extracted)

        # Fix array of files: OpenAPI 3.0.3 format: binary
        if schema_dict.get("type") == "array" and "items" in schema_dict:
            items = schema_dict["items"]
            if isinstance(items, dict):
                if items.get("contentMediaType") == "application/octet-stream" or items.get("format") == "binary":
                    items.pop("contentMediaType", None)
                    items["type"] = "string"
                    items["format"] = "binary"

        # Fix single file
        if schema_dict.get("contentMediaType") == "application/octet-stream":
            schema_dict.pop("contentMediaType", None)
            schema_dict["type"] = "string"
            schema_dict["format"] = "binary"

        # Recurse through all nested dicts/lists
        for val in list(schema_dict.values()):
            if isinstance(val, dict):
                fix_schema(val)
            elif isinstance(val, list):
                for elem in val:
                    if isinstance(elem, dict):
                        fix_schema(elem)

    fix_schema(schema)
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/health", tags=["Health"])
def health_check():
    """Simple health check endpoint to verify server is running."""
    return {"status": "ok", "project": settings.PROJECT_NAME}
