import type { RoadNetworkDetails, Incident, Ambulance, Hospital } from '../types'

interface Props {
  network: RoadNetworkDetails | null
  incidents: Incident[]
  ambulances: Ambulance[]
  hospitals: Hospital[]
  onTrafficChange?: (fromNode: string, toNode: string, minutes: number) => void
}

export function RoadNetworkMap({
  network,
  incidents,
  ambulances,
  hospitals,
  onTrafficChange,
}: Props) {
  if (!network) {
    return (
      <div className="card text-center py-8 text-gray-500 text-sm">
        Road network topology not loaded. Click &quot;Load Scenario&quot;.
      </div>
    )
  }

  // Pre-index entities by location node
  const nodeEntities: Record<
    string,
    { incidents: Incident[]; ambulances: Ambulance[]; hospitals: Hospital[] }
  > = {}

  network.nodes.forEach((n) => {
    nodeEntities[n.id] = { incidents: [], ambulances: [], hospitals: [] }
  })

  incidents.forEach((i) => {
    if (nodeEntities[i.location_node]) {
      nodeEntities[i.location_node].incidents.push(i)
    }
  })

  ambulances.forEach((a) => {
    if (nodeEntities[a.location_node]) {
      nodeEntities[a.location_node].ambulances.push(a)
    }
  })

  hospitals.forEach((h) => {
    if (nodeEntities[h.location_node]) {
      nodeEntities[h.location_node].hospitals.push(h)
    }
  })

  // Group bidirectional edges to avoid rendering overlapping arrows
  const drawnEdges: { from: string; to: string; x1: number; y1: number; x2: number; y2: number; time: number; base: number; isCongested: boolean }[] = []
  const edgeSet = new Set<string>()

  const nodeMap = new Map(network.nodes.map((n) => [n.id, n]))

  network.edges.forEach((edge) => {
    const key = [edge.from_node, edge.to_node].sort().join('-')
    if (!edgeSet.has(key)) {
      edgeSet.add(key)
      const u = nodeMap.get(edge.from_node)
      const v = nodeMap.get(edge.to_node)
      if (u && v) {
        drawnEdges.push({
          from: edge.from_node,
          to: edge.to_node,
          x1: u.x,
          y1: u.y,
          x2: v.x,
          y2: v.y,
          time: edge.travel_time_min,
          base: edge.baseline_travel_time_min,
          isCongested: edge.is_congested,
        })
      }
    }
  })

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-200">City Road Network Topology (10 Nodes)</h3>
          <p className="text-xs text-gray-400">
            Dijkstra-routed synthetic graph · Red edges represent injected traffic congestion
          </p>
        </div>

        {/* Quick Traffic Presets */}
        {onTrafficChange && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTrafficChange('N2', 'N3', 30.0)}
              className="text-xs px-2.5 py-1 rounded bg-orange-950 border border-orange-800 text-orange-200 hover:bg-orange-900 transition-colors"
              title="Set N2-N3 corridor travel time to 30 min"
            >
              🚧 Jam N2 ↔ N3 (30m)
            </button>
            <button
              onClick={() => onTrafficChange('N1', 'N2', 45.0)}
              className="text-xs px-2.5 py-1 rounded bg-red-950 border border-red-800 text-red-200 hover:bg-red-900 transition-colors"
              title="Set N1-N2 corridor travel time to 45 min"
            >
              🚧 Jam N1 ↔ N2 (45m)
            </button>
            <button
              onClick={() => {
                onTrafficChange('N2', 'N3', 3.0)
                onTrafficChange('N1', 'N2', 2.0)
              }}
              className="text-xs px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
              title="Restore standard speed (60 km/h baseline)"
            >
              ↺ Reset Traffic
            </button>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full bg-gray-950/70 border border-gray-800 rounded-xl overflow-hidden p-2 flex items-center justify-center">
        <svg viewBox="20 20 440 500" className="w-full max-w-2xl h-auto select-none">
          {/* Edges */}
          {drawnEdges.map((e, idx) => {
            const midX = (e.x1 + e.x2) / 2
            const midY = (e.y1 + e.y2) / 2
            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={e.x1}
                  y1={e.y1}
                  x2={e.x2}
                  y2={e.y2}
                  stroke={e.isCongested ? '#ef4444' : '#374151'}
                  strokeWidth={e.isCongested ? 3.5 : 2}
                  strokeDasharray={e.isCongested ? '4 2' : 'none'}
                  className="transition-all"
                />
                {/* Edge Travel Time Badge */}
                <rect
                  x={midX - 18}
                  y={midY - 8}
                  width="36"
                  height="16"
                  rx="4"
                  fill={e.isCongested ? '#7f1d1d' : '#1f2937'}
                  stroke={e.isCongested ? '#ef4444' : '#4b5563'}
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={midY + 3.5}
                  textAnchor="middle"
                  fill={e.isCongested ? '#fecaca' : '#9ca3af'}
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {e.time.toFixed(0)}m
                </text>
              </g>
            )
          })}

          {/* Nodes */}
          {network.nodes.map((node) => {
            const entities = nodeEntities[node.id] || { incidents: [], ambulances: [], hospitals: [] }
            const hasInc = entities.incidents.length > 0
            const hasAmb = entities.ambulances.length > 0
            const hasHosp = entities.hospitals.length > 0

            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                {/* Node Outer Ring */}
                <circle
                  r="18"
                  fill={hasInc ? '#450a0a' : hasHosp ? '#3b0764' : hasAmb ? '#172554' : '#111827'}
                  stroke={hasInc ? '#ef4444' : hasHosp ? '#a855f7' : hasAmb ? '#3b82f6' : '#4b5563'}
                  strokeWidth="2"
                />

                {/* Node ID */}
                <text
                  textAnchor="middle"
                  y="4"
                  fill="#f3f4f6"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.id}
                </text>

                {/* Entity Pills */}
                {hasInc && (
                  <g transform="translate(0, -22)">
                    <rect x="-14" y="-8" width="28" height="13" rx="3" fill="#dc2626" />
                    <text textAnchor="middle" y="1" fill="#fff" fontSize="7.5" fontWeight="bold">
                      INC ({entities.incidents.length})
                    </text>
                  </g>
                )}
                {hasAmb && (
                  <g transform="translate(-18, 16)">
                    <rect x="-11" y="-6" width="22" height="12" rx="3" fill="#2563eb" />
                    <text textAnchor="middle" y="2.5" fill="#fff" fontSize="7" fontWeight="bold">
                      AMB
                    </text>
                  </g>
                )}
                {hasHosp && (
                  <g transform="translate(18, 16)">
                    <rect x="-12" y="-6" width="24" height="12" rx="3" fill="#9333ea" />
                    <text textAnchor="middle" y="2.5" fill="#fff" fontSize="7" fontWeight="bold">
                      HOSP
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Map Legend */}
      <div className="flex items-center justify-between text-xs text-gray-400 flex-wrap gap-3 pt-1 border-t border-gray-800">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Incident Location
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Ambulance Station
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" /> Receiving Hospital
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-500 inline-block" /> Congested Road Corridor
          </span>
        </div>
      </div>
    </div>
  )
}
