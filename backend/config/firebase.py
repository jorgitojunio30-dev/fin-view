import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json

# Inicializa Firebase Admin SDK
# Tenta carregar as credenciais de diferentes formas:
# 1. Variável de ambiente com o JSON completo (melhor para Render)
# 2. Variável de ambiente com o caminho do arquivo
# 3. Caminho padrão local

firebase_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
caminho_credenciais = os.getenv(
    "FIREBASE_CREDENTIALS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "firebase-credentials.json")
)

if not firebase_admin._apps:
    if firebase_json:
        # Carrega direto do JSON string na variável de ambiente
        try:
            cred_dict = json.loads(firebase_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"Erro ao carregar FIREBASE_CREDENTIALS_JSON: {e}")
            if os.path.exists(caminho_credenciais):
                cred = credentials.Certificate(caminho_credenciais)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()
    elif os.path.exists(caminho_credenciais):
        cred = credentials.Certificate(caminho_credenciais)
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()

db = firestore.client()
