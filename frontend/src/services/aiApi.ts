import { apiFetch } from './apiClient'

export interface IdentifiedPokemon {
  pokemon_name: string
  pokedex_number: number
  name: string
  type_1: string
  type_2: string | null
}

export async function identifyPokemonFromImage(
  image: File,
): Promise<IdentifiedPokemon> {
  const formData = new FormData()

  formData.append('image', image)

  const response = await apiFetch(
    '/ai/identify-pokemon',
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null)

    throw new Error(
      error?.detail ??
        'No fue posible identificar el Pokémon.',
    )
  }

  return response.json()
}