import networkx as nx
from typing import List, Tuple, Optional
from dataclasses import dataclass
from app.models import Incident, Hospital

@dataclass
class HospitalMatch:
    hospital_id: str
    travel_time_minutes: float
    matched_capabilities: List[str]

@dataclass
class RejectedHospital:
    hospital_id: str
    reason: str

def rank_hospitals_for_incident(
    incident: Incident,
    hospitals: List[Hospital],
    graph: nx.DiGraph,
    ambulance_node: str
) -> Tuple[List[HospitalMatch], List[RejectedHospital]]:
    matches = []
    rejected = []
    
    for h in hospitals:
        if h.available_capacity <= 0:
            rejected.append(RejectedHospital(hospital_id=h.id, reason="No available capacity"))
            continue
            
        has_all_caps = all(cap in h.capabilities for cap in incident.required_capabilities)
        if not has_all_caps:
            rejected.append(RejectedHospital(hospital_id=h.id, reason="Missing capabilities"))
            continue
            
        try:
            tt = nx.shortest_path_length(graph, source=incident.location_node, target=h.location_node, weight="travel_time_min")
            matches.append(HospitalMatch(
                hospital_id=h.id,
                travel_time_minutes=float(tt),
                matched_capabilities=h.capabilities
            ))
        except nx.NetworkXNoPath:
            rejected.append(RejectedHospital(hospital_id=h.id, reason="No path to hospital"))
            
    matches.sort(key=lambda x: x.travel_time_minutes)
    return matches, rejected
