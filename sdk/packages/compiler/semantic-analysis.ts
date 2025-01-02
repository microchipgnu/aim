import type { ParsedDocument, Block, VariableReference, BlockType } from './types';

/**
 * Represents a semantic error found during analysis
 */
interface SemanticError {
  message: string;
  location?: {
    blockId?: string;
    line?: number;
    column?: number;
  };
}

/**
 * Analyzes a parsed AIM document for semantic correctness
 * Validates variable declarations, references, and block-specific rules
 */
export function analyzeDocument(doc: ParsedDocument): SemanticError[] {
  const errors: SemanticError[] = [];
  const declaredVariables = new Map<string, {
    blockId: string;
    blockType?: BlockType;
  }>();

  // Analyze frontmatter if present
  if (doc.frontmatter) {
    validateFrontmatter(doc.frontmatter, errors);
  }

  // First pass - collect all variable declarations from command blocks
  const blocks = doc.blocks || [];
  blocks.forEach((block: Block) => {
    // Check if it's a directive block
    if (block.type === 'textDirective' || block.type === 'leafDirective' || block.type === 'containerDirective') {
      if (['ai', 'input', 'flow'].includes(block?.name || '')) {
        // Check for variables declared in command token
        const blockVars = Array.isArray(block.content) 
          ? block.content.filter((part): part is VariableReference => 
              typeof part !== 'string' && part.type === 'variable'
            )
          : [];

        blockVars.forEach((varRef: VariableReference) => {
          declaredVariables.set(varRef.name, {
            blockId: block.id,
            blockType: block.name as BlockType
          });
        });
      }
    }
  });

  // Second pass - analyze blocks and check references
  blocks.forEach((block: Block) => {
    analyzeBlock(block, declaredVariables, errors);
  });

  return errors;
}

/**
 * Validates frontmatter content based on AIM spec
 */
function validateFrontmatter(frontmatter: any, errors: SemanticError[]): void {
  // Validate required frontmatter fields
  const requiredFields = ['title'];
  requiredFields.forEach(field => {
    if (!frontmatter[field]) {
      errors.push({
        message: `Missing required frontmatter field: ${field}`,
        location: { line: 1 }
      });
    }
  });
}

/**
 * Analyzes a single block and its children for semantic correctness
 */
function analyzeBlock(
  block: Block, 
  declaredVariables: Map<string, {blockId: string; blockType?: BlockType}>,
  errors: SemanticError[]
): void {
  // Track variable declarations from set blocks
  if (block.type === 'containerDirective' && block.name === 'set' && block.attributes?.id) {
    const varName = block.attributes.id;
    if (declaredVariables.has(varName)) {
      errors.push({
        message: `Variable '${varName}' is already declared`,
        location: {
          blockId: block.id
        }
      });
    }
    declaredVariables.set(varName, {
      blockId: block.id,
      blockType: block.name as BlockType
    });
  }

  // Validate block-specific semantics based on directive name
  if (block.type === 'textDirective' || block.type === 'leafDirective' || block.type === 'containerDirective') {
    switch (block.name) {
      case 'loop':
        validateLoopBlock(block, errors);
        break;
      case 'if':
        validateIfBlock(block, errors);
        break;
      case 'ai':
        validateAIBlock(block, errors);
        break;
      case 'input':
        validateInputBlock(block, errors);
        break;
      case 'media':
        validateMediaBlock(block, errors);
        break;
      case 'flow':
        validateFlowBlock(block, errors);
        break;
    }
  }

  // Check variable references
  checkVariableReferences(block, declaredVariables, errors);

  // Recursively analyze children
  block.children?.forEach(child => {
    analyzeBlock(child, declaredVariables, errors);
  });
}

/**
 * Checks all variable references to ensure they are declared
 */
function checkVariableReferences(
  block: Block,
  declaredVariables: Map<string, {blockId: string; blockType?: BlockType}>,
  errors: SemanticError[]
): void {
  // Check variable references in content
  if (block.content) {
    if (Array.isArray(block.content)) {
      block.content.forEach((part: string | VariableReference) => {
        if (typeof part !== 'string' && part.type === 'variable') {
          const varInfo = declaredVariables.get(part.name);
          if (!varInfo) {
            errors.push({
              message: `Referenced variable '${part.name}' is not declared`,
              location: {
                blockId: block.id
              }
            });
          }
        }
      });
    }
  }

  // Check variable references in attributes
  if (block.attributes) {
    Object.values(block.attributes).forEach(value => {
      if (typeof value === 'string' && value.startsWith('$')) {
        const varName = value.slice(1); // Remove $
        const varInfo = declaredVariables.get(varName);
        if (!varInfo) {
          errors.push({
            message: `Referenced variable '${varName}' in attributes is not declared`,
            location: {
              blockId: block.id
            }
          });
        }
      }
    });
  }
}

/**
 * Validates loop block syntax and attributes
 */
function validateLoopBlock(block: Block, errors: SemanticError[]): void {
  if (!block.attributes?.count && !block.attributes?.in) {
    errors.push({
      message: "Loop block must specify either 'count' or 'in' attribute",
      location: {
        blockId: block.id
      }
    });
  }
  
  if (block.attributes?.in && !block.attributes?.as) {
    errors.push({
      message: "Loop block with 'in' must specify an 'as' iterator variable",
      location: {
        blockId: block.id
      }
    });
  }
}

/**
 * Validates if block syntax and condition
 */
function validateIfBlock(block: Block, errors: SemanticError[]): void {
  if (!block.attributes?.condition) {
    errors.push({
      message: "If block must specify a 'condition' attribute",
      location: {
        blockId: block.id
      }
    });
  }
}

/**
 * Validates AI block required attributes and model compatibility
 */
function validateAIBlock(block: Block, errors: SemanticError[]): void {
  // Required attributes
  const required = ['model'];
  required.forEach(attr => {
    if (!block.attributes?.[attr]) {
      errors.push({
        message: `AI block must specify '${attr}' attribute`,
        location: {
          blockId: block.id
        }
      });
    }
  });

  // Validate model-specific requirements
  if (block.attributes?.type === 'vision' && !block.attributes?.input?.includes('$media')) {
    errors.push({
      message: "Vision AI blocks must reference media input",
      location: {
        blockId: block.id
      }
    });
  }
}

/**
 * Validates input block type and required attributes
 */
function validateInputBlock(block: Block, errors: SemanticError[]): void {
  if (!block.attributes?.type) {
    errors.push({
      message: "Input block must specify input type",
      location: {
        blockId: block.id
      }
    });
    return;
  }

  // Type-specific validation
  switch (block.attributes.type) {
    case 'choice':
      if (!block.attributes.options) {
        errors.push({
          message: "Choice input must specify options",
          location: { blockId: block.id }
        });
      }
      break;
    case 'slider':
      if (!block.attributes.min || !block.attributes.max) {
        errors.push({
          message: "Slider input must specify min and max values",
          location: { blockId: block.id }
        });
      }
      break;
  }
}

/**
 * Validates media block type and source
 */
function validateMediaBlock(block: Block, errors: SemanticError[]): void {
  if (!block.attributes?.type) {
    errors.push({
      message: "Media block must specify media type",
      location: { blockId: block.id }
    });
  }
  if (!block.attributes?.src) {
    errors.push({
      message: "Media block must specify source",
      location: { blockId: block.id }
    });
  }
}

/**
 * Validates flow block source and inputs
 */
function validateFlowBlock(block: Block, errors: SemanticError[]): void {
  if (!block.attributes?.src) {
    errors.push({
      message: "Flow block must specify source file",
      location: { blockId: block.id }
    });
  }
  if (!block.attributes?.inputs) {
    errors.push({
      message: "Flow block must specify input mappings",
      location: { blockId: block.id }
    });
  }
}
