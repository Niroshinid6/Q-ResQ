import type { Ambulance, AmbulanceStatus } from '../types'

interface Props {
  ambulances: Ambulance[]
  onToggleStatus?: (ambulanceId: string, newStatus: AmbulanceStatus) => void
}

const statusColor: Record<string, string> = {
  available: 'text-green-400 bg-green-950 border-green-800',
  dispatched: 'text-yellow-400 bg-yellow-950 border-yellow-800',
  unavailable: 'text-red-400 bg-red-950 border-red-800',
}

export function AmbulanceList({ ambulances, onToggleStatus }: Props) {
  if (ambulances.length === 0) {
    return <p className="text-gray-500 text-sm">No ambulances loaded.</p>
  }

  return (
    <div className="space-y-3">
      {ambulances.map((amb) => {
        const isAvail = amb.status === 'available'
        const nextStatus: AmbulanceStatus = isAvail ? 'unavailable' : 'available'

        return (
          <div key={amb.id} className="card border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-gray-100">{amb.id}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-semibold capitalize ${
                    statusColor[amb.status] ?? 'text-gray-400'
                  }`}
                >
                  {amb.status}
                </span>
              </div>
              {onToggleStatus && (
                <button
                  onClick={() => onToggleStatus(amb.id, nextStatus)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
                    isAvail
                      ? 'bg-red-950/60 border-red-800 text-red-300 hover:bg-red-900/80'
                      : 'bg-green-950/60 border-green-800 text-green-300 hover:bg-green-900/80'
                  }`}
                  title={`Click to set ${nextStatus}`}
                >
                  Set {isAvail ? 'Unavailable' : 'Available'}
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-2">
              Location Node: <span className="font-mono text-gray-200">{amb.location_node}</span>
              {amb.assigned_incident_id && (
                <>
                  {' '}· Assigned to:{' '}
                  <span className="text-yellow-300 font-mono font-semibold">
                    {amb.assigned_incident_id}
                  </span>
                </>
              )}
            </p>

            <div>
              <span className="text-[11px] text-gray-500 block mb-1">Equipped Capabilities:</span>
              <div className="flex flex-wrap gap-1.5">
                {amb.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded px-2 py-0.5 text-xs bg-blue-950 text-blue-300 border border-blue-800 font-mono"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
