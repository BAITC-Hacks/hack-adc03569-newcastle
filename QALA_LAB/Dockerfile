FROM python:3.12-slim
WORKDIR /app
COPY app ./app
COPY web ./web
COPY sources ./sources
COPY server.py ./
USER 65534:65534
EXPOSE 8000
CMD ["python", "server.py", "--host", "0.0.0.0"]
