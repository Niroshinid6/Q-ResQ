from fastapi import APIRouter
from app.models import IncidentCreate, Incident
from app import scenario

router = APIRouter()

@router.get("/")
def list_incidents():
    return scenario.get_incidents()

@router.post("/", response_model=Incident)
def create_incident(inc: IncidentCreate):
    return scenario.add_incident(inc)
