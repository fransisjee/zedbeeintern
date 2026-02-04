import requests

BASE_URL = "http://localhost:8000/api"

def test_signup():
    print("Testing Signup...")
    response = requests.post(f"{BASE_URL}/signup", json={"username": "py_dev_user", "password": "password123"})
    if response.status_code == 201:
        print("Signup: Success")
    elif response.status_code == 400 and "Username already exists" in response.text:
        print("Signup: User already exists (Expected if running multiple times)")
    else:
        print(f"Signup: Failed {response.status_code} - {response.text}")

def test_login():
    print("\nTesting Login...")
    response = requests.post(f"{BASE_URL}/login", json={"username": "zedbee", "password": "zedbee123"})
    if response.status_code == 200:
        token = response.json().get("access_token")
        print("Login: Success")
        return token
    else:
        print(f"Login: Failed {response.status_code} - {response.text}")
        return None

def test_me(token):
    print("\nTesting /me Endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/me", headers=headers)
    if response.status_code == 200:
        print(f"Me: Success, User: {response.json().get('username')}")
    else:
        print(f"Me: Failed {response.status_code} - {response.text}")

def test_reset_password():
    print("\nTesting Reset Password...")
    response = requests.post(f"{BASE_URL}/reset-password", json={"username": "py_dev_user", "new_password": "newpassword123"})
    if response.status_code == 200:
        print("Reset Password: Success")
    else:
        print(f"Reset Password: Failed {response.status_code} - {response.text}")

def test_login_new_password():
    print("\nTesting Login with New Password...")
    response = requests.post(f"{BASE_URL}/login", json={"username": "py_dev_user", "password": "newpassword123"})
    if response.status_code == 200:
        print("Login (New Password): Success")
    else:
        print(f"Login (New Password): Failed {response.status_code} - {response.text}")

if __name__ == "__main__":
    try:
        test_signup()
        token = test_login()
        if token:
            test_me(token)
            test_reset_password()
            test_login_new_password()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure it is running on http://localhost:8000")
