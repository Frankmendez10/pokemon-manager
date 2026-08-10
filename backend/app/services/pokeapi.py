import httpx

POKEAPI_BASE_URL = "https://pokeapi.co/api/v2"


class PokeAPIError(Exception):
    """Base exception for PokéAPI errors."""


class PokemonNotFoundError(PokeAPIError):
    """Raised when a Pokémon does not exist in PokéAPI."""


class PokeAPITimeoutError(PokeAPIError):
    """Raised when PokéAPI request times out."""


class PokeAPIConnectionError(PokeAPIError):
    """Raised when PokéAPI cannot be reached."""


def get_pokemon_from_pokeapi(
    pokemon_identifier: int | str,
) -> dict:
    url = f"{POKEAPI_BASE_URL}/pokemon/{pokemon_identifier}"

    try:
        response = httpx.get(url, timeout=10.0)

    except httpx.TimeoutException as error:
        raise PokeAPITimeoutError(
            "PokéAPI request timed out"
        ) from error

    except httpx.RequestError as error:
        raise PokeAPIConnectionError(
            "Unable to connect to PokéAPI"
        ) from error

    if response.status_code == 404:
        raise PokemonNotFoundError(
            "Pokémon not found in PokéAPI"
        )

    response.raise_for_status()

    return response.json()


def map_pokemon_data(pokemon_data: dict) -> dict:
    types = pokemon_data.get("types", [])

    type_1 = None
    type_2 = None

    for pokemon_type in types:
        slot = pokemon_type.get("slot")
        type_name = pokemon_type.get("type", {}).get("name")

        if slot == 1:
            type_1 = type_name
        elif slot == 2:
            type_2 = type_name

    return {
        "pokedex_number": pokemon_data["id"],
        "name": pokemon_data["name"],
        "type_1": type_1,
        "type_2": type_2,
    }