def get_auth_headers(client, username: str, password: str = "pass123") -> dict:
    """Helper to log in and return Authorization header."""
    res = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_cross_tenant_isolation_on_project_codes(client, test_users):
    """Prove Company Beta cannot view, edit, or delete Company Alpha's data."""
    headers_a = get_auth_headers(client, "admin_a")
    headers_b = get_auth_headers(client, "admin_b")

    # 1. Admin A creates a Project Code in Company Alpha
    create_res = client.post(
        "/api/v1/project-codes/",
        json={"code": "PRJ-ALPHA", "name": "Alpha Secret Project"},
        headers=headers_a,
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["id"]

    # 2. Admin B lists project codes -> MUST NOT see Alpha's project
    list_b = client.get("/api/v1/project-codes/", headers=headers_b)
    assert list_b.status_code == 200
    assert list_b.json() == []

    # 3. Admin B tries to edit Alpha's project -> MUST get 404 Not Found
    put_b = client.put(
        f"/api/v1/project-codes/{project_id}",
        json={"name": "Hacked by Beta"},
        headers=headers_b,
    )
    assert put_b.status_code == 404

    # 4. Admin B tries to delete Alpha's project -> MUST get 404 Not Found
    del_b = client.delete(f"/api/v1/project-codes/{project_id}", headers=headers_b)
    assert del_b.status_code == 404


def test_rbac_regular_user_cannot_access_admin_routes(client, test_users):
    """Prove regular employees can read dropdowns, but cannot mutate master data or manage users."""
    headers_user = get_auth_headers(client, "user_a")

    # Allowed: Reading project codes for dropdowns
    get_res = client.get("/api/v1/project-codes/", headers=headers_user)
    assert get_res.status_code == 200

    # Blocked: Creating a project code (403 Forbidden)
    post_res = client.post(
        "/api/v1/project-codes/",
        json={"code": "PRJ-HACK", "name": "Unauthorized"},
        headers=headers_user,
    )
    assert post_res.status_code == 403

    # Blocked: Listing company users (403 Forbidden)
    users_res = client.get("/api/v1/users/", headers=headers_user)
    assert users_res.status_code == 403


def test_privilege_escalation_and_self_lockout(client, test_users):
    """Prove admin cannot create super_admin and cannot deactivate themselves."""
    headers_a = get_auth_headers(client, "admin_a")
    admin_a_id = test_users["admin_a"].id

    # 1. Try creating a super_admin -> MUST return 403 Forbidden
    esc_res = client.post(
        "/api/v1/users/",
        json={
            "username": "fake_super",
            "full_name": "Evil Super",
            "role": "super_admin",
            "password": "password123",
        },
        headers=headers_a,
    )
    assert esc_res.status_code == 403

    # 2. Try deactivating self -> MUST return 400 Bad Request
    lockout_res = client.put(
        f"/api/v1/users/{admin_a_id}",
        json={"is_active": False},
        headers=headers_a,
    )
    assert lockout_res.status_code == 400


def test_shamsi_date_validation_on_record_create(client, test_users):
    """Prove invalid Jalali dates (e.g. month 13, day 45) are rejected."""
    headers_user = get_auth_headers(client, "user_a")

    # Invalid Shamsi date
    bad_res = client.post(
        "/api/v1/records/",
        data={
            "invoice_no": "INV-100",
            "project_code": "PRJ-01",
            "amount": 50000,
            "record_date": "1403/13/45",  # Invalid Jalali month/day!
        },
        headers=headers_user,
    )
    assert bad_res.status_code == 400

    # Valid Shamsi date
    good_res = client.post(
        "/api/v1/records/",
        data={
            "invoice_no": "INV-100",
            "project_code": "PRJ-01",
            "amount": 50000,
            "record_date": "1403/08/03",
        },
        headers=headers_user,
    )
    assert good_res.status_code == 201