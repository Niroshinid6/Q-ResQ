import { useState } from 'react'
import type {
  QuantumExperimentResult,
  QuantumExperimentRequest,
} from '../types'
import { api } from '../lib/api'

interface Props {
  scenarioLoaded: boolean
}

export function QuantumDashboard({ scenarioLoaded }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QuantumExperimentResult | null>(null)

  // Experiment parameters
  const [reps, setReps] = useState<number>(1)
  const [maxIter, setMaxIter] = useState<number>(25)
  const [penaltyMultiplier, setPenaltyMultiplier] = useState<number>(25.0)

  const handleRunExperiment = async () => {
    if (!scenarioLoaded) {
      setError('Please load the demonstration scenario first.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const params: QuantumExperimentRequest = {
        reps,
        max_iter: maxIter,
        penalty_multiplier: penaltyMultiplier,
      }
      const res = await api.runQuantumExperiment(params)
      setResult(res.data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown quantum execution error'
      setError(`Quantum experiment failed: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="card bg-gradient-to-r from-purple-950/40 via-gray-900 to-blue-950/40 border-purple-900/60 p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⚛️</span>
              <h2 className="text-base font-bold text-white">
                Qiskit QAOA Quantum Dispatch Experiment
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700">
                Statevector Simulator
              </span>
            </div>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              Formulates an exact Quadratic Unconstrained Binary Optimization (QUBO) dispatch
              subproblem mapped to an Ising Hamiltonian ($H_C$). Executes the Quantum Approximate
              Optimization Algorithm (QAOA) on an ideal local quantum simulator and benchmarks it
              directly against the classical ground-truth baseline.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunExperiment}
              disabled={loading || !scenarioLoaded}
              className="btn-primary bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 text-xs px-4 py-2 flex items-center gap-2 shadow-lg shadow-purple-950/50"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⚛️</span> Simulating Circuit...
                </>
              ) : (
                <>
                  <span>⚡</span> Run QAOA Experiment
                </>
              )}
            </button>
          </div>
        </div>

        {/* Experiment Parameters */}
        <div className="mt-4 pt-4 border-t border-gray-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-gray-400 block mb-1 font-medium">
              QAOA Circuit Depth ($p$ layers): <span className="text-purple-300 font-bold">{reps}</span>
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={reps}
              onChange={(e) => setReps(Number(e.target.value))}
              disabled={loading}
              className="w-full accent-purple-500 bg-gray-800 rounded cursor-pointer"
            />
            <span className="text-[10px] text-gray-500">
              Depth determines variational parameter count ($2p$)
            </span>
          </div>

          <div>
            <label className="text-gray-400 block mb-1 font-medium">
              Classical Optimizer Iterations: <span className="text-purple-300 font-bold">{maxIter}</span>
            </label>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={maxIter}
              onChange={(e) => setMaxIter(Number(e.target.value))}
              disabled={loading}
              className="w-full accent-purple-500 bg-gray-800 rounded cursor-pointer"
            />
            <span className="text-[10px] text-gray-500">
              COBYLA parameter optimization steps
            </span>
          </div>

          <div>
            <label className="text-gray-400 block mb-1 font-medium">
              Penalty Multiplier $P$: <span className="text-purple-300 font-bold">{penaltyMultiplier}</span>
            </label>
            <input
              type="range"
              min="15"
              max="50"
              step="5"
              value={penaltyMultiplier}
              onChange={(e) => setPenaltyMultiplier(Number(e.target.value))}
              disabled={loading}
              className="w-full accent-purple-500 bg-gray-800 rounded cursor-pointer"
            />
            <span className="text-[10px] text-gray-500">
              Hard constraint enforcement barrier in QUBO
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Side-by-Side Comparison */}
          <div>
            <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
              <span>⚖️</span> Quantum vs. Classical Benchmark (Identical 4-Qubit Inputs)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Classical Baseline Card */}
              <div className="card bg-gray-900 border-gray-700">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-400 font-bold text-sm">Classical Baseline</span>
                    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-mono">
                      Exact State Enumeration
                    </span>
                  </div>
                  <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                    ✓ Feasible
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-800/60">
                    <span className="text-gray-400">Optimal Bitstring:</span>
                    <span className="font-mono font-bold text-green-300 text-sm">
                      {result.classical_baseline.optimal_bitstring}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800/60">
                    <span className="text-gray-400">Ground-Truth Objective Energy:</span>
                    <span className="font-mono font-bold text-gray-100">
                      {result.classical_baseline.objective_value.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800/60">
                    <span className="text-gray-400">Execution Wall Time:</span>
                    <span className="font-mono text-gray-200">
                      {result.classical_baseline.runtime_ms.toFixed(2)} ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Decoded Assignments:</span>
                    <div className="space-y-1">
                      {result.classical_baseline.assignments.map((a, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-800/80 px-2 py-1 rounded text-[11px] font-mono text-blue-200 border border-gray-700 flex justify-between"
                        >
                          <span>{a.ambulance_id}</span>
                          <span className="text-gray-500">→</span>
                          <span>{a.incident_id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantum QAOA Card */}
              <div className="card bg-purple-950/20 border-purple-800/80">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-purple-900/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-purple-300 font-bold text-sm">Qiskit QAOA</span>
                    <span className="text-[10px] bg-purple-900/60 text-purple-200 border border-purple-700 px-1.5 py-0.5 rounded font-mono">
                      Ansatz $p={reps}$
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold flex items-center gap-1 ${
                      result.quantum_qaoa.is_feasible ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {result.quantum_qaoa.is_feasible ? '✓ Feasible' : '✗ Infeasible'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-purple-900/40">
                    <span className="text-gray-400">Measured Best Bitstring:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-300 text-sm">
                        {result.quantum_qaoa.measured_bitstring}
                      </span>
                      {result.comparison.is_exact_match ? (
                        <span className="text-[10px] px-1.5 py-0.2 bg-green-950 text-green-300 rounded border border-green-800">
                          Exact Match
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 bg-yellow-950 text-yellow-300 rounded border border-yellow-800">
                          Δ {result.comparison.energy_gap.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-purple-900/40">
                    <span className="text-gray-400">Measured Objective Energy:</span>
                    <span className="font-mono font-bold text-gray-100">
                      {result.quantum_qaoa.measured_energy.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-purple-900/40">
                    <span className="text-gray-400">State Sampling Probability:</span>
                    <span className="font-mono font-bold text-purple-200">
                      {(result.quantum_qaoa.success_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-purple-900/40">
                    <span className="text-gray-400">Quantum Simulator Runtime:</span>
                    <span className="font-mono text-gray-200">
                      {result.quantum_qaoa.runtime_ms.toFixed(1)} ms
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Decoded Assignments:</span>
                    <div className="space-y-1">
                      {result.quantum_qaoa.assignments.map((a, idx) => (
                        <div
                          key={idx}
                          className="bg-purple-900/30 px-2 py-1 rounded text-[11px] font-mono text-purple-200 border border-purple-800/60 flex justify-between"
                        >
                          <span>{a.ambulance_id}</span>
                          <span className="text-gray-500">→</span>
                          <span>{a.incident_id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Circuit Metadata & Variational Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h4 className="text-xs font-bold text-gray-200 mb-2 flex items-center gap-1.5">
                <span>🔧</span> Quantum Circuit Architecture
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-gray-800 border border-gray-700/60">
                  <span className="text-gray-400 text-[11px]">Qubit Count:</span>
                  <p className="font-mono font-bold text-gray-100 text-sm">
                    {result.quantum_qaoa.circuit_stats.num_qubits} Qubits
                  </p>
                </div>
                <div className="p-2 rounded bg-gray-800 border border-gray-700/60">
                  <span className="text-gray-400 text-[11px]">Circuit Depth:</span>
                  <p className="font-mono font-bold text-gray-100 text-sm">
                    {result.quantum_qaoa.circuit_stats.depth}
                  </p>
                </div>
                <div className="p-2 rounded bg-gray-800 border border-gray-700/60">
                  <span className="text-gray-400 text-[11px]">Variational Parameters:</span>
                  <p className="font-mono font-bold text-gray-100 text-sm">
                    {result.quantum_qaoa.circuit_stats.num_parameters} ($\gamma, \beta$)
                  </p>
                </div>
                <div className="p-2 rounded bg-gray-800 border border-gray-700/60">
                  <span className="text-gray-400 text-[11px]">Gate Decomposition:</span>
                  <p className="font-mono text-xs text-purple-300 truncate">
                    {Object.entries(result.quantum_qaoa.circuit_stats.gate_counts)
                      .map(([k, v]) => `${k}:${v}`)
                      .join(' ')}
                  </p>
                </div>
              </div>

              {/* Variational Angles */}
              <div className="mt-3 pt-2 border-t border-gray-800 text-[11px] font-mono text-gray-400">
                <p>
                  Optimal $\gamma$: [{result.quantum_qaoa.optimal_gamma.join(', ')}]
                </p>
                <p>
                  Optimal $\beta$: [{result.quantum_qaoa.optimal_beta.join(', ')}]
                </p>
              </div>
            </div>

            {/* Problem Formulation & QUBO Mapping */}
            <div className="card">
              <h4 className="text-xs font-bold text-gray-200 mb-2 flex items-center gap-1.5">
                <span>📐</span> QUBO Formulation &amp; Variables
              </h4>
              <div className="space-y-1.5 text-xs">
                {result.problem_formulation.variables.map((v) => (
                  <div
                    key={v.var}
                    className="flex justify-between items-center py-1 px-2 rounded bg-gray-800/60 border border-gray-700/40 text-[11px]"
                  >
                    <span className="font-mono font-bold text-purple-300">{v.var}</span>
                    <span className="text-gray-400">
                      {v.ambulance} ➔ {v.incident}
                    </span>
                    <span className="font-mono text-gray-300">{v.travel_time_min.toFixed(1)}m</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2 italic">
                Ising Hamiltonian transformation: $x_i = (I - Z_i)/2$. Constraints encoded as
                quadratic penalty $P(x_i x_j)$.
              </p>
            </div>
          </div>

          {/* Scientific Transparency & Limitations Notice */}
          <div className="card bg-gray-900 border-yellow-900/60 p-4">
            <h4 className="text-xs font-bold text-yellow-300 mb-2 flex items-center gap-1.5">
              <span>⚠️</span> Scientific Transparency, Realities &amp; Limitations
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300 list-disc list-inside leading-relaxed">
              {result.limitations_and_realities.map((item, idx) => (
                <li key={idx} className="text-[11px] text-gray-400">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
