from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.pokemon import Pokemon
from app.schemas.pokemon import PokemonCreate, PokemonUpdate
from app.services.pokeapi import (
    PokemonNotFoundError,
    PokeAPITimeoutError,
    PokeAPIConnectionError,
    get_pokemon_from_pokeapi,
    map_pokemon_data,
)


def get_pokemon(db: Session) -> list[Pokemon]:
    statement = select(Pokemon).order_by(
        Pokemon.pokedex_number
    )

    return list(db.scalars(statement).all())


def get_pokemon_by_id(
    db: Session,
    pokemon_id: int,
) -> Pokemon | None:
    return db.get(Pokemon, pokemon_id)


def get_pokemon_by_pokedex_number(
    db: Session,
    pokedex_number: int,
) -> Pokemon | None:
    statement = select(Pokemon).where(
        Pokemon.pokedex_number == pokedex_number
    )

    return db.scalar(statement)


def create_pokemon(
    db: Session,
    pokemon_data: PokemonCreate,
) -> tuple[Pokemon, bool]:
    found_in_pokeapi = False

    # Primero verificamos si el Pokémon existe en PokéAPI.
    try:
        pokeapi_data = get_pokemon_from_pokeapi(
            pokemon_data.pokedex_number
        )

        # Si existe, utilizamos sus datos oficiales.
        mapped_data = map_pokemon_data(
            pokeapi_data
        )

        found_in_pokeapi = True

    except PokemonNotFoundError:
        # Si no existe en PokéAPI, utilizamos los datos
        # proporcionados manualmente.
        mapped_data = pokemon_data.model_dump()

    except PokeAPITimeoutError as error:
        raise error

    except PokeAPIConnectionError as error:
        raise error

    # Verificamos si el número de Pokédex ya existe
    # en nuestra base de datos.
    existing_pokemon = get_pokemon_by_pokedex_number(
        db,
        mapped_data["pokedex_number"],
    )

    if existing_pokemon is not None:
        raise ValueError(
            "Este número de Pokédex ya existe "
            "en nuestra colección."
        )

    pokemon = Pokemon(**mapped_data)

    db.add(pokemon)
    db.commit()
    db.refresh(pokemon)

    return pokemon, found_in_pokeapi


def update_pokemon(
    db: Session,
    pokemon: Pokemon,
    pokemon_data: PokemonUpdate,
) -> Pokemon:
    update_data = pokemon_data.model_dump(
        exclude_unset=True
    )

    if "pokedex_number" in update_data:
        existing_pokemon = (
            get_pokemon_by_pokedex_number(
                db,
                update_data["pokedex_number"],
            )
        )

        if (
            existing_pokemon is not None
            and existing_pokemon.id != pokemon.id
        ):
            raise ValueError(
                "Ya existe un Pokémon con ese "
                "número de Pokédex"
            )

    for field, value in update_data.items():
        setattr(pokemon, field, value)

    db.commit()
    db.refresh(pokemon)

    return pokemon


def delete_pokemon(
    db: Session,
    pokemon: Pokemon,
) -> None:
    db.delete(pokemon)
    db.commit()


def import_pokemon_from_pokeapi(
    db: Session,
    pokemon_identifier: int | str,
) -> Pokemon:
    pokemon_data = get_pokemon_from_pokeapi(
        pokemon_identifier
    )

    mapped_data = map_pokemon_data(
        pokemon_data
    )

    pokemon_create = PokemonCreate(
        **mapped_data
    )

    pokemon, _ = create_pokemon(
        db,
        pokemon_create,
    )

    return pokemon