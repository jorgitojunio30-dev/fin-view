import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json
import sys

# Inicializa Firebase Admin SDK
# Em produção (Render): defina FIREBASE_CREDENTIALS_JSON com o conteúdo do JSON
# Em desenvolvimento: usa o arquivo firebase-credentials.json local

firebase_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
caminho_credenciais = os.getenv(
    "FIREBASE_CREDENTIALS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "firebase-credentials.json")
)

if not firebase_admin._apps:
    if firebase_json:
        try:
            cred_dict = json.loads(firebase_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase inicializado via FIREBASE_CREDENTIALS_JSON")
        except json.JSONDecodeError as e:
            print(f"ERRO FATAL: FIREBASE_CREDENTIALS_JSON contém JSON inválido: {e}", file=sys.stderr)
            raise
        except Exception as e:
            print(f"ERRO FATAL: Falha ao inicializar Firebase com FIREBASE_CREDENTIALS_JSON: {e}", file=sys.stderr)
            raise
    elif os.path.exists(caminho_credenciais):
        try:
            cred = credentials.Certificate(caminho_credenciais)
            firebase_admin.initialize_app(cred)
            print(f"Firebase inicializado via arquivo: {caminho_credenciais}")
        except Exception as e:
            print(f"ERRO FATAL: Falha ao inicializar Firebase com arquivo de credenciais: {e}", file=sys.stderr)
            raise
    else:
        print(
            "ERRO FATAL: Nenhuma credencial Firebase encontrada.\n"
            "  - Em produção: defina a variável FIREBASE_CREDENTIALS_JSON\n"
            f"  - Em desenvolvimento: crie o arquivo {caminho_credenciais}",
            file=sys.stderr
        )
        raise RuntimeError("Credenciais Firebase não configuradas")

db = firestore.client()
