#!/bin/sh
set -e

echo "Waiting for MySQL..."
python - <<'PY'
import os
import time
import MySQLdb

host = os.getenv("DB_HOST", "mysql")
port = int(os.getenv("DB_PORT", "3306"))
user = os.getenv("DB_USER", "root")
password = os.getenv("DB_PASSWORD", "123456")
database = os.getenv("DB_NAME", "credit_card_payment_db")

for attempt in range(30):
    try:
        conn = MySQLdb.connect(host=host, port=port, user=user, passwd=password, db=database)
        conn.close()
        print("MySQL is ready.")
        break
    except Exception as exc:
        print(f"MySQL not ready yet: {exc}")
        time.sleep(2)
else:
    raise SystemExit("Could not connect to MySQL.")
PY

python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000
