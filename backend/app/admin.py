"""
Admin Blueprint – Handles all administrator-only operations.

All routes require authentication (@login_required) and admin privileges (@admin_required).
Endpoints include user management, system log retrieval, and statistics.
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from .models import User, AuditLog, db
from .utils import admin_required
from .extensions import csrf

# Create blueprint with URL prefix /api/admin
bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@bp.route('/users', methods=['GET'])
@login_required
@admin_required
def get_users():
    """
    Retrieve all users.

    Returns a list of users with id, username, email, and role (Admin/User).
    Only accessible by admin users.
    """
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'role': 'Admin' if u.is_admin else 'User',
    } for u in users])


@bp.route('/users', methods=['POST'])
@login_required
@admin_required
def create_user():
    """
    Create a new user account.

    Expects JSON payload with username, email, password, and optional role ('Admin' or 'User').
    Performs uniqueness checks on username and email.
    Returns 400 if any required field is missing or if username/email already exists.
    Logs the creation action in the audit log.
    """
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'User')

    # Validate required fields
    if not username or not email or not password:
        return jsonify({'error': 'Missing fields'}), 400

    # Check for existing username or email
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username exists'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email exists'}), 400

    # Create and persist the new user
    user = User(username=username, email=email)
    user.set_password(password)
    user.is_admin = (role.lower() == 'admin')
    db.session.add(user)
    db.session.commit()

    # Record the action in audit log
    AuditLog.log(current_user.id, f'CREATED_USER {username}', request.remote_addr)
    return jsonify({'success': True})


@bp.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(user_id):
    """
    Delete a user by ID.

    Prevents deleting the currently logged-in admin (self-deletion is forbidden).
    Logs the deletion action.
    """
    # Prevent admin from deleting their own account
    if user_id == current_user.id:
        return jsonify({'error': 'Cannot delete yourself'}), 400

    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    AuditLog.log(current_user.id, f'DELETED_USER {user.username}', request.remote_addr)
    return jsonify({'success': True})


@bp.route('/logs', methods=['GET'])
@login_required
@admin_required
def get_logs():
    """
    Retrieve system audit logs with pagination.

    Query parameters:
        page (int, optional): Page number (default 1).
        per_page (int, internal): Fixed at 100 log entries per page.

    Returns a JSON object containing:
        logs: list of log entries (timestamp, action, username, IP)
        page: current page number
        pages: total number of pages
        total: total number of log entries
    """
    page = request.args.get('page', 1, type=int)
    per_page = 100
    paginated = AuditLog.query.order_by(AuditLog.timestamp.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    result = []
    for log in paginated.items:
        username = User.query.get(log.user_id).username if log.user_id else 'system'
        result.append({
            'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'action': log.action,
            'user': username,
            'ip': log.ip_address
        })

    return jsonify({
        'logs': result,
        'page': paginated.page,
        'pages': paginated.pages,
        'total': paginated.total
    })


@bp.route('/stats', methods=['GET'])
@login_required
@admin_required
def get_stats():
    """
    Return basic system statistics.

    Includes total number of users, total audit log entries, and active sessions.
    Active sessions count is a placeholder (requires session store implementation).
    """
    total_users = User.query.count()
    total_logs = AuditLog.query.count()
    # Placeholder – could be calculated by tracking active session IDs
    active_sessions = 0

    return jsonify({
        'total_users': total_users,
        'total_logs': total_logs,
        'active_sessions': active_sessions
    })