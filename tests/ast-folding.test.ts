import test from "node:test";
import assert from "node:assert";
import { AstSkeletonizer } from "../src/compressor/ast.js";

test("AstSkeletonizer folds long TypeScript functions into signatures", () => {
  const tsCode = `
import { Database } from "./db";

export interface User {
  id: string;
  name: string;
}

export async function processUsers(db: Database, limit: number): Promise<User[]> {
  const query = "SELECT * FROM users LIMIT " + limit;
  const rawResults = await db.execute(query);
  const formatted: User[] = [];
  for (const row of rawResults) {
    formatted.push({
      id: String(row.id),
      name: String(row.name).trim(),
    });
  }
  if (formatted.length === 0) {
    console.log("No users found");
    return [];
  }
  console.log("Found users: " + formatted.length);
  return formatted;
}

export function quickHelper(x: number): number {
  return x * 2;
}
`;

  const result = AstSkeletonizer.foldTypeScript(tsCode, 10);

  // Should fold processUsers (which is ~17 lines)
  assert.ok(result.tokensSaved > 0);
  assert.ok(result.code.includes("/* [folded by TokenSentry:"));
  assert.ok(result.code.includes("export async function processUsers(db: Database, limit: number): Promise<User[]>;"));
  // Should keep quickHelper intact because it is small (< 10 lines)
  assert.ok(result.code.includes("return x * 2;"));
});

test("AstSkeletonizer folds long Python functions into signatures", () => {
  const pyCode = `
import os
import sys

class DataProcessor:
    def process_records(self, items: list[dict], threshold: float = 0.5) -> list[dict]:
        results = []
        for item in items:
            score = item.get("score", 0.0)
            if score >= threshold:
                item["valid"] = True
                results.append(item)
            else:
                item["valid"] = False
        print(f"Processed {len(results)} valid records")
        return results

    def tiny_method(self, x: int) -> int:
        return x + 1
`;

  const result = AstSkeletonizer.foldPython(pyCode, 8);

  assert.ok(result.tokensSaved > 0);
  assert.ok(result.code.includes('"""[folded by TokenSentry:'));
  // Should keep tiny_method intact
  assert.ok(result.code.includes("return x + 1"));
});
