from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.accounts import router as accounts_router
from routes.revenues import router as revenues_router
from routes.expenses import router as expenses_router
from routes.categories import router as categories_router
from routes.cards import router as cards_router
from routes.invoices import router as invoices_router
from routes.dashboard import router as dashboard_router
from routes.reports import router as reports_router
from routes.alerts import router as alerts_router

import os

app = FastAPI(
    title="FinView API",
    description="API do Sistema de Gestão Financeira Familiar",
    version="1.0.0"
)

# CORS
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:5174")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Captura erros de credenciais do Firestore antes que derrubem o servidor
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    error_str = str(exc)
    if "invalid_grant" in error_str or "Invalid JWT" in error_str:
        return JSONResponse(
            status_code=503,
            content={"detail": "Serviço temporariamente indisponível. Erro de autenticação com o banco de dados."}
        )
    if "RetryError" in type(exc).__name__ or "ServiceUnavailable" in type(exc).__name__:
        return JSONResponse(
            status_code=503,
            content={"detail": "Serviço temporariamente indisponível. Tente novamente em instantes."}
        )
    raise exc


@app.get("/")
def raiz():
    return {"mensagem": "FinView API está funcionando!", "versao": "1.0.0"}


@app.head("/")
def raiz_head():
    return {}


@app.get("/health")
def verificar_saude():
    return {"status": "ok"}


@app.head("/health")
def verificar_saude_head():
    return {}

# Registrar rotas
app.include_router(accounts_router, prefix="/api")
app.include_router(revenues_router, prefix="/api")
app.include_router(expenses_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(cards_router, prefix="/api")
app.include_router(invoices_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
