"""
Utility functions and decorators used across the application.
"""

from functools import wraps
from flask import abort, jsonify
from flask_login import current_user


def admin_required(f):
    """
    Decorator to restrict access to admin‑only routes.

    Checks that the current user is authenticated and has the `is_admin` flag set to True.
    If the user is not authenticated or is not an admin, returns a 403 Forbidden response
    with a JSON error message. Otherwise, proceeds to the decorated function.

    This decorator is intended to be applied after @login_required, so `current_user`
    is guaranteed to be authenticated (unless bypassed, but @login_required ensures it).

    Returns:
        The decorated function if allowed, or a 403 JSON response.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Check both authentication status and admin role
        if not current_user.is_authenticated or not current_user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated