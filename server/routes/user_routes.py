from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from models.User import User
from models.TokenBlocklist import TokenBlocklist
from db.Burnout_Tracker import db
from utils.auth_utils import role_required
from utils.jwt_blocklist import jwt_blocklist
from utils.validators import is_strong_password  

auth_bp = Blueprint('auth_bp', __name__)

# ==================== Home ====================
@auth_bp.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the Student Burnout Tracker API!"})


# ==================== SIGNUP ====================
@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'staff').lower()

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required."}), 400

    if not is_strong_password(password):
        return jsonify({
            "error": "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character."
        }), 400

    # Check if user already exists
    existing_user = User.query.filter(
        (User.username == username) | (User.email == email)
    ).first()

    if existing_user:
        return jsonify({"error": "User with that username or email already exists."}), 409

    # Create new user
    new_user = User(username=username, email=email, role=role)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully.",
        "user": new_user.to_dict()
    }), 201


# ==================== LOGIN ====================
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    username_or_email = data.get('username_or_email')
    password = data.get('password')

    if not username_or_email or not password:
        return jsonify({"error": "Username/email and password are required."}), 400

    # Finding a user by username or email
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username/email or password."}), 401

    access_token = create_access_token(identity={
        "id": user.id,
        "role": user.role,
        "username": user.username
        })

    return jsonify({
        "message": "Login successful.",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


# ==================== LOGOUT ====================
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        jwt_data = get_jwt()
        jti = jwt_data.get("jti")
        print(f"[DEBUG] JWT data: {jwt_data}")
        print(f"[DEBUG] JTI: {jti}")

        if not jti:
            return jsonify({"error": "Token does not contain a jti"}), 400

        blocked_token = TokenBlocklist(jti=jti)
        db.session.add(blocked_token)
        db.session.commit()
        return jsonify({"message": "Successfully logged out"}), 200

    except Exception as e:
        print(f"[ERROR] Logout failed: {e}")
        return jsonify({"error": str(e)}), 500
    
# ===== Get a user by username =====
@auth_bp.route('/users/username/<string:username>', methods=['GET'])
@jwt_required()
def get_user_by_username(username):
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify(user.to_dict()), 200

# ==================== DUMMY ROUTE TO TEST RBAC Admin ====================
@auth_bp.route('/admin-only', methods=['GET'])
@role_required(['admin'])
def admin_only_route():
    return jsonify({"message": "You are an admin!"})

# ==================== DUMMY ROUTE TO TEST RBAC Student ====================
@auth_bp.route('/student-only', methods=['GET'])
@role_required(['student'])
def staff_only_route():
    return jsonify({"message": "You are a student!"})

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required(['admin'])  # Or remove if not admin-only
def get_all_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@auth_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@role_required(['admin'])  # Optional: adjust based on your access policy
def get_user_by_id(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/users/<int:user_id>', methods=['PATCH'])
@jwt_required()
def update_user(user_id):
    current_user = get_jwt()
    if current_user['id'] != user_id and current_user['role'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if username:
        user.username = username
    if email:
        user.email = email
    if password:
        if not is_strong_password(password):
            return jsonify({
                "error": "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character."
            }), 400
        user.set_password(password)

    db.session.commit()
    return jsonify({"message": "User updated successfully", "user": user.to_dict()}), 200

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])  # Only admins can delete users
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully."}), 200

@auth_bp.route('/users/role/<string:role>', methods=['GET'])
@jwt_required()
@role_required(['admin'])  # Optional
def get_users_by_role(role):
    users = User.query.filter_by(role=role.lower()).all()
    return jsonify([user.to_dict() for user in users]), 200

# ==================== SUSPEND OR ACTIVATE USER ====================
@auth_bp.route('/users/<int:user_id>/status', methods=['PATCH'])
@jwt_required()
@role_required(['admin'])  # Only admins can suspend/activate
def update_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    is_active = data.get("is_active")

    if is_active is None:
        return jsonify({"error": "'is_active' field is required."}), 400

    user.is_active = bool(is_active)
    db.session.commit()

    status = "activated" if user.is_active else "suspended"
    return jsonify({
        "message": f"User {status} successfully.",
        "user": user.to_dict()
    }), 200
