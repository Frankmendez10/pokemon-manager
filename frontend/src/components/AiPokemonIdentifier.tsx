import { useEffect, useRef, useState } from 'react'
import { identifyPokemonFromImage } from '../services/aiApi'

export interface IdentifiedPokemon {
  pokemon_name: string
  pokedex_number: number
  name: string
  type_1: string
  type_2: string | null
}

interface AiPokemonIdentifierProps {
  onIdentified?: (pokemon: IdentifiedPokemon) => void
  onAddToCollection?: (
    pokemon: IdentifiedPokemon,
  ) => Promise<void>
}

function AiPokemonIdentifier({
  onIdentified,
  onAddToCollection,
}: AiPokemonIdentifierProps) {
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null)

  const [result, setResult] =
    useState<IdentifiedPokemon | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [adding, setAdding] =
    useState(false)

  const [addedToCollection, setAddedToCollection] =
    useState(false)

  const [error, setError] =
    useState('')

  const fileInputRef =
    useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(selectedFile)

    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [selectedFile])

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    setError('')
    setResult(null)
    setAddedToCollection(false)

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      setError(
        'Selecciona un archivo de imagen válido.',
      )
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  function handleSelectImage() {
    if (!loading && !adding) {
      fileInputRef.current?.click()
    }
  }

  async function handleIdentify() {
    if (!selectedFile) {
      setError(
        'Selecciona una imagen primero.',
      )
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setAddedToCollection(false)

    try {
      const pokemon =
        await identifyPokemonFromImage(
          selectedFile,
        )

      setResult(pokemon)

      onIdentified?.(pokemon)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible identificar el Pokémon.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToCollection() {
    if (!result || !onAddToCollection) {
      return
    }

    setAdding(true)
    setError('')

    try {
      await onAddToCollection(result)

      setAddedToCollection(true)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo agregar el Pokémon a la colección.',
      )
    } finally {
      setAdding(false)
    }
  }

  function handleIdentifyAnother() {
    handleClear()
    }

  function handleClear() {
    if (loading || adding) {
      return
    }

    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError('')
    setAddedToCollection(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className="ai-pokemon-section">
      <div className="ai-pokemon-header">
        <div className="ai-pokemon-icon">
          ✨
        </div>

        <div>
          <h2>
            Identificar Pokémon con IA
          </h2>

          <p>
            Sube una imagen y Gemini
            identificará el Pokémon automáticamente.
          </p>
        </div>
      </div>

      <div className="ai-pokemon-content">
        {!selectedFile && (
          <button
            type="button"
            className="ai-pokemon-dropzone"
            onClick={handleSelectImage}
            disabled={loading || adding}
          >
            <span className="ai-pokemon-upload-icon">
              🖼️
            </span>

            <span className="ai-pokemon-dropzone-title">
              Selecciona una imagen
            </span>

            <span className="ai-pokemon-dropzone-description">
              Haz clic aquí para elegir una imagen
              de tu dispositivo
            </span>

            <span className="ai-pokemon-dropzone-formats">
              PNG, JPG, JPEG o WEBP
            </span>
          </button>
        )}

        <input
          ref={fileInputRef}
          id="pokemon-image"
          className="ai-pokemon-file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading || adding}
        />

        {selectedFile && previewUrl && (
          <div className="ai-pokemon-selected">
            <div className="ai-pokemon-preview">
              <img
                src={previewUrl}
                alt="Vista previa del Pokémon"
              />
            </div>

            <div className="ai-pokemon-file-info">
              <div>
                <span className="ai-pokemon-file-label">
                  Imagen seleccionada
                </span>

                <span className="ai-pokemon-file-name">
                  {selectedFile.name}
                </span>
              </div>

              <button
                type="button"
                className="ai-pokemon-change-button"
                onClick={handleSelectImage}
                disabled={loading || adding}
              >
                Cambiar imagen
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="ai-pokemon-error">
            <span>!</span>

            <p>{error}</p>
          </div>
        )}

        <div className="ai-pokemon-actions">
          <button
            type="button"
            className="ai-pokemon-identify-button"
            onClick={handleIdentify}
            disabled={
              loading ||
              adding ||
              !selectedFile ||
              addedToCollection
            }
          >
            {loading ? (
              <>
                <span className="ai-pokemon-spinner" />
                Analizando...
              </>
            ) : (
              <>
                <span>✨</span>
                Identificar Pokémon
              </>
            )}
          </button>

          {(selectedFile || result) && (
            <button
              type="button"
              className="ai-pokemon-clear-button"
              onClick={handleClear}
              disabled={loading || adding}
            >
              Limpiar
            </button>
          )}
        </div>

        {result && (
          <div className="ai-pokemon-result">
            <div className="ai-pokemon-result-header">
              <div className="ai-pokemon-result-icon">
                ✓
              </div>

              <div>
                <span>
                  Pokémon identificado
                </span>

                <h3>
                  {result.name}
                </h3>
              </div>
            </div>

            <div className="ai-pokemon-result-details">
              <div className="ai-pokemon-result-number">
                <span>Pokédex</span>

                <strong>
                  #
                  {result.pokedex_number
                    .toString()
                    .padStart(3, '0')}
                </strong>
              </div>

              <div className="ai-pokemon-result-types">
                <span>Tipo</span>

                <div className="types">
                  {result.type_1 && (
                    <span
                      className={`type type-${result.type_1}`}
                    >
                      {result.type_1}
                    </span>
                  )}

                  {result.type_2 && (
                    <span
                      className={`type type-${result.type_2}`}
                    >
                      {result.type_2}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!addedToCollection ? (
              <button
                type="button"
                className="ai-pokemon-add-button"
                onClick={handleAddToCollection}
                disabled={
                  adding ||
                  !onAddToCollection
                }
              >
                {adding ? (
                  <>
                    <span className="ai-pokemon-spinner" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <span>＋</span>
                    Agregar a mi colección
                  </>
                )}
              </button>
            ) : (
              <div className="ai-pokemon-added">
                <div className="ai-pokemon-added-message">
                <span>✓</span>
                Pokémon agregado a tu colección
                </div>

                <button
                type="button"
                className="ai-pokemon-another-button"
                onClick={handleIdentifyAnother}
                >
                Identificar otro Pokémon
                </button>
            </div>
            )}

            <p className="ai-pokemon-result-source">
              Los datos fueron obtenidos desde PokéAPI.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default AiPokemonIdentifier
