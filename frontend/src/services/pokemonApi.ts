export interface Pokemon {
  id: number
  pokedex_number: number
  name: string
  type_1: string | null
  type_2: string | null
}

const API_URL = 'http://127.0.0.1:8000'

export async function getPokemon(): Promise<Pokemon[]> {
  const response = await fetch(`${API_URL}/pokemon/`)

  if (!response.ok) {
    throw new Error('No se pudieron obtener los Pokémon')
  }

  return response.json()
}