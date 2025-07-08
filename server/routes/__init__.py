from .user_routes import auth_bp
from .evaluation_routes import evaluation_bp

all_routes = [
    auth_bp,
    evaluation_bp
]