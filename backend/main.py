from fastapi import FastAPI

from app.api.routes.pokemon import router as pokemon_router
from app.core.database import check_database_connection


app = FastAPI(
    title="Pokémon Manager API",
    description="API for managing Pokémon",
    version="1.0.0",
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