FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu
COPY . .
ENV JAVA_BACKEND_URL=http://backend:8080/api
ENV PYTHONUNBUFFERED=1
CMD ["python", "main.py"]
