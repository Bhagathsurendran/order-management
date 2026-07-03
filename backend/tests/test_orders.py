"""
tests/test_orders.py
Tests for Order CRUD endpoints:
- Create order
- List orders with filters
- Get single order
- Update status
- Soft delete
- Dashboard stats
"""
import pytest


@pytest.mark.asyncio
async def test_create_order(client, auth_headers):
    response = await client.post(
        "/api/v1/orders",
        json={"customer_name": "John Doe", "amount": 5000.0},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["customer_name"] == "John Doe"
    assert data["data"]["amount"] == 5000.0
    assert data["data"]["status"] == "Pending"
    assert data["data"]["currency"] == "INR"


@pytest.mark.asyncio
async def test_create_order_validation_error(client, auth_headers):
    # customer_name too short
    response = await client.post(
        "/api/v1/orders",
        json={"customer_name": "Jo", "amount": 100.0},
        headers=auth_headers,
    )
    assert response.status_code == 422

    # amount <= 0
    response = await client.post(
        "/api/v1/orders",
        json={"customer_name": "John Doe", "amount": -100.0},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_order_unauthenticated(client):
    response = await client.post(
        "/api/v1/orders",
        json={"customer_name": "John Doe", "amount": 5000.0},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_orders(client, auth_headers):
    # Create a couple of orders first
    for name in ["Alice", "Bob Carter"]:
        await client.post(
            "/api/v1/orders",
            json={"customer_name": name, "amount": 1000.0},
            headers=auth_headers,
        )

    response = await client.get("/api/v1/orders", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "items" in data["data"]
    assert "total" in data["data"]


@pytest.mark.asyncio
async def test_list_orders_search(client, auth_headers):
    await client.post(
        "/api/v1/orders",
        json={"customer_name": "SearchableName", "amount": 999.0},
        headers=auth_headers,
    )
    response = await client.get(
        "/api/v1/orders?search=SearchableName", headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    items = data["data"]["items"]
    assert any("SearchableName" in item["customer_name"] for item in items)


@pytest.mark.asyncio
async def test_get_order_detail(client, auth_headers):
    create_resp = await client.post(
        "/api/v1/orders",
        json={"customer_name": "Detail Test", "amount": 2000.0},
        headers=auth_headers,
    )
    order_id = create_resp.json()["data"]["id"]

    response = await client.get(f"/api/v1/orders/{order_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["data"]["id"] == order_id


@pytest.mark.asyncio
async def test_get_order_not_found(client, auth_headers):
    response = await client.get(
        "/api/v1/orders/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_order_status(client, auth_headers):
    create_resp = await client.post(
        "/api/v1/orders",
        json={"customer_name": "Status Update", "amount": 3000.0},
        headers=auth_headers,
    )
    order_id = create_resp.json()["data"]["id"]

    response = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "Processing"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "Processing"


@pytest.mark.asyncio
async def test_update_invalid_status(client, auth_headers):
    create_resp = await client.post(
        "/api/v1/orders",
        json={"customer_name": "Invalid Status", "amount": 1000.0},
        headers=auth_headers,
    )
    order_id = create_resp.json()["data"]["id"]

    response = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "InvalidStatus"},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_dashboard_stats(client, auth_headers):
    response = await client.get("/api/v1/orders/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "total_orders" in data
    assert "pending" in data
    assert "completed" in data
    assert "total_revenue_inr" in data
