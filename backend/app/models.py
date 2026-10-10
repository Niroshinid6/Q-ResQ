from __future__ import annotations
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class UrgencyLevel(str, Enum):
    P1 = "P1"  # Critical / life-threatening
    P2 = "P2"  # Serious
    P3 = "P3"  # Non-urgent


class IncidentType(str, Enum):
    CARDIAC = "cardiac"
    TRAUMA = "trauma"
    STROKE = "stroke"
    RESPIRATORY = "respiratory"
    GENERAL = "general"


class AmbulanceStatus(str, Enum):
    AVAILABLE = "available"
    DISPATCHED = "dispatched"
    UNAVAILABLE = "unavailable"


# ---- Incident models ----
class IncidentCreate(BaseModel):
    id: str
    incident_type: IncidentType
    location_node: str
    reported_severity: int = Field(..., ge=1, le=10, description="Raw severity 1-10")
    required_capabilities: List[str] = Field(default_factory=list)

    @field_validator("reported_severity")
    @classmethod
    def severity_range(cls, v: int) -> int:
        if not 1 <= v <= 10:
            raise ValueError("reported_severity must be between 1 and 10")
        return v


class Incident(IncidentCreate):
    urgency: UrgencyLevel
    urgency_score: float
    urgency_rationale: str


# ---- Ambulance models ----
class AmbulanceCreate(BaseModel):
    id: str
    location_node: str
    capabilities: List[str]
    status: AmbulanceStatus = AmbulanceStatus.AVAILABLE


class Ambulance(AmbulanceCreate):
    assigned_incident_id: Optional[str] = None


# ---- Hospital models ----
class HospitalCreate(BaseModel):
    id: str
    location_node: str
    capabilities: List[str]
    available_capacity: int = Field(..., ge=0)


class Hospital(HospitalCreate):
    pass


# ---- Road network ----
class TrafficUpdate(BaseModel):
    edge_from: str
    edge_to: str
    new_travel_time_minutes: float = Field(..., gt=0)


class RoadEdgeInfo(BaseModel):
    from_node: str
    to_node: str
    distance_km: float
    travel_time_min: float
    baseline_travel_time_min: float
    is_congested: bool


class NetworkNodeInfo(BaseModel):
    id: str
    x: float
    y: float
    label: str


class RoadNetworkDetails(BaseModel):
    nodes: List[NetworkNodeInfo]
    edges: List[RoadEdgeInfo]


# ---- Scenario update ----
class ScenarioUpdate(BaseModel):
    traffic_updates: List[TrafficUpdate] = Field(default_factory=list)
    ambulance_status_updates: Dict[str, AmbulanceStatus] = Field(default_factory=dict)
    hospital_capacity_updates: Dict[str, int] = Field(default_factory=dict)


# ---- Classical optimization result models ----
class Assignment(BaseModel):
    incident_id: str
    ambulance_id: str
    hospital_id: str
    travel_time_to_incident_minutes: float
    travel_time_to_hospital_minutes: float
    total_time_minutes: float
    hospital_capabilities_matched: List[str]
    rejected_hospitals: List[Dict[str, Any]] = Field(default_factory=list)


class OptimizationResult(BaseModel):
    status: str  # OPTIMAL, FEASIBLE, INFEASIBLE
    assignments: List[Assignment]
    unserved_incidents: List[Dict[str, Any]]
    objective_value: float
    solver_wall_time_ms: float
    objective_weights: Dict[str, Any]
    explanation: str


# ---- Quantum QAOA models ----
class QuantumExperimentRequest(BaseModel):
    reps: int = Field(default=1, ge=1, le=3, description="QAOA depth / layers p")
    max_iter: int = Field(default=25, ge=5, le=100, description="Optimizer max iterations")
    penalty_multiplier: float = Field(default=25.0, gt=0, description="Constraint penalty multiplier P")


class CircuitStats(BaseModel):
    num_qubits: int
    depth: int
    gate_counts: Dict[str, int]
    num_parameters: int


class ClassicalBaselineResult(BaseModel):
    method: str
    optimal_bitstring: str
    objective_value: float
    is_feasible: bool
    assignments: List[Dict[str, str]]
    runtime_ms: float


class QuantumQAOAResult(BaseModel):
    method: str
    measured_bitstring: str
    measured_energy: float
    success_probability: float
    is_feasible: bool
    assignments: List[Dict[str, str]]
    runtime_ms: float
    circuit_stats: CircuitStats
    optimal_gamma: List[float]
    optimal_beta: List[float]
    state_distribution: Dict[str, float]


class QuantumExperimentResult(BaseModel):
    status: str
    problem_formulation: Dict[str, Any]
    qubo_terms: List[Dict[str, Any]]
    classical_baseline: ClassicalBaselineResult
    quantum_qaoa: QuantumQAOAResult
    comparison: Dict[str, Any]
    limitations_and_realities: List[str]
