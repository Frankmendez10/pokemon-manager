import { useState } from 'react'
import { importPokemon } from '../services/pokemonApi'
import type { Pokemon } from '../services/pokemon'

interface ImportPokemonProps {
  onImported: (pokemon: Pokemon) => void
}

export default function ImportPokemon({
  onImported,
}: ImportPokemonProps) {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.SubmitEvent) {
    event.preventDefault()

    const value = identifier.trim()

    if (!value) {
      setError('Ingresa un nombre o número de Pokédex.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const pokemon = await importPokemon(value)

      onImported(pokemon)
      setIdentifier('')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo importar el Pokémon.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="import-section">
      <div>
        <h3>Importar Pokémon</h3>
        <p>
          Busca un Pokémon por nombre o número de Pokédex.
        </p>
      </div>

      <form
        className="import-form"
        onSubmit={handleSubmit}
      >
        <input
          className="import-input"
          type="text"
          value={identifier}
          onChange={(event) =>
            setIdentifier(event.target.value)
          }
          placeholder="Ej. pikachu o 25"
          disabled={loading}
        />

        <button
          className="import-button"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </form>

      {error && (
        <div className="import-error">
          {error}
        </div>
      )}
    </section>
  )
}
