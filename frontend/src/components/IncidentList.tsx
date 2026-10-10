import type { Incident } from '../types'

interface Props {
  incidents: Incident[]
}

const urgencyClass: Record<string, string> = {
  P1: 'badge-p1',
  P2: 'badge-p2',
  P3: 'badge-p3',
}

export function IncidentList({ incidents }: Props) {
  if (incidents.length === 0) {
    return <p className="text-gray-500 text-sm">No incidents loaded.</p>
  }

  return (
    <div className="space-y-2">
      {incidents.map((inc) => (
        <div key={inc.id} className="card flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-gray-200">{inc.id}</span>
              <span className={urgencyClass[inc.urgency] ?? 'badge-p3'}>{inc.urgency}</span>
              <span className="text-gray-500 text-xs capitalize">{inc.incident_type}</span>
            </div>
            <p className="text-xs text-gray-400">
              Node: <span className="text-gray-200">{inc.location_node}</span> · Severity:{' '}
              <span className="text-gray-200">{inc.reported_severity}/10</span>
            </p>
            <p className="text-xs text-gray-500 mt-1 italic">{inc.urgency_rationale}</p>
            {inc.required_capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {inc.required_capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded px-1.5 py-0.5 text-xs bg-gray-800 text-gray-300 border border-gray-700"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
