# Pokémon Manager

Aplicación web full-stack para gestionar una colección personal de Pokémon, con autenticación de usuarios, integración con PokéAPI e identificación de Pokémon mediante IA (Gemini).

## Features

- Autenticación con JWT (access token + refresh token en cookie HttpOnly)
- CRUD completo de Pokémon
- Búsqueda por nombre o número de Pokédex
- Importación automática de datos desde [PokéAPI](https://pokeapi.co/)
- Identificación de Pokémon a partir de una foto, usando IA (Gemini)
- Persistencia en PostgreSQL
- API REST documentada con Swagger/OpenAPI
- Tests automatizados en el backend

## Arquitectura

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | FastAPI (Python) |
| Base de datos | PostgreSQL (SQLAlchemy ORM) |
| API externa | PokéAPI |
| IA | Google Gemini |
| Autenticación | JWT (access + refresh token) |

Para más detalle sobre decisiones técnicas, ver [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md).

## Requisitos previos

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Una API key de [Google Gemini](https://ai.google.dev/)

## Configuración

1. Clona el repositorio y entra a la carpeta del proyecto.
2. Crea las bases de datos en PostgreSQL (una para desarrollo y otra para tests, si vas a correr la suite de pruebas):

   ```sql
   CREATE DATABASE pokemon_manager;
   CREATE DATABASE pokemon_manager_test;
   CREATE USER pokemon_user WITH PASSWORD 'tu_password';
   GRANT ALL PRIVILEGES ON DATABASE pokemon_manager TO pokemon_user;
   GRANT ALL PRIVILEGES ON DATABASE pokemon_manager_test TO pokemon_user;
   ```

3. Copia el archivo de variables de entorno de ejemplo y complétalo con tus propios valores:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Variables requeridas en `backend/.env`:

   | Variable | Descripción |
   |---|---|
   | `DATABASE_URL` | Cadena de conexión a PostgreSQL (desarrollo) |
   | `TEST_DATABASE_URL` | Cadena de conexión a PostgreSQL (usada solo al correr `pytest`) |
   | `GEMINI_API_KEY` | API key de Google Gemini |
   | `SECRET_KEY` | Clave secreta para firmar los JWT (usa un valor largo y aleatorio) |

## Ejecución manual

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

La API quedará disponible en `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend quedará disponible en `http://localhost:5173`.

## URLs de la aplicación

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger / documentación interactiva | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

## Tests

Backend:

```bash
cd backend
pytest
```

- **Backend tests:** 16 passed (autenticación, health check y CRUD de Pokémon)

Frontend:

```bash
cd frontend
npm run build
```

- **Frontend production build:** passed

## Estructura del proyecto

```
pokemon-manager/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # Endpoints (auth, pokemon, ai)
│   │   ├── core/              # Configuración, base de datos, seguridad
│   │   ├── models/            # Modelos SQLAlchemy
│   │   ├── schemas/           # Schemas Pydantic
│   │   └── services/          # Lógica de negocio e integraciones
│   ├── tests/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/
│       └── services/
├── README.md
└── TECHNICAL_DOCUMENTATION.md
```

## Licencia

Proyecto de portafolio con fines demostrativos.
