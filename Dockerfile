# 1. Use official lightweight Python 3.12 Linux image
FROM python:3.12-slim

# 2. Prevent Python from writing .pyc files & buffer logs (shows logs instantly)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 3. Set working directory inside container
WORKDIR /app

# 4. Copy ONLY requirements first (Docker Layer Caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of your application code (app/, alembic/, fonts/, etc.)
COPY . .

# 6. Expose FastAPI port
EXPOSE 8000

# 7. Start Uvicorn bound to 0.0.0.0 so it is reachable outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
