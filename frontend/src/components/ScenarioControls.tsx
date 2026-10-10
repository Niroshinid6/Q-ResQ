import { useState } from 'react'
import type { Ambulance, Hospital, RoadNetworkDetails } from '../types'

interface Props {
  ambulances: Ambulance[]
  hospitals: Hospital[]
  network: RoadNetworkDetails | null
  loading: boolean
  onApplyScenarioUpdate: (
    trafficUpdates: { edge_from: string; edge_to: string; new_travel_time_minutes: number }[],
    ambulanceUpdates: Record<string, 'available' | 'unavailable'>,
    hospitalUpdates: Record<string, number>,
  ) => Promise<void>
}

export function ScenarioControls({
  ambulances,
  hospitals,
  network,
  loading,
  onApplyScenarioUpdate,
}: Props) {
  // Traffic state
  const [selectedEdge, setSelectedEdge] = useState<string>('N2->N3')
  const [customTravelTime, setCustomTravelTime] = useState<number>(30.0)

  // Ambulance availability state
  const [ambStatusMap, setAmbStatusMap] = useState<Record<string, 'available' | 'unavailable'>>({})

  // Hospital capacity state
  const [hospCapMap, setHospCapMap] = useState<Record<string, number>>({})

  // Success message
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const handleTrafficPreset = async (from: string, to: string, time: number) => {
    setStatusMsg(`Applying traffic delay on ${from} ↔ ${to} (${time} min)...`)
    await onApplyScenarioUpdate(
      [
        { edge_from: from, edge_to: to, new_travel_time_minutes: time },
        { edge_from: to, edge_to: from, new_travel_time_minutes: time },
      ],
      {},
      {},
    )
    setStatusMsg(`Traffic updated: ${from} ↔ ${to} set to ${time} min. Re-optimization complete.`)
  }

  const handleApplyCustomTraffic = async () => {
    const [from, to] = selectedEdge.split('->')
    if (!from || !to) return
    setStatusMsg(`Updating ${from} ↔ ${to} to ${customTravelTime} min...`)
    await onApplyScenarioUpdate(
      [
        { edge_from: from, edge_to: to, new_travel_time_minutes: customTravelTime },
        { edge_from: to, edge_to: from, new_travel_time_minutes: customTravelTime },
      ],
      {},
      {},
    )
    setStatusMsg(`Traffic updated and re-optimized.`)
  }

  const handleToggleAmbulance = async (ambId: string, currentStatus: string) => {
    const nextStatus: 'available' | 'unavailable' =
      currentStatus === 'available' ? 'unavailable' : 'available'
    const newMap: Record<string, 'available' | 'unavailable'> = {
      ...ambStatusMap,
      [ambId]: nextStatus,
    }
    setAmbStatusMap(newMap)
    setStatusMsg(`Setting ${ambId} to ${nextStatus}...`)
    await onApplyScenarioUpdate([], { [ambId]: nextStatus }, {})
    setStatusMsg(`Ambulance ${ambId} set to ${nextStatus}. Re-optimization complete.`)
  }

  const handleSetHospitalCapacity = async (hospId: string, capacity: number) => {
    const newMap = { ...hospCapMap, [hospId]: capacity }
    setHospCapMap(newMap)
    setStatusMsg(`Updating ${hospId} capacity to ${capacity}...`)
    await onApplyScenarioUpdate([], {}, { [hospId]: capacity })
    setStatusMsg(`Hospital ${hospId} capacity set to ${capacity}. Re-optimization complete.`)
  }

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
        <div>
          <h3 className="text-sm font-bold text-gray-200">Interactive Scenario Condition Modifiers</h3>
          <p className="text-xs text-gray-400">
            Inject disruptions (congestion, fleet breakdowns, hospital saturation) and re-optimize.
          </p>
        </div>
        {statusMsg && (
          <span className="text-xs px-2.5 py-1 rounded bg-green-950/80 border border-green-800 text-green-300 font-medium">
            ✓ {statusMsg}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Road Traffic Disruptions */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🚧</span>
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Road Traffic &amp; Delays
            </h4>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-gray-400 block mb-1">Target Edge Corridor:</label>
              <select
                value={selectedEdge}
                onChange={(e) => setSelectedEdge(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-200 text-xs font-mono"
              >
                {network?.edges.map((e, idx) => (
                  <option key={idx} value={`${e.from_node}->${e.to_node}`}>
                    {e.from_node} ➔ {e.to_node} (currently {e.travel_time_min.toFixed(0)}m)
                  </option>
                ))}
                {!network && <option value="N2->N3">N2 ➔ N3 (Corridor)</option>}
              </select>
            </div>

            <div>
              <label className="text-gray-400 block mb-1">
                Travel Time: <span className="text-yellow-300 font-bold">{customTravelTime} min</span>
              </label>
              <input
                type="range"
                min="2"
                max="60"
                step="2"
                value={customTravelTime}
                onChange={(e) => setCustomTravelTime(Number(e.target.value))}
                disabled={loading}
                className="w-full accent-yellow-500 bg-gray-800 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={handleApplyCustomTraffic}
              disabled={loading}
              className="w-full btn-primary text-xs justify-center py-1.5"
            >
              Apply Edge Traffic Delay
            </button>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-gray-800/80 space-y-1">
              <span className="text-[11px] text-gray-500 block">Scenario Presets:</span>
              <button
                onClick={() => handleTrafficPreset('N2', 'N3', 40.0)}
                disabled={loading}
                className="w-full text-left text-xs px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-700/60 transition-colors"
              >
                🚨 Heavy Bridge Jam: N2 ↔ N3 (40 min)
              </button>
              <button
                onClick={() => handleTrafficPreset('N1', 'N2', 30.0)}
                disabled={loading}
                className="w-full text-left text-xs px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-700/60 transition-colors"
              >
                🚨 Highway Accident: N1 ↔ N2 (30 min)
              </button>
            </div>
          </div>
        </div>

        {/* 2. Ambulance Availability */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🚑</span>
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Fleet Availability
            </h4>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Toggle ambulances off-duty (e.g., mechanical fault or out of service) to test contingency
            dispatch:
          </p>

          <div className="space-y-2">
            {ambulances.map((amb) => {
              const currentStatus = ambStatusMap[amb.id] || amb.status
              const isAvail = currentStatus === 'available'

              return (
                <div
                  key={amb.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-800/80 border border-gray-700 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-gray-200">{amb.id}</span>
                    <span className="text-[11px] text-gray-400 block">
                      Node {amb.location_node}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleAmbulance(amb.id, currentStatus)}
                    disabled={loading}
                    className={`px-3 py-1 rounded font-semibold text-xs transition-colors ${
                      isAvail
                        ? 'bg-green-950 border border-green-800 text-green-300 hover:bg-red-950 hover:border-red-800 hover:text-red-300'
                        : 'bg-red-950 border border-red-800 text-red-300 hover:bg-green-950 hover:border-green-800 hover:text-green-300'
                    }`}
                  >
                    {isAvail ? 'Online (Available)' : 'Offline (Unavailable)'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* 3. Hospital Capacity Saturation */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🏥</span>
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Hospital Bed Saturation
            </h4>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Set capacity to 0 to simulate ER diverts and force solver to re-route to alternative
            hospitals:
          </p>

          <div className="space-y-2">
            {hospitals.map((hosp) => {
              const currentCap = hospCapMap[hosp.id] ?? hosp.available_capacity

              return (
                <div
                  key={hosp.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-800/80 border border-gray-700 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-gray-200">{hosp.id}</span>
                    <span className="text-[11px] text-gray-400 block">
                      Node {hosp.location_node}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSetHospitalCapacity(hosp.id, 0)}
                      disabled={loading || currentCap === 0}
                      className="px-2 py-0.5 rounded text-[11px] bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 transition-colors disabled:opacity-40"
                      title="Set capacity to 0 (Full)"
                    >
                      Saturate (0)
                    </button>
                    <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5">
                      <button
                        onClick={() => handleSetHospitalCapacity(hosp.id, Math.max(0, currentCap - 1))}
                        disabled={loading || currentCap <= 0}
                        className="text-gray-400 hover:text-white px-1 disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-purple-300 px-1">
                        {currentCap}
                      </span>
                      <button
                        onClick={() => handleSetHospitalCapacity(hosp.id, currentCap + 1)}
                        disabled={loading}
                        className="text-gray-400 hover:text-white px-1"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
