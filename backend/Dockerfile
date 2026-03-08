FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml .
RUN uv pip install --system -e ".[dev]"

COPY . .

RUN chmod +x start.sh

EXPOSE 8000
CMD ["./start.sh"]
