from fastapi import APIRouter, Depends, HTTPException, Request
from middleware.auth import verificar_token
from services.firestore import get_all_documents, get_document, create_document, update_document, delete_document
from .schemas import AccountCreate, AccountUpdate

router = APIRouter(
    prefix="/accounts",
    tags=["Accounts"],
    dependencies=[Depends(verificar_token)]
)

COLLECTION_NAME = "accounts"

@router.get("/")
def get_accounts(request: Request):
    user_id = request.state.user_id
    accounts = get_all_documents(user_id, COLLECTION_NAME)
    return accounts

@router.post("/")
def create_account(account: AccountCreate, request: Request):
    user_id = request.state.user_id
    data = account.dict()
    doc_id = create_document(user_id, COLLECTION_NAME, data)
    return {"id": doc_id, **data}

@router.get("/{account_id}")
def get_account(account_id: str, request: Request):
    user_id = request.state.user_id
    account = get_document(user_id, COLLECTION_NAME, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return account

@router.put("/{account_id}")
def update_account(account_id: str, account: AccountUpdate, request: Request):
    user_id = request.state.user_id
    update_data = {k: v for k, v in account.dict().items() if v is not None}
    success = update_document(user_id, COLLECTION_NAME, account_id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return {"message": "Conta atualizada com sucesso"}

@router.delete("/{account_id}")
def delete_account(account_id: str, request: Request):
    user_id = request.state.user_id
    success = delete_document(user_id, COLLECTION_NAME, account_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return {"message": "Conta excluída com sucesso"}
