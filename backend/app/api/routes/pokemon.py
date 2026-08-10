from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.pokemon import (
    PokemonCreate,
    PokemonResponse,
    PokemonUpdate,
)
from app.services.pokeapi import (
    PokemonNotFoundError,
    PokeAPITimeoutError,
    PokeAPIConnectionError,
)

from app.services.pokemon import (
    create_pokemon,
    delete_pokemon,
    get_pokemon,
    get_pokemon_by_id as get_pokemon_service_by_id,
    import_pokemon_from_pokeapi,
    update_pokemon,
)

router = APIRouter(
    prefix="/pokemon",
    tags=["Pokémon"],
)


@router.get("/", response_model=list[PokemonResponse])
def list_pokemon(db: Session = Depends(get_db)):
    return get_pokemon(db)


@router.post(
    "/",
    response_model=PokemonResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_pokemon(
    pokemon_data: PokemonCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_pokemon(db, pokemon_data)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )


@router.post(
    "/import/{pokemon_identifier}",
    response_model=PokemonResponse,
    status_code=status.HTTP_201_CREATED,
)
def import_pokemon(
    pokemon_identifier: int | str,
    db: Session = Depends(get_db),
):
    try:
        return import_pokemon_from_pokeapi(
            db,
            pokemon_identifier,
        )

    except PokemonNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    except PokeAPITimeoutError as error:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(error),
        )

    except PokeAPIConnectionError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )


@router.get("/{pokemon_id}", response_model=PokemonResponse)
def get_pokemon_by_id(
    pokemon_id: int,
    db: Session = Depends(get_db),
):
    pokemon = get_pokemon_service_by_id(db, pokemon_id)

    if pokemon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pokémon not found",
        )

    return pokemon


@router.put("/{pokemon_id}", response_model=PokemonResponse)
def edit_pokemon(
    pokemon_id: int,
    pokemon_data: PokemonUpdate,
    db: Session = Depends(get_db),
):
    pokemon = get_pokemon_service_by_id(db, pokemon_id)

    if pokemon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pokémon not found",
        )

    try:
        return update_pokemon(db, pokemon, pokemon_data)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )


@router.delete(
    "/{pokemon_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_pokemon(
    pokemon_id: int,
    db: Session = Depends(get_db),
):
    pokemon = get_pokemon_service_by_id(db, pokemon_id)

    if pokemon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pokémon not found",
        )

    delete_pokemon(db, pokemon)