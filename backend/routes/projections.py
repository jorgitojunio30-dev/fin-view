from fastapi import APIRouter, Depends, Request
from middleware.auth import verificar_token
from services.firestore import query_documents
from datetime import datetime, date, timedelta
import calendar

router = APIRouter(
    prefix="/projections",
    tags=["Projections"],
    dependencies=[Depends(verificar_token)]
)

@router.get("/next-month")
def get_next_month_projection(request: Request):
    user_id = request.state.user_id
    
    # 1. Calculate Next Month
    today = datetime.now()
    # Reliable next month calculation
    if today.month == 12:
        next_month_str = f"{today.year + 1:04d}-01"
    else:
        next_month_str = f"{today.year:04d}-{today.month + 1:02d}"
    
    # 2. Expected Revenue (Average of last 3 months)
    last_3_months = []
    for i in range(1, 4):
        # Go back i months reliably
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        m_str = f"{y:04d}-{m:02d}"
        revs = query_documents(user_id, "revenues", [('month', '==', m_str)])
        last_3_months.append(sum(r.get('amount', 0) for r in revs))
    
    expected_revenue = sum(last_3_months) / len(last_3_months) if last_3_months else 0
    
    # 3. Fixed Expenses for next month
    fixed_expenses = query_documents(user_id, "expenses", [
        ('month', '==', next_month_str),
        ('type', '==', 'fixa')
    ])
    total_fixed = sum(e.get('amount', 0) for e in fixed_expenses)
    
    # 4. Card Installments for next month
    card_purchases = query_documents(user_id, "cardPurchases", [('month', '==', next_month_str)])
    total_cards = sum(p.get('amount', 0) for p in card_purchases)
    
    # 5. Summary
    balance_projected = expected_revenue - total_fixed - total_cards
    
    return {
        "targetMonth": next_month_str,
        "expectedRevenue": expected_revenue,
        "fixedExpenses": {
            "total": total_fixed,
            "items": fixed_expenses
        },
        "cardInstallments": {
            "total": total_cards,
            "items": card_purchases
        },
        "projectedBalance": balance_projected,
        "limitForVariables": max(0, balance_projected)
    }
