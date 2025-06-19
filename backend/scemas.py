from pydantic import BaseModel
from typing import List, Dict, Optional

class UserBase(BaseModel):
    name: str

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class SplitBase(BaseModel):
    amount: float

class Split(SplitBase):
    id: int
    user_id: int
    expense_id: int
    user: User
    
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    description: str
    amount: float

class ExpenseCreate(ExpenseBase):
    paid_by: str
    split_type: str  # "equal" or "percentage"
    splits: Optional[Dict[str, float]] = {}  # For percentage splits

class Expense(ExpenseBase):
    id: int
    group_id: int
    paid_by_id: int
    paid_by: User
    splits: List[Split] = []
    
    class Config:
        from_attributes = True

class GroupBase(BaseModel):
    name: str

class GroupCreate(GroupBase):
    users: List[str]

class Group(GroupBase):
    id: int
    users: List[User] = []
    expenses: List[Expense] = []
    
    class Config:
        from_attributes = True