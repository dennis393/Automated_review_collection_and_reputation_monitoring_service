FROM python:3.12-slim

WORKDIR /app

COPY requirements-api.txt .
COPY requirements-worker.txt .

RUN pip install --no-cache-dir -r requirements-api.txt
RUN pip install --no-cache-dir -r requirements-worker.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "API_Dev_B"]



 