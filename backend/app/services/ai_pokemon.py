from app.services.gemini import (
    identify_pokemon_from_image,
)
from app.services.pokeapi import (
    get_pokemon_from_pokeapi,
    map_pokemon_data,
)


def identify_pokemon_with_data(
    image_bytes: bytes,
    mime_type: str,
) -> dict:
    pokemon_name = identify_pokemon_from_image(
        image_bytes,
        mime_type,
    )

    pokemon_data = get_pokemon_from_pokeapi(
        pokemon_name
    )

    mapped_data = map_pokemon_data(
        pokemon_data
    )

    return {
        "pokemon_name": pokemon_name,
        **mapped_data,
    }