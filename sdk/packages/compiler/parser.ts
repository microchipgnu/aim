import yaml from 'js-yaml'
import { nanoid } from 'nanoid'
import remarkComment from 'remark-comment'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkSqueezeParagraphs from 'remark-squeeze-paragraphs'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import remarkToc from 'remark-toc'
import remarkAttributes from 'remark-attributes'
import remarkGfm from 'remark-gfm'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { $parserState, resetParserState, setVariable } from './state'
import type { BlockType, ParsedDocument, VariableReference } from './types'

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------
export interface AIMNode {
  type: BlockType
  id: string
  children: AIMNode[]
  name?: string
  attributes?: Record<string, any>
  content?: string | Array<string | VariableReference>
  frontmatter?: Record<string, any>
}

export interface VariableParserConfig {
  startDelimiter: string
  endDelimiter: string
  variableNamePattern: RegExp
}

const defaultVariableParserConfig: VariableParserConfig = {
  startDelimiter: '{{',
  endDelimiter: '}}',
  variableNamePattern: /[a-zA-Z0-9_.-]/
}

// -----------------------------------------------------------------------
// processVariables: Convert variable expressions to { type: 'variable', ... }
// -----------------------------------------------------------------------
export function processVariables(
  content: string, 
  config: Partial<VariableParserConfig> = {}
): Array<string | VariableReference> {
  const {
    startDelimiter,
    endDelimiter,
    variableNamePattern
  } = { ...defaultVariableParserConfig, ...config }

  const variables = $parserState.getState().variables

  const parts: Array<string | VariableReference> = []
  let currentText = ''
  let i = 0

  while (i < content.length) {
    if (content.startsWith(startDelimiter, i)) {
      if (currentText) {
        parts.push(currentText)
        currentText = ''
      }

      i += startDelimiter.length

      // Skip whitespace
      while (i < content.length && /\s/.test(content[i])) {
        i++
      }

      // Extract the full variable name including dots
      let varName = ''
      while (i < content.length && !content.startsWith(endDelimiter, i)) {
        if (!/\s/.test(content[i])) {
          varName += content[i]
        }
        i++
      }

      if (content.startsWith(endDelimiter, i)) {
        i += endDelimiter.length
      }

      const varInfo = variables.get(varName)

      // Check if this is an input variable from frontmatter
      if (varName.startsWith('input.')) {
        const cleanVarName = varName.replace('input.', '')
        parts.push({
          type: 'variable',
          name: cleanVarName,
          location: {
            blockId: 'frontmatter',
            blockType: 'input',
          },
          contentType: 'string' // Default to string for input variables
        })
      } else {
        parts.push({
          type: 'variable',
          name: varName,
          location: {
            blockId: varInfo?.blockId,
            blockType: varInfo?.blockType,
          },
          contentType: 'string' // Default to string for regular variables
        })
      }
    } else {
      currentText += content[i]
      i++
    }
  }

  if (currentText) {
    parts.push(currentText)
  }

  return parts
}

// -----------------------------------------------------------------------
// createNode: Create a new AIM node with the given properties
// -----------------------------------------------------------------------
export function createNode(
  type: BlockType,
  id: string,
  name: string | undefined,
  attributes: Record<string, any>,
  content: Array<string | VariableReference> | undefined
): AIMNode {
  // Register this node's ID in parser state before processing children
  setVariable({
    name: id,
    info: { blockId: id, blockType: type }
  })

  return {
    type,
    name,
    id,
    children: [], // Children will be added after node creation
    attributes,
    ...(content && { content })
  }
}

// -----------------------------------------------------------------------
// Process attributes to handle variable references
// -----------------------------------------------------------------------
export function processAttributes(
  attributes: Record<string, any>,
  config: Partial<VariableParserConfig> = {}
): Record<string, any> {
  const processedAttributes: Record<string, any> = {}

  if (!attributes) return processedAttributes

  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string') {
      const processed = processVariables(value, config)
      if (processed.length === 1) {
        processedAttributes[key] = processed[0]
      } else {
        processedAttributes[key] = processed
      }
    } else {
      processedAttributes[key] = value
    }
  }

  return processedAttributes
}

// -----------------------------------------------------------------------
// Process a single node in the AST
// -----------------------------------------------------------------------
export function processNode(
  node: any, 
  config: Partial<VariableParserConfig> = {}
): AIMNode | undefined {
  if (node.type === 'yaml') {
    return
  }

  const blockId = node.attributes?.id || nanoid()
  
  // Add hProperties attributes if they exist
  const hProperties = node.data?.hProperties || {}
  
  const processedAttributes = processAttributes({
    ...hProperties,
    ...(node.attributes || {})
  }, config)

  // Add language to attributes for code blocks
  if (node.type === 'code') {
    let language = node.lang;
    if (!language) {
      // Try to detect language from content
      const content = node.value || '';
      if (content.includes('console.log') || content.includes('const ') || content.includes('let ') || content.includes('function')) {
        language = 'javascript';
      } else if (content.includes('print(') || content.includes('def ') || content.includes('import ')) {
        language = 'python';
      } else {
        language = 'text';
      }
    }
    processedAttributes.language = language;
  }

  // Create the node first to register it in parser state
  let createdNode: AIMNode

  // Handle directives (textDirective, leafDirective, containerDirective)
  if (node.type.endsWith('Directive')) {
    const content = node.value ? processVariables(node.value, config) : undefined
    createdNode = createNode(
      node.type as BlockType,
      blockId,
      node.name,
      processedAttributes,
      content
    )
  } else {
    // Handle other node types
    createdNode = createNode(
      node.type as BlockType,
      blockId,
      node.name,
      processedAttributes,
      node.value ? processVariables(node.value, config) : undefined
    )
  }

  // Process children after parent node is created and registered
  if (node.children && node.children.length > 0) {
    createdNode.children = node.children
      .map((childNode: any) => processNode(childNode, config))
      .filter(Boolean) as AIMNode[]
  }

  return createdNode
}

function remarkAIM(config: Partial<VariableParserConfig> = {}) {
  return function transformer(tree: any, file: any) {
    // Process frontmatter
    visit(tree, 'yaml', (node: { value: string }) => {
      try {
        const parsed = yaml.load(node.value)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          file.data.frontmatter = parsed as Record<string, any>
        }
      } catch (err) {
        console.error('Error parsing frontmatter:', err)
      }
    })

    file.data.ast = {
      type: 'root' as BlockType,
      id: nanoid(),
      children: tree.children.map((node: any) => processNode(node, config)).filter(Boolean) as AIMNode[],
      ...(file.data.frontmatter && { frontmatter: file.data.frontmatter })
    }
  }
}

// -----------------------------------------------------------------------
// Exported function to process the entire document
// -----------------------------------------------------------------------
export async function processAIMDocument(
  input: string, 
  options: { 
    addToc?: boolean, 
    addMdx?: boolean,
    variableParser?: Partial<VariableParserConfig>
  } = { 
    addMdx: false, 
    addToc: false 
  }
): Promise<ParsedDocument> {
  resetParserState()

  const processor = unified()
    .use(remarkParse)
    .use(remarkAttributes as any)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)

  if (options.addToc) {
    processor.use(remarkToc)
  }

  if (options.addMdx) {
    processor.use(remarkMdx)
  }

  processor
    .use(remarkSqueezeParagraphs)
    .use(remarkComment)
    .use(remarkDirective)
    .use(remarkAIM, options.variableParser)
    .use(remarkStringify)

  const file = await processor.process(input)
  return {
    blocks: (file.data.ast as { children: AIMNode[] }).children,
    frontmatter: file.data.frontmatter as Record<string, any> | undefined
  }
}

const doc = await processAIMDocument(`---
input:
  - name: question
    type: string
    description: "The math question to be answered"
    default: "What is 2 + 2?"
  - name: answer
    type: string
    description: "The answer to the math question"
    default: "4"
---

# Hello World {id=test test=v[input.answer]}

this is a var v[input.answer]

`, {
  addMdx: false,
  addToc: false,
  variableParser: {
    startDelimiter: 'v[',  
    endDelimiter: ']',
    variableNamePattern: /[a-zA-Z][a-zA-Z0-9_.-]*/ // Start with letter, then alphanumeric/underscore/hyphen/dot
  }
})
