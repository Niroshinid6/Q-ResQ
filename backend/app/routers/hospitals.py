from fastapi import APIRouter, HTTPException
from app import scenario

router = APIRouter()

@router.get("/")
def list_hospitals():
    return scenario.get_hospitals()

@router.get("/{hospital_id}")
def get_hospital(hospital_id: str):
    hosps = scenario.get_hospitals()
    for h in hosps:
        if h.id == hospital_id:
            return h
    raise HTTPException(status_code=404, detail="Hospital not found")
