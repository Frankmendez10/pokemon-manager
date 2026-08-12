from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from app.core.security import get_current_user
from app.models.user import User

from app.services.ai_pokemon import (
    identify_pokemon_with_data,
)

from app.services.gemini import (
    GeminiError,
    GeminiIdentificationError,
)

from app.services.pokeapi import (
    PokemonNotFoundError,
    PokeAPITimeoutError,
    PokeAPIConnectionError,
)


router = APIRouter(
    prefix="/ai",
    tags=["IA"],
)


@router.post("/identify-pokemon")
async def identify_pokemon(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not image.content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo determinar el tipo de archivo.",
        )

    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser una imagen.",
        )

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen está vacía.",
        )

    mime_type = image.content_type

    try:
        pokemon_data = identify_pokemon_with_data(
            image_bytes,
            mime_type,
        )

        return pokemon_data

    except GeminiIdentificationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )

    except GeminiError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
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