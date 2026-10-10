import axios from 'axios'
import type {
  Incident,
  Ambulance,
  Hospital,
  OptimizationResult,
  ScenarioStatus,
  ScenarioUpdate,
  RoadNetworkDetails,
  QuantumExperimentRequest,
  QuantumExperimentResult,
} from '../types'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const client = axios.create({ baseURL: BASE })

export const api = {
  health: () => client.get<{ status: string; service: string; version: string }>('/health'),

  loadScenario: () => client.post<{ message: string }>('/scenario/load'),
  getScenarioStatus: () => client.get<ScenarioStatus>('/scenario/status'),
  getNetwork: () => client.get<RoadNetworkDetails>('/scenario/network'),
  updateScenario: (update: ScenarioUpdate) => client.post<{ message: string }>('/scenario/update', update),

  getIncidents: () => client.get<Incident[]>('/incidents'),
  getAmbulances: () => client.get<Ambulance[]>('/ambulances'),
  getHospitals: () => client.get<Hospital[]>('/hospitals'),

  runOptimizer: () => client.post<OptimizationResult>('/optimize'),

  // Quantum endpoints
  getQuantumInfo: () => client.get<{
    status: string
    framework: string
    qiskit_version: string
    backend: string
    algorithm: string
    qubit_formulation: string
  }>('/quantum/info'),
  runQuantumExperiment: (params?: QuantumExperimentRequest) =>
    client.post<QuantumExperimentResult>('/quantum/experiment', params ?? {}),
}
