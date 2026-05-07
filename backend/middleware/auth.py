from fastapi import Request, HTTPException, Depends
from firebase_admin import auth


async def verificar_token(request: Request):
    """
    Middleware para verificar o token JWT do Firebase.
    O token deve ser enviado no header Authorization: Bearer <token>
    """
    authorization = request.headers.get("Authorization")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Token de autenticação não fornecido."
        )

    token = authorization.split("Bearer ")[1]

    try:
        decoded_token = auth.verify_id_token(token)
        request.state.user_id = decoded_token["uid"]
        request.state.user_email = decoded_token.get("email", "")
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token expirado. Faça login novamente."
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido."
        )
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Erro ao verificar autenticação."
        )
