import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def load_demo(client):
    client.post("/scenario/load")

def test_health_check(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_load_scenario(client):
    r = client.post("/scenario/load")
    assert r.status_code == 200

def test_feasible_allocation(client):
    r = client.post("/optimize")
    assert r.status_code == 200
    res = r.json()
    assert res["status"] in ["OPTIMAL", "FEASIBLE"]
    assert len(res["assignments"]) > 0

def test_three_incidents_two_ambulances(client):
    r = client.post("/optimize")
    assert r.status_code == 200
    res = r.json()
    assert len(res["unserved_incidents"]) >= 1
    assert len(res["assignments"]) <= 2

def test_unavailable_ambulance(client):
    update = {
        "ambulance_status_updates": {"AMB-001": "unavailable"}
    }
    client.post("/scenario/update", json=update)
    r = client.post("/optimize")
    res = r.json()
    for a in res["assignments"]:
        assert a["ambulance_id"] != "AMB-001"

def test_hospital_missing_capability(client):
    inc = {
        "id": "INC-HYPER",
        "incident_type": "general",
        "location_node": "N1",
        "reported_severity": 10,
        "required_capabilities": ["HYPERBARIC"]
    }
    client.post("/incidents/", json=inc)
    r = client.post("/optimize")
    res = r.json()
    unserved_ids = [u["incident_id"] for u in res["unserved_incidents"]]
    assert "INC-HYPER" in unserved_ids

def test_hospital_no_capacity(client):
    update = {
        "hospital_capacity_updates": {"HOSP-A": 0, "HOSP-B": 0, "HOSP-C": 0}
    }
    client.post("/scenario/update", json=update)
    r = client.post("/optimize")
    res = r.json()
    assert len(res["assignments"]) == 0
    assert len(res["unserved_incidents"]) >= 3

def test_traffic_change_reoptimize(client):
    r1 = client.post("/optimize")
    res1 = r1.json()
    
    update = {
        "traffic_updates": [{"edge_from": "N2", "edge_to": "N3", "new_travel_time_minutes": 999.0}]
    }
    client.post("/scenario/update", json=update)
    r2 = client.post("/optimize")
    assert r2.status_code == 200

def test_invalid_severity(client):
    inc = {
        "id": "INC-ERR",
        "incident_type": "general",
        "location_node": "N1",
        "reported_severity": 11,
        "required_capabilities": []
    }
    r = client.post("/incidents/", json=inc)
    assert r.status_code == 422

def test_infeasible_no_ambulances(client):
    update = {
        "ambulance_status_updates": {"AMB-001": "unavailable", "AMB-002": "unavailable"}
    }
    client.post("/scenario/update", json=update)
    r = client.post("/optimize")
    res = r.json()
    assert len(res["assignments"]) == 0
