import uuid
import calendar
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from middleware.auth import verificar_token
from services.firestore import (
    get_all_documents, get_document, create_document, update_document, delete_document,
    query_documents, batch_update_documents, batch_delete_documents
)
from .schemas import ExpenseCreate, ExpenseUpdate

router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"],
    dependencies=[Depends(verificar_token)]
)

COLLECTION_NAME = "expenses"

@router.get("/")
def get_expenses(request: Request, month: str = None, account_id: str = None, type: str = None):
    user_id = request.state.user_id

    filters = []
    if month:
        filters.append(('month', '==', month))
    if account_id:
        filters.append(('accountId', '==', account_id))
    if type:
        filters.append(('type', '==', type))

    if filters:
        expenses = query_documents(user_id, COLLECTION_NAME, filters)
    else:
        expenses = get_all_documents(user_id, COLLECTION_NAME)

    # Sort by date descending
    expenses.sort(key=lambda x: x.get('date', ''), reverse=True)
    return expenses

@router.post("/")
def create_expense(expense: ExpenseCreate, request: Request):
    user_id = request.state.user_id
    data = expense.dict()
    
    # Convert datetime to ISO string for Firebase storage
    if isinstance(data['date'], datetime):
        base_date = data['date']
        data['date'] = base_date.isoformat()
    else:
        base_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))

    if data.get('type') == 'fixa':
        recurring_id = str(uuid.uuid4())
        data['recurringId'] = recurring_id
        data['isRecurring'] = True
        data['status'] = 'pendente'  # fixas começam como pendente

        months = data.get('recurringMonths') or 12
        
        first_doc_id = None
        for i in range(months):
            # Calculate new date
            new_month_idx = (base_date.month + i - 1)
            new_month = (new_month_idx % 12) + 1
            new_year = base_date.year + (new_month_idx // 12)
            
            # Handle days (e.g. Jan 31 -> Feb 28)
            last_day = calendar.monthrange(new_year, new_month)[1]
            new_day = min(base_date.day, last_day)
            occurrence_date = base_date.replace(year=new_year, month=new_month, day=new_day)
            
            occ_data = data.copy()
            occ_data['date'] = occurrence_date.isoformat()
            occ_data['month'] = f"{new_year:04d}-{new_month:02d}"
            occ_data['recurringIndex'] = i + 1  # 1-based: 1 de 12, 2 de 12, etc.
            
            doc_id = create_document(user_id, COLLECTION_NAME, occ_data)
            if i == 0:
                first_doc_id = doc_id
        
        return {"id": first_doc_id, **data}
    else:
        data['status'] = data.get('status') or 'realizado'  # variáveis começam como realizado
        doc_id = create_document(user_id, COLLECTION_NAME, data)
        return {"id": doc_id, **data}

@router.patch("/{expense_id}/toggle-status")
def toggle_expense_status(expense_id: str, request: Request):
    """Alterna o status entre 'pendente' e 'realizado'."""
    user_id = request.state.user_id
    expense = get_document(user_id, COLLECTION_NAME, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    novo_status = 'realizado' if expense.get('status', 'pendente') == 'pendente' else 'pendente'
    update_document(user_id, COLLECTION_NAME, expense_id, {'status': novo_status})
    return {"status": novo_status}


@router.get("/{expense_id}")
def get_expense(expense_id: str, request: Request):
    user_id = request.state.user_id
    expense = get_document(user_id, COLLECTION_NAME, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    return expense

@router.put("/{expense_id}")
def update_expense(expense_id: str, expense: ExpenseUpdate, request: Request, scope: str = "single"):
    """
    scope: "single" | "future"
    """
    user_id = request.state.user_id
    current_expense = get_document(user_id, COLLECTION_NAME, expense_id)
    if not current_expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")

    update_data = {k: v for k, v in expense.dict().items() if v is not None}
    
    if 'date' in update_data and update_data['date'] is not None:
        update_data['date'] = update_data['date'].isoformat()

    # Não permitir alterar o type de uma despesa recorrente para evitar estado inconsistente
    if current_expense.get('recurringId') and 'type' in update_data:
        update_data.pop('type')
    
    # If scope is "future" and it's a recurring expense, update all future occurrences
    if scope == "future" and current_expense.get('recurringId'):
        recurring_id = current_expense['recurringId']
        current_date = current_expense['date']
        
        # Don't update date/month in batch update as they vary per occurrence
        batch_update_data = update_data.copy()
        batch_update_data.pop('date', None)
        batch_update_data.pop('month', None)
        
        filters = [
            ('recurringId', '==', recurring_id),
            ('date', '>=', current_date)
        ]
        
        count = batch_update_documents(user_id, COLLECTION_NAME, filters, batch_update_data)
        return {"message": f"{count} despesas atualizadas com sucesso"}
    else:
        success = update_document(user_id, COLLECTION_NAME, expense_id, update_data)
        if not success:
            raise HTTPException(status_code=404, detail="Despesa não encontrada")
        return {"message": "Despesa atualizada com sucesso"}

@router.delete("/{expense_id}")
def delete_expense(expense_id: str, request: Request, scope: str = "single"):
    """
    scope: "single" | "future"
    """
    user_id = request.state.user_id
    current_expense = get_document(user_id, COLLECTION_NAME, expense_id)
    if not current_expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")

    if scope == "future" and current_expense.get('recurringId'):
        recurring_id = current_expense['recurringId']
        current_date = current_expense['date']
        
        filters = [
            ('recurringId', '==', recurring_id),
            ('date', '>=', current_date)
        ]
        
        count = batch_delete_documents(user_id, COLLECTION_NAME, filters)
        return {"message": f"{count} despesas excluídas com sucesso"}
    else:
        success = delete_document(user_id, COLLECTION_NAME, expense_id)
        if not success:
            raise HTTPException(status_code=404, detail="Despesa não encontrada")
        return {"message": "Despesa excluída com sucesso"}


@router.post("/{expense_id}/renew")
def renew_expense_series(expense_id: str, request: Request, months: int = 12):
    """
    Renova uma série de despesa fixa criando mais N meses a partir do mês seguinte ao último.
    """
    user_id = request.state.user_id
    expense = get_document(user_id, COLLECTION_NAME, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")

    if not expense.get('recurringId'):
        raise HTTPException(status_code=400, detail="Esta despesa não faz parte de uma série recorrente")

    # Pegar dados base da despesa atual
    recurring_id = expense['recurringId']
    old_months = expense.get('recurringMonths', 12)
    old_index = expense.get('recurringIndex', old_months)

    # Calcular o mês seguinte ao último da série
    last_month_str = expense.get('month', '')
    if not last_month_str:
        raise HTTPException(status_code=400, detail="Despesa sem campo month")

    last_year, last_month = int(last_month_str.split('-')[0]), int(last_month_str.split('-')[1])

    # Pegar o dia base da despesa
    date_str = expense.get('date', '')
    base_day = int(date_str.split('T')[0].split('-')[2]) if date_str else 1

    new_total_months = old_months + months
    first_doc_id = None

    for i in range(months):
        # Calcular mês: partindo do mês seguinte ao último
        new_month_idx = (last_month + i)  # já é o próximo (last_month + 0 = próximo mês)
        new_month = (new_month_idx % 12) + 1
        new_year = last_year + ((new_month_idx) // 12)

        last_day = calendar.monthrange(new_year, new_month)[1]
        new_day = min(base_day, last_day)
        occurrence_date = datetime(new_year, new_month, new_day)

        occ_data = {
            "description": expense['description'],
            "amount": expense['amount'],
            "category": expense['category'],
            "accountId": expense['accountId'],
            "type": "fixa",
            "isRecurring": True,
            "recurringId": recurring_id,
            "recurringMonths": new_total_months,
            "recurringIndex": old_index + i + 1,
            "status": "pendente",
            "date": occurrence_date.isoformat(),
            "month": f"{new_year:04d}-{new_month:02d}"
        }

        doc_id = create_document(user_id, COLLECTION_NAME, occ_data)
        if i == 0:
            first_doc_id = doc_id

    # Atualizar recurringMonths em todos os documentos da série
    batch_update_documents(user_id, COLLECTION_NAME,
        [('recurringId', '==', recurring_id)],
        {'recurringMonths': new_total_months}
    )

    return {"message": f"Série renovada com mais {months} meses", "newTotal": new_total_months}
