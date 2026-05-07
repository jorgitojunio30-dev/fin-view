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
            # O Render às vezes escapa as aspas — tenta limpar antes de parsear
            firebase_json_clean = firebase_json.strip()
            cred_dict = json.loads(firebase_json_clean)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase inicializado via FIREBASE_CREDENTIALS_JSON", flush=True)
        except json.JSONDecodeError as e:
            print(f"ERRO FATAL: FIREBASE_CREDENTIALS_JSON contém JSON inválido: {e}", file=sys.stderr, flush=True)
            print(f"Primeiros 100 chars da variável: {firebase_json[:100]!r}", file=sys.stderr, flush=True)
            raise
        except Exception as e:
            print(f"ERRO FATAL: Falha ao inicializar Firebase com FIREBASE_CREDENTIALS_JSON: {e}", file=sys.stderr, flush=True)
            raise
    elif os.path.exists(caminho_credenciais):
        try:
            cred = credentials.Certificate(caminho_credenciais)
            firebase_admin.initialize_app(cred)
            print(f"Firebase inicializado via arquivo: {caminho_credenciais}", flush=True)
        except Exception as e:
            print(f"ERRO FATAL: Falha ao inicializar Firebase com arquivo de credenciais: {e}", file=sys.stderr, flush=True)
            raise
    else:
        msg = (
            "ERRO FATAL: Nenhuma credencial Firebase encontrada.\n"
            "  - Em produção: defina a variável de ambiente FIREBASE_CREDENTIALS_JSON\n"
            f"  - Em desenvolvimento: crie o arquivo {caminho_credenciais}"
        )
        print(msg, file=sys.stderr, flush=True)
        raise RuntimeError("Credenciais Firebase não configuradas")

db = firestore.client()
