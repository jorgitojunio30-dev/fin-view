from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.accounts import router as accounts_router
from routes.revenues import router as revenues_router
from routes.expenses import router as expenses_router
from routes.categories import router as categories_router
from routes.cards import router as cards_router
from routes.invoices import router as invoices_router
from routes.dashboard import router as dashboard_router
from routes.reports import router as reports_router
from routes.projections import router as projections_router
from routes.alerts import router as alerts_router

import os

app = FastAPI(
    title="FinView API",
    description="API do Sistema de Gestão Financeira Familiar",
    version="1.0.0"
)

# CORS - Configuração para permitir o frontend acessar a API
# Em produção no Render, você pode definir a variável de ambiente ALLOWED_ORIGINS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:5174,*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def raiz():
    return {"mensagem": "FinView API está funcionando!", "versao": "1.0.0"}


@app.get("/health")
def verificar_saude():
    return {"status": "ok"}

# Registrar rotas
app.include_router(accounts_router, prefix="/api")
app.include_router(revenues_router, prefix="/api")
app.include_router(expenses_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(cards_router, prefix="/api")
app.include_router(invoices_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(projections_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
