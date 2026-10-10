import { useState, useEffect, useCallback } from 'react'
import type {
  Incident,
  Ambulance,
  Hospital,
  OptimizationResult,
  RoadNetworkDetails,
  AmbulanceStatus,
} from './types'
import { api } from './lib/api'
import { IncidentList } from './components/IncidentList'
import { AmbulanceList } from './components/AmbulanceList'
import { HospitalList } from './components/HospitalList'
import { OptimizationResults } from './components/OptimizationResults'
import { RoadNetworkMap } from './components/RoadNetworkMap'
import { ScenarioControls } from './components/ScenarioControls'
import { QuantumDashboard } from './components/QuantumDashboard'

type Tab = 'dashboard' | 'network' | 'incidents' | 'fleet' | 'controls' | 'results' | 'quantum'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [network, setNetwork] = useState<RoadNetworkDetails | null>(null)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [scenarioLoaded, setScenarioLoaded] = useState(false)

  // Check API health on mount
  useEffect(() => {
    api
      .health()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false))
  }, [])

  const refreshData = useCallback(async () => {
    try {
      const [incRes, ambRes, hospRes, netRes] = await Promise.all([
        api.getIncidents(),
        api.getAmbulances(),
        api.getHospitals(),
        api.getNetwork(),
      ])
      setIncidents(incRes.data)
      setAmbulances(ambRes.data)
      setHospitals(hospRes.data)
      setNetwork(netRes.data)
    } catch (e: unknown) {
      console.error('Data refresh error:', e)
    }
  }, [])

  const loadScenario = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await api.loadScenario()
      await refreshData()
      setResult(null)
      setScenarioLoaded(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(`Failed to load scenario: ${msg}`)
    } finally {
      setLoading(false)
    }
  }, [refreshData])

  const runOptimizer = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.runOptimizer()
      setResult(res.data)
      setActiveTab('results')
      await refreshData()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(`Optimization failed: ${msg}`)
    } finally {
      setLoading(false)
    }
  }, [refreshData])

  // Mutation and instant re-optimization handler
  const handleApplyScenarioUpdate = async (
    trafficUpdates: { edge_from: string; edge_to: string; new_travel_time_minutes: number }[],
    ambulanceUpdates: Record<string, AmbulanceStatus>,
    hospitalUpdates: Record<string, number>,
  ) => {
    setLoading(true)
    setError(null)
    try {
      await api.updateScenario({
        traffic_updates: trafficUpdates,
        ambulance_status_updates: ambulanceUpdates,
        hospital_capacity_updates: hospitalUpdates,
      })
      // Execute genuine re-optimization
      const optRes = await api.runOptimizer()
      setResult(optRes.data)
      await refreshData()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Update failed'
      setError(`Scenario update or re-optimization failed: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  // Quick toggle handlers from lists
  const handleToggleAmbulanceStatus = async (ambId: string, newStatus: AmbulanceStatus) => {
    await handleApplyScenarioUpdate([], { [ambId]: newStatus }, {})
  }

  const handleUpdateHospitalCapacity = async (hospId: string, newCapacity: number) => {
    await handleApplyScenarioUpdate([], {}, { [hospId]: newCapacity })
  }

  const handleTrafficChange = async (from: string, to: string, minutes: number) => {
    await handleApplyScenarioUpdate(
      [
        { edge_from: from, edge_to: to, new_travel_time_minutes: minutes },
        { edge_from: to, edge_to: from, new_travel_time_minutes: minutes },
      ],
      {},
      {},
    )
  }

  const tabs: { id: Tab; label: string; count?: number; icon?: string }[] = [
    { id: 'dashboard', label: 'Overview', icon: '📊' },
    { id: 'network', label: 'City Road Map', icon: '🗺️' },
    { id: 'incidents', label: 'Emergencies', count: incidents.length, icon: '🚨' },
    { id: 'fleet', label: 'Ambulances & Hospitals', icon: '🚑' },
    { id: 'controls', label: 'Scenario Modifiers', icon: '🛠️' },
    { id: 'results', label: 'Classical Results', count: result ? result.assignments.length : undefined, icon: '⚡' },
    { id: 'quantum', label: 'QAOA Experiment', icon: '⚛️' },
  ]

  // Compute key summary numbers
  const totalBeds = hospitals.reduce((sum, h) => sum + h.available_capacity, 0)
  const availableAmbs = ambulances.filter((a) => a.status === 'available').length

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 bg-red-950 border border-red-800 rounded-lg">🚨</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-white leading-tight">
                    Q-ResQ
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                    Hybrid Classical &amp; Quantum
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Emergency Response Optimization MVP · Google OR-Tools + Qiskit QAOA
                </p>
              </div>
            </div>

            <div
              className={`ml-2 h-2.5 w-2.5 rounded-full ${
                apiOnline === null
                  ? 'bg-gray-500 animate-pulse'
                  : apiOnline
                  ? 'bg-green-500 shadow-sm shadow-green-500'
                  : 'bg-red-500'
              }`}
              title={apiOnline === null ? 'Checking API…' : apiOnline ? 'FastAPI Online' : 'FastAPI Offline'}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="btn-primary bg-gray-800 hover:bg-gray-700 text-xs px-3 py-2 border border-gray-700"
              onClick={loadScenario}
              disabled={loading}
              title="Reset to 3 incidents, 2 ambulances, 3 hospitals"
            >
              {loading ? '⏳' : '📂'} Reset / Load Scenario
            </button>
            <button
              className="btn-primary bg-blue-600 hover:bg-blue-500 text-xs px-3 py-2"
              onClick={runOptimizer}
              disabled={loading || !scenarioLoaded}
              title="Run classical OR-Tools CP-SAT solver"
            >
              {loading ? '⏳' : '⚡'} OR-Tools Solve
            </button>
            <button
              className="btn-primary bg-purple-700 hover:bg-purple-600 text-xs px-3 py-2"
              onClick={() => {
                setActiveTab('quantum')
              }}
              disabled={loading || !scenarioLoaded}
              title="Navigate to Qiskit QAOA quantum benchmark"
            >
              ⚛️ Quantum QAOA
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-5 flex-1 w-full">
        {/* Error notification banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-950 border border-red-800 text-red-300 px-4 py-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              className="text-red-400 hover:text-red-200 text-sm font-bold ml-4"
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* API offline banner */}
        {apiOnline === false && (
          <div className="mb-4 rounded-lg bg-yellow-950/80 border border-yellow-800 text-yellow-300 px-4 py-3 text-xs">
            ⚠️ Backend API is offline. Start the backend: <code className="bg-gray-900 px-1 py-0.5 rounded text-white font-mono">uvicorn app.main:app --reload</code>
          </div>
        )}

        {/* Not Loaded Hero State */}
        {!scenarioLoaded && apiOnline !== false && (
          <div className="card text-center py-16 px-4 max-w-xl mx-auto border-gray-800 my-8">
            <span className="text-4xl p-3 bg-gray-900 border border-gray-800 rounded-2xl inline-block mb-3">🚑</span>
            <h2 className="text-lg font-bold text-white mb-1">Ready for Incident Coordination</h2>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Load the synthetic demonstration scenario: 3 emergencies (P1 Cardiac, P2 Trauma, P2 Stroke),
              2 advanced life support ambulances, and 3 specialized receiving hospitals across a 10-node road grid.
            </p>
            <button
              onClick={loadScenario}
              disabled={loading}
              className="btn-primary bg-blue-600 hover:bg-blue-500 text-sm px-6 py-2.5 font-bold shadow-lg shadow-blue-950"
            >
              {loading ? '⏳ Loading...' : '📂 Load Demonstration Scenario'}
            </button>
          </div>
        )}

        {scenarioLoaded && (
          <>
            {/* Top Stat Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="card p-3 bg-gray-900/60 border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block">Active Incidents</span>
                  <span className="text-lg font-black text-red-400 font-mono">{incidents.length}</span>
                </div>
                <span className="text-xl">🚨</span>
              </div>
              <div className="card p-3 bg-gray-900/60 border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block">Available Ambulances</span>
                  <span className="text-lg font-black text-blue-400 font-mono">
                    {availableAmbs} / {ambulances.length}
                  </span>
                </div>
                <span className="text-xl">🚑</span>
              </div>
              <div className="card p-3 bg-gray-900/60 border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block">Total Hospital Beds</span>
                  <span className="text-lg font-black text-purple-400 font-mono">{totalBeds}</span>
                </div>
                <span className="text-xl">🏥</span>
              </div>
              <div className="card p-3 bg-gray-900/60 border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block">Solver Status</span>
                  <span
                    className={`text-sm font-black font-mono ${
                      result
                        ? result.status === 'OPTIMAL'
                          ? 'text-green-400'
                          : 'text-yellow-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {result ? `${result.status} (${result.assignments.length} served)` : 'Not Solved'}
                  </span>
                </div>
                <span className="text-xl">⚡</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 mb-5 border-b border-gray-800 overflow-x-auto pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors rounded-t-lg flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white border border-gray-800 border-b-gray-900 -mb-px shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/40'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="ml-1 rounded-full bg-gray-800 border border-gray-700 px-1.5 py-0.2 text-[10px] font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div>
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Map on top */}
                  <RoadNetworkMap
                    network={network}
                    incidents={incidents}
                    ambulances={ambulances}
                    hospitals={hospitals}
                    onTrafficChange={handleTrafficChange}
                  />

                  {/* Summary split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                        <span>🚨</span> Emergency Queue &amp; Urgency Scoring
                      </h3>
                      <IncidentList incidents={incidents} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                        <span>⚡</span> Latest OR-Tools Dispatch Allocation
                      </h3>
                      {result ? (
                        <OptimizationResults result={result} />
                      ) : (
                        <div className="card text-center py-10 text-gray-500 text-xs">
                          <p className="mb-2 text-xl">⚡</p>
                          <p>Click &quot;OR-Tools Solve&quot; in the top bar to run the classical solver.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'network' && (
                <RoadNetworkMap
                  network={network}
                  incidents={incidents}
                  ambulances={ambulances}
                  hospitals={hospitals}
                  onTrafficChange={handleTrafficChange}
                />
              )}

              {activeTab === 'incidents' && (
                <div>
                  <div className="mb-3 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-200">Emergency Incidents Intake</h3>
                    <span className="text-xs text-gray-400">Rules-based provisional triage: P1 (Critical), P2 (Serious), P3 (Non-urgent)</span>
                  </div>
                  <IncidentList incidents={incidents} />
                </div>
              )}

              {activeTab === 'fleet' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                      <span>🚑</span> Ambulance Registry
                    </h3>
                    <AmbulanceList
                      ambulances={ambulances}
                      onToggleStatus={handleToggleAmbulanceStatus}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                      <span>🏥</span> Receiving Hospitals &amp; Capabilities
                    </h3>
                    <HospitalList
                      hospitals={hospitals}
                      onUpdateCapacity={handleUpdateHospitalCapacity}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'controls' && (
                <ScenarioControls
                  ambulances={ambulances}
                  hospitals={hospitals}
                  network={network}
                  loading={loading}
                  onApplyScenarioUpdate={handleApplyScenarioUpdate}
                />
              )}

              {activeTab === 'results' && (
                <div>
                  <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                    <span>⚡</span> Classical Combinatorial Solver Results (Google OR-Tools CP-SAT)
                  </h3>
                  {result ? (
                    <OptimizationResults result={result} />
                  ) : (
                    <div className="card text-center py-12 text-gray-500 text-xs">
                      <p className="text-3xl mb-2">⚡</p>
                      <p className="font-semibold text-gray-400">No classical allocation calculated yet</p>
                      <p className="mt-1">Click &quot;OR-Tools Solve&quot; in the header to run the optimizer.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'quantum' && (
                <QuantumDashboard scenarioLoaded={scenarioLoaded} />
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-gray-950 py-4 text-center text-[11px] text-gray-600">
        Q-ResQ · Hackathon Prototype for Quantum AI &amp; Software · Built with FastAPI, Google OR-Tools, NetworkX, Qiskit &amp; React
      </footer>
    </div>
  )
}

export default App
