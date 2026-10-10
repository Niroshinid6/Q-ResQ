from fastapi import APIRouter, HTTPException
from app import scenario

router = APIRouter()

@router.get("/")
def list_ambulances():
    return scenario.get_ambulances()

@router.get("/{ambulance_id}")
def get_ambulance(ambulance_id: str):
    ambs = scenario.get_ambulances()
    for a in ambs:
        if a.id == ambulance_id:
            return a
    raise HTTPException(status_code=404, detail="Ambulance not found")
