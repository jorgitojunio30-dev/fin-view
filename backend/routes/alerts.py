from fastapi import APIRouter, Depends, Request
from middleware.auth import verificar_token
from services.firestore import query_documents, get_all_documents
from datetime import datetime, date, timedelta

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"],
    dependencies=[Depends(verificar_token)]
)

@router.get("/")
def get_active_alerts(request: Request):
    user_id = request.state.user_id
    today = datetime.now()
    month_str = today.strftime("%Y-%m")
    
    alerts = []
    
    # 1. Check Card Limits and Closing Dates
    cards = get_all_documents(user_id, "cards")
    for card in cards:
        # Check Closing Date
        if card.get('closingDay') == today.day:
            alerts.append({
                "id": f"closing-{card['id']}",
                "type": "fechamento",
                "severity": "info",
                "message": f"Sua fatura do {card['name']} fecha hoje.",
                "link": "/cartoes"
            })
            
        # Check Due Date (today and 1 day before) — only if not paid
        due_day = card.get('dueDay', 1)
        due_date_this_month = today.replace(day=min(due_day, 28))
        days_until_due = (due_date_this_month.date() - today.date()).days

        if days_until_due in (0, 1):
            # Get invoice — only alert if not paid
            invoices = query_documents(user_id, "invoices", [
                ('cardId', '==', card['id']),
                ('month', '==', month_str)
            ])
            unpaid_invoices = [i for i in invoices if i.get('status') != 'paga']
            if unpaid_invoices:
                amount = unpaid_invoices[0].get('totalAmount', 0)
                if days_until_due == 0:
                    # Vence hoje — danger, topo
                    alerts.insert(0, {
                        "id": f"due-{card['id']}",
                        "type": "vencimento",
                        "severity": "danger",
                        "message": f"Fatura do {card['name']} vence hoje — R$ {amount:,.2f}",
                        "link": "/cartoes"
                    })
                else:
                    # Vence amanhã — warning
                    alerts.append({
                        "id": f"due-{card['id']}",
                        "type": "vencimento",
                        "severity": "warning",
                        "message": f"Fatura do {card['name']} vence amanhã — R$ {amount:,.2f}",
                        "link": "/cartoes"
                    })

        # Check Limit (80%)
        purchases = query_documents(user_id, "cardPurchases", [
            ('cardId', '==', card['id']),
            ('month', '==', month_str)
        ])
        current_spent = sum(p.get('amount', 0) for p in purchases)
        limit = card.get('limit', 0)
        if limit > 0 and (current_spent / limit) >= 0.8:
            alerts.append({
                "id": f"limit-{card['id']}",
                "type": "limite_cartao",
                "severity": "danger",
                "message": f"{card['name']} atingiu {(current_spent/limit)*100:.0f}% do limite.",
                "link": "/cartoes"
            })

    # 2. Check Budget
    revs = query_documents(user_id, "revenues", [('month', '==', month_str)])
    exps = query_documents(user_id, "expenses", [('month', '==', month_str)])
    total_rev = sum(r.get('amount', 0) for r in revs)
    total_exp = sum(e.get('amount', 0) for e in exps)
    
    if total_rev > 0:
        usage = total_exp / total_rev
        if usage >= 1.0:
            alerts.append({
                "id": "budget-over",
                "type": "orcamento",
                "severity": "danger",
                "message": "Você ultrapassou sua receita total deste mês!",
                "link": "/"
            })
        elif usage >= 0.9:
            alerts.append({
                "id": "budget-near",
                "type": "orcamento",
                "severity": "warning",
                "message": "Você já comprometeu 90% da sua receita do mês.",
                "link": "/"
            })

    # 3. Despesas pendentes que vencem nas próximas 24h
    tomorrow = today + timedelta(days=1)
    pending_expenses = [e for e in exps if e.get('status', 'realizado') == 'pendente']
    for exp in pending_expenses:
        exp_date_str = exp.get('date', '')
        if not exp_date_str:
            continue
        try:
            exp_date = datetime.fromisoformat(exp_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
        except (ValueError, TypeError):
            continue
        # Se a data da despesa é entre agora e amanhã (próximas 24h)
        if exp_date.date() == today.date():
            # Vence hoje — danger, vai pro topo
            alerts.insert(0, {
                "id": f"expense-due-{exp['id']}",
                "type": "despesa_vencendo",
                "severity": "danger",
                "message": f"Despesa \"{exp['description']}\" de R$ {exp['amount']:,.2f} vence hoje!",
                "link": "/despesas"
            })
        elif exp_date.date() == tomorrow.date():
            # Vence amanhã — warning
            alerts.append({
                "id": f"expense-due-{exp['id']}",
                "type": "despesa_vencendo",
                "severity": "warning",
                "message": f"Despesa \"{exp['description']}\" de R$ {exp['amount']:,.2f} vence amanhã.",
                "link": "/despesas"
            })

    return alerts
