# Q-ResQ 🚨⚛️

**Hybrid Classical-Quantum Emergency Response Coordination Platform**  
*Hackathon Prototype for Quantum AI & Software*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Google OR-Tools](https://img.shields.io/badge/Google%20OR--Tools-9.10-4285F4.svg?logo=google)](https://developers.google.com/optimization)
[![Qiskit](https://img.shields.io/badge/Qiskit-2.5.2-6929C4.svg?logo=qiskit)](https://qiskit.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![Pytest](https://img.shields.io/badge/Tests-15%20Passed-brightgreen.svg?logo=pytest)](https://pytest.org)

---

## 1. Executive Summary

During mass-casualty events or urban crises, emergency response coordination requires solving a multi-constraint combinatorial optimization problem:
1. Matching **patient clinical requirements** (cardiac defibrillation, advanced airway, trauma surgery) to **ambulance capabilities**.
2. Routing ambulances to appropriate **hospitals with verified capability and available bed capacity**.
3. Minimizing **fleet travel times across congested road networks** while prioritizing life-threatening emergencies.

**Q-ResQ** is a demonstrable hybrid system:
- **Production-Grade Classical Core**: Uses **Google OR-Tools CP-SAT** to solve the complete city-scale assignment problem with hard capability and capacity constraints, transparent urgency penalties, and dynamic re-optimization.
- **Quantum Simulation Experiment**: Formulates a focused 4-qubit emergency dispatch subproblem as a **Quadratic Unconstrained Binary Optimization (QUBO)** problem, translates it to an Ising Hamiltonian ($H_C$), and executes the **Quantum Approximate Optimization Algorithm (QAOA)** via **Qiskit** on a local statevector simulator.
- **Scientific Transparency**: Directly compares the quantum ansatz against the classical exact ground truth on identical inputs, analyzing circuit depth, gate counts, sampling probabilities, and explaining NISQ limitations without claiming premature quantum advantage.

---

## 2. System Architecture

```
                                  +-----------------------------------------------+
                                  |     Q-ResQ React + TypeScript Frontend        |
                                  | (Live Map, Fleet Registry, Disruption Studio, |
                                  |    OR-Tools Results & QAOA Circuit Bench)     |
                                  +-----------------------+-----------------------+
                                                          | HTTP REST (JSON)
                                                          v
                                  +-----------------------------------------------+
                                  |            FastAPI Python Backend             |
                                  +-------+-----------------------+---------------+
                                          |                       |
                    +---------------------+                       +---------------------+
                    v                                                                   v
     +------------------------------+                                    +------------------------------+
     |   Classical Optimization     |                                    |      Quantum Experiment      |
     |   (Google OR-Tools CP-SAT)   |                                    |       (Qiskit 2.5 + QAOA)    |
     +--------------+---------------+                                    +--------------+---------------+
                    |                                                                   |
                    v                                                                   v
  * Hard capability constraints                                        * 4-Qubit QUBO formulation
  * Hospital bed capacity bounds                                       * Ising Pauli operator mapping
  * Transparent urgency weights (P1/P2/P3)                             * Parameterized Ansatz (p layers)
  * Dynamic road re-routing via NetworkX                               * Classical COBYLA optimization
```

---

## 3. Core Capabilities

### Classical Engine (Google OR-Tools CP-SAT)
1. **Emergency Intake & Urgency Scoring**: Rule-based triage scoring categorizes incidents into `P1` (Critical), `P2` (Serious), and `P3` (Non-urgent) with explicit clinical rationale.
2. **Capability Matching**: Ambulances and hospitals must satisfy 100% of an incident's required clinical skills (e.g., `ALS`, `defibrillator`, `trauma_kit`, `stroke_unit`).
3. **Capacity Constraints**: Hospital bed limits are hard constraints. When a hospital reaches capacity, the solver rejects routing to that facility.
4. **Road Network Simulation**: 10-node directed graph with Dijkstra shortest-path travel times and dynamic congestion injection.
5. **Explainable Results**: Every optimization run details chosen assignments, scene arrival times, hospital transfer times, rejected alternatives with rejection reasons, and unserved incidents.

### Quantum Module (Qiskit QAOA Simulator)
1. **Mathematical QUBO Formulation**:
   Binary decision variables $x \in \{0, 1\}^4$:
   - $x_0$: Ambulance $A_0 \to$ Incident $I_0$
   - $x_1$: Ambulance $A_1 \to$ Incident $I_0$
   - $x_2$: Ambulance $A_0 \to$ Incident $I_1$
   - $x_3$: Ambulance $A_1 \to$ Incident $I_1$

   Objective to minimize:
   $$\min_{x} \sum_{k=0}^3 q_k x_k + P \Big( x_0 x_1 + x_2 x_3 + x_0 x_2 + x_1 x_3 \Big)$$
   where $q_k = \text{TravelTime}_k - \text{UrgencyReward}_k$, and $P$ is the constraint penalty multiplier.

2. **Ising Hamiltonian Mapping**:
   Using the operator substitution $x_i = \frac{I - Z_i}{2}$, the QUBO is mapped to a Pauli $Z$ Hamiltonian:
   $$H_C = \sum_{i} h_i Z_i + \sum_{i < j} J_{ij} Z_i Z_j + \text{offset} \cdot I$$
   verified to match QUBO state energies across all 16 computational basis states.

3. **QAOA Circuit Execution**:
   - Parameterized ansatz with $p$ layers ($2p$ variational parameters: $\gamma, \beta$).
   - Classical optimization of angles using COBYLA.
   - Circuit analysis: Qubit count (4), circuit depth, gate counts (`rz`, `rx`, `rzz`, `u`).
   - Ground truth comparison: Direct benchmark against exact brute-force classical state enumeration.

---

## 4. Scientific Realities & Limitations

To maintain absolute academic integrity, Q-ResQ highlights the following:
* **No Claim of Quantum Advantage**: On small or current problem sizes, classical algorithms (OR-Tools CP-SAT, Simplex, Branch-and-Cut) solve allocation problems in <1 millisecond with 100% mathematical optimality.
* **NISQ Physical Constraints**: On real quantum processors, two-qubit entangling gates ($R_{ZZ}$, $CX$) suffer from gate infidelities and environmental decoherence, causing state decay.
* **Scaling Bottlenecks**: QUBO formulations scale quadratically ($O(N^2)$ variables) for full multi-party assignments.
* **Role of QAOA in Emergency Dispatch**: This prototype demonstrates how emergency resource allocation problems can be formulated for future fault-tolerant quantum algorithms.

---

## 5. Technology Stack & Versions

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Backend** | Python | 3.10+ | Core server runtime |
| **Framework** | FastAPI | 0.111.0 | REST API engine & OpenAPI docs |
| **Classical Solver** | Google OR-Tools | 9.10.4067 | CP-SAT constraint optimization |
| **Quantum Framework** | Qiskit | 2.5.2 | Quantum circuits & Hamiltonian synthesis |
| **Quantum Algorithms** | Qiskit-Algorithms | 0.4.0 | QAOA implementation & COBYLA optimizer |
| **Network Graph** | NetworkX | 3.3 | Synthetic road network & Dijkstra routing |
| **Data Validation** | Pydantic | 2.7.1 | Strongly-typed schemas |
| **Persistence** | SQLite + SQLAlchemy | 2.0.30 | Local audit trail of optimization runs |
| **Frontend** | React + TypeScript | 18.3 / 5.4 | Interactive operations dashboard |
| **Build Tool** | Vite | 5.3.1 | Frontend dev server & production bundler |
| **Styling** | Tailwind CSS | 3.4.4 | Emergency operations UI styling |
| **Testing** | Pytest + HTTPX | 8.2.0 | Automated backend test suite |

---

## 6. Installation & Quick Start

### Prerequisites
* **Python**: 3.10, 3.11, or 3.12
* **Node.js**: v18+ and `npm`
* **Git**: 2.x

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/Q-ResQ.git
cd Q-ResQ
cp .env.example .env
```

### 2. Backend Setup
```bash
# Optional: create a virtual environment
python -m venv .venv

# Activate environment:
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 3. Run Backend Server
```bash
# From workspace root
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation: **http://localhost:8000/docs**

### 4. Frontend Setup & Run
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Web Dashboard will be available at: **http://localhost:5173**

---

## 7. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/scenario/load` | Reset and load demonstration scenario |
| `GET` | `/scenario/status` | Current entity counts |
| `GET` | `/scenario/network` | Road network topology with node coordinates and edge travel times |
| `POST` | `/scenario/update` | Mutate traffic delays, fleet availability, or hospital capacity |
| `GET` | `/incidents` | List emergency queue with urgency scores |
| `POST` | `/incidents` | Submit a new emergency incident |
| `GET` | `/ambulances` | List ambulances with location and status |
| `GET` | `/hospitals` | List hospitals with capabilities and bed capacity |
| `POST` | `/optimize` | Execute Google OR-Tools CP-SAT classical dispatch solver |
| `GET` | `/optimize/history` | Audit log of previous optimization runs |
| `GET` | `/quantum/info` | Quantum simulator specs and algorithm metadata |
| `POST` | `/quantum/experiment` | Execute 4-qubit QAOA circuit simulation and benchmark vs classical ground truth |

---

## 8. Repeatable Demonstration Walkthrough

Follow these steps for a live presentation or evaluation:

1. **Start Services**: Run backend on `:8000` and frontend on `:5173`. Open browser to `http://localhost:5173`.
2. **Load Scenario**: Click **"📂 Reset / Load Scenario"** in the header.
   - 3 Incidents appear: `INC-001` (Cardiac, severity 9/10, P1), `INC-002` (Trauma, severity 7/10, P2), `INC-003` (Stroke, severity 5/10, P2).
   - 2 Ambulances: `AMB-001` at node `N2`, `AMB-002` at node `N6`.
   - 3 Hospitals: `HOSP-A` at `N3` (2 beds), `HOSP-B` at `N7` (3 beds), `HOSP-C` at `N10` (1 bed).
3. **Execute Classical Optimization**: Click **"⚡ OR-Tools Solve"**.
   - Notice that with 3 incidents and 2 ambulances, the solver serves the 2 highest priority emergencies and explicitly flags 1 incident as unserved due to resource constraints.
4. **Inspect the City Road Map**: Click the **"City Road Map"** tab to view the spatial network topology.
5. **Inject Scenario Disruption**:
   - In the **Scenario Modifiers** tab (or via the map buttons), click **"🚧 Jam N2 ↔ N3 (40m)"**.
   - Observe the road turn red. The system triggers re-optimization, automatically re-routing ambulances to avoid the congested corridor.
   - Click **"Saturate (0)"** on `HOSP-A` to simulate hospital bed diversion. The solver rejects `HOSP-A` and re-allocates patients to `HOSP-B`.
6. **Execute Quantum QAOA Experiment**: Click the **"⚛️ QAOA Experiment"** tab.
   - Adjust QAOA depth ($p = 1$ or $2$) and optimizer iterations.
   - Click **"⚡ Run QAOA Experiment"**.
   - Review the side-by-side comparison:
     - Classical ground truth bitstring vs QAOA measured bitstring.
     - Circuit depth, gate counts (`rz`, `rx`, `rzz`), and optimal variational parameters ($\gamma, \beta$).
     - Read the scientific limitations box explaining NISQ hardware constraints.

---

## 9. Automated Test Suite

Run all automated unit and integration tests:

```bash
python -m pytest backend/tests/ -v
```

### Verified Test Cases (15/15 Passing):
* `test_health_check`: Verifies API health endpoint.
* `test_load_scenario`: Verifies demo scenario initialization.
* `test_feasible_allocation`: Tests valid OR-Tools dispatch assignment.
* `test_three_incidents_two_ambulances`: Confirms unserved demand handling when demand exceeds fleet size.
* `test_unavailable_ambulance`: Ensures off-duty ambulances are never assigned.
* `test_hospital_missing_capability`: Confirms that clinical capability mismatches prevent inappropriate dispatch.
* `test_hospital_no_capacity`: Verifies diversion when receiving hospitals have 0 bed capacity.
* `test_traffic_change_reoptimize`: Verifies dynamic re-routing upon traffic congestion.
* `test_invalid_severity`: Enforces Pydantic input validation (rejects invalid severity ratings).
* `test_infeasible_no_ambulances`: Validates graceful infeasibility handling when fleet is unavailable.
* `test_quantum_info`: Verifies Qiskit simulator metadata endpoint.
* `test_quantum_experiment_execution`: Verifies 4-qubit QUBO formulation, QAOA simulation, and classical comparison.
* `test_quantum_multi_reps`: Verifies multi-layer QAOA ($p=2$) variational parameter synthesis.
* `test_scenario_network_endpoint`: Validates road network coordinates and topology export.
* `test_traffic_update_affects_network`: Verifies that traffic mutations mark edges as congested.

---

## 10. Repository Cleanliness & Submission Checklist

- [x] No credentials, API tokens, or secrets committed.
- [x] `.gitignore` excludes `node_modules`, `__pycache__`, `.venv`, `.pytest_cache`, and SQLite databases (`*.db`).
- [x] `.env.example` provided for configuration.
- [x] Compatible and pinned package versions documented.
- [x] Frontend and backend run locally without external paid cloud dependencies.

---

*Built with passion for the Quantum AI & Software Hackathon.*