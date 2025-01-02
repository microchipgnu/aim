import { processAIMDocument } from './parser';
import { analyzeDocument } from './semantic-analysis';
import { $parserState, type ParserState } from './state';
import type { ParsedDocument } from './types';

export interface CompilerError {
  message: string;
  location?: {
    blockId?: string;
    line?: number;
    column?: number;
  };
}

export interface CompilerResult {
  document: ParsedDocument;
  errors: CompilerError[];
  raw: string;
  internalState: ParserState;
}

export async function compile(input: string): Promise<CompilerResult> {
  const parsedDocument = await processAIMDocument(input);

  // Perform semantic analysis
  // TODO: fix semantic analysis
  const semanticErrors = analyzeDocument(parsedDocument);

  return {
    document: parsedDocument,
    errors: [],
    raw: input,
    internalState: $parserState.getState()
  };
}

export * from './state';
export * from './types';
export * from './parser';
export * from './semantic-analysis';
