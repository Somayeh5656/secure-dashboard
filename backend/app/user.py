"""
User Blueprint – Handles profile management, activity logs, and password changes for regular users.

All routes require authentication (@login_required). 
No admin privileges are needed; users can only access their own data.
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from .models import User, AuditLog, db
from .extensions import csrf
from .utils import admin_required   # not used here (user endpoints have no admin checks)

# Create blueprint with URL prefix /api/user
bp = Blueprint('user', __name__, url_prefix='/api/user')


@bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    """
    Retrieve the currently authenticated user's profile data.

    Returns:
        JSON object containing username, email, formatted user ID,
        join date, and a dynamically generated avatar (using ui-avatars API).
    """
    return jsonify({
        'username': current_user.username,
        'email': current_user.email,
        'userId': f'USR-{current_user.id:04X}',
        'joinDate': current_user.created_at.strftime('%Y-%m-%d'),
        'avatar': f'https://ui-avatars.com/api/?name={current_user.username}&background=00FFFF&color=000000'
    })


@bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """
    Update the current user's profile (username and/or email).

    Only allows modification of 'username' and 'email' fields.
    Checks that new values are not already taken by another user.
    Logs the update action in the audit log.
    """
    data = request.get_json()

    # Update username if provided
    if 'username' in data:
        # Prevent duplicate username (excluding the current user)
        if User.query.filter(User.username == data['username'], User.id != current_user.id).first():
            return jsonify({'error': 'Username already taken'}), 400
        current_user.username = data['username']

    # Update email if provided
    if 'email' in data:
        # Prevent duplicate email (excluding the current user)
        if User.query.filter(User.email == data['email'], User.id != current_user.id).first():
            return jsonify({'error': 'Email already registered'}), 400
        current_user.email = data['email']

    db.session.commit()

    # Record the update in security audit log
    AuditLog.log(current_user.id, 'PROFILE_UPDATED', request.remote_addr)
    return jsonify({'success': True})


@bp.route('/activity', methods=['GET'])
@login_required
def get_activity():
    """
    Retrieve the current user's recent audit log entries.

    Returns up to 20 most recent actions (login, profile updates, password changes, etc.)
    ordered from newest to oldest.
    """
    logs = AuditLog.query.filter_by(user_id=current_user.id)\
                        .order_by(AuditLog.timestamp.desc())\
                        .limit(20).all()

    return jsonify([{
        'date': log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
        'ip': log.ip_address,
        'action': log.action,
        'location': 'Unknown'   # Placeholder – could be extended with GeoIP lookup
    } for log in logs])


@bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """
    Change the current user's password.

    Expects JSON payload with 'old_password' and 'new_password'.
    Verifies the old password before updating.
    Logs the password change action.
    """
    data = request.get_json()
    old = data.get('old_password')
    new = data.get('new_password')

    if not old or not new:
        return jsonify({'error': 'Missing fields'}), 400

    # Validate current password
    if not current_user.check_password(old):
        return jsonify({'error': 'Incorrect current password'}), 400

    # Hash and store the new password
    current_user.set_password(new)
    db.session.commit()

    # Record the change
    AuditLog.log(current_user.id, 'PASSWORD_CHANGED', request.remote_addr)
    return jsonify({'success': True})