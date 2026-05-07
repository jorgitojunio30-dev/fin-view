from fastapi import APIRouter, Depends, Request
from middleware.auth import verificar_token
from services.firestore import query_documents
from datetime import datetime, timedelta
import calendar

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
    dependencies=[Depends(verificar_token)]
)

@router.get("/evolution")
def get_monthly_evolution(request: Request, months: int = 6):
    user_id = request.state.user_id
    
    # Calculate last N months
    today = datetime.now()
    result = []
    
    for i in range(months - 1, -1, -1):
        # Calculate date for i months ago
        year = today.year + (today.month - i - 1) // 12
        month = (today.month - i - 1) % 12 + 1
        month_str = f"{year:04d}-{month:02d}"
        month_label = calendar.month_name[month][:3].capitalize() + f"/{str(year)[2:]}"
        
        # Fetch revenues
        revs = query_documents(user_id, "revenues", [('month', '==', month_str)])
        total_rev = sum(r.get('amount', 0) for r in revs)
        
        # Fetch expenses
        exps = query_documents(user_id, "expenses", [('month', '==', month_str)])
        total_exp = sum(e.get('amount', 0) for e in exps)
        
        result.append({
            "month": month_str,
            "label": month_label,
            "receitas": total_rev,
            "despesas": total_exp,
            "saldo": total_rev - total_exp
        })
        
    return result

@router.get("/categories")
def get_category_distribution(request: Request, month: str = None):
    user_id = request.state.user_id
    if not month:
        month = datetime.now().strftime("%Y-%m")
        
    expenses = query_documents(user_id, "expenses", [('month', '==', month)])
    
    summary = {}
    for e in expenses:
        cat = e.get('category', 'Outros')
        summary[cat] = summary.get(cat, 0) + e.get('amount', 0)
        
    result = [{"name": k, "value": v} for k, v in summary.items()]
    # Sort by value descending
    result.sort(key=lambda x: x['value'], reverse=True)
    
    return result

@router.get("/invoice-growth")
def get_invoice_growth(request: Request, month: str = None):
    user_id = request.state.user_id
    if not month:
        month = datetime.now().strftime("%Y-%m")
        
    # Fetch all purchases that fall into this invoice month
    purchases = query_documents(user_id, "cardPurchases", [('month', '==', month)])
    
    # Sort by purchase date
    purchases.sort(key=lambda x: x.get('date', ''))
    
    # Aggregate by day
    daily_totals = {}
    for p in purchases:
        # Extract date part only (YYYY-MM-DD)
        p_date = p.get('date', '').split('T')[0]
        if not p_date: continue
        
        daily_totals[p_date] = daily_totals.get(p_date, 0) + p.get('amount', 0)
        
    # Create cumulative growth list
    sorted_days = sorted(daily_totals.keys())
    result = []
    accumulated = 0
    
    for day in sorted_days:
        accumulated += daily_totals[day]
        # Format day for label (DD/MM)
        day_parts = day.split('-')
        label = f"{day_parts[2]}/{day_parts[1]}"
        
        result.append({
            "date": day,
            "label": label,
            "value": accumulated
        })
        
    return result
