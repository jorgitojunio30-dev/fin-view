from fastapi import APIRouter, Depends, HTTPException, Request
from middleware.auth import verificar_token
from services.firestore import get_all_documents, get_document, create_document, update_document, delete_document
from .schemas import RevenueCreate, RevenueUpdate

router = APIRouter(
    prefix="/revenues",
    tags=["Revenues"],
    dependencies=[Depends(verificar_token)]
)

COLLECTION_NAME = "revenues"

@router.get("/")
def get_revenues(request: Request, month: str = None, account_id: str = None):
    user_id = request.state.user_id
    revenues = get_all_documents(user_id, COLLECTION_NAME)
    
    if month:
        revenues = [r for r in revenues if r.get('month') == month]
        
    if account_id:
        revenues = [r for r in revenues if r.get('accountId') == account_id]
        
    # Sort by date descending
    revenues.sort(key=lambda x: x.get('date', ''), reverse=True)
    return revenues

@router.post("/")
def create_revenue(revenue: RevenueCreate, request: Request):
    user_id = request.state.user_id
    # Convert datetime to ISO string for Firebase storage
    data = revenue.dict()
    data['date'] = data['date'].isoformat()
    doc_id = create_document(user_id, COLLECTION_NAME, data)
    return {"id": doc_id, **data}

@router.get("/{revenue_id}")
def get_revenue(revenue_id: str, request: Request):
    user_id = request.state.user_id
    revenue = get_document(user_id, COLLECTION_NAME, revenue_id)
    if not revenue:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return revenue

@router.put("/{revenue_id}")
def update_revenue(revenue_id: str, revenue: RevenueUpdate, request: Request):
    user_id = request.state.user_id
    update_data = {k: v for k, v in revenue.dict().items() if v is not None}
    
    if 'date' in update_data and update_data['date'] is not None:
        update_data['date'] = update_data['date'].isoformat()
        
    success = update_document(user_id, COLLECTION_NAME, revenue_id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return {"message": "Receita atualizada com sucesso"}

@router.delete("/{revenue_id}")
def delete_revenue(revenue_id: str, request: Request):
    user_id = request.state.user_id
    success = delete_document(user_id, COLLECTION_NAME, revenue_id)
    if not success:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return {"message": "Receita excluída com sucesso"}
