// Core types
import type { MarkedToken } from 'marked';

export interface Block {
    type: BlockType;
    id: string; // Unique identifier for the block
    name?: string;
    children: Block[];
    attributes?: Record<string, any>;
    frontmatter?: Record<string, any>;
    content?: string | Array<string | VariableReference>;
  }
  
export interface VariableReference {
    type: 'variable';
    name: string;
    location: {
      blockId: string | undefined; // ID of block where variable is defined, or undefined if not found
      blockType: BlockType | undefined; // Type of block where variable is defined, or undefined if not found
    };
    contentType: string; // The data type of the variable's value (e.g. 'string', 'number', 'boolean')
  }
  
export interface ParsedDocument {
    frontmatter?: Record<string, any>;
    blocks: Block[];
  }

export type BlockType = 
  | MarkedToken['type']
  | 'text'
  | 'code'
  | 'image'
  | 'variable'
  | 'structured'
  | 'default'
  | 'ai'
  | 'set'
  | 'loop'
  | 'for'
  | 'string'
  | 'input'
  | 'media'
  | 'flow'
  | 'textDirective'
  | 'leafDirective'
  | 'containerDirective'
  | 'replicate'
  | 'container';