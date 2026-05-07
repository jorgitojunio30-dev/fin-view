import uuid
import calendar
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from middleware.auth import verificar_token
from services.firestore import (
    get_all_documents, get_document, create_document, update_document, delete_document,
    batch_update_documents, batch_delete_documents
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
    expenses = get_all_documents(user_id, COLLECTION_NAME)
    
    if month:
        expenses = [e for e in expenses if e.get('month') == month]
        
    if account_id:
        expenses = [e for e in expenses if e.get('accountId') == account_id]

    if type:
        expenses = [e for e in expenses if e.get('type') == type]
        
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
        
        # Create 12 occurrences
        first_doc_id = None
        for i in range(12):
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
            
            doc_id = create_document(user_id, COLLECTION_NAME, occ_data)
            if i == 0:
                first_doc_id = doc_id
        
        return {"id": first_doc_id, **data}
    else:
        doc_id = create_document(user_id, COLLECTION_NAME, data)
        return {"id": doc_id, **data}

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
