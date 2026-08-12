import jwt

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Response,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_current_user,
)
from app.models.user import User
from app.schemas.user import (
    Token,
    UserCreate,
    UserResponse,
)
from app.services.auth import authenticate_user, create_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_user(db, user_data)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )


@router.post(
    "/login",
    response_model=Token,
)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        db,
        form_data.username,
        form_data.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},
    )

    refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post(
    "/refresh",
    response_model=Token,
)
def refresh_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if refresh_token is None:
        raise credentials_exception

    try:
        payload = decode_refresh_token(refresh_token)

        if payload.get("type") != "refresh":
            print("ERROR: token type incorrecto")
            raise credentials_exception

        user_id = payload.get("sub")

        if user_id is None:
            print("ERROR: user_id no existe")
            raise credentials_exception

        user_id = int(user_id)

    except jwt.InvalidTokenError as error:
        print("ERROR JWT:", error)
        raise credentials_exception

    except ValueError as error:
        print("ERROR VALUE:", error)
        raise credentials_exception

    user = db.get(User, user_id)

    if user is None or not user.is_active:
        raise credentials_exception

    access_token = create_access_token(
        data={"sub": str(user.id)},
    )

    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
    )

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="refresh_token",
    )

    return {
        "message": "Successfully logged out",
    }

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user
