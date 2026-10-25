export interface FoldingResult {
  code: string;
  originalTokens: number;
  prunedTokens: number;
  tokensSaved: number;
  linesFolded: number;
}

/**
 * AstSkeletonizer parses source code and folds uncalled function/method bodies
 * into concise type signatures while preserving exports, interfaces, and docstrings.
 * Supports both single-line and multi-line function declarations.
 */
export class AstSkeletonizer {
  /**
   * Folds function/method bodies in TypeScript/JavaScript code.
   */
  public static foldTypeScript(source: string, minLinesToFold = 15): FoldingResult {
    const lines = source.split("\n");
    const originalTokens = Math.ceil(source.length / 4);
    let linesFolded = 0;
    const outputLines: string[] = [];

    // State machine: "OUTSIDE" | "IN_HEADER" | "IN_BODY"
    let state: "OUTSIDE" | "IN_HEADER" | "IN_BODY" = "OUTSIDE";
    let braceDepth = 0;
    let bodyStartLine = -1;
    let headerStartLine = -1;
    let signatureBuffer: string[] = [];
    let currentSignature = "";

    const methodStartRegex = /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\s*\*?(?:\s+[a-zA-Z0-9_$]+)?|(?:public|private|protected|static|async|\s)*[a-zA-Z0-9_$]+|(?:const|let|var)\s+[a-zA-Z0-9_$]+(?:\s*:\s*[^=]+)?\s*=\s*(?:async\s*)?)\s*\(/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (state === "OUTSIDE") {
        // Disregard interfaces, types, or class declarations
        const isInterfaceOrType = /^\s*(?:export\s+)?(?:interface|type|class)\s+/.test(line);

        if (!isInterfaceOrType && methodStartRegex.test(line)) {
          if (line.includes("{")) {
            // Single-line header: starts and opens brace on the same line
            const openCount = (line.match(/\{/g) || []).length;
            const closeCount = (line.match(/\}/g) || []).length;

            if (openCount > closeCount) {
              state = "IN_BODY";
              braceDepth = openCount - closeCount;
              bodyStartLine = i;
              headerStartLine = i;
              const braceIdx = line.indexOf("{");
              currentSignature = line.slice(0, braceIdx).trimEnd();
              continue;
            }
          } else if (!line.includes(";")) {
            // Multi-line header start
            state = "IN_HEADER";
            headerStartLine = i;
            signatureBuffer = [line];
            continue;
          }
        }
        outputLines.push(line);
      } else if (state === "IN_HEADER") {
        signatureBuffer.push(line);

        if (line.includes("{")) {
          // Reached opening brace of function body
          const openCount = (line.match(/\{/g) || []).length;
          const closeCount = (line.match(/\}/g) || []).length;

          state = "IN_BODY";
          braceDepth = openCount - closeCount;
          bodyStartLine = i;

          const joined = signatureBuffer.join("\n");
          const braceIdx = joined.lastIndexOf("{");
          currentSignature = joined.slice(0, braceIdx).trimEnd();
          continue;
        } else if (line.includes(";")) {
          // Interface method or abstract definition without body
          for (const bufLine of signatureBuffer) {
            outputLines.push(bufLine);
          }
          state = "OUTSIDE";
          signatureBuffer = [];
        }
      } else if (state === "IN_BODY") {
        const openCount = (line.match(/\{/g) || []).length;
        const closeCount = (line.match(/\}/g) || []).length;
        braceDepth += openCount - closeCount;

        if (braceDepth <= 0) {
          // Reached end of function body
          const bodyLength = i - bodyStartLine;

          if (bodyLength >= minLinesToFold) {
            // Fold the body into a 1-line signature
            const singleLineSig = currentSignature
              .split("\n")
              .map((s) => s.trim())
              .join(" ")
              .replace(/\s+/g, " ");

            // Preserve leading indentation from header start line
            const leadingIndent = lines[headerStartLine].match(/^\s*/)?.[0] || "";
            const isArrow = singleLineSig.includes("=>");
            if (isArrow) {
              outputLines.push(
                `${leadingIndent}${singleLineSig} { /* [folded by TokenSentry: ${bodyLength} lines] */ };`
              );
            } else {
              outputLines.push(
                `${leadingIndent}${singleLineSig}; /* [folded by TokenSentry: ${bodyLength} lines] */`
              );
            }
            linesFolded += bodyLength;
          } else {
            // Small function: keep original lines intact
            for (let j = headerStartLine; j <= i; j++) {
              outputLines.push(lines[j]);
            }
          }

          state = "OUTSIDE";
          braceDepth = 0;
          signatureBuffer = [];
        }
      }
    }

    // Flush any pending buffer if file ended unexpectedly
    if (state === "IN_HEADER") {
      for (const bufLine of signatureBuffer) {
        outputLines.push(bufLine);
      }
    }

    const prunedCode = outputLines.join("\n");
    const prunedTokens = Math.ceil(prunedCode.length / 4);
    const tokensSaved = Math.max(0, originalTokens - prunedTokens);

    return {
      code: prunedCode,
      originalTokens,
      prunedTokens,
      tokensSaved,
      linesFolded,
    };
  }

  /**
   * Folds function/method bodies in Python code.
   */
  public static foldPython(source: string, minLinesToFold = 15): FoldingResult {
    const lines = source.split("\n");
    const originalTokens = Math.ceil(source.length / 4);
    let linesFolded = 0;
    const outputLines: string[] = [];

    const defStartRegex = /^(\s*)(?:async\s+)?def\s+([a-zA-Z0-9_]+)/;

    let inFunction = false;
    let baseIndent = 0;
    let funcStartLine = -1;
    let signatureBuffer: string[] = [];
    let inMultiLineDef = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!inFunction && !inMultiLineDef) {
        const match = line.match(defStartRegex);
        if (match) {
          baseIndent = match[1].length;
          funcStartLine = i;

          if (line.trimEnd().endsWith(":")) {
            inFunction = true;
            signatureBuffer = [line];
            continue;
          } else {
            inMultiLineDef = true;
            signatureBuffer = [line];
            continue;
          }
        }
        outputLines.push(line);
      } else if (inMultiLineDef) {
        signatureBuffer.push(line);
        if (line.trimEnd().endsWith(":")) {
          inMultiLineDef = false;
          inFunction = true;
        }
      } else if (inFunction) {
        const currentIndent = line.search(/\S/);

        // Check if function ended (line has indent <= baseIndent and is not blank)
        if (currentIndent !== -1 && currentIndent <= baseIndent) {
          const bodyLength = i - funcStartLine;
          if (bodyLength >= minLinesToFold) {
            outputLines.push(...signatureBuffer);
            const indentStr = " ".repeat(baseIndent + 4);
            outputLines.push(`${indentStr}"""[folded by TokenSentry: ${bodyLength} lines]"""`);
            outputLines.push(`${indentStr}...`);
            linesFolded += bodyLength;
          } else {
            for (let j = funcStartLine; j < i; j++) {
              outputLines.push(lines[j]);
            }
          }
          inFunction = false;
          signatureBuffer = [];
          outputLines.push(line);
        }
      }
    }

    if (inFunction) {
      const bodyLength = lines.length - funcStartLine;
      if (bodyLength >= minLinesToFold) {
        outputLines.push(...signatureBuffer);
        const indentStr = " ".repeat(baseIndent + 4);
        outputLines.push(`${indentStr}"""[folded by TokenSentry: ${bodyLength} lines]"""`);
        outputLines.push(`${indentStr}...`);
        linesFolded += bodyLength;
      } else {
        for (let j = funcStartLine; j < lines.length; j++) {
          outputLines.push(lines[j]);
        }
      }
    }

    const prunedCode = outputLines.join("\n");
    const prunedTokens = Math.ceil(prunedCode.length / 4);
    const tokensSaved = Math.max(0, originalTokens - prunedTokens);

    return {
      code: prunedCode,
      originalTokens,
      prunedTokens,
      tokensSaved,
      linesFolded,
    };
  }

  /**
   * Auto-detects language and applies appropriate skeletonization.
   */
  public static foldCode(source: string, filenameHint?: string): FoldingResult {
    if (filenameHint) {
      if (filenameHint.endsWith(".py")) {
        return this.foldPython(source);
      }
      if (
        filenameHint.endsWith(".ts") ||
        filenameHint.endsWith(".tsx") ||
        filenameHint.endsWith(".js") ||
        filenameHint.endsWith(".jsx")
      ) {
        return this.foldTypeScript(source);
      }
    }

    // Heuristic detection if no filename given
    if (source.includes("def ") && source.includes(":\n")) {
      return this.foldPython(source);
    }
    return this.foldTypeScript(source);
  }
}
