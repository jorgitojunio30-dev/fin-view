import uuid
import calendar
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from middleware.auth import verificar_token
from services.firestore import (
    get_all_documents, get_document, create_document, update_document, delete_document,
    query_documents, batch_update_documents, batch_delete_documents
)
from .schemas import RevenueCreate, RevenueUpdate

router = APIRouter(
    prefix="/revenues",
    tags=["Revenues"],
    dependencies=[Depends(verificar_token)]
)

COLLECTION_NAME = "revenues"
FIXED_REVENUE_MONTHS = 120  # 10 anos — receita fixa sem série definida

@router.get("/")
def get_revenues(request: Request, month: str = None, account_id: str = None):
    user_id = request.state.user_id

    filters = []
    if month:
        filters.append(('month', '==', month))
    if account_id:
        filters.append(('accountId', '==', account_id))

    if filters:
        revenues = query_documents(user_id, COLLECTION_NAME, filters)
    else:
        revenues = get_all_documents(user_id, COLLECTION_NAME)

    revenues.sort(key=lambda x: x.get('date', ''), reverse=True)
    return revenues

@router.post("/")
def create_revenue(revenue: RevenueCreate, request: Request):
    user_id = request.state.user_id
    data = revenue.dict()

    if isinstance(data['date'], datetime):
        base_date = data['date']
        data['date'] = base_date.isoformat()
    else:
        base_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))

    if data.get('isFixed'):
        recurring_id = str(uuid.uuid4())
        data['recurringId'] = recurring_id
        data['status'] = 'pendente'  # fixas começam como pendente

        months = data.get('recurringMonths') or FIXED_REVENUE_MONTHS

        first_doc_id = None
        for i in range(months):
            new_month_idx = (base_date.month + i - 1)
            new_month = (new_month_idx % 12) + 1
            new_year = base_date.year + (new_month_idx // 12)

            last_day = calendar.monthrange(new_year, new_month)[1]
            new_day = min(base_date.day, last_day)
            occurrence_date = base_date.replace(year=new_year, month=new_month, day=new_day)

            occ_data = data.copy()
            occ_data['date'] = occurrence_date.isoformat()
            occ_data['month'] = f"{new_year:04d}-{new_month:02d}"

            doc_id = create_document(user_id, COLLECTION_NAME, occ_data)
            if i == 0:
                first_doc_id = doc_id

        return {"id": first_doc_id, **data}
    else:
        data['date'] = base_date.isoformat()
        data['status'] = data.get('status') or 'realizado'  # variáveis começam como realizado
        doc_id = create_document(user_id, COLLECTION_NAME, data)
        return {"id": doc_id, **data}

@router.patch("/{revenue_id}/toggle-status")
def toggle_revenue_status(revenue_id: str, request: Request):
    """Alterna o status entre 'pendente' e 'realizado'."""
    user_id = request.state.user_id
    revenue = get_document(user_id, COLLECTION_NAME, revenue_id)
    if not revenue:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    novo_status = 'realizado' if revenue.get('status', 'pendente') == 'pendente' else 'pendente'
    update_document(user_id, COLLECTION_NAME, revenue_id, {'status': novo_status})
    return {"status": novo_status}


@router.get("/{revenue_id}")
def get_revenue(revenue_id: str, request: Request):
    user_id = request.state.user_id
    revenue = get_document(user_id, COLLECTION_NAME, revenue_id)
    if not revenue:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return revenue

@router.put("/{revenue_id}")
def update_revenue(revenue_id: str, revenue: RevenueUpdate, request: Request, scope: str = "single"):
    """
    scope: "single" | "future"
    """
    user_id = request.state.user_id
    current_revenue = get_document(user_id, COLLECTION_NAME, revenue_id)
    if not current_revenue:
        raise HTTPException(status_code=404, detail="Receita não encontrada")

    update_data = {k: v for k, v in revenue.dict().items() if v is not None}

    if 'date' in update_data and update_data['date'] is not None:
        update_data['date'] = update_data['date'].isoformat()

    # Não permitir alterar isFixed de uma receita recorrente
    if current_revenue.get('recurringId') and 'isFixed' in update_data:
        update_data.pop('isFixed')

    if scope == "future" and current_revenue.get('recurringId'):
        recurring_id = current_revenue['recurringId']
        current_date = current_revenue['date']

        batch_update_data = update_data.copy()
        batch_update_data.pop('date', None)
        batch_update_data.pop('month', None)

        filters = [
            ('recurringId', '==', recurring_id),
            ('date', '>=', current_date)
        ]

        count = batch_update_documents(user_id, COLLECTION_NAME, filters, batch_update_data)
        return {"message": f"{count} receitas atualizadas com sucesso"}
    else:
        success = update_document(user_id, COLLECTION_NAME, revenue_id, update_data)
        if not success:
            raise HTTPException(status_code=404, detail="Receita não encontrada")
        return {"message": "Receita atualizada com sucesso"}

@router.delete("/{revenue_id}")
def delete_revenue(revenue_id: str, request: Request, scope: str = "single"):
    """
    scope: "single" | "future"
    """
    user_id = request.state.user_id
    current_revenue = get_document(user_id, COLLECTION_NAME, revenue_id)
    if not current_revenue:
        raise HTTPException(status_code=404, detail="Receita não encontrada")

    if scope == "future" and current_revenue.get('recurringId'):
        recurring_id = current_revenue['recurringId']
        current_date = current_revenue['date']

        filters = [
            ('recurringId', '==', recurring_id),
            ('date', '>=', current_date)
        ]

        count = batch_delete_documents(user_id, COLLECTION_NAME, filters)
        return {"message": f"{count} receitas excluídas com sucesso"}
    else:
        success = delete_document(user_id, COLLECTION_NAME, revenue_id)
        if not success:
            raise HTTPException(status_code=404, detail="Receita não encontrada")
        return {"message": "Receita excluída com sucesso"}
