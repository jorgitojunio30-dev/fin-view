import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

# Inicializa Firebase Admin SDK
# O caminho do arquivo de credenciais pode ser definido via variável de ambiente
caminho_credenciais = os.getenv(
    "FIREBASE_CREDENTIALS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "firebase-credentials.json")
)

if not firebase_admin._apps:
    if os.path.exists(caminho_credenciais):
        cred = credentials.Certificate(caminho_credenciais)
        firebase_admin.initialize_app(cred)
    else:
        # Em produção, pode usar Application Default Credentials
        firebase_admin.initialize_app()

db = firestore.client()
