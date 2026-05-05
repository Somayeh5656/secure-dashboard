"""
Authentication Blueprint – Handles user registration, login, logout, and CSRF token generation.

All routes are prefixed with /api/auth.
Uses rate limiting to prevent brute‑force attacks and logs all important actions.
"""

from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from datetime import datetime
from .extensions import db, limiter
from .models import User, AuditLog
from .utils import admin_required
from flask_wtf.csrf import generate_csrf

# Create blueprint with URL prefix /api/auth
bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/csrf', methods=['GET'])
def get_csrf():
    """
    Generate a CSRF token and set it as a readable cookie.

    The cookie is used by the frontend to include the token in the X-CSRFToken header.
    httponly=False allows JavaScript to read the cookie; secure=False for development.
    SameSite='Lax' prevents cross-origin sending while allowing same‑origin navigation.
    """
    token = generate_csrf()
    response = jsonify({'csrf_token': token})
    response.set_cookie(
        'csrf_token',
        token,
        httponly=False,      # JavaScript needs to read it
        secure=False,        # Set to True in production with HTTPS
        samesite='Lax'
    )
    return response


@bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")          # Max 5 login attempts per minute (brute‑force protection)
def login():
    """
    Authenticate a user using username/email and password.

    Expects JSON payload with 'username' (can be username or email) and 'password'.
    On success, logs in the user, updates last_login, records audit log, and returns user info.
    On failure, logs the failed attempt and returns a generic error message.
    """
    data = request.get_json()
    identifier = data.get('username')   # Can be username OR email
    password = data.get('password')

    # Logging for debugging (password length only, not actual password)
    print(f"[LOGIN] Received identifier: '{identifier}', password length: {len(password) if password else 0}")

    # Validate presence of credentials
    if not identifier or not password:
        return jsonify({'error': 'Missing credentials'}), 400

    # Try to find user by username first
    user = User.query.filter_by(username=identifier).first()
    if not user:
        # If not found, try by email
        user = User.query.filter_by(email=identifier).first()

    if user:
        print(f"[LOGIN] User found: {user.username}, is_admin: {user.is_admin}")
        if user.check_password(password):
            # Credentials correct – log in the user
            login_user(user, remember=data.get('remember', False))
            user.last_login = datetime.utcnow()
            db.session.commit()
            AuditLog.log(user.id, 'LOGIN_SUCCESS', request.remote_addr)
            return jsonify({
                'success': True,
                'is_admin': user.is_admin,
                'username': user.username,
                'userId': f'USR-{user.id:04X}'
            })
        else:
            print("[LOGIN] Password mismatch")
    else:
        print(f"[LOGIN] User not found for identifier: {identifier}")

    # Generic error message prevents username enumeration
    AuditLog.log(None, f'LOGIN_FAILED for {identifier}', request.remote_addr)
    return jsonify({'error': 'Invalid username or password'}), 401


@bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """
    Log out the currently authenticated user.

    Records the logout action in the audit log before ending the session.
    """
    AuditLog.log(current_user.id, 'LOGOUT', request.remote_addr)
    logout_user()
    return jsonify({'success': True})


@bp.route('/register', methods=['POST'])
@limiter.limit("3 per hour")            # Max 3 registration attempts per hour (prevent spam)
def register():
    """
    Create a new user account.

    Expects JSON payload with 'username', 'email', and 'password'.
    Checks for existing username/email; first user ever created becomes admin.
    Hashes the password before saving.
    Logs the registration event.
    """
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    print(f"[REGISTER] username='{username}', email='{email}', password length={len(password) if password else 0}")

    # Validate required fields
    if not username or not email or not password:
        return jsonify({'error': 'Missing fields'}), 400

    # Check for existing username or email
    if User.query.filter_by(username=username).first():
        print(f"[REGISTER] Username '{username}' already exists")
        return jsonify({'error': 'Username already exists'}), 400
    if User.query.filter_by(email=email).first():
        print(f"[REGISTER] Email '{email}' already exists")
        return jsonify({'error': 'Email already exists'}), 400

    # Create new user
    user = User(username=username, email=email)
    user.set_password(password)          # Hashes the password

    # First user becomes admin
    if User.query.count() == 0:
        user.is_admin = True
        print("[REGISTER] First user – set admin")

    db.session.add(user)
    db.session.commit()
    print(f"[REGISTER] User created with id={user.id}, username={user.username}")
    AuditLog.log(user.id, 'REGISTERED', request.remote_addr)

    return jsonify({'success': True})