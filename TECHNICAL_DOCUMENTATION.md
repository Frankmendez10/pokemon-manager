# Documentación técnica — Pokémon Manager

## 1. Arquitectura general

Pokémon Manager sigue una arquitectura cliente-servidor clásica:

- **Frontend**: SPA en React + TypeScript (Vite), consume la API vía `fetch`.
- **Backend**: API REST en FastAPI (Python), organizada por capas (rutas → servicios → modelos).
- **Base de datos**: PostgreSQL, accedida mediante SQLAlchemy (ORM, estilo `Mapped`/`mapped_column`).
- **Integraciones externas**:
  - **PokéAPI**: fuente oficial de datos de Pokémon (tipos, número de Pokédex).
  - **Google Gemini**: identificación de Pokémon a partir de una imagen.

```
┌─────────────┐      HTTP/JSON      ┌─────────────┐
│   Frontend   │ ───────────────────▶│   Backend    │
│ React + TS   │◀─────────────────── │   FastAPI    │
└─────────────┘                     └──────┬───────┘
                                            │
                             ┌──────────────┼──────────────┐
                             ▼              ▼              ▼
                       PostgreSQL       PokéAPI         Gemini
```

## 2. Estructura del backend

```
backend/app/
├── api/routes/
│   ├── auth.py       # Registro, login, refresh, logout, /me
│   ├── pokemon.py    # CRUD + importación desde PokéAPI
│   └── ai.py          # Identificación por imagen
├── core/
│   ├── database.py    # Engine, sesión, health check
│   └── security.py    # JWT, hashing de contraseñas, dependencia get_current_user
├── models/
│   ├── user.py
│   └── pokemon.py
├── schemas/
│   ├── user.py
│   └── pokemon.py
└── services/
    ├── auth.py         # Lógica de registro / autenticación
    ├── pokemon.py       # Lógica de negocio de Pokémon (CRUD, importación)
    ├── pokeapi.py        # Cliente HTTP hacia PokéAPI
    ├── gemini.py          # Cliente de Gemini para identificación
    └── ai_pokemon.py       # Orquesta Gemini + PokéAPI
```

La separación en capas (`routes` → `services` → `models`) mantiene las rutas delgadas: cada endpoint valida entrada/salida y delega la lógica de negocio a la capa de servicios, lo que facilita testear esa lógica de forma aislada.

## 3. Estructura del frontend

```
frontend/src/
├── App.tsx                     # Estado global de la app y layout principal
├── components/
│   ├── Login.tsx                # Formulario de login
│   ├── PokemonForm.tsx           # Alta/edición manual de Pokémon
│   ├── ImportPokemon.tsx          # Importación por número/nombre desde PokéAPI
│   └── AiPokemonIdentifier.tsx     # Identificación por foto (Gemini)
└── services/
    ├── apiClient.ts              # fetch autenticado + renovación automática de token
    ├── authApi.ts                 # login, logout, restoreSession
    ├── pokemonApi.ts               # CRUD de Pokémon
    └── aiApi.ts                     # Llamada al endpoint de identificación por IA
```

El estado de la colección y de sesión vive en `App.tsx` (sin librería de estado global), y cada componente recibe callbacks para comunicar cambios hacia arriba (patrón "lifting state up").

## 4. Autenticación

- Se usa **JWT** con dos tokens:
  - **Access token**: vida corta (60 minutos), se guarda en memoria en el frontend (variable de módulo en `apiClient.ts`), se envía en el header `Authorization: Bearer`.
  - **Refresh token**: vida larga (7 días), se guarda en una cookie `HttpOnly` (no accesible desde JavaScript), y se usa para obtener un nuevo access token sin volver a pedir credenciales.
- `apiFetch` (en `apiClient.ts`) intercepta respuestas `401`, intenta renovar el access token automáticamente contra `/auth/refresh` y reintenta la petición original una sola vez.
- Las contraseñas se hashean con `pwdlib` (`PasswordHash.recommended()`) antes de guardarse; nunca se almacenan en texto plano.
- Todos los endpoints de Pokémon e IA requieren un usuario autenticado (`Depends(get_current_user)`).

## 5. Persistencia

- ORM: SQLAlchemy 2.x con `Mapped`/`mapped_column`.
- Entidades: `User` (username, email, hashed_password, is_active) y `Pokemon` (pokedex_number único, name, type_1, type_2).
- Las tablas se crean automáticamente al iniciar la app (`create_tables()` en `main.py`), útil para desarrollo; en un entorno productivo se recomendaría reemplazar esto por migraciones versionadas (p. ej. Alembic).

## 6. API REST

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/auth/register` | Registro de usuario | No |
| POST | `/auth/login` | Login, retorna access token y setea cookie de refresh | No |
| POST | `/auth/refresh` | Renueva el access token usando la cookie de refresh | Cookie |
| POST | `/auth/logout` | Elimina la cookie de refresh | No |
| GET | `/auth/me` | Datos del usuario autenticado | Sí |
| GET | `/pokemon/` | Lista la colección | Sí |
| POST | `/pokemon/` | Crea un Pokémon (usa PokéAPI si el número existe, si no usa los datos enviados) | Sí |
| POST | `/pokemon/import/{identifier}` | Importa un Pokémon por número o nombre desde PokéAPI | Sí |
| GET | `/pokemon/{id}` | Obtiene un Pokémon por id | Sí |
| PUT | `/pokemon/{id}` | Actualiza un Pokémon | Sí |
| DELETE | `/pokemon/{id}` | Elimina un Pokémon | Sí |
| POST | `/ai/identify-pokemon` | Identifica un Pokémon a partir de una imagen | Sí |
| GET | `/health` | Verifica el estado de la app y la conexión a la base de datos | No |

La documentación interactiva (Swagger) se genera automáticamente por FastAPI en `/docs`.

## 7. Integración con PokéAPI

`services/pokeapi.py` encapsula las llamadas HTTP (`httpx`) hacia PokéAPI y traduce sus errores a excepciones propias del dominio (`PokemonNotFoundError`, `PokeAPITimeoutError`, `PokeAPIConnectionError`), que luego las rutas transforman en códigos HTTP apropiados (404, 504, 502). `map_pokemon_data` normaliza la respuesta de PokéAPI al modelo interno (`pokedex_number`, `name`, `type_1`, `type_2`).

Al crear un Pokémon manualmente, el backend primero intenta enriquecer los datos consultando PokéAPI por el número de Pokédex; si no lo encuentra, usa los datos proporcionados por el usuario. Esto se comunica al frontend mediante el header `X-Pokemon-Source: pokeapi`.

## 8. Identificación por IA

`services/gemini.py` envía la imagen al modelo de Gemini con un prompt restringido para devolver únicamente el nombre del Pokémon en minúsculas (o `unknown`). `services/ai_pokemon.py` orquesta el flujo completo: Gemini identifica el nombre → se consulta PokéAPI con ese nombre → se devuelve al frontend el Pokémon ya mapeado, listo para agregarse a la colección.

## 9. Manejo de errores

- El backend traduce excepciones de dominio a códigos HTTP semánticos (409 para conflictos de datos, 404 para no encontrado, 502/504 para fallos de PokéAPI, 422 para fallos de identificación de IA).
- El frontend centraliza el parseo de errores de la API (`error?.detail`) en cada función de `services/`, y los muestra en la UI mediante estados de error por componente.

## 10. Testing

- Framework: `pytest` + `TestClient` de FastAPI.
- `conftest.py` crea y destruye el esquema en una base de datos de test dedicada (`pokemon_manager_test`) en cada test, y autentica un usuario de prueba automáticamente para el cliente de test.
- Cobertura actual: **16 tests** — health check, y CRUD completo de Pokémon (creación, lectura, actualización, borrado y validaciones de conflicto).

## 11. Seguridad

Puntos ya cubiertos:
- Contraseñas hasheadas (nunca en texto plano).
- Refresh token en cookie `HttpOnly` (mitiga robo vía XSS).
- Endpoints de datos protegidos con autenticación JWT.
- Validación de entrada con Pydantic (longitudes, tipos, `EmailStr`).

Puntos a mejorar (ver auditoría en la sección de mensajes del chat, no incluidos en este documento por ser tareas pendientes y no características ya implementadas):
- Externalizar `SECRET_KEY` y `DATABASE_URL` a variables de entorno.
- Rotar y externalizar la API key de Gemini.
- Servir la cookie de refresh con `secure=True` en producción (HTTPS).

## 12. Posibles mejoras futuras

- Migraciones de base de datos con Alembic en lugar de `create_all` automático.
- Paginación en `GET /pokemon/`.
- Roles de usuario (admin vs usuario estándar).
- Rate limiting en los endpoints de autenticación y de IA.
- Tests automatizados en el frontend (actualmente solo se valida el build de producción).
