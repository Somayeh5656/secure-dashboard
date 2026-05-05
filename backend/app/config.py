"""
Configuration module for the Flask application.

Loads environment variables from .env file and defines security-related settings
for sessions, CSRF protection, and rate limiting.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file (keeps secrets out of version control)
load_dotenv()


class Config:
    """
    Application configuration class.

    All settings are loaded from environment variables with sensible fallback defaults.
    """

    # ------------------------------------------------------------------
    # Flask core settings
    # ------------------------------------------------------------------
    # Secret key used for session signing and CSRF token generation.
    # In production, MUST be set via environment variable SECRET_KEY.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-change-in-prod'

    # Database connection string – defaults to SQLite for development.
    # Override with DATABASE_URL environment variable for production.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'

    # Disable Flask-SQLAlchemy event system to save resources (recommended).
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ------------------------------------------------------------------
    # Session security (Flask-Login / Flask session cookie)
    # ------------------------------------------------------------------
    # Prevent JavaScript from accessing the session cookie (mitigates XSS attacks).
    SESSION_COOKIE_HTTPONLY = True

    # Send cookie only over HTTPS. Set to True in production after enabling TLS.
    # False is acceptable for local development without HTTPS.
    SESSION_COOKIE_SECURE = False

    # Restrict cookie sending to same-origin requests; Lax allows top‑level navigation.
    # Prevents CSRF across most cross‑origin requests.
    SESSION_COOKIE_SAMESITE = 'Lax'

    # Session expiration after 24 hours of inactivity.
    PERMANENT_SESSION_LIFETIME = 86400  # seconds

    # ------------------------------------------------------------------
    # CSRF protection (Flask-WTF)
    # ------------------------------------------------------------------
    # Globally enable CSRF token validation for all POST, PUT, DELETE requests.
    WTF_CSRF_ENABLED = True

    # CSRF token validity period (1 hour).
    WTF_CSRF_TIME_LIMIT = 3600

    # Separate secret key for CSRF token signing (falls back to SECRET_KEY).
    # Optional but recommended for separation of concerns.
    WTF_CSRF_SECRET_KEY = os.environ.get('WTF_CSRF_SECRET_KEY') or SECRET_KEY

    # HTTP header name where the frontend sends the CSRF token.
    # Used by fetchWithCsrf helper on the client side.
    WTF_CSRF_HEADERS = ['X-CSRFToken']

    # ------------------------------------------------------------------
    # Rate limiting (Flask-Limiter)
    # ------------------------------------------------------------------
    # Enable rate limiting globally.
    RATELIMIT_ENABLED = True

    # Use in‑memory storage (not suitable for production with multiple processes).
    # Replace with Redis (or other centralised store) in production.
    RATELIMIT_STORAGE_URL = "memory://"

    # Time window strategy: sliding‑window or fixed‑window.
    RATELIMIT_STRATEGY = "fixed-window"

    # Default rate limits applied to all routes unless overridden by decorator.
    # Format: "X per Yperiod"
    RATELIMIT_DEFAULT = "200 per day;50 per hour"