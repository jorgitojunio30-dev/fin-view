from fastapi import APIRouter, Depends, HTTPException, Request
from middleware.auth import verificar_token
from services.firestore import get_all_documents, get_document, create_document, update_document, delete_document
from .schemas import CategoryCreate, CategoryUpdate

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
    dependencies=[Depends(verificar_token)]
)

COLLECTION_NAME = "categories"

CATEGORIAS_PADRAO = [
    # Receitas
    {"name": "Salário",       "type": "receita", "color": "#10b981"},
    {"name": "Freelance",     "type": "receita", "color": "#3b82f6"},
    {"name": "Investimentos", "type": "receita", "color": "#8b5cf6"},
    {"name": "Bônus",         "type": "receita", "color": "#f59e0b"},
    {"name": "Outros",        "type": "receita", "color": "#6b7280"},
    # Despesas
    {"name": "Moradia",       "type": "despesa", "color": "#ef4444"},
    {"name": "Alimentação",   "type": "despesa", "color": "#f97316"},
    {"name": "Transporte",    "type": "despesa", "color": "#eab308"},
    {"name": "Saúde",         "type": "despesa", "color": "#06b6d4"},
    {"name": "Educação",      "type": "despesa", "color": "#3b82f6"},
    {"name": "Lazer",         "type": "despesa", "color": "#8b5cf6"},
    {"name": "Assinaturas",   "type": "despesa", "color": "#ec4899"},
    {"name": "Cartão de Crédito", "type": "despesa", "color": "#64748b"},
    {"name": "Outros",        "type": "despesa", "color": "#6b7280"},
]


def seed_categorias_padrao(user_id: str):
    """Popula as categorias padrão se o usuário ainda não tiver nenhuma."""
    existentes = get_all_documents(user_id, COLLECTION_NAME)
    if existentes:
        return
    for cat in CATEGORIAS_PADRAO:
        create_document(user_id, COLLECTION_NAME, cat)


@router.get("/")
def get_categories(request: Request, type: str = None):
    user_id = request.state.user_id

    # Seed automático no primeiro acesso
    seed_categorias_padrao(user_id)

    categories = get_all_documents(user_id, COLLECTION_NAME)

    if type:
        categories = [c for c in categories if c.get('type') == type]

    return categories


@router.post("/")
def create_category(category: CategoryCreate, request: Request):
    user_id = request.state.user_id
    data = category.dict()
    doc_id = create_document(user_id, COLLECTION_NAME, data)
    return {"id": doc_id, **data}


@router.put("/{category_id}")
def update_category(category_id: str, category: CategoryUpdate, request: Request):
    user_id = request.state.user_id
    update_data = {k: v for k, v in category.dict().items() if v is not None}
    success = update_document(user_id, COLLECTION_NAME, category_id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return {"message": "Categoria atualizada com sucesso"}


@router.delete("/{category_id}")
def delete_category(category_id: str, request: Request):
    user_id = request.state.user_id
    success = delete_document(user_id, COLLECTION_NAME, category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return {"message": "Categoria excluída com sucesso"}
