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
export declare class AstSkeletonizer {
    /**
     * Folds function/method bodies in TypeScript/JavaScript code.
     */
    static foldTypeScript(source: string, minLinesToFold?: number): FoldingResult;
    /**
     * Folds function/method bodies in Python code.
     */
    static foldPython(source: string, minLinesToFold?: number): FoldingResult;
    /**
     * Auto-detects language and applies appropriate skeletonization.
     */
    static foldCode(source: string, filenameHint?: string): FoldingResult;
}
