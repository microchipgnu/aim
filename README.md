# **AI Markup Language (AIM)**

AI Markup Language (AIM) is a markup language designed to create interactive, intelligent, and multimodal documents. 

By merging the simplicity of Markdown with advanced programming constructs and multimedia capabilities, AIM enables users to build dynamic workflows, integrate AI tasks, and deliver rich, interactive content. 

AIM documents have the file extension `.aim`, `.aimd` or `.md`.

## **Architecture**

The AIM project is structured as a monorepo containing several key packages:

### Core Packages

1. **@aim-sdk/core**
   - Parses AIM documents
   - Transforms AIM syntax into executable code
   - Handles directives and command processing
   - Manages variable substitution and context
   - Executes compiled AIM documents
   - Manages AI model integrations
   - Handles state management
   - Processes multimedia content

2. **@aim-sdk/adapters**
   - Provides integrations with various execution environments
   - Includes adapters for code execution (e2b, quickjs)
   - Enables extensibility for different runtime environments

3. **CLI (aimx)**
   - Command-line interface for AIM projects
   - Project initialization and management
   - Development server controls
   - Build and deployment tools

### Applications

1. **Gateway**
   - Serves as the main API gateway for AIM projects
   - Handles authentication and user management
   - Manages project storage and versioning
   - Provides RESTful APIs for client applications

2. **Inference Server**
   - Handles AI model inference requests
   - Manages model loading and execution
   - Optimizes resource usage for AI operations

3. **Website**
   - Documentation and marketing website
   - User guides and tutorials
   - API documentation

### Project Structure

```
aim/
├── cli/ # Command line interface
├── sdk/ # Core SDK packages
│ └── packages/
│   ├── core/ # Core functionality
│   └── server/ # Server implementation
├── website/ # Documentation website
└── start-here/ # Getting started guide and template project
```

## **Getting Started**

To get started with AIM, please refer to the [Getting Started](./start-here/README.md) guide.

## **Documentation**

### Key Features

1. **Document Processing**
   - Markdown-compatible syntax
   - Custom directives and commands
   - Variable substitution
   - AI model integration

2. **Runtime Capabilities**
   - Multiple AI provider support
   - Multimedia content handling
   - Interactive components
   - State management

3. **Development Tools**
   - Local development server
   - Hot reload support
   - Build optimization
   - Deployment utilities

---

For VS Code (and other editors based on VS Code), you can install the [AIM Syntax](https://marketplace.cursorapi.com/items?itemName=stripe.markdoc-language-support) extension.