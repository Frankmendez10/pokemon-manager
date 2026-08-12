import { useEffect, useState } from 'react'
import {
  createPokemon,
  updatePokemon,
} from '../services/pokemonApi'
import type {
  Pokemon,
  PokemonCreate,
  PokemonUpdate,
} from '../services/pokemonApi'

interface PokemonFormProps {
  pokemon?: Pokemon | null
  onSaved: (pokemon: Pokemon) => void
  onCancel?: () => void
}

function PokemonForm({
  pokemon,
  onSaved,
  onCancel,
}: PokemonFormProps) {
  const isEditing =
    pokemon !== null &&
    pokemon !== undefined

  const [pokedexNumber, setPokedexNumber] =
    useState('')
  const [name, setName] = useState('')
  const [type1, setType1] = useState('')
  const [type2, setType2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showPokeApiMessage, setShowPokeApiMessage] =
    useState(false)

  const [savedPokemon, setSavedPokemon] =
    useState<Pokemon | null>(null)

  useEffect(() => {
    if (pokemon) {
      setPokedexNumber(
        pokemon.pokedex_number.toString(),
      )

      setName(pokemon.name)
      setType1(pokemon.type_1 ?? '')
      setType2(pokemon.type_2 ?? '')
    } else {
      setPokedexNumber('')
      setName('')
      setType1('')
      setType2('')
    }

    setError('')
    setShowPokeApiMessage(false)
    setSavedPokemon(null)
  }, [pokemon])

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    setError('')

    const parsedPokedexNumber =
      Number(pokedexNumber)

    if (
      !Number.isInteger(parsedPokedexNumber) ||
      parsedPokedexNumber <= 0
    ) {
      setError(
        'El número de Pokédex debe ser un número entero mayor que 0.',
      )
      return
    }

    if (!name.trim()) {
      setError(
        'El nombre del Pokémon es obligatorio.',
      )
      return
    }

    if (!type1.trim()) {
      setError(
        'El tipo principal es obligatorio.',
      )
      return
    }

    setLoading(true)

    try {
      if (isEditing) {
        const updateData: PokemonUpdate = {
          pokedex_number:
            parsedPokedexNumber,
          name: name.trim(),
          type_1: type1.trim(),
          type_2:
            type2.trim() || null,
        }

        const updatedPokemon =
          await updatePokemon(
            pokemon.id,
            updateData,
          )

        onSaved(updatedPokemon)
      } else {
        const createData: PokemonCreate = {
          pokedex_number:
            parsedPokedexNumber,
          name: name.trim(),
          type_1: type1.trim(),
          type_2:
            type2.trim() || null,
        }

        const result =
          await createPokemon(createData)

        setSavedPokemon(result.pokemon)

        if (result.foundInPokeApi) {
          setShowPokeApiMessage(true)
        } else {
          onSaved(result.pokemon)
        }
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : isEditing
            ? 'No se pudo actualizar el Pokémon.'
            : 'No se pudo crear el Pokémon.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handlePokeApiMessageAccept() {
    if (!savedPokemon) {
      return
    }

    onSaved(savedPokemon)

    setShowPokeApiMessage(false)
    setSavedPokemon(null)
  }

  return (
    <section className="pokemon-form-section">
      <div className="pokemon-form-header">
        <div>
          <h2>
            {isEditing
              ? 'Editar Pokémon'
              : 'Crear Pokémon'}
          </h2>

          <p>
            {isEditing
              ? 'Actualiza la información del Pokémon.'
              : 'Agrega un nuevo Pokémon a tu colección.'}
          </p>
        </div>
      </div>

      <form
        className="pokemon-form"
        onSubmit={handleSubmit}
      >
        <div className="pokemon-form-grid">
          <div className="pokemon-form-field">
            <label htmlFor="pokedex-number">
              Número de Pokédex
            </label>

            <input
              id="pokedex-number"
              type="number"
              min="1"
              value={pokedexNumber}
              onChange={(event) =>
                setPokedexNumber(
                  event.target.value,
                )
              }
              disabled={
                loading || isEditing
              }
              required
            />
          </div>

          <div className="pokemon-form-field">
            <label htmlFor="pokemon-name">
              Nombre
            </label>

            <input
              id="pokemon-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              disabled={
                loading || isEditing
              }
              maxLength={100}
              required
            />
          </div>

          <div className="pokemon-form-field">
            <label htmlFor="pokemon-type-1">
              Tipo principal
            </label>

            <input
              id="pokemon-type-1"
              type="text"
              value={type1}
              onChange={(event) =>
                setType1(event.target.value)
              }
              disabled={loading}
              maxLength={50}
              required
            />
          </div>

          <div className="pokemon-form-field">
            <label htmlFor="pokemon-type-2">
              Tipo secundario
            </label>

            <input
              id="pokemon-type-2"
              type="text"
              value={type2}
              onChange={(event) =>
                setType2(event.target.value)
              }
              disabled={loading}
              maxLength={50}
            />
          </div>
        </div>

        {error && (
          <div className="pokemon-form-error">
            <p>{error}</p>
          </div>
        )}

        <div className="pokemon-form-actions">
          {onCancel && (
            <button
              type="button"
              className="pokemon-form-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            className="pokemon-form-submit"
            disabled={loading}
          >
            {loading
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear Pokémon'}
          </button>
        </div>
      </form>

      {showPokeApiMessage && (
        <div className="pokemon-modal-overlay">
          <div
            className="pokemon-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pokemon-modal-title"
          >
            <div className="pokemon-modal-icon">
              ✓
            </div>

            <h3 id="pokemon-modal-title">
              Pokémon encontrado en PokéAPI
            </h3>

            <p>
                El número de Pokédex introducido corresponde a un
                Pokémon existente en PokéAPI.
              </p>

              <p>
                El número de Pokédex #
                {savedPokemon?.pokedex_number} corresponde a{' '}
                <strong>{savedPokemon?.name}</strong>, por lo
                que se guardó el Pokémon encontrado con sus
                datos oficiales.
              </p>

            <button
              type="button"
              className="pokemon-modal-button"
              onClick={
                handlePokeApiMessageAccept
              }
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default PokemonForm