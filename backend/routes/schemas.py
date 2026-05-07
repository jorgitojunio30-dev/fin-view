from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AccountBase(BaseModel):
    name: str
    description: Optional[str] = None

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class AccountResponse(AccountBase):
    id: str
    createdAt: datetime

class RevenueBase(BaseModel):
    description: str
    amount: float
    category: str
    accountId: str
    date: datetime
    month: str # YYYY-MM

class RevenueCreate(RevenueBase):
    pass

class RevenueUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    accountId: Optional[str] = None
    date: Optional[datetime] = None
    month: Optional[str] = None

class RevenueResponse(RevenueBase):
    id: str

class ExpenseBase(BaseModel):
    description: str
    amount: float
    category: str
    accountId: str
    type: str # fixa | variavel
    date: datetime
    month: str # YYYY-MM
    isRecurring: Optional[bool] = False
    recurringId: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    accountId: Optional[str] = None
    type: Optional[str] = None
    date: Optional[datetime] = None
    month: Optional[str] = None
    isRecurring: Optional[bool] = None
    recurringId: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    id: str

class CategoryBase(BaseModel):
    name: str
    type: str  # receita | despesa
    color: Optional[str] = "#3b82f6"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: str

class CardBase(BaseModel):
    name: str
    lastDigits: str
    limit: float
    closingDay: int
    dueDay: int

class CardCreate(CardBase):
    pass

class CardUpdate(BaseModel):
    name: Optional[str] = None
    lastDigits: Optional[str] = None
    limit: Optional[float] = None
    closingDay: Optional[int] = None
    dueDay: Optional[int] = None

class CardResponse(CardBase):
    id: str

class PurchaseBase(BaseModel):
    cardId: str
    description: str
    category: str
    totalAmount: float
    installments: int
    currentInstallment: int
    amount: float
    date: datetime
    month: str # YYYY-MM

class PurchaseCreate(BaseModel):
    cardId: str
    description: str
    category: str
    totalAmount: float
    installments: int
    date: datetime

class PurchaseResponse(PurchaseBase):
    id: str

class InvoiceBase(BaseModel):
    cardId: str
    month: str
    status: str # aberta | fechada | paga
    totalAmount: float
    dueDate: datetime
    paidAt: Optional[datetime] = None
    accountId: Optional[str] = None

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    paidAt: Optional[datetime] = None
    accountId: Optional[str] = None
    totalAmount: Optional[float] = None

class InvoiceResponse(InvoiceBase):
    id: str
