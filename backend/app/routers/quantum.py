"""
FastAPI router for Qiskit QAOA quantum optimization experiments.
"""

from fastapi import APIRouter, HTTPException
from app.models import QuantumExperimentRequest, QuantumExperimentResult
from app import scenario
from app.road_network import build_network, apply_traffic_update
from app.quantum_optimizer import run_quantum_experiment
import qiskit

router = APIRouter()


@router.get("/info")
def quantum_info():
    return {
        "status": "ready",
        "framework": "Qiskit",
        "qiskit_version": qiskit.__version__,
        "backend": "StatevectorSampler (Local Ideal Simulator)",
        "algorithm": "QAOA (Quantum Approximate Optimization Algorithm)",
        "qubit_formulation": "4-qubit Emergency Dispatch QUBO",
    }


@router.post("/experiment", response_model=QuantumExperimentResult)
def run_experiment(params: QuantumExperimentRequest = QuantumExperimentRequest()):
    incidents = scenario.get_incidents()
    ambulances = scenario.get_ambulances()

    if len(incidents) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 incidents must be loaded to run the quantum experiment. Click Load Scenario first.",
        )

    graph = build_network()
    for tu in scenario.get_traffic_updates():
        apply_traffic_update(graph, tu.edge_from, tu.edge_to, tu.new_travel_time_minutes)

    try:
        result = run_quantum_experiment(incidents, ambulances, graph, params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quantum experiment failed: {str(e)}")
