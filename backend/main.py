from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.pokemon import router as pokemon_router
from app.core.database import check_database_connection


app = FastAPI(
    title="Pokémon Manager API",
    description="API for managing Pokémon",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pokemon_router)


@app.get("/")
def root():
    return {
        "message": "Pokémon Manager API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    database_status = check_database_connection()

    return {
        "status": "healthy" if database_status else "unhealthy",
        "database": "connected" if database_status else "disconnected",
    }