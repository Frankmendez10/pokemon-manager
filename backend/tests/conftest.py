import os
import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.models.user import User
from app.models.pokemon import Pokemon
from main import app


TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    raise RuntimeError(
        "TEST_DATABASE_URL no está configurada. "
        "Agrégala a backend/.env (ver backend/.env.example)."
    )


engine = create_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True,
)


TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        # Crear usuario de prueba
        register_response = test_client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "TestPassword123!",
            },
        )

        assert register_response.status_code == 201

        # Obtener JWT mediante el endpoint real de login
        login_response = test_client.post(
            "/auth/login",
            data={
                "username": "testuser",
                "password": "TestPassword123!",
            },
        )

        assert login_response.status_code == 200

        access_token = login_response.json()["access_token"]

        # Autenticar automáticamente todas las peticiones
        test_client.headers.update(
            {
                "Authorization": f"Bearer {access_token}",
            }
        )

        yield test_client

    app.dependency_overrides.clear()
