// Shared TypeScript types matching backend Pydantic models

export type UrgencyLevel = 'P1' | 'P2' | 'P3'
export type IncidentType = 'cardiac' | 'trauma' | 'stroke' | 'respiratory' | 'general'
export type AmbulanceStatus = 'available' | 'dispatched' | 'unavailable'

export interface Incident {
  id: string
  incident_type: IncidentType
  location_node: string
  reported_severity: number
  required_capabilities: string[]
  urgency: UrgencyLevel
  urgency_score: number
  urgency_rationale: string
}

export interface Ambulance {
  id: string
  location_node: string
  capabilities: string[]
  status: AmbulanceStatus
  assigned_incident_id: string | null
}

export interface Hospital {
  id: string
  location_node: string
  capabilities: string[]
  available_capacity: number
}

export interface Assignment {
  incident_id: string
  ambulance_id: string
  hospital_id: string
  travel_time_to_incident_minutes: number
  travel_time_to_hospital_minutes: number
  total_time_minutes: number
  hospital_capabilities_matched: string[]
  rejected_hospitals: { hospital_id: string; reason: string }[]
}

export interface OptimizationResult {
  status: string
  assignments: Assignment[]
  unserved_incidents: { incident_id: string; reason: string }[]
  objective_value: number
  solver_wall_time_ms: number
  objective_weights: Record<string, unknown>
  explanation: string
}

export interface ScenarioStatus {
  incidents: number
  ambulances: number
  hospitals: number
}

export interface RoadEdgeInfo {
  from_node: string
  to_node: string
  distance_km: number
  travel_time_min: number
  baseline_travel_time_min: number
  is_congested: boolean
}

export interface NetworkNodeInfo {
  id: string
  x: number
  y: number
  label: string
}

export interface RoadNetworkDetails {
  nodes: NetworkNodeInfo[]
  edges: RoadEdgeInfo[]
}

export interface TrafficUpdate {
  edge_from: string
  edge_to: string
  new_travel_time_minutes: number
}

export interface ScenarioUpdate {
  traffic_updates?: TrafficUpdate[]
  ambulance_status_updates?: Record<string, AmbulanceStatus>
  hospital_capacity_updates?: Record<string, number>
}

// Quantum types
export interface CircuitStats {
  num_qubits: number
  depth: number
  gate_counts: Record<string, number>
  num_parameters: number
}

export interface ClassicalBaselineResult {
  method: string
  optimal_bitstring: string
  objective_value: number
  is_feasible: boolean
  assignments: { incident_id: string; ambulance_id: string }[]
  runtime_ms: number
}

export interface QuantumQAOAResult {
  method: string
  measured_bitstring: string
  measured_energy: number
  success_probability: number
  is_feasible: boolean
  assignments: { incident_id: string; ambulance_id: string }[]
  runtime_ms: number
  circuit_stats: CircuitStats
  optimal_gamma: number[]
  optimal_beta: number[]
  state_distribution: Record<string, number>
}

export interface QuantumComparison {
  is_exact_match: boolean
  energy_gap: number
  approximation_ratio: number
  classical_faster_by_factor: number
  feasibility_agreement: boolean
}

export interface QuantumExperimentResult {
  status: string
  problem_formulation: {
    description: string
    incidents: string[]
    ambulances: string[]
    variables: { var: string; ambulance: string; incident: string; travel_time_min: number }[]
    penalty_multiplier: number
  }
  qubo_terms: { term: string; coefficient: number; type: string }[]
  classical_baseline: ClassicalBaselineResult
  quantum_qaoa: QuantumQAOAResult
  comparison: QuantumComparison
  limitations_and_realities: string[]
}

export interface QuantumExperimentRequest {
  reps?: number
  max_iter?: number
  penalty_multiplier?: number
}
