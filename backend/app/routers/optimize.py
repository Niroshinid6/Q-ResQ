from fastapi import APIRouter, Depends
from app.models import ScenarioUpdate, OptimizationResult, RoadNetworkDetails
from app import scenario
from app.road_network import build_network, apply_traffic_update, get_network_details
from app.optimizer import run_optimizer
from app.database import OptimizationRunDB, get_session
from sqlalchemy.orm import Session
import json

router = APIRouter()


@router.post("/scenario/load")
def load_scenario():
    scenario.reset_scenario()
    return {"message": "Scenario loaded"}


@router.get("/scenario/status")
def scenario_status():
    return {
        "incidents": len(scenario.get_incidents()),
        "ambulances": len(scenario.get_ambulances()),
        "hospitals": len(scenario.get_hospitals()),
    }


@router.get("/scenario/network", response_model=RoadNetworkDetails)
def get_scenario_network():
    graph = build_network()
    for tu in scenario.get_traffic_updates():
        apply_traffic_update(graph, tu.edge_from, tu.edge_to, tu.new_travel_time_minutes)
    return get_network_details(graph)


@router.post("/scenario/update")
def update_scenario(update: ScenarioUpdate):
    scenario.apply_scenario_update(update)
    return {"message": "Update applied"}


@router.post("/optimize", response_model=OptimizationResult)
def optimize(db: Session = Depends(get_session)):
    incidents = scenario.get_incidents()
    ambulances = scenario.get_ambulances()
    hospitals = scenario.get_hospitals()

    graph = build_network()
    for tu in scenario.get_traffic_updates():
        apply_traffic_update(graph, tu.edge_from, tu.edge_to, tu.new_travel_time_minutes)

    result = run_optimizer(incidents, ambulances, hospitals, graph)

    db_run = OptimizationRunDB(
        status=result.status,
        objective_value=result.objective_value,
        assignments_json=json.loads(json.dumps([a.model_dump() for a in result.assignments])),
        unserved_json=json.loads(json.dumps(result.unserved_incidents)),
        explanation=result.explanation,
    )
    db.add(db_run)
    db.commit()

    return result


@router.get("/optimize/history")
def optimize_history(db: Session = Depends(get_session)):
    runs = db.query(OptimizationRunDB).order_by(OptimizationRunDB.id.desc()).limit(10).all()
    return runs
