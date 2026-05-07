import uuid
import calendar
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Request
from middleware.auth import verificar_token
from services.firestore import (
    get_all_documents, get_document, create_document, update_document, delete_document,
    query_documents, batch_delete_documents
)
from .schemas import CardCreate, CardUpdate, PurchaseCreate

router = APIRouter(
    prefix="/cards",
    tags=["Cards"],
    dependencies=[Depends(verificar_token)]
)

CARDS_COLLECTION = "cards"
PURCHASES_COLLECTION = "cardPurchases"

@router.get("/")
def get_cards(request: Request):
    user_id = request.state.user_id
    return get_all_documents(user_id, CARDS_COLLECTION)

@router.post("/")
def create_card(card: CardCreate, request: Request):
    user_id = request.state.user_id
    data = card.dict()
    doc_id = create_document(user_id, CARDS_COLLECTION, data)
    return {"id": doc_id, **data}

@router.put("/{card_id}")
def update_card(card_id: str, card: CardUpdate, request: Request):
    user_id = request.state.user_id
    update_data = {k: v for k, v in card.dict().items() if v is not None}
    success = update_document(user_id, CARDS_COLLECTION, card_id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")
    return {"message": "Cartão atualizado com sucesso"}

@router.delete("/{card_id}")
def delete_card(card_id: str, request: Request):
    user_id = request.state.user_id
    success = delete_document(user_id, CARDS_COLLECTION, card_id)
    if not success:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")
    # Also delete all purchases associated with this card
    batch_delete_documents(user_id, PURCHASES_COLLECTION, [('cardId', '==', card_id)])
    return {"message": "Cartão e compras associadas excluídos com sucesso"}

# Purchases
@router.post("/purchases")
def create_purchase(purchase: PurchaseCreate, request: Request):
    user_id = request.state.user_id
    data = purchase.dict()
    
    card = get_document(user_id, CARDS_COLLECTION, data['cardId'])
    if not card:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")
    
    base_date = data['date']
    if isinstance(base_date, str):
        base_date = datetime.fromisoformat(base_date.replace('Z', '+00:00'))
    
    closing_day = card['closingDay']
    installment_amount = round(data['totalAmount'] / data['installments'], 2)
    
    # Calculate the first installment month
    # If purchase day > closing day, it goes to the next month
    start_month_offset = 0
    if base_date.day > closing_day:
        start_month_offset = 1
        
    first_doc_id = None
    for i in range(data['installments']):
        current_offset = start_month_offset + i
        
        # Calculate installment month/year
        new_month_idx = (base_date.month + current_offset - 1)
        new_month = (new_month_idx % 12) + 1
        new_year = base_date.year + (new_month_idx // 12)
        
        installment_month = f"{new_year:04d}-{new_month:02d}"
        
        purchase_data = {
            "cardId": data['cardId'],
            "description": data['description'],
            "category": data['category'],
            "totalAmount": data['totalAmount'],
            "installments": data['installments'],
            "currentInstallment": i + 1,
            "amount": installment_amount if i < data['installments'] - 1 else round(data['totalAmount'] - (installment_amount * (data['installments'] - 1)), 2),
            "date": base_date.isoformat(),
            "month": installment_month
        }
        
        doc_id = create_document(user_id, PURCHASES_COLLECTION, purchase_data)
        if i == 0:
            first_doc_id = doc_id
            
    return {"id": first_doc_id, "message": "Compra parcelada com sucesso"}

@router.get("/purchases/{month}")
def get_purchases_by_month(month: str, request: Request, card_id: str = None):
    user_id = request.state.user_id
    filters = [('month', '==', month)]
    if card_id:
        filters.append(('cardId', '==', card_id))
        
    return query_documents(user_id, PURCHASES_COLLECTION, filters)

@router.delete("/purchases/{purchase_id}")
def delete_purchase(purchase_id: str, request: Request):
    user_id = request.state.user_id
    success = delete_document(user_id, PURCHASES_COLLECTION, purchase_id)
    if not success:
        raise HTTPException(status_code=404, detail="Compra não encontrada")
    return {"message": "Compra excluída com sucesso"}
