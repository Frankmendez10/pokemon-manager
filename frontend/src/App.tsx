import { useEffect, useState } from 'react'
import { getPokemon, type Pokemon } from './services/pokemonApi'

function App() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPokemon() {
      try {
        const data = await getPokemon()
        setPokemon(data)
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado',
        )
      } finally {
        setLoading(false)
      }
    }

    loadPokemon()
  }, [])

  if (loading) {
    return <h1>Cargando Pokémon...</h1>
  }

  if (error) {
    return <h1>Error: {error}</h1>
  }

  return (
    <main>
      <h1>Pokémon Manager</h1>

      <p>
        Pokémon registrados: <strong>{pokemon.length}</strong>
      </p>

      <ul>
        {pokemon.map((item) => (
          <li key={item.id}>
            #{item.pokedex_number} — {item.name}
            {' — '}
            {item.type_1}
            {item.type_2 ? ` / ${item.type_2}` : ''}
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App