FROM python:3.12-slim

# Install system dependencies required by asyncpg and PostGIS client libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install uv for fast dependency resolution
RUN pip install uv --no-cache-dir

# Copy dependency manifest first to leverage layer cache
COPY pyproject.toml .

# Install all dependencies (including dev extras for hot-reload tooling)
RUN uv pip install --system -e ".[dev]"

# Copy source — in dev this is overridden by a bind mount
COPY . .

EXPOSE 8000

# Default: hot reload enabled. Override CMD in production.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
