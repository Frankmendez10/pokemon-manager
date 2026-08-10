from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.pokemon import Pokemon
from app.schemas.pokemon import PokemonCreate, PokemonUpdate
from app.services.pokeapi import (
    get_pokemon_from_pokeapi,
    map_pokemon_data,
)

def get_pokemon(db: Session) -> list[Pokemon]:
    statement = select(Pokemon).order_by(Pokemon.pokedex_number)
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
) -> Pokemon:
    existing_pokemon = get_pokemon_by_pokedex_number(
        db,
        pokemon_data.pokedex_number,
    )

    if existing_pokemon is not None:
        raise ValueError(
            "A Pokémon with this Pokédex number already exists"
        )

    pokemon = Pokemon(**pokemon_data.model_dump())

    db.add(pokemon)
    db.commit()
    db.refresh(pokemon)

    return pokemon

def update_pokemon(
    db: Session,
    pokemon: Pokemon,
    pokemon_data: PokemonUpdate,
) -> Pokemon:
    update_data = pokemon_data.model_dump(exclude_unset=True)

    if "pokedex_number" in update_data:
        existing_pokemon = get_pokemon_by_pokedex_number(
            db,
            update_data["pokedex_number"],
        )

        if (
            existing_pokemon is not None
            and existing_pokemon.id != pokemon.id
        ):
            raise ValueError(
                "A Pokémon with this Pokédex number already exists"
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

    mapped_data = map_pokemon_data(pokemon_data)

    pokemon_create = PokemonCreate(**mapped_data)

    return create_pokemon(db, pokemon_create)