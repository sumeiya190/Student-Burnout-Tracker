import re

# Check password strength
def is_strong_password(password):
    return (
        len(password) >= 8 and
        re.search(r'[A-Z]', password) and
        re.search(r'[a-z]', password) and
        re.search(r'\d', password) and
        re.search(r'[!@#$%^&*(),.?":{}|<>]', password)
    )

# Validate user data
def validate_user_data(data, existing_user=None):
    errors = {}

    # Validate username
    if 'username' in data:
        username = data['username'].strip()
        if len(username) < 3:
            errors['username'] = "Username must be at least 3 characters long."

    # Validate email
    if 'email' in data:
        email = data['email'].strip()
        if '@' not in email or '.' not in email:
            errors['email'] = "Invalid email format."

    # Validate password (only if it's given)
    if 'password' in data and data['password']:
        if not is_strong_password(data['password']):
            errors['password'] = (
                "Password must be at least 8 characters long, include "
                "uppercase, lowercase, a number, and a special character."
            )

    return errors
