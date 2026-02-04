import requests
import json

BASE_URL = "http://localhost:8000/api"

def register(username, password):
    print(f"Registering {username}...")
    res = requests.post(f"{BASE_URL}/signup", json={"username": username, "password": password})
    # Ignore 400 if user exists
    return res.status_code

def login(username, password):
    print(f"Logging in {username}...")
    res = requests.post(f"{BASE_URL}/login", json={"username": username, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]
    return None

def save_config(token, config_data):
    print("Saving config...")
    res = requests.put(f"{BASE_URL}/config", 
                       headers={"Authorization": f"Bearer {token}"},
                       json={"data": config_data})
    return res.status_code

def get_config(token):
    print("Getting config...")
    res = requests.get(f"{BASE_URL}/config", headers={"Authorization": f"Bearer {token}"})
    if res.status_code == 200:
        return res.json().get("data", {})
    return None

def run_test():
    # User 1: zedbee
    token1 = login("zedbee", "zedbee123")
    if not token1:
        print("Failed to login zedbee")
        return

    # User 2: newuser
    register("newuser", "password123")
    token2 = login("newuser", "password123")
    if not token2:
        print("Failed to login newuser")
        return

    # 1. Save config for User 1
    config1 = {"device": {"type": "Energy Meter"}}
    save_config(token1, config1)

    # 2. Check User 1 config
    fetched1 = get_config(token1)
    if fetched1 == config1:
        print("User 1 config matches: PASS")
    else:
        print(f"User 1 config mismatch: {fetched1} != {config1}")

    # 3. Check User 2 config (should be empty initially)
    fetched2_initial = get_config(token2)
    if not fetched2_initial:
        print("User 2 initial config empty: PASS")
    else:
        print(f"User 2 initial config not empty: {fetched2_initial}")

    # 4. Save config for User 2
    config2 = {"device": {"type": "Flow Meter"}}
    save_config(token2, config2)

    # 5. Check User 2 config
    fetched2 = get_config(token2)
    if fetched2 == config2:
        print("User 2 config matches: PASS")
    else:
        print(f"User 2 config mismatch: {fetched2} != {config2}")

    # 6. Re-check User 1 (should not change)
    fetched1_again = get_config(token1)
    if fetched1_again == config1:
        print("User 1 config isolation: PASS")
    else:
        print(f"User 1 config affected by User 2: {fetched1_again}")

if __name__ == "__main__":
    run_test()
