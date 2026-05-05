"""
Extensions module – initializes Flask extensions used across the application.

This centralises the creation of database, authentication, CSRF protection,
and rate limiting objects so they can be imported and used anywhere.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# SQLAlchemy ORM – handles database models, queries, and transactions
db = SQLAlchemy()

# Flask-Login – manages user sessions and authentication state
login_manager = LoginManager()

# Flask-WTF CSRF protection – validates anti‑forgery tokens on state‑changing requests
csrf = CSRFProtect()

# Flask-Limiter – rate limiting to prevent brute‑force and abuse
# key_func=get_remote_address: uses client IP address as the limit key
# default_limits: applied globally unless overridden by decorators
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)