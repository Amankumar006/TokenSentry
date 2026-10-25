import test from "node:test";
import assert from "node:assert";
import { AstSkeletonizer } from "../src/compressor/ast.js";

test("STRICT: Real-World Archetype 1 - Express.js REST API Router", () => {
  const expressRouter = `
import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { UserService } from "../services/user.service";

export const userRouter = Router();
const userService = new UserService();

export async function handleUserRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { email, password, name } = req.body;
    const existing = await userService.findByEmail(email);
    if (existing) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }
    const user = await userService.create({ email, password, name });
    const token = userService.generateJwt(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

userRouter.post("/register", [body("email").isEmail()], handleUserRegistration);
`;

  const result = AstSkeletonizer.foldTypeScript(expressRouter, 10);
  assert.ok(result.tokensSaved > 0, "Express router handler should be folded");
  assert.ok(result.code.includes("handleUserRegistration"));
  assert.ok(result.code.includes("userRouter.post"));
});

test("STRICT: Real-World Archetype 2 - React Redux Slice & Complex Hook", () => {
  const reactCode = `
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
  discountCode?: string;
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
};

export function recalculateTotals(items: CartItem[], discountRate: number = 0): number {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.price * item.quantity;
  }
  const tax = subtotal * 0.08;
  const discount = subtotal * discountRate;
  const total = Math.max(0, subtotal + tax - discount);
  return total;
}

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {},
});
`;

  const result = AstSkeletonizer.foldTypeScript(reactCode, 8);
  assert.ok(result.tokensSaved > 0, "Redux calculation helper should be folded");
  assert.ok(result.code.includes("export interface CartItem"));
  assert.ok(result.code.includes("export interface CartState"));
});

test("STRICT: Real-World Archetype 3 - Python FastAPI CRUD with Pydantic", () => {
  const fastApiCode = `
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    is_active: bool

async def create_new_user(user_in: UserCreate, db = Depends(get_db)) -> UserResponse:
    existing = await db.query_user(user_in.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed = hash_password(user_in.password)
    new_user = await db.insert_user(user_in.email, user_in.username, hashed)
    await send_welcome_email(new_user.email)
    return UserResponse(id=new_user.id, email=new_user.email, username=new_user.username, is_active=True)
`;

  const result = AstSkeletonizer.foldPython(fastApiCode, 8);
  assert.ok(result.tokensSaved > 0, "FastAPI endpoint function should be folded");
  assert.ok(result.code.includes("class UserCreate(BaseModel):"));
  assert.ok(result.code.includes("class UserResponse(BaseModel):"));
  assert.ok(result.code.includes("create_new_user"));
});

test("STRICT: Real-World Archetype 4 - PyTorch Deep Learning Training Loop", () => {
  const pyTorchCode = `
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

def train_epoch(model: nn.Module, loader: DataLoader, optimizer: torch.optim.Optimizer, criterion: nn.Module, device: str) -> float:
    model.train()
    total_loss = 0.0
    for batch_idx, (data, target) in enumerate(loader):
        data, target = data.to(device), target.to(device)
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        total_loss += loss.item()
    avg_loss = total_loss / len(loader)
    print(f"Epoch complete. Average loss: {avg_loss:.4f}")
    return avg_loss
`;

  const result = AstSkeletonizer.foldPython(pyTorchCode, 10);
  assert.ok(result.tokensSaved > 0, "PyTorch training loop should be folded");
  assert.ok(result.code.includes("train_epoch"));
  assert.ok(result.code.includes("folded by TokenSentry"));
});
