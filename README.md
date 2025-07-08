# 🧠 Student Burnout Tracker
#### A simple, privacy-focused web-based application that allows students to regularly assess their mental well-being and track signs of academic burnout. Built with Flask (Python) and React (Vite), this system aims to promote early intervention by allowing students to check in weekly, view progress, and get support if needed.

## 🌟 Features
#### ✅ User Registration and Login (JWT-based)
#### 📅 Weekly burnout self-assessment form
#### 📈 Dashboard with burnout history tracking
#### 🔔 Admin alerts for high-risk students
#### 🔐 Role-based access control (Student/Admin)
#### 📊 Secure storage of user data with SQLite
#### ⚠️ Input validation and error handling

## 🎯 Purpose
#### The Student Burnout Tracker was developed as part of a university capstone project. It addresses the increasing rate of academic burnout among university students by providing a proactive and accessible tool for self-monitoring and institutional support.

## 🛠️ Tech Stack
### Layer	Technology
#### Frontend	React (Vite), CSS
#### Backend	Flask (Python)
#### Database	SQLite
#### ORM	SQLAlchemy
#### Authentication	JSON Web Tokens (JWT)
#### Dev Environment	VS Code
#### Backup	GitHub

## 🖥️ Setup Instructions
### Clone the repository

bash
Copy
Edit
git clone https://github.com/Yasir554/Student-Burnout-Tracker
cd Student-Burnout-Tracker
Set up the backend

bash
Copy
Edit
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
python app.py
Set up the frontend

bash
Copy
Edit
cd frontend
npm install
npm run dev
Access the app
Navigate to http://localhost:5173 in your browser.

## 📁 Project Structure
csharp
Copy
Edit
Student-Burnout-Tracker/
│
├── backend/              # Flask API backend
│   ├── app.py            # Entry point
│   └── models/           # SQLAlchemy models
│
├── frontend/             # React frontend
│   ├── src/
│   ├── public/
│   └── vite.config.js
│
└── README.md             # Project README

## 🧪 Testing
#### Testing was done manually using Flask’s test client and Postman for backend endpoints. Core functionalities like registration, login, assessment, and role-based access were tested with valid and invalid inputs. Test results are documented in the project report (Chapter 5) and screenshots are available in the Appendices.

## 🧩 Limitations
#### No integration with professional therapy services
#### No AI chatbot or natural language mood tracking
#### Built for prototype/demo purposes, not production use