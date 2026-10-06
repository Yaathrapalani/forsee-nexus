from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "forsee-nexus-api"


def test_create_student_success(client: TestClient, sample_student_payload: dict):
    response = client.post("/api/v1/students", json=sample_student_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == sample_student_payload["name"]
    assert data["roll_number"] == sample_student_payload["roll_number"]
    assert data["department"] == sample_student_payload["department"]
    assert data["year"] == sample_student_payload["year"]
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert data["skills"] == sample_student_payload["skills"]


def test_create_student_duplicate_roll_number(
    client: TestClient, sample_student_payload: dict
):
    # First creation
    res1 = client.post("/api/v1/students", json=sample_student_payload)
    assert res1.status_code == 201

    # Second creation with identical roll_number
    res2 = client.post("/api/v1/students", json=sample_student_payload)
    assert res2.status_code == 409
    assert (
        f"'{sample_student_payload['roll_number']}' already exists"
        in res2.json()["detail"]
    )


def test_create_student_validation_errors(client: TestClient):
    # Empty name
    res = client.post(
        "/api/v1/students",
        json={
            "name": "   ",
            "roll_number": "2024CS0001",
            "department": "CSE",
            "year": 2,
        },
    )
    assert res.status_code == 422

    # Empty roll number
    res = client.post(
        "/api/v1/students",
        json={"name": "John Doe", "roll_number": "  ", "department": "CSE", "year": 2},
    )
    assert res.status_code == 422

    # Invalid year (< 1)
    res = client.post(
        "/api/v1/students",
        json={
            "name": "John Doe",
            "roll_number": "2024CS0002",
            "department": "CSE",
            "year": 0,
        },
    )
    assert res.status_code == 422

    # Invalid year (> 5)
    res = client.post(
        "/api/v1/students",
        json={
            "name": "John Doe",
            "roll_number": "2024CS0003",
            "department": "CSE",
            "year": 6,
        },
    )
    assert res.status_code == 422

    # Invalid avatar URL scheme
    res = client.post(
        "/api/v1/students",
        json={
            "name": "John Doe",
            "roll_number": "2024CS0004",
            "department": "CSE",
            "year": 2,
            "avatar_url": "ftp://invalid-url.com",
        },
    )
    assert res.status_code == 422

    # Invalid external social URL scheme (relative path not allowed for LinkedIn)
    res_social = client.post(
        "/api/v1/students",
        json={
            "name": "John Doe",
            "roll_number": "2024CS0005",
            "department": "CSE",
            "year": 2,
            "linkedin_url": "/in/johndoe",
        },
    )
    assert res_social.status_code == 422


def test_get_student_by_id(client: TestClient, sample_student_payload: dict):
    create_res = client.post("/api/v1/students", json=sample_student_payload)
    student_id = create_res.json()["id"]

    res = client.get(f"/api/v1/students/{student_id}")
    assert res.status_code == 200
    assert res.json()["id"] == student_id
    assert res.json()["name"] == sample_student_payload["name"]


def test_get_nonexistent_student(client: TestClient):
    res = client.get("/api/v1/students/999999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_list_students_and_filtering(client: TestClient):
    s1 = {
        "name": "Alice Smith",
        "roll_number": "2024CSE001",
        "department": "CSE",
        "year": 2,
    }
    s2 = {
        "name": "Bob Jones",
        "roll_number": "2024ECE002",
        "department": "ECE",
        "year": 3,
    }
    s3 = {
        "name": "Charlie Brown",
        "roll_number": "2024CSE003",
        "department": "CSE",
        "year": 2,
    }

    client.post("/api/v1/students", json=s1)
    client.post("/api/v1/students", json=s2)
    client.post("/api/v1/students", json=s3)

    # List all
    all_res = client.get("/api/v1/students")
    assert all_res.status_code == 200
    assert len(all_res.json()) == 3

    # Filter by department
    cse_res = client.get("/api/v1/students?department=CSE")
    assert cse_res.status_code == 200
    assert len(cse_res.json()) == 2
    assert all(s["department"] == "CSE" for s in cse_res.json())

    # Filter by year
    year3_res = client.get("/api/v1/students?year=3")
    assert year3_res.status_code == 200
    assert len(year3_res.json()) == 1
    assert year3_res.json()[0]["roll_number"] == "2024ECE002"

    # Filter by both
    combo_res = client.get("/api/v1/students?department=CSE&year=2")
    assert combo_res.status_code == 200
    assert len(combo_res.json()) == 2


def test_update_student_success(client: TestClient, sample_student_payload: dict):
    create_res = client.post("/api/v1/students", json=sample_student_payload)
    student_id = create_res.json()["id"]

    update_payload = {
        "name": "Priya Nair Updated",
        "year": 4,
        "skills": ["Python", "FastAPI", "React", "Docker", "Kubernetes"],
    }
    res = client.put(f"/api/v1/students/{student_id}", json=update_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Priya Nair Updated"
    assert data["year"] == 4
    assert len(data["skills"]) == 5
    # Unchanged fields remain
    assert data["roll_number"] == sample_student_payload["roll_number"]
    assert data["department"] == sample_student_payload["department"]


def test_update_student_conflict_roll_number(client: TestClient):
    client.post(
        "/api/v1/students",
        json={
            "name": "Student A",
            "roll_number": "ROLLA",
            "department": "CSE",
            "year": 1,
        },
    )
    s2 = client.post(
        "/api/v1/students",
        json={
            "name": "Student B",
            "roll_number": "ROLLB",
            "department": "ECE",
            "year": 1,
        },
    ).json()

    # Attempt to update s2 with s1's roll number
    res = client.put(f"/api/v1/students/{s2['id']}", json={"roll_number": "ROLLA"})
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"].lower()


def test_update_nonexistent_student(client: TestClient):
    res = client.put("/api/v1/students/999999", json={"name": "Ghost"})
    assert res.status_code == 404


def test_delete_student_success(client: TestClient, sample_student_payload: dict):
    create_res = client.post("/api/v1/students", json=sample_student_payload)
    student_id = create_res.json()["id"]

    # Delete
    del_res = client.delete(f"/api/v1/students/{student_id}")
    assert del_res.status_code == 204

    # Subsequent GET returns 404
    get_res = client.get(f"/api/v1/students/{student_id}")
    assert get_res.status_code == 404


def test_delete_nonexistent_student(client: TestClient):
    del_res = client.delete("/api/v1/students/999999")
    assert del_res.status_code == 404


def test_readiness_check(client: TestClient):
    res = client.get("/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"


def test_request_id_and_security_headers(client: TestClient):
    custom_request_id = "test-corr-id-12345"
    res = client.get("/health", headers={"X-Request-ID": custom_request_id})
    assert res.status_code == 200
    assert res.headers.get("X-Request-ID") == custom_request_id
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "X-Response-Time-Ms" in res.headers


def test_pagination_headers_and_bounds(
    client: TestClient, sample_student_payload: dict
):
    client.post("/api/v1/students", json=sample_student_payload)

    res = client.get("/api/v1/students?skip=0&limit=50")
    assert res.status_code == 200
    assert "X-Total-Count" in res.headers
    assert int(res.headers["X-Total-Count"]) >= 1
    assert res.headers.get("X-Page-Limit") == "50"
    assert res.headers.get("X-Page-Skip") == "0"


def test_search_query_filter(client: TestClient):
    client.post(
        "/api/v1/students",
        json={
            "name": "Arjun Das",
            "roll_number": "2024AD99",
            "department": "CSE",
            "year": 4,
        },
    )
    client.post(
        "/api/v1/students",
        json={
            "name": "Bhavna Patel",
            "roll_number": "2024BP88",
            "department": "ECE",
            "year": 3,
        },
    )

    # Search by name substring
    res_name = client.get("/api/v1/students?q=arjun")
    assert res_name.status_code == 200
    items = res_name.json()
    assert len(items) == 1
    assert items[0]["name"] == "Arjun Das"

    # Search by roll number substring
    res_roll = client.get("/api/v1/students?q=BP88")
    assert res_roll.status_code == 200
    assert len(res_roll.json()) == 1
    assert res_roll.json()[0]["name"] == "Bhavna Patel"


def test_optimistic_concurrency_conflict(
    client: TestClient, sample_student_payload: dict
):
    # Create initial student
    create_res = client.post("/api/v1/students", json=sample_student_payload)
    student = create_res.json()
    student_id = student["id"]
    initial_version = student["version"]
    assert initial_version == 1

    # Update with correct version
    update1 = client.put(
        f"/api/v1/students/{student_id}",
        json={"name": "Priya Nair Updated", "version": 1},
    )
    assert update1.status_code == 200
    assert update1.json()["version"] == 2

    # Attempt second update using stale version (1 instead of 2) -> 409 Conflict
    conflict_res = client.put(
        f"/api/v1/students/{student_id}",
        json={"name": "Stale Update Attempt", "version": 1},
    )
    assert conflict_res.status_code == 409
    assert "conflict" in conflict_res.json()["detail"].lower()
