import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import health, incidents, ambulances, hospitals, optimize, quantum


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Q-ResQ API",
    description="Emergency Response Coordination with OR-Tools and Qiskit QAOA Optimization",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
app.include_router(ambulances.router, prefix="/ambulances", tags=["ambulances"])
app.include_router(hospitals.router, prefix="/hospitals", tags=["hospitals"])
app.include_router(optimize.router, tags=["optimization"])
app.include_router(quantum.router, prefix="/quantum", tags=["quantum"])
