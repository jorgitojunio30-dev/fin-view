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

@router.get("/")
def get_categories(request: Request, type: str = None):
    user_id = request.state.user_id
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
