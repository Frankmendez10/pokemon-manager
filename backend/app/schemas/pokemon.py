from pydantic import BaseModel, ConfigDict, Field


class PokemonBase(BaseModel):
    pokedex_number: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=100)
    type_1: str = Field(min_length=1, max_length=50)
    type_2: str | None = Field(default=None, min_length=1, max_length=50)


class PokemonCreate(PokemonBase):
    pass


class PokemonUpdate(BaseModel):
    pokedex_number: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=1, max_length=100)
    type_1: str | None = Field(default=None, min_length=1, max_length=50)
    type_2: str | None = Field(default=None, min_length=1, max_length=50)


class PokemonResponse(PokemonBase):
    id: int

    model_config = ConfigDict(from_attributes=True)