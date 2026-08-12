import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

class GeminiError(Exception):
    """Base exception for Gemini errors."""


class GeminiIdentificationError(GeminiError):
    """Raised when Gemini cannot identify a Pokémon."""


def identify_pokemon_from_image(
    image_bytes: bytes,
    mime_type: str,
) -> str:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise GeminiError(
            "GEMINI_API_KEY no está configurada."
        )

    client = genai.Client(api_key=api_key)

    prompt = """
Identify the Pokémon shown in this image.

Return ONLY the Pokémon's name in lowercase.
Do not return explanations, punctuation, JSON,
or any additional text.

If the image does not clearly contain a Pokémon,
return exactly:

unknown
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type,
                ),
                prompt,
            ],
        )
    except Exception as error:
        raise GeminiIdentificationError(
            "No fue posible analizar la imagen con Gemini."
        ) from error

    pokemon_name = response.text.strip().lower()

    if not pokemon_name or pokemon_name == "unknown":
        raise GeminiIdentificationError(
            "No se pudo identificar un Pokémon en la imagen."
        )

    return pokemon_name