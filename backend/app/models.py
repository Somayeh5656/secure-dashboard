"""
Database models – defines the structure of the application's data.

Contains two main models:
    - User: stores user account information, authentication, and role.
    - AuditLog: records security‑relevant events for forensic analysis.
"""

from datetime import datetime, timedelta
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db


class User(UserMixin, db.Model):
    """
    User account model.

    Implements Flask-Login required methods and provides password hashing.
    Stores basic identity, authentication data, and administrative role.
    """

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    # Hashed password (never store plain text)
    password_hash = db.Column(db.String(200), nullable=False)

    # Role flag: True for administrators, False for regular users
    is_admin = db.Column(db.Boolean, default=False)

    # Timestamps for auditing and session management
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        """
        Hash and store the user's password.

        Uses PBKDF2 with SHA‑256 (Werkzeug's default) which includes a random salt.
        This is a one‑way function – the original password cannot be recovered.
        """
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        """
        Verify a plain‑text password against the stored hash.

        Returns True if the password matches, False otherwise.
        """
        return check_password_hash(self.password_hash, password)

    # ------------------------------------------------------------------
    # Flask-Login required methods and properties
    # ------------------------------------------------------------------
    @property
    def is_authenticated(self):
        """Return True if the user is authenticated (always True for loaded users)."""
        return True

    @property
    def is_active(self):
        """Return True if the account is active (no account lockout implemented)."""
        return True

    @property
    def is_anonymous(self):
        """Return True if the user is anonymous (always False for actual users)."""
        return False

    def get_id(self):
        """Return the unique identifier for this user as a string (required by Flask-Login)."""
        return str(self.id)


class AuditLog(db.Model):
    """
    Security audit log model.

    Stores every important action (login, logout, registration, user creation/deletion,
    profile updates, password changes) along with the user ID, action description,
    client IP address, and timestamp.
    """

    id = db.Column(db.Integer, primary_key=True)
    # Foreign key to User; nullable=True because some actions (e.g., failed login) may have no user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    action = db.Column(db.String(255), nullable=False)  # Human‑readable description
    ip_address = db.Column(db.String(45))               # Supports IPv4 and IPv6
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def log(user_id, action, ip_address=None):
        """
        Insert a new log entry into the database.

        Args:
            user_id (int or None): ID of the logged‑in user, or None for anonymous actions.
            action (str): Description of the event (e.g., "LOGIN_SUCCESS").
            ip_address (str, optional): Client IP address from request.remote_addr.

        Security: Sanitises the action string to prevent log injection attacks.
                  Removes newlines, carriage returns, and tabs.
        """
        import re
        # Remove any control characters that could break log parsing or enable injection
        safe_action = re.sub(r'[\n\r\t]', ' ', action)
        # Optional: escape backslashes (kept simple here)
        safe_action = safe_action.replace('\\', '\\\\')
        log = AuditLog(user_id=user_id, action=safe_action, ip_address=ip_address)
        db.session.add(log)
        db.session.commit()

    @staticmethod
    def delete_older_than(days=2):
        """
        Delete log entries older than a specified number of days.

        Used to prevent the audit log table from growing indefinitely.
        Default: keep only the last 2 days of logs (adjustable).

        Returns the number of deleted rows.
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        deleted = AuditLog.query.filter(AuditLog.timestamp < cutoff).delete()
        db.session.commit()
        return deleted