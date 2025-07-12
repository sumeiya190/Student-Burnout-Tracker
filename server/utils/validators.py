import re

def is_valid_email(email):
    # Only allows full emails like name@example.com
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
    return re.fullmatch(pattern, email) is not None


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
        email_pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
    if not re.fullmatch(email_pattern, email):
        errors['email'] = "Invalid email format. Please use a full email like name@example.com."


    # Validate password (only if it's given)
    if 'password' in data and data['password']:
        if not is_strong_password(data['password']):
            errors['password'] = (
                "Password must be at least 8 characters long, include "
                "uppercase, lowercase, a number, and a special character."
            )

    return errors
