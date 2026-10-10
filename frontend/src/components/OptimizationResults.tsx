import type { OptimizationResult } from '../types'

interface Props {
  result: OptimizationResult
}

const statusColor: Record<string, string> = {
  OPTIMAL: 'text-green-400',
  FEASIBLE: 'text-yellow-400',
  INFEASIBLE: 'text-red-400',
}

export function OptimizationResults({ result }: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-lg font-bold ${statusColor[result.status] ?? 'text-gray-300'}`}>
          {result.status}
        </span>
        <span className="text-sm text-gray-400">
          Objective: {result.objective_value.toFixed(1)} · Solved in{' '}
          {result.solver_wall_time_ms.toFixed(0)} ms
        </span>
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-300 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
        {result.explanation}
      </p>

      {/* Assignments */}
      {result.assignments.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">
            Assignments ({result.assignments.length})
          </h4>
          <div className="space-y-2">
            {result.assignments.map((a) => (
              <div
                key={a.incident_id}
                className="card bg-gray-800 border-green-900"
              >
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Incident</span>
                    <p className="font-mono font-bold text-green-300">{a.incident_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Ambulance</span>
                    <p className="font-mono font-bold text-blue-300">{a.ambulance_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Hospital</span>
                    <p className="font-mono font-bold text-purple-300">{a.hospital_id}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400 flex gap-4 flex-wrap">
                  <span>→ Scene: {a.travel_time_to_incident_minutes.toFixed(1)} min</span>
                  <span>→ Hospital: {a.travel_time_to_hospital_minutes.toFixed(1)} min</span>
                  <span className="font-semibold text-gray-200">
                    Total: {a.total_time_minutes.toFixed(1)} min
                  </span>
                </div>
                {a.rejected_hospitals.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Rejected:{' '}
                    {a.rejected_hospitals
                      .map((r) => `${r.hospital_id} (${r.reason})`)
                      .join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unserved */}
      {result.unserved_incidents.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-2">
            Unserved Incidents ({result.unserved_incidents.length})
          </h4>
          <div className="space-y-1">
            {result.unserved_incidents.map((u) => (
              <div
                key={u.incident_id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950 border border-red-900 text-xs"
              >
                <span className="font-mono font-bold text-red-300">{u.incident_id}</span>
                <span className="text-red-400">—</span>
                <span className="text-red-300">{u.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weights */}
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer hover:text-gray-300">
          Objective weights &amp; solver config
        </summary>
        <pre className="mt-2 bg-gray-800 rounded p-2 overflow-auto text-gray-400">
          {JSON.stringify(result.objective_weights, null, 2)}
        </pre>
      </details>
    </div>
  )
}
