import yaml from 'js-yaml'
import { nanoid } from 'nanoid'
import remarkComment from 'remark-comment'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
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

// -----------------------------------------------------------------------
// processVariables: Convert {{VAR}} occurrences to { type: 'variable', ... }
// -----------------------------------------------------------------------
export function processVariables(content: string): Array<string | VariableReference> {
  const variables = $parserState.getState().variables
  const parts: Array<string | VariableReference> = []
  let currentText = ''
  let i = 0

  while (i < content.length) {
    if (content[i] === '{' && content[i + 1] === '{') {
      if (currentText) {
        parts.push(currentText)
        currentText = ''
      }

      i += 2 // Skip '{{'

      // Skip whitespace
      while (i < content.length && /\s/.test(content[i])) {
        i++
      }

      let varName = ''
      while (i < content.length && /[a-zA-Z0-9_.-]/.test(content[i])) {
        varName += content[i]
        i++
      }

      // Skip whitespace and closing }}
      while (i < content.length && content[i] !== '}') {
        i++
      }
      if (i < content.length && content[i] === '}') {
        i++ // Skip first }
      }
      if (i < content.length && content[i] === '}') {
        i++ // Skip second }
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
        })
      } else {
        parts.push({
          type: 'variable',
          name: varName,
          location: {
            blockId: varInfo?.blockId,
            blockType: varInfo?.blockType,
          },
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
export function processAttributes(attributes: Record<string, any>): Record<string, any> {
  const processedAttributes: Record<string, any> = {}

  if (!attributes) return processedAttributes

  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const varName = value.slice(2, -2).trim()
      const varInfo = $parserState.getState().variables.get(varName)
      processedAttributes[key] = {
        type: 'variable',
        name: varName,
        location: {
          blockId: varInfo?.blockId,
          blockType: varInfo?.blockType,
        },
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
export function processNode(node: any): AIMNode | undefined {
  if (node.type === 'yaml') {
    return
  }

  const blockId = node.attributes?.id || nanoid()
  const processedAttributes = processAttributes(node.attributes)

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
    const content = node.value ? processVariables(node.value) : undefined
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
      node.value ? processVariables(node.value) : undefined
    )
  }

  // Process children after parent node is created and registered
  if (node.children && node.children.length > 0) {
    createdNode.children = node.children
      .map(processNode)
      .filter(Boolean) as AIMNode[]
  }

  return createdNode
}

function remarkAIM() {
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
      children: tree.children.map(processNode).filter(Boolean) as AIMNode[],
      ...(file.data.frontmatter && { frontmatter: file.data.frontmatter })
    }
  }
}

// -----------------------------------------------------------------------
// Exported function to process the entire document
// -----------------------------------------------------------------------
export async function processAIMDocument(input: string): Promise<ParsedDocument> {
  resetParserState()

  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkComment)
    .use(remarkDirective)
    .use(remarkAIM)
    .use(remarkStringify)

  // const ast = processor.parse(input)
  // const processedAst = await processor.run(ast)

  const file = await processor.process(input)
  return {
    blocks: (file.data.ast as { children: AIMNode[] }).children,
    frontmatter: file.data.frontmatter as Record<string, any> | undefined
  }
}