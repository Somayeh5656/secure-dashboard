# clear_logs.py
from app import create_app
from app.models import AuditLog

app = create_app()
with app.app_context():
    deleted = AuditLog.delete_older_than(days=0)   # 0 deletes all logs
    print(f"Deleted {deleted} logs")