from fastapi import APIRouter, Depends, Request
from middleware.auth import verificar_token
from services.firestore import query_documents
from datetime import datetime

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(verificar_token)]
)

@router.get("/summary")
def get_dashboard_summary(request: Request, month: str = None, account_id: str = None):
    user_id = request.state.user_id
    if not month:
        month = datetime.now().strftime("%Y-%m")
    
    # 1. Fetch Revenues
    rev_filters = [('month', '==', month)]
    if account_id:
        rev_filters.append(('accountId', '==', account_id))
    revenues = query_documents(user_id, "revenues", rev_filters)
    total_revenues = sum(r.get('amount', 0) for r in revenues)
    
    # 2. Fetch Expenses
    exp_filters = [('month', '==', month)]
    if account_id:
        exp_filters.append(('accountId', '==', account_id))
    expenses = query_documents(user_id, "expenses", exp_filters)
    total_expenses = sum(e.get('amount', 0) for e in expenses)
    
    # 3. Fetch Credit Card Purchases (Total for the month)
    # Card purchases are not tied to a specific bank account directly in the purchase doc
    # but the wallet filter might imply the user wants to see cards linked to that profile?
    # For now, let's fetch all cards for that user in that month.
    purchases = query_documents(user_id, "cardPurchases", [('month', '==', month)])
    total_card_purchases = sum(p.get('amount', 0) for p in purchases)
    
    # 4. Fetch all invoices for the month (any status = compromisso do mês)
    all_invoices = query_documents(user_id, "invoices", [('month', '==', month)])
    total_open_invoices = sum(i.get('totalAmount', 0) for i in all_invoices)

    # 5. Group by category for chart
    expenses_by_category = {}
    for e in expenses:
        cat = e.get('category', 'Outros')
        expenses_by_category[cat] = expenses_by_category.get(cat, 0) + e.get('amount', 0)
    
    category_summary = [{"name": k, "value": v} for k, v in expenses_by_category.items()]

    return {
        "month": month,
        "totalRevenues": total_revenues,
        "totalExpenses": total_expenses,
        "balance": total_revenues - total_expenses - total_open_invoices,
        "totalCardPurchases": total_card_purchases,
        "totalOpenInvoices": total_open_invoices,
        "categorySummary": category_summary
    }
