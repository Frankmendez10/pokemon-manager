import { apiFetch } from './apiClient'

export interface Pokemon {
  id: number
  pokedex_number: number
  name: string
  type_1: string
  type_2: string | null
}

export interface PokemonCreate {
  pokedex_number: number
  name: string
  type_1: string
  type_2?: string | null
}

export interface PokemonUpdate {
  pokedex_number?: number
  name?: string
  type_1?: string
  type_2?: string | null
}

export async function getPokemon(): Promise<Pokemon[]> {
  const response = await apiFetch('/pokemon/')

  if (!response.ok) {
    throw new Error(
      'No se pudieron obtener los Pokémon',
    )
  }

  return response.json()
}

export async function getPokemonById(
  id: number,
): Promise<Pokemon> {
  const response = await apiFetch(
    `/pokemon/${id}`,
  )

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null)

    throw new Error(
      error?.detail ??
        'No se pudo obtener el Pokémon',
    )
  }

  return response.json()
}

export interface CreatePokemonResult {
  pokemon: Pokemon
  foundInPokeApi: boolean
}

export async function createPokemon(
  pokemon: PokemonCreate,
): Promise<CreatePokemonResult> {
  const response = await apiFetch('/pokemon/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pokemon),
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null)

    throw new Error(
      error?.detail ??
        'No se pudo crear el Pokémon',
    )
  }

  const createdPokemon: Pokemon =
    await response.json()

  const foundInPokeApi =
    response.headers.get(
      'X-Pokemon-Source',
    ) === 'pokeapi'

  return {
    pokemon: createdPokemon,
    foundInPokeApi,
  }
}

export async function updatePokemon(
  id: number,
  pokemon: PokemonUpdate,
): Promise<Pokemon> {
  const response = await apiFetch(
    `/pokemon/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pokemon),
    },
  )

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null)

    throw new Error(
      error?.detail ??
        'No se pudo actualizar el Pokémon',
    )
  }

  return response.json()
}

export async function deletePokemon(
  id: number,
): Promise<void> {
  const response = await apiFetch(
    `/pokemon/${id}`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null)

    throw new Error(
      error?.detail ??
        'No se pudo eliminar el Pokémon',
    )
  }
}

export async function importPokemon(
  identifier: string,
): Promise<Pokemon> {
  const response = await apiFetch(
    `/pokemon/import/${encodeURIComponent(
      identifier,
    )}`,
    {
      method: 'POST',
    },
  )

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null)

    throw new Error(
      error?.detail ??
        'No se pudo importar el Pokémon',
    )
  }

  return response.json()
}