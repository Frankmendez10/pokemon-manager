import { useEffect, useMemo, useState } from 'react'
import { getPokemon, deletePokemon, createPokemon } from './services/pokemonApi'
import type { Pokemon } from './services/pokemonApi'
import Login from './components/Login'
import ImportPokemon from './components/ImportPokemon'
import PokemonForm from './components/PokemonForm'
import { getAccessToken,} from './services/apiClient'
import { logout, restoreSession,} from './services/authApi'
import AiPokemonIdentifier, { type IdentifiedPokemon,} from './components/AiPokemonIdentifier'
import Register from "./components/Register";

function App() {
  const [token, setToken] = useState<string | null>( getAccessToken(), )
  const [sessionLoading, setSessionLoading] = useState(true)
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPokemonForm, setShowPokemonForm] = useState(false)
  const [editingPokemon, setEditingPokemon] = useState<Pokemon | null>(null)
  const [pokemonToDelete, setPokemonToDelete] = useState<Pokemon | null>(null)
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const currentToken = getAccessToken()

        if (currentToken) {
          setToken(currentToken)
          return
        }

        const newToken = await restoreSession()

        if (newToken) {
          setToken(newToken)
        } else {
          setToken(null)
        }
      } finally {
        setSessionLoading(false)
      }
    }

    restore()
  }, [])

  useEffect(() => {
    if (!token) {
      setPokemon([])
      setLoading(false)
      return
    }

    const loadPokemon = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getPokemon()

        setPokemon(data)
      } catch {
        setError(
          'No fue posible cargar los Pokémon.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadPokemon()
  }, [token])

  const filteredPokemon = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase()

    if (!normalizedSearch) {
      return pokemon
    }

    return pokemon.filter((item) => {
      return (
        item.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.pokedex_number
          .toString()
          .includes(normalizedSearch)
      )
    })
  }, [pokemon, search])

  function handleLogin(accessToken: string) {
    setToken(accessToken)
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setToken(null)
      setPokemon([])
      setSearch('')
      setError('')
      setShowPokemonForm(false)
      setEditingPokemon(null)
    }
  }

  async function handleAddAiPokemon(
    identifiedPokemon: IdentifiedPokemon,
  ) {
    setError('')

    const { pokemon: createdPokemon } =
      await createPokemon({
        pokedex_number:
          identifiedPokemon.pokedex_number,
        name: identifiedPokemon.name,
        type_1: identifiedPokemon.type_1,
        type_2: identifiedPokemon.type_2,
      })

    setPokemon((current) => [
      ...current,
      createdPokemon,
    ])
  }

  function handlePokemonImported(
    newPokemon: Pokemon,
  ) {
    setPokemon((current) => [
      ...current,
      newPokemon,
    ])
  }

 function handleDeletePokemon(
    selectedPokemon: Pokemon,
  ) {
    setPokemonToDelete(selectedPokemon)
  }

  async function confirmDeletePokemon() {
    if (!pokemonToDelete) {
      return
    }

    try {
      setError('')

      await deletePokemon(
        pokemonToDelete.id,
      )

      setPokemon((current) =>
        current.filter(
          (item) =>
            item.id !== pokemonToDelete.id,
        ),
      )

      setPokemonToDelete(null)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el Pokémon.',
      )
    }
  }

  function handleCreatePokemon() {
    setEditingPokemon(null)
    setShowPokemonForm(true)
  }

  function handleEditPokemon(
    selectedPokemon: Pokemon,
  ) {
    setEditingPokemon(selectedPokemon)
    setShowPokemonForm(true)
  }

  function handlePokemonSaved(
  savedPokemon: Pokemon,
) {
  setPokemon((current) => {
    const existingIndex = current.findIndex(
      (item) => item.id === savedPokemon.id,
    )

    if (existingIndex === -1) {
      return [...current, savedPokemon]
    }

    return current.map((item) =>
      item.id === savedPokemon.id
        ? savedPokemon
        : item,
    )
  })

  setShowPokemonForm(false)
  setEditingPokemon(null)
}

  function handlePokemonFormCancel() {
    setShowPokemonForm(false)
    setEditingPokemon(null)
  }

  if (sessionLoading) {
    return (
      <div className="state-message">
        <span className="spinner" />
        <p>Verificando sesión...</p>
      </div>
    )
  }

  if (!token) {
    return showRegister ? (
      <Register
        onBackToLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login
        onLogin={handleLogin}
        onRegister={() => setShowRegister(true)}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-brand">
          <span className="eyebrow">
            POKÉMON MANAGER
          </span>

          <h1>Pokémon Manager</h1>

          <p>
            Administra tu colección de Pokémon.
          </p>

          <div className="pokemon-counter">
            <strong>{pokemon.length}</strong>
            <span>registrados</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </header>

      <main>
        {pokemonToDelete && (
          <div className="pokemon-modal-overlay">
            <div
              className="pokemon-modal pokemon-delete-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-pokemon-title"
            >
              <div className="pokemon-delete-icon">
                !
              </div>

              <h3 id="delete-pokemon-title">
                ¿Eliminar Pokémon?
              </h3>

              <p>
                ¿Estás seguro de que deseas eliminar a{' '}
                <strong>
                  {pokemonToDelete.name}
                </strong>{' '}
                (#
                {pokemonToDelete.pokedex_number})?
              </p>

              <p>
                Esta acción no se puede deshacer.
              </p>

              <div className="pokemon-delete-actions">
                <button
                  type="button"
                  className="pokemon-modal-cancel"
                  onClick={() =>
                    setPokemonToDelete(null)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="pokemon-modal-delete"
                  onClick={confirmDeletePokemon}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
        {showPokemonForm ? (
          <PokemonForm
            pokemon={editingPokemon}
            onSaved={handlePokemonSaved}
            onCancel={handlePokemonFormCancel}
          />
        ) : (
          <>

            <AiPokemonIdentifier
              onAddToCollection={handleAddAiPokemon}
            />

            <ImportPokemon
              onImported={handlePokemonImported}
            />

            <section className="toolbar">
              <div>
                <h2>Mi colección</h2>

                <p>
                  {filteredPokemon.length} Pokémon
                  encontrados
                </p>
              </div>

              <button
                type="button"
                className="import-button"
                onClick={handleCreatePokemon}
              >
                Nuevo Pokémon
              </button>

              <input
                type="search"
                placeholder="Buscar por nombre o Pokédex..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </section>

            {loading && (
              <div className="state-message">
                <span className="spinner" />
                <p>Cargando Pokémon...</p>
              </div>
            )}

            {!loading && error && (
              <div className="state-message error">
                <p>{error}</p>
              </div>
            )}

            {!loading &&
              !error &&
              filteredPokemon.length === 0 && (
                <div className="state-message">
                  <p>
                    No se encontraron Pokémon.
                  </p>
                </div>
              )}

            {!loading &&
              !error &&
              filteredPokemon.length > 0 && (
                <section className="pokemon-grid">
                  {filteredPokemon.map((item) => (
                    <article
                      className="pokemon-card"
                      key={item.id}
                    >
                      <div className="card-top">
                        <span className="pokedex-number">
                          #
                          {item.pokedex_number
                            .toString()
                            .padStart(3, '0')}
                        </span>

                        <span className="card-id">
                          ID {item.id}
                        </span>
                      </div>

                      <div className="pokemon-card-image">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokedex_number}.png`}
                          alt={`Imagen de ${item.name}`}
                          loading="lazy"
                        />
                      </div>

                      <div className="pokemon-info">
                        <h3>{item.name}</h3>

                        <div className="types">
                          {item.type_1 && (
                            <span
                              className={`type type-${item.type_1}`}
                            >
                              {item.type_1}
                            </span>
                          )}

                          {item.type_2 && (
                            <span
                              className={`type type-${item.type_2}`}
                            >
                              {item.type_2}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pokemon-card-actions">
                        <button
                          type="button"
                          onClick={() =>
                            handleEditPokemon(item)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="pokemon-delete-button"
                          onClick={() =>
                            handleDeletePokemon(item)
                          }
                        >
                          Eliminar
                        </button>
                        
                      </div>
                    </article>
                  ))}
                </section>
              )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
