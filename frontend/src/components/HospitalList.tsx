import type { Hospital } from '../types'

interface Props {
  hospitals: Hospital[]
  onUpdateCapacity?: (hospitalId: string, newCapacity: number) => void
}

export function HospitalList({ hospitals, onUpdateCapacity }: Props) {
  if (hospitals.length === 0) {
    return <p className="text-gray-500 text-sm">No hospitals loaded.</p>
  }

  return (
    <div className="space-y-3">
      {hospitals.map((h) => {
        const hasCap = h.available_capacity > 0

        return (
          <div key={h.id} className="card border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-gray-100">{h.id}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                    hasCap
                      ? 'bg-green-950/80 border-green-800 text-green-300'
                      : 'bg-red-950/80 border-red-800 text-red-300'
                  }`}
                >
                  {hasCap ? `${h.available_capacity} Beds Available` : 'At Full Capacity (0 Beds)'}
                </span>
              </div>

              {onUpdateCapacity && (
                <div className="flex items-center gap-1.5 bg-gray-800/80 border border-gray-700 rounded-lg p-0.5">
                  <button
                    onClick={() => onUpdateCapacity(h.id, Math.max(0, h.available_capacity - 1))}
                    disabled={h.available_capacity <= 0}
                    className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:hover:bg-gray-700 text-xs text-white font-bold flex items-center justify-center transition-colors"
                    title="Decrease capacity by 1"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs px-2 font-bold text-gray-200">
                    {h.available_capacity}
                  </span>
                  <button
                    onClick={() => onUpdateCapacity(h.id, h.available_capacity + 1)}
                    className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-xs text-white font-bold flex items-center justify-center transition-colors"
                    title="Increase capacity by 1"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-2">
              Location Node: <span className="font-mono text-gray-200">{h.location_node}</span>
            </p>

            <div>
              <span className="text-[11px] text-gray-500 block mb-1">Clinical Capabilities:</span>
              <div className="flex flex-wrap gap-1.5">
                {h.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded px-2 py-0.5 text-xs bg-purple-950 text-purple-300 border border-purple-800 font-mono"
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
