import test from "node:test";
import assert from "node:assert";
import { AstSkeletonizer } from "../src/compressor/ast.js";

test("STRICT: Arrow functions assigned to const/let/var", () => {
  const tsArrowCode = `
export const calculateTax = async (
  grossIncome: number,
  deductions: number,
  taxBracket: "A" | "B" | "C"
): Promise<{ netTax: number; effectiveRate: number }> => {
  const taxable = Math.max(0, grossIncome - deductions);
  let rate = 0.15;
  if (taxBracket === "B") {
    rate = 0.25;
  } else if (taxBracket === "C") {
    rate = 0.35;
  }
  const netTax = taxable * rate;
  const effectiveRate = netTax / Math.max(1, grossIncome);
  console.log("Calculated tax:", { netTax, effectiveRate });
  return { netTax, effectiveRate };
};

export const quickAdd = (a: number, b: number): number => a + b;
`;

  const result = AstSkeletonizer.foldTypeScript(tsArrowCode, 10);
  assert.ok(result.tokensSaved > 0, "Arrow function should be folded and save tokens");
  assert.ok(result.code.includes("calculateTax"));
  assert.ok(result.code.includes("folded by TokenSentry"));
  // 1-line quickAdd should be kept intact
  assert.ok(result.code.includes("export const quickAdd = (a: number, b: number): number => a + b;"));
});

test("STRICT: Generator and async generator functions", () => {
  const genCode = `
export async function* paginateRecords<T>(
  fetcher: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string }>
): AsyncGenerator<T, void, unknown> {
  let cursor: string | undefined = undefined;
  while (true) {
    const page = await fetcher(cursor);
    for (const item of page.items) {
      yield item;
    }
    if (!page.nextCursor) {
      break;
    }
    cursor = page.nextCursor;
  }
}
`;

  const result = AstSkeletonizer.foldTypeScript(genCode, 8);
  assert.ok(result.tokensSaved > 0, "Generator function should be folded");
  assert.ok(result.code.includes("paginateRecords"));
  assert.ok(result.code.includes("folded by TokenSentry"));
});

test("STRICT: Decorators on TypeScript class methods and Python functions", () => {
  const tsDecorated = `
import { Controller, Get, Post, Body, Param } from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Get(":id")
  public async getUserById(@Param("id") id: string): Promise<UserRecord> {
    const user = await this.service.findUser(id);
    if (!user) {
      throw new NotFoundException();
    }
    await this.auditLog.record("read", id);
    return user;
  }

  @Post()
  public async createUser(
    @Body() dto: CreateUserDto
  ): Promise<UserRecord> {
    const validated = await this.validator.validate(dto);
    const user = await this.service.insert(validated);
    await this.auditLog.record("create", user.id);
    await this.notifier.sendWelcomeEmail(user.email);
    return user;
  }
}
`;

  const result = AstSkeletonizer.foldTypeScript(tsDecorated, 5);
  assert.ok(result.tokensSaved > 0, "Decorated methods should be folded");
  assert.ok(result.code.includes("@Controller(\"users\")"), "Class decorator preserved");
  assert.ok(result.code.includes("@Get(\":id\")"), "Method decorator preserved");
  assert.ok(result.code.includes("createUser"), "Method header preserved");

  const pyDecorated = `
from fastapi import FastAPI, Depends, HTTPException

app = FastAPI()

@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str | None = None):
    item = await db.fetch_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    log.info("Fetched item", item_id=item_id)
    return {"item_id": item_id, "q": q, "data": item}
`;

  const pyResult = AstSkeletonizer.foldPython(pyDecorated, 5);
  assert.ok(pyResult.tokensSaved > 0, "Python decorated function folded");
  assert.ok(pyResult.code.includes('@app.get("/items/{item_id}")'), "Python decorator preserved");
  assert.ok(pyResult.code.includes("read_item"), "Python func signature preserved");
});

test("STRICT: Malformed code & unclosed braces must never throw or crash", () => {
  const brokenTs = `
function brokenCode() {
  const x = 10;
  if (x > 5) {
    console.log("Unclosed brace
`;

  // Must not throw an unhandled exception
  assert.doesNotThrow(() => {
    const res = AstSkeletonizer.foldTypeScript(brokenTs, 5);
    assert.ok(typeof res.code === "string");
  });

  const brokenPy = `
def broken_py():
    x = 1
    # Missing end
`;
  assert.doesNotThrow(() => {
    const res = AstSkeletonizer.foldPython(brokenPy, 5);
    assert.ok(typeof res.code === "string");
  });
});

test("STRICT: Nested classes, interfaces, and type definitions preserved", () => {
  const tsTypes = `
export type Result<T> = { success: true; data: T } | { success: false; error: string };

export interface ConfigOptions {
  timeoutMs: number;
  retries: number;
}

export class ServiceFactory {
  public static createService(opts: ConfigOptions): Service {
    const valid = opts.timeoutMs > 0 && opts.retries >= 0;
    if (!valid) {
      throw new Error("Invalid options");
    }
    const internalClient = new HttpClient(opts.timeoutMs);
    const retryHandler = new RetryHandler(opts.retries);
    return new Service(internalClient, retryHandler);
  }
}
`;

  const result = AstSkeletonizer.foldTypeScript(tsTypes, 6);
  assert.ok(result.code.includes("export type Result<T>"), "Type alias preserved");
  assert.ok(result.code.includes("export interface ConfigOptions"), "Interface preserved");
  assert.ok(result.code.includes("ServiceFactory"), "Class preserved");
});

test("STRICT: Code embedded inside markdown fences in tool_result", () => {
  const markdownToolResult = `
Here is the file src/service.ts:
\`\`\`typescript
export async function heavyProcessing(data: number[]): Promise<number> {
  let sum = 0;
  for (const n of data) {
    const squared = n * n;
    sum += squared;
  }
  if (sum > 1000) {
    sum = 1000;
  }
  return sum;
}
\`\`\`
Please inspect the file.
`;

  const result = AstSkeletonizer.foldTypeScript(markdownToolResult, 6);
  assert.ok(result.tokensSaved > 0, "Code inside markdown fences should be folded");
  assert.ok(result.code.includes("heavyProcessing"));
});
