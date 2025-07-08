from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models.Evaluation import Evaluation
from models.User import User
from db.Burnout_Tracker import db
from utils.auth_utils import role_required

evaluation_bp = Blueprint('evaluation_bp', __name__)

# ==================== SUBMIT NEW EVALUATION (Student) ====================
@evaluation_bp.route('/evaluations', methods=['POST'])
@jwt_required()
def submit_evaluation():
    """Student submits a new evaluation."""
    data = request.get_json()
    current_user = get_jwt_identity()
    user_id = current_user.get("id")

    try:
        evaluation = Evaluation(
            user_id=user_id,
            q1=data.get('q1'),
            q2=data.get('q2'),
            q3=data.get('q3'),
            q4=data.get('q4'),
            q5=data.get('q5'),
            q6=data.get('q6'),
            q7=data.get('q7'),
            q8=data.get('q8'),
            q9=data.get('q9'),
            q10=data.get('q10'),
        )
        evaluation.calculate_total_score()
        db.session.add(evaluation)
        db.session.commit()

        return jsonify({
            "message": "Evaluation submitted successfully.",
            "evaluation": evaluation.to_dict()
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== GET ALL EVALUATIONS (Admin) ====================
@evaluation_bp.route('/evaluations', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_all_evaluations():
    """Admin retrieves all evaluations."""
    evaluations = Evaluation.query.order_by(Evaluation.submitted_at.desc()).all()
    return jsonify([e.to_dict() for e in evaluations]), 200


# ==================== GET EVALUATION BY ID (Owner/Admin) ====================
@evaluation_bp.route('/evaluations/<int:evaluation_id>', methods=['GET'])
@jwt_required()
def get_evaluation_by_id(evaluation_id):
    """Retrieve a specific evaluation by ID (owner or admin)."""
    current_user = get_jwt_identity()
    user_id = current_user.get("id")
    role = current_user.get("role")

    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({"error": "Evaluation not found."}), 404

    if evaluation.user_id != user_id and role != 'admin':
        return jsonify({"error": "Unauthorized access."}), 403

    return jsonify(evaluation.to_dict()), 200


# ==================== GET MY EVALUATIONS (Student) ====================
@evaluation_bp.route('/my-evaluations', methods=['GET'])
@jwt_required()
def get_my_evaluations():
    """Student retrieves all of their submitted evaluations."""
    current_user = get_jwt_identity()
    user_id = current_user.get("id")

    evaluations = Evaluation.query.filter_by(user_id=user_id).order_by(Evaluation.submitted_at.desc()).all()
    return jsonify([e.to_dict() for e in evaluations]), 200


# ==================== DELETE EVALUATION (Admin) ====================
@evaluation_bp.route('/evaluations/<int:evaluation_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_evaluation(evaluation_id):
    """Admin deletes an evaluation."""
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({"error": "Evaluation not found."}), 404

    db.session.delete(evaluation)
    db.session.commit()
    return jsonify({"message": "Evaluation deleted successfully."}), 200


# ==================== GET EVALUATIONS BY USER ID (Admin) ====================
@evaluation_bp.route('/evaluations/user/<int:user_id>', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_user_evaluations(user_id):
    """Admin gets all evaluations for a specific user by ID."""
    evaluations = Evaluation.query.filter_by(user_id=user_id).order_by(Evaluation.submitted_at.asc()).all()
    if not evaluations:
        return jsonify({"message": "No evaluations found for this user."}), 404

    result = []
    for index, evaluation in enumerate(evaluations, start=1):
        eval_dict = evaluation.to_dict()
        eval_dict["evaluation_number"] = f"Evaluation {index}"
        eval_dict["is_alert"] = evaluation.needs_support
        result.append(eval_dict)

    return jsonify(result), 200


# ==================== GET EVALUATIONS BY USERNAME (Admin) ====================
@evaluation_bp.route('/evaluations/username/<string:username>', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_evaluations_by_username(username):
    """Admin gets evaluations by username (only if student)."""
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found."}), 404
    if user.role != 'student':
        return jsonify({"error": "Only student evaluations can be viewed."}), 400

    evaluations = Evaluation.query.filter_by(user_id=user.id).order_by(Evaluation.submitted_at.desc()).all()
    return jsonify([e.to_dict() for e in evaluations]), 200


# ==================== SET MEETING FOR EVALUATION (Admin) ====================
@evaluation_bp.route('/evaluations/<int:evaluation_id>/set-meeting', methods=['PATCH'])
@jwt_required()
@role_required(['admin'])
def set_meeting_for_evaluation(evaluation_id):
    """Admin sets meeting info for a specific evaluation."""
    data = request.get_json()
    evaluation = Evaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({"error": "Evaluation not found."}), 404

    required_fields = ['place', 'time', 'day', 'date']
    if not all(data.get(field) for field in required_fields):
        return jsonify({"error": "All meeting details (place, time, day, date) are required."}), 400

    evaluation.meeting_place = data['place']
    evaluation.meeting_time = data['time']
    evaluation.meeting_day = data['day']
    evaluation.meeting_date = data['date']
    db.session.commit()

    return jsonify({
        "message": "Meeting scheduled successfully.",
        "evaluation": evaluation.to_dict()
    }), 200


# ==================== MARK EVALUATION AS HANDLED (Admin) ====================
@evaluation_bp.route('/evaluations/<int:evaluation_id>/handle', methods=['PATCH'])
@jwt_required()
@role_required(['admin'])
def mark_evaluation_handled(evaluation_id):
    """Admin marks an evaluation as handled."""
    evaluation = Evaluation.query.get(evaluation_id)
    current_user = get_jwt_identity()

    if not evaluation:
        return jsonify({"error": "Evaluation not found."}), 404

    if evaluation.handled_by_admin_id:
        return jsonify({"message": "Evaluation already handled."}), 200

    evaluation.handled_by_admin_id = current_user.get("id")
    evaluation.handled_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Evaluation marked as handled."}), 200


# ==================== GET LATEST STUDENT MEETING INFO ====================
@evaluation_bp.route('/evaluations/student/meeting', methods=['GET'])
@jwt_required()
@role_required(['student'])
def get_student_meeting_info():
    """Student gets the latest meeting info if evaluation is handled."""
    current_user = get_jwt_identity()
    evaluation = (
        Evaluation.query
        .filter_by(user_id=current_user["id"])
        .filter(Evaluation.handled_by_admin_id.isnot(None))
        .order_by(Evaluation.handled_at.desc())
        .first()
    )

    if not evaluation:
        return jsonify({"message": "No handled evaluation found."}), 404

    if not evaluation.meeting_place:
        return jsonify({"message": "No meeting has been scheduled yet."}), 200

    return jsonify({
        "meeting": {
            "place": evaluation.meeting_place,
            "time": evaluation.meeting_time,
            "day": evaluation.meeting_day,
            "date": evaluation.meeting_date,
            "scheduled_by": {
                "id": evaluation.handled_by_admin.id,
                "name": evaluation.handled_by_admin.username,
                "email": evaluation.handled_by_admin.email
            },
            "evaluation_id": evaluation.id
        }
    }), 200


@evaluation_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Returns notifications for the current user based on role."""
    current_user = get_jwt_identity()
    user_id = current_user.get("id")
    role = current_user.get("role")

    notifications = []

    if role == 'student':
        evaluation = (
            Evaluation.query
            .filter_by(user_id=user_id)
            .filter(Evaluation.meeting_place.isnot(None))
            .order_by(Evaluation.submitted_at.desc())
            .first()
        )
        if evaluation:
            notifications.append({
                "type": "meeting",
                "evaluation_id": evaluation.id,
                "message": f"A meeting has been scheduled on {evaluation.meeting_date} at {evaluation.meeting_time}.",
                "meeting": {
                    "place": evaluation.meeting_place,
                    "time": evaluation.meeting_time,
                    "day": evaluation.meeting_day,
                    "date": evaluation.meeting_date,
                }
            })

    elif role == 'admin':
        unhandled = Evaluation.query.filter_by(handled_by_admin_id=None).count()
        if unhandled > 0:
            notifications.append({
                "type": "pending_evaluations",
                "message": f"There are {unhandled} unhandled evaluations."
            })

    return jsonify(notifications), 200

# ==================== CREATE NOTIFICATION (Test Route) ====================
@evaluation_bp.route('/notifications', methods=['POST'])
@jwt_required()
def create_notification():
    """Test route to simulate creating a notification."""
    data = request.get_json()
    return jsonify({
        "message": "Notification received.",
        "data": data
    }), 201
