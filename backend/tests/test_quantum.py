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


def test_quantum_info(client):
    r = client.get("/quantum/info")
    assert r.status_code == 200
    data = r.json()
    assert data["framework"] == "Qiskit"
    assert "QAOA" in data["algorithm"]
    assert data["qubit_formulation"] == "4-qubit Emergency Dispatch QUBO"


def test_quantum_experiment_execution(client):
    payload = {"reps": 1, "max_iter": 20, "penalty_multiplier": 25.0}
    r = client.post("/quantum/experiment", json=payload)
    assert r.status_code == 200
    res = r.json()

    assert res["status"] == "COMPLETED"
    assert "classical_baseline" in res
    assert "quantum_qaoa" in res
    assert "comparison" in res
    assert "limitations_and_realities" in res

    # Classical ground truth verification
    classical = res["classical_baseline"]
    assert classical["is_feasible"] is True
    assert len(classical["optimal_bitstring"]) == 4
    assert len(classical["assignments"]) > 0

    # Quantum QAOA verification
    qaoa = res["quantum_qaoa"]
    circuit = qaoa["circuit_stats"]
    assert circuit["num_qubits"] == 4
    assert circuit["depth"] > 0
    assert len(qaoa["optimal_gamma"]) == 1
    assert len(qaoa["optimal_beta"]) == 1
    assert qaoa["runtime_ms"] > 0

    # Scientific transparency check
    limitations = res["limitations_and_realities"]
    assert len(limitations) >= 3
    assert any("NISQ" in item for item in limitations)
    assert any("No quantum advantage" in item for item in limitations)


def test_quantum_multi_reps(client):
    payload = {"reps": 2, "max_iter": 15, "penalty_multiplier": 25.0}
    r = client.post("/quantum/experiment", json=payload)
    assert r.status_code == 200
    res = r.json()

    qaoa = res["quantum_qaoa"]
    assert len(qaoa["optimal_gamma"]) == 2
    assert len(qaoa["optimal_beta"]) == 2
    assert qaoa["circuit_stats"]["num_parameters"] == 4


def test_scenario_network_endpoint(client):
    r = client.get("/scenario/network")
    assert r.status_code == 200
    data = r.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) == 10
    assert len(data["edges"]) >= 14
    # Verify node coordinate format
    node0 = data["nodes"][0]
    assert "id" in node0
    assert "x" in node0
    assert "y" in node0


def test_traffic_update_affects_network(client):
    # Apply high traffic on N1 -> N2
    update = {
        "traffic_updates": [{"edge_from": "N1", "edge_to": "N2", "new_travel_time_minutes": 99.0}]
    }
    client.post("/scenario/update", json=update)

    r = client.get("/scenario/network")
    assert r.status_code == 200
    data = r.json()
    edge_n1_n2 = next(e for e in data["edges"] if e["from_node"] == "N1" and e["to_node"] == "N2")
    assert edge_n1_n2["travel_time_min"] == 99.0
    assert edge_n1_n2["is_congested"] is True
