from app.services.pokeapi import (
    PokemonNotFoundError,
    PokeAPITimeoutError,
    PokeAPIConnectionError,
)

def test_list_pokemon_empty(client):
    response = client.get("/pokemon/")

    assert response.status_code == 200
    assert response.json() == []

def test_create_pokemon(client):
    pokemon_data = {
        "pokedex_number": 25,
        "name": "Pikachu",
        "type_1": "Electric",
        "type_2": None,
    }

    response = client.post("/pokemon/", json=pokemon_data)

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["pokedex_number"] == 25
    assert data["name"] == "Pikachu"
    assert data["type_1"] == "Electric"
    assert data["type_2"] is None

def test_get_pokemon_by_id(client):
    pokemon_data = {
        "pokedex_number": 25,
        "name": "Pikachu",
        "type_1": "Electric",
        "type_2": None,
    }

    create_response = client.post("/pokemon/", json=pokemon_data)

    assert create_response.status_code == 201

    pokemon_id = create_response.json()["id"]

    response = client.get(f"/pokemon/{pokemon_id}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == pokemon_id
    assert data["name"] == "Pikachu"
    assert data["pokedex_number"] == 25

def test_get_pokemon_not_found(client):
    response = client.get("/pokemon/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Pokémon not found"

def test_create_pokemon_invalid_data(client):
    pokemon_data = {
        "pokedex_number": 0,
        "name": "",
        "type_1": "",
        "type_2": None,
    }

    response = client.post("/pokemon/", json=pokemon_data)

    assert response.status_code == 422

def test_create_pokemon_duplicate_pokedex_number(client):
    pokemon_data = {
        "pokedex_number": 25,
        "name": "Pikachu",
        "type_1": "Electric",
        "type_2": None,
    }

    first_response = client.post("/pokemon/", json=pokemon_data)

    assert first_response.status_code == 201

    duplicate_response = client.post("/pokemon/", json=pokemon_data)

    assert duplicate_response.status_code == 409
    assert "already exists" in duplicate_response.json()["detail"]

def test_update_pokemon(client):
    pokemon_data = {
        "pokedex_number": 25,
        "name": "Pikachu",
        "type_1": "Electric",
        "type_2": None,
    }

    create_response = client.post("/pokemon/", json=pokemon_data)

    assert create_response.status_code == 201

    pokemon_id = create_response.json()["id"]

    update_data = {
        "name": "Raichu",
        "type_1": "Electric",
    }

    response = client.put(
        f"/pokemon/{pokemon_id}",
        json=update_data,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == pokemon_id
    assert data["name"] == "Raichu"
    assert data["type_1"] == "Electric"
    assert data["pokedex_number"] == 25

def test_update_pokemon_not_found(client):
    update_data = {
        "name": "Raichu",
    }

    response = client.put(
        "/pokemon/999999",
        json=update_data,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Pokémon not found"

def test_update_pokemon_duplicate_pokedex_number(client):
    pikachu = {
        "pokedex_number": 25,
        "name": "Pikachu",
        "type_1": "Electric",
        "type_2": None,
    }

    charmander = {
        "pokedex_number": 4,
        "name": "Charmander",
        "type_1": "Fire",
        "type_2": None,
    }

    pikachu_response = client.post("/pokemon/", json=pikachu)
    charmander_response = client.post("/pokemon/", json=charmander)

    assert pikachu_response.status_code == 201
    assert charmander_response.status_code == 201

    charmander_id = charmander_response.json()["id"]

    response = client.put(
        f"/pokemon/{charmander_id}",
        json={"pokedex_number": 25},
    )

    assert response.status_code == 409

def test_delete_pokemon(client):
    pokemon_data = {
        "pokedex_number": 25,
        "name": "Pikachu",
        "type_1": "Electric",
        "type_2": None,
    }

    create_response = client.post("/pokemon/", json=pokemon_data)

    assert create_response.status_code == 201

    pokemon_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/pokemon/{pokemon_id}"
    )

    assert delete_response.status_code == 204

    get_response = client.get(
        f"/pokemon/{pokemon_id}"
    )

    assert get_response.status_code == 404

def test_delete_pokemon_not_found(client):
    response = client.delete("/pokemon/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Pokémon not found"

def test_import_pokemon_from_pokeapi(client, monkeypatch):
    pokeapi_response = {
        "id": 150,
        "name": "mewtwo",
        "types": [
            {
                "slot": 1,
                "type": {
                    "name": "psychic",
                },
            },
        ],
    }

    def mock_get_pokemon_from_pokeapi(pokemon_identifier):
        assert pokemon_identifier == "150"
        return pokeapi_response

    monkeypatch.setattr(
        "app.services.pokemon.get_pokemon_from_pokeapi",
        mock_get_pokemon_from_pokeapi,
    )

    response = client.post("/pokemon/import/150")

    assert response.status_code == 201

    data = response.json()

    assert data["pokedex_number"] == 150
    assert data["name"] == "mewtwo"
    assert data["type_1"] == "psychic"
    assert data["type_2"] is None

def test_import_pokemon_not_found(client, monkeypatch):
    def mock_get_pokemon_from_pokeapi(pokemon_identifier):
        raise PokemonNotFoundError(
            "Pokémon not found in PokéAPI"
        )

    monkeypatch.setattr(
        "app.services.pokemon.get_pokemon_from_pokeapi",
        mock_get_pokemon_from_pokeapi,
    )

    response = client.post("/pokemon/import/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Pokémon not found in PokéAPI"


def test_import_pokemon_timeout(client, monkeypatch):
    def mock_get_pokemon_from_pokeapi(pokemon_identifier):
        raise PokeAPITimeoutError(
            "PokéAPI request timed out"
        )

    monkeypatch.setattr(
        "app.services.pokemon.get_pokemon_from_pokeapi",
        mock_get_pokemon_from_pokeapi,
    )

    response = client.post("/pokemon/import/25")

    assert response.status_code == 504
    assert response.json()["detail"] == "PokéAPI request timed out"


def test_import_pokemon_connection_error(client, monkeypatch):
    def mock_get_pokemon_from_pokeapi(pokemon_identifier):
        raise PokeAPIConnectionError(
            "Unable to connect to PokéAPI"
        )

    monkeypatch.setattr(
        "app.services.pokemon.get_pokemon_from_pokeapi",
        mock_get_pokemon_from_pokeapi,
    )

    response = client.post("/pokemon/import/25")

    assert response.status_code == 502
    assert response.json()["detail"] == "Unable to connect to PokéAPI"