import threading
from typing import List, Tuple
from app.models import Incident, IncidentCreate, Ambulance, AmbulanceCreate, Hospital, HospitalCreate, ScenarioUpdate, UrgencyLevel, IncidentType, AmbulanceStatus

_lock = threading.Lock()

_incidents: List[Incident] = []
_ambulances: List[Ambulance] = []
_hospitals: List[Hospital] = []
_traffic_updates = []

def calc_urgency(incident_type: IncidentType, reported_severity: int, required_capabilities: List[str]) -> Tuple[UrgencyLevel, float, str]:
    if incident_type == IncidentType.CARDIAC and "defibrillator" in required_capabilities:
        return UrgencyLevel.P1, 10.0, "Cardiac with defibrillator required is always P1"
        
    if reported_severity >= 8:
        return UrgencyLevel.P1, reported_severity * 1.0, "High severity (8-10)"
    elif reported_severity >= 5:
        return UrgencyLevel.P2, reported_severity * 1.0, "Medium severity (5-7)"
    else:
        return UrgencyLevel.P3, reported_severity * 1.0, "Low severity (1-4)"

def build_incident(ic: IncidentCreate) -> Incident:
    urg, score, rat = calc_urgency(ic.incident_type, ic.reported_severity, ic.required_capabilities)
    return Incident(
        **ic.model_dump(),
        urgency=urg,
        urgency_score=score,
        urgency_rationale=rat
    )

def load_demo_scenario() -> Tuple[List[Incident], List[Ambulance], List[Hospital]]:
    with _lock:
        global _incidents, _ambulances, _hospitals, _traffic_updates
        _incidents = [
            build_incident(IncidentCreate(id="INC-001", incident_type=IncidentType.CARDIAC, location_node="N1", reported_severity=9, required_capabilities=["ALS", "defibrillator"])),
            build_incident(IncidentCreate(id="INC-002", incident_type=IncidentType.TRAUMA, location_node="N4", reported_severity=7, required_capabilities=["trauma_kit"])),
            build_incident(IncidentCreate(id="INC-003", incident_type=IncidentType.STROKE, location_node="N8", reported_severity=5, required_capabilities=["ALS"]))
        ]
        
        _ambulances = [
            Ambulance(**AmbulanceCreate(id="AMB-001", location_node="N2", capabilities=["ALS", "defibrillator", "trauma_kit"], status=AmbulanceStatus.AVAILABLE).model_dump()),
            Ambulance(**AmbulanceCreate(id="AMB-002", location_node="N6", capabilities=["ALS", "trauma_kit"], status=AmbulanceStatus.AVAILABLE).model_dump()),
        ]
        
        _hospitals = [
            Hospital(**HospitalCreate(id="HOSP-A", location_node="N3", capabilities=["ALS", "defibrillator", "trauma_kit", "stroke_unit"], available_capacity=2).model_dump()),
            Hospital(**HospitalCreate(id="HOSP-B", location_node="N7", capabilities=["trauma_kit", "ALS"], available_capacity=3).model_dump()),
            Hospital(**HospitalCreate(id="HOSP-C", location_node="N10", capabilities=["ALS", "defibrillator", "stroke_unit"], available_capacity=1).model_dump()),
        ]
        _traffic_updates = []
        
    return _incidents, _ambulances, _hospitals

def get_incidents() -> List[Incident]:
    with _lock:
        return list(_incidents)

def add_incident(inc: IncidentCreate) -> Incident:
    with _lock:
        full_inc = build_incident(inc)
        _incidents.append(full_inc)
        return full_inc

def get_ambulances() -> List[Ambulance]:
    with _lock:
        return list(_ambulances)

def get_hospitals() -> List[Hospital]:
    with _lock:
        return list(_hospitals)

def apply_scenario_update(update: ScenarioUpdate) -> None:
    with _lock:
        global _traffic_updates
        _traffic_updates.extend(update.traffic_updates)
        
        for amb in _ambulances:
            if amb.id in update.ambulance_status_updates:
                amb.status = update.ambulance_status_updates[amb.id]
                
        for h in _hospitals:
            if h.id in update.hospital_capacity_updates:
                h.available_capacity = update.hospital_capacity_updates[h.id]

def reset_scenario() -> None:
    load_demo_scenario()

def get_traffic_updates():
    with _lock:
        return list(_traffic_updates)
