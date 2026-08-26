web: gunicorn -w 2 -k uvicorn.workers.UvicornWorker --timeout 120 --keep-alive 5 --proxy-headers --forwarded-allow-ips='*' server:app --bind 0.0.0.0:$PORT
