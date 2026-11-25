def test_login_success(client, test_users):
    """Verify valid credentials return a JWT access token."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin_a", "password": "pass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_users):
    """Verify incorrect password returns 401 Unauthorized."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin_a", "password": "wrong_password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_login_inactive_user(client, db, test_users):
    """Verify deactivated employees cannot log in."""
    user_a = test_users["user_a"]
    user_a.is_active = False
    db.commit()

    response = client.post(
        "/api/v1/auth/login",
        data={"username": "user_a", "password": "pass123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Inactive user account"


def test_get_me_authenticated(client, test_users):
    """Verify /me returns the logged-in profile and NEVER leaks hashed_password."""
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "admin_a", "password": "pass123"},
    )
    token = login_res.json()["access_token"]

    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["username"] == "admin_a"
    assert profile["role"] == "admin"
    assert "hashed_password" not in profile


def test_get_me_unauthenticated(client):
    """Verify protected routes reject requests without a token."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401