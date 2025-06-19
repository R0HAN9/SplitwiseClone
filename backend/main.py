from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Splitwise Clone API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Splitwise Clone API"}

# Group Management
@app.post("/groups", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db)):
    # Create users if they don't exist
    for user_name in group.users:
        existing_user = db.query(models.User).filter(models.User.name == user_name).first()
        if not existing_user:
            new_user = models.User(name=user_name)
            db.add(new_user)
    
    db.commit()
    
    # Create group
    db_group = models.Group(name=group.name)
    db.add(db_group)
    db.flush()
    
    # Add users to group
    for user_name in group.users:
        user = db.query(models.User).filter(models.User.name == user_name).first()
        db_group.users.append(user)
    
    db.commit()
    db.refresh(db_group)
    return db_group

@app.get("/groups/{group_id}", response_model=schemas.Group)
def get_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@app.get("/groups", response_model=List[schemas.Group])
def get_all_groups(db: Session = Depends(get_db)):
    return db.query(models.Group).all()

# Expense Management
@app.post("/groups/{group_id}/expenses", response_model=schemas.Expense)
def create_expense(group_id: int, expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    # Verify group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Find paid_by user
    paid_by_user = None
    for user in group.users:
        if user.name == expense.paid_by:
            paid_by_user = user
            break
    
    if not paid_by_user:
        raise HTTPException(status_code=400, detail="Paid by user not in group")
    
    # Create expense
    db_expense = models.Expense(
        description=expense.description,
        amount=expense.amount,
        group_id=group_id,
        paid_by_id=paid_by_user.id
    )
    db.add(db_expense)
    db.flush()
    
    # Create splits
    if expense.split_type == "equal":
        split_amount = expense.amount / len(group.users)
        for user in group.users:
            split = models.Split(
                expense_id=db_expense.id,
                user_id=user.id,
                amount=split_amount
            )
            db.add(split)
    elif expense.split_type == "percentage":
        for user_name, percentage in expense.splits.items():
            user = next((u for u in group.users if u.name == user_name), None)
            if user:
                split_amount = (expense.amount * percentage) / 100
                split = models.Split(
                    expense_id=db_expense.id,
                    user_id=user.id,
                    amount=split_amount
                )
                db.add(split)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

# Balance Tracking
@app.get("/groups/{group_id}/balances")
def get_group_balances(group_id: int, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Calculate balances
    balances = {}
    for user in group.users:
        balances[user.name] = 0
    
    # Get all expenses for this group
    expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).all()
    
    for expense in expenses:
        paid_by_name = expense.paid_by.name
        
        # Add amount paid to payer's balance
        balances[paid_by_name] += expense.amount
        
        # Subtract splits from each user's balance
        for split in expense.splits:
            split_user_name = split.user.name
            balances[split_user_name] -= split.amount
    
    # Calculate who owes whom
    settlements = []
    debtors = [(name, -balance) for name, balance in balances.items() if balance < 0]
    creditors = [(name, balance) for name, balance in balances.items() if balance > 0]
    
    for debtor_name, debt in debtors:
        for creditor_name, credit in creditors:
            if debt > 0 and credit > 0:
                settlement_amount = min(debt, credit)
                settlements.append({
                    "from": debtor_name,
                    "to": creditor_name,
                    "amount": round(settlement_amount, 2)
                })
                debt -= settlement_amount
                credit -= settlement_amount
    
    return {
        "group_name": group.name,
        "balances": {name: round(balance, 2) for name, balance in balances.items()},
        "settlements": settlements
    }

@app.get("/users/{user_name}/balances")
def get_user_balances(user_name: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.name == user_name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    total_owed = 0
    total_owing = 0
    
    # Get all groups user is part of
    for group in user.groups:
        group_balances = get_group_balances(group.id, db)
        user_balance = group_balances["balances"].get(user_name, 0)
        
        if user_balance > 0:
            total_owed += user_balance
        else:
            total_owing += abs(user_balance)
    
    return {
        "user": user_name,
        "total_owed": round(total_owed, 2),
        "total_owing": round(total_owing, 2),
        "net_balance": round(total_owed - total_owing, 2)
    }