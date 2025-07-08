# models/Evaluation.py
from db.Burnout_Tracker import db
from datetime import datetime

class Evaluation(db.Model):
    __tablename__ = 'evaluations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    q1 = db.Column(db.Integer, nullable=False)
    q2 = db.Column(db.Integer, nullable=False)
    q3 = db.Column(db.Integer, nullable=False)
    q4 = db.Column(db.Integer, nullable=False)
    q5 = db.Column(db.Integer, nullable=False)
    q6 = db.Column(db.Integer, nullable=False)
    q7 = db.Column(db.Integer, nullable=False)
    q8 = db.Column(db.Integer, nullable=False)
    q9 = db.Column(db.Integer, nullable=False)
    q10 = db.Column(db.Integer, nullable=False)

    total_score = db.Column(db.Integer, nullable=False)
    needs_support = db.Column(db.Boolean, default=False)

    handled_by_admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    handled_at = db.Column(db.DateTime, nullable=True)

    # ✅ New meeting-related fields (nullable)
    meeting_place = db.Column(db.String(120), nullable=True)
    meeting_time = db.Column(db.String(20), nullable=True)  # e.g., "14:00"
    meeting_day = db.Column(db.String(20), nullable=True)   # e.g., "Monday"
    meeting_date = db.Column(db.String(20), nullable=True)  # e.g., "2025-07-07"

    user = db.relationship('User', foreign_keys=[user_id], backref='evaluations')
    handled_by_admin = db.relationship('User', foreign_keys=[handled_by_admin_id])

    def calculate_total_score(self):
        self.total_score = sum([
            self.q1, self.q2, self.q3, self.q4, self.q5,
            self.q6, self.q7, self.q8, self.q9, self.q10
        ])
        self.needs_support = self.total_score >= 35

    def to_dict(self):
        return {
            "id": self.id,
            "submitted_at": self.submitted_at.isoformat(),
            "date": self.submitted_at.strftime("%Y-%m-%d"),
            "total_score": self.total_score,
            "needs_support": self.needs_support,
            "user": {
                "id": self.user.id,
                "username": self.user.username,
                "email": self.user.email
            },
            "answers": {
                "q1": self.q1,
                "q2": self.q2,
                "q3": self.q3,
                "q4": self.q4,
                "q5": self.q5,
                "q6": self.q6,
                "q7": self.q7,
                "q8": self.q8,
                "q9": self.q9,
                "q10": self.q10
            },
            "handled_by": {
                "id": self.handled_by_admin.id,
                "username": self.handled_by_admin.username,
                "email": self.handled_by_admin.email
            } if self.handled_by_admin else None,
            "handled_at": self.handled_at.isoformat() if self.handled_at else None,
            # ✅ Include meeting info
            "meeting": {
                "place": self.meeting_place,
                "time": self.meeting_time,
                "day": self.meeting_day,
                "date": self.meeting_date
            } if self.meeting_place else None
        }
