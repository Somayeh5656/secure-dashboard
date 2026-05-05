"""
Flask application factory.

This module initializes the Flask app, configures extensions,
registers blueprints, adds security headers, and creates database tables.
"""

from flask import Flask, jsonify, g
from .config import Config
from .extensions import db, login_manager, csrf, limiter
from .models import User


def create_app():
    """
    Application factory – creates and configures the Flask app.

    Returns:
        Flask: The configured Flask application instance.
    """
    app = Flask(__name__)
    # Load configuration from Config class (e.g., secret keys, session settings)
    app.config.from_object(Config)

    # ------------------------------------------------------------------
    # Initialize Flask extensions
    # ------------------------------------------------------------------
    db.init_app(app)                # SQLAlchemy ORM for database operations
    login_manager.init_app(app)     # Flask-Login for session‑based user authentication
    csrf.init_app(app)              # Flask-WTF CSRF protection

    @login_manager.user_loader
    def load_user(user_id):
        """Load a user from the database by ID (used by Flask-Login)."""
        return User.query.get(int(user_id))

    limiter.init_app(app)           # Flask-Limiter for rate limiting (login, registration)

    # Configure Flask-Login behaviour
    login_manager.login_view = 'auth.login'   # Not used directly (API only), but required
    login_manager.login_message = None        # Suppress default flash message

    # ------------------------------------------------------------------
    # Register blueprints (modular route groups)
    # ------------------------------------------------------------------
    from .auth import bp as auth_bp
    app.register_blueprint(auth_bp)           # Authentication: login, register, logout, CSRF

    from .user import bp as user_bp
    app.register_blueprint(user_bp)           # User dashboard: profile, activity, change password

    from .admin import bp as admin_bp
    app.register_blueprint(admin_bp)          # Admin panel: user management, logs, statistics

    # ------------------------------------------------------------------
    # Global error handlers
    # ------------------------------------------------------------------
    @app.errorhandler(400)
    def bad_request(e):
        """Handle HTTP 400 Bad Request errors."""
        if 'CSRF' in str(e):
            # Provide a clear message for CSRF token failures
            return jsonify({'error': 'CSRF token missing or invalid'}), 400
        # Generic fallback for other bad requests
        return jsonify({'error': 'Bad request'}), 400

    # ------------------------------------------------------------------
    # Security headers – sent with every response
    # ------------------------------------------------------------------
    @app.after_request
    def add_security_headers(response):
        """
        Add security headers to all HTTP responses to mitigate common attacks.

        Headers added:
            X-Frame-Options: DENY          – Prevents clickjacking (page cannot be framed)
            X-Content-Type-Options: nosniff – Stops MIME type sniffing
            Referrer-Policy: strict-origin-when-cross-origin – Controls referrer information
            Content-Security-Policy: restricts resource loading to same origin,
                allows inline scripts/styles (needed for development) and scripts from cdnjs
        """
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        # CSP – adjust for production to remove 'unsafe-inline' if possible
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline';"
        )
        return response

    # ------------------------------------------------------------------
    # Database setup – create all tables (development only)
    # ------------------------------------------------------------------
    with app.app_context():
        db.create_all()                     # Creates tables based on SQLAlchemy models

    return app