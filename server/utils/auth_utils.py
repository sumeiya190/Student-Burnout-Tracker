from functools import wraps
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask import jsonify
from models.User import User

def role_required(roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            identity = get_jwt_identity()
            user_id = identity.get("id")
            user = User.query.get(user_id)

            if not user or user.role.lower() not in roles:
                return jsonify({"error": "Access forbidden: you don't have the required permissions to access this resource."}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
