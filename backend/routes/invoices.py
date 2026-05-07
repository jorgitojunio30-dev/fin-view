from fastapi import APIRouter, Depends, HTTPException, Request
from middleware.auth import verificar_token
from services.firestore import (
    get_all_documents, get_document, create_document, update_document, query_documents
)
from .schemas import InvoiceUpdate, InvoicePayRequest
from datetime import datetime

router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"],
    dependencies=[Depends(verificar_token)]
)

COLLECTION_NAME = "invoices"

@router.get("/")
def get_invoices(request: Request, card_id: str = None, month: str = None):
    user_id = request.state.user_id
    filters = []
    if card_id:
        filters.append(('cardId', '==', card_id))
    if month:
        filters.append(('month', '==', month))
    
    if not filters:
        return get_all_documents(user_id, COLLECTION_NAME)
    
    return query_documents(user_id, COLLECTION_NAME, filters)

@router.post("/")
def create_or_update_invoice(request: Request, data: InvoiceUpdate):
    user_id = request.state.user_id
    payload = {k: v for k, v in data.dict().items() if v is not None}
    card_id = payload.get('cardId')
    month = payload.get('month')
    
    if not card_id or not month:
        raise HTTPException(status_code=400, detail="cardId e month são obrigatórios")
    
    # Check if exists
    existing = query_documents(user_id, COLLECTION_NAME, [
        ('cardId', '==', card_id),
        ('month', '==', month)
    ])
    
    if existing:
        invoice_id = existing[0]['id']
        update_document(user_id, COLLECTION_NAME, invoice_id, payload)
        return {"id": invoice_id, **payload}
    else:
        doc_id = create_document(user_id, COLLECTION_NAME, payload)
        return {"id": doc_id, **payload}

@router.put("/{invoice_id}/pay")
def pay_invoice(invoice_id: str, request: Request, data: InvoicePayRequest):
    """
    Marca a fatura como paga. Não cria despesa pois as compras do cartão
    já são contabilizadas separadamente no saldo.
    """
    user_id = request.state.user_id
    invoice = get_document(user_id, COLLECTION_NAME, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura não encontrada")
    
    if invoice.get('status') == 'paga':
        raise HTTPException(status_code=400, detail="Fatura já está paga")
    
    account_id = data.accountId
    paid_at = data.paidAt or datetime.now().isoformat()
    amount = data.amount or invoice.get('totalAmount')
    
    update_data = {
        "status": "paga",
        "paidAt": paid_at,
        "accountId": account_id,
        "totalAmount": amount
    }
    update_document(user_id, COLLECTION_NAME, invoice_id, update_data)
    
    return {"message": "Fatura paga com sucesso"}
