import time
import networkx as nx
from typing import List, Dict, Any
from ortools.sat.python import cp_model
from app.models import Incident, Ambulance, Hospital, Assignment, OptimizationResult
from app.hospital_matcher import rank_hospitals_for_incident


def run_optimizer(
    incidents: List[Incident],
    ambulances: List[Ambulance],
    hospitals: List[Hospital],
    graph: nx.DiGraph,
    time_limit_seconds: int = 10,
) -> OptimizationResult:
    """
    Solve ambulance-to-incident-to-hospital assignment via OR-Tools CP-SAT.

    Objective (minimise):
        Σ (travel_time_to_incident + travel_time_to_hospital) × 10   [integer scaled]
      + Σ unserved_penalty × 10
          P1 penalty = 1000, P2 = 500, P3 = 100

    Hard constraints:
        1. Each ambulance → at most 1 incident.
        2. Each incident → at most 1 ambulance.
        3. Only AVAILABLE ambulances are eligible.
        4. Ambulance must have ALL required capabilities of the incident.
        5. Hospital must have ALL required capabilities of the incident.
        6. Incidents routed to a hospital ≤ hospital.available_capacity.
    """
    start_time = time.time()

    model = cp_model.CpModel()

    x: Dict[tuple, Any] = {}
    y: Dict[str, Any] = {}

    # Penalty weights (will be scaled ×10 to stay integer)
    P_UNSERVED: Dict[str, int] = {"P1": 1000, "P2": 500, "P3": 100}

    objective_terms: List[Any] = []

    # Create "served" boolean for each incident and add penalty for being unserved
    for inc in incidents:
        y[inc.id] = model.NewBoolVar(f"y_{inc.id}")
        not_served = model.NewBoolVar(f"not_served_{inc.id}")
        model.Add(y[inc.id] + not_served == 1)
        penalty = P_UNSERVED.get(inc.urgency.value, 100)
        objective_terms.append(not_served * penalty * 10)

    valid_pairs: List[tuple] = []
    hospital_usage: Dict[str, List[Any]] = {h.id: [] for h in hospitals}
    ambulance_usage: Dict[str, List[Any]] = {a.id: [] for a in ambulances}

    # Pre-compute structural infeasibility reasons per incident
    incident_unserved_reason: Dict[str, str] = {}

    for inc in incidents:
        incident_vars: List[Any] = []
        no_capable_ambulance = True
        no_capable_hospital = True

        for amb in ambulances:
            if amb.status != "available":
                continue

            # Check ambulance capability
            if not all(cap in amb.capabilities for cap in inc.required_capabilities):
                continue

            no_capable_ambulance = False

            try:
                tt_amb_inc = nx.shortest_path_length(
                    graph,
                    source=amb.location_node,
                    target=inc.location_node,
                    weight="travel_time_min",
                )
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                continue

            matches, rejected = rank_hospitals_for_incident(inc, hospitals, graph, amb.location_node)
            if matches:
                no_capable_hospital = False

            for match in matches:
                var = model.NewBoolVar(f"x_{inc.id}_{amb.id}_{match.hospital_id}")
                x[(inc.id, amb.id, match.hospital_id)] = var

                incident_vars.append(var)
                hospital_usage[match.hospital_id].append(var)
                ambulance_usage[amb.id].append(var)

                cost = int(round((tt_amb_inc + match.travel_time_minutes) * 10))
                objective_terms.append(var * cost)
                valid_pairs.append((inc, amb, match, tt_amb_inc, rejected))

        # Determine structural reason for any unserved outcome
        available_ambs = [a for a in ambulances if a.status == "available"]
        if not available_ambs:
            incident_unserved_reason[inc.id] = "No ambulances available"
        elif no_capable_ambulance:
            incident_unserved_reason[inc.id] = (
                f"No available ambulance has required capabilities: {inc.required_capabilities}"
            )
        elif no_capable_hospital:
            incident_unserved_reason[inc.id] = (
                f"No hospital has required capabilities or available capacity "
                f"for: {inc.required_capabilities}"
            )
        else:
            incident_unserved_reason[inc.id] = (
                "Solver could not assign (all compatible ambulances/hospitals already allocated)"
            )

        # Link y[inc.id] to sum of assignment variables
        model.Add(sum(incident_vars) == y[inc.id])

    # Constraint: each ambulance dispatched at most once
    for amb_id, vars_list in ambulance_usage.items():
        if vars_list:
            model.Add(sum(vars_list) <= 1)

    # Constraint: hospital capacity
    for h in hospitals:
        if hospital_usage[h.id]:
            model.Add(sum(hospital_usage[h.id]) <= h.available_capacity)

    model.Minimize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    status = solver.Solve(model)

    wall_time_ms = (time.time() - start_time) * 1000

    assignments: List[Assignment] = []
    unserved: List[Dict[str, Any]] = []
    status_str = "INFEASIBLE"
    obj_val = 0.0

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        status_str = "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE"
        obj_val = solver.ObjectiveValue() / 10.0

        served_incident_ids: set = set()

        for inc, amb, match, tt_amb_inc, rejected in valid_pairs:
            var = x[(inc.id, amb.id, match.hospital_id)]
            if solver.Value(var) == 1:
                assignments.append(
                    Assignment(
                        incident_id=inc.id,
                        ambulance_id=amb.id,
                        hospital_id=match.hospital_id,
                        travel_time_to_incident_minutes=float(tt_amb_inc),
                        travel_time_to_hospital_minutes=match.travel_time_minutes,
                        total_time_minutes=float(tt_amb_inc) + match.travel_time_minutes,
                        hospital_capabilities_matched=match.matched_capabilities,
                        rejected_hospitals=[
                            {"hospital_id": r.hospital_id, "reason": r.reason}
                            for r in rejected
                        ],
                    )
                )
                served_incident_ids.add(inc.id)

        for inc in incidents:
            if inc.id not in served_incident_ids:
                unserved.append(
                    {
                        "incident_id": inc.id,
                        "reason": incident_unserved_reason.get(
                            inc.id, "Not assigned by solver"
                        ),
                    }
                )
    else:
        for inc in incidents:
            unserved.append(
                {
                    "incident_id": inc.id,
                    "reason": incident_unserved_reason.get(
                        inc.id, "Infeasible model — solver returned no solution"
                    ),
                }
            )

    objective_weights: Dict[str, Any] = {
        "P1_unserved_penalty": P_UNSERVED["P1"],
        "P2_unserved_penalty": P_UNSERVED["P2"],
        "P3_unserved_penalty": P_UNSERVED["P3"],
        "travel_time_weight": 1,
        "scale_factor": 10,
        "note": (
            "Objective = Σ(travel_times × 10) + Σ(unserved_penalties × 10), "
            "minimised by CP-SAT. All times in minutes."
        ),
    }

    explanation = (
        f"Solver status: {status_str}. "
        f"Served {len(assignments)}/{len(incidents)} incidents. "
        f"{len(unserved)} incident(s) unserved. "
        f"Objective value: {obj_val:.1f} (lower = better). "
        f"Wall time: {wall_time_ms:.0f} ms."
    )

    return OptimizationResult(
        status=status_str,
        assignments=assignments,
        unserved_incidents=unserved,
        objective_value=obj_val,
        solver_wall_time_ms=wall_time_ms,
        objective_weights=objective_weights,
        explanation=explanation,
    )
