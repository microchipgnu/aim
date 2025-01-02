# **AI Markup Language (AIM)**

AI Markup Language (AIM) is a markup language designed to create interactive, intelligent, and multimodal documents. 

By merging the simplicity of Markdown with advanced programming constructs and multimedia capabilities, AIM enables users to build dynamic workflows, integrate AI tasks, and deliver rich, interactive content. 

AIM documents have the file extension `.aim`, `.aimd` or `.md`.

## **Architecture**

The AIM project is structured as a monorepo containing several key packages:

### Core Packages

1. **@aim-sdk/compiler**
   - Parses AIM documents
   - Transforms AIM syntax into executable code
   - Handles directives and command processing
   - Manages variable substitution and context

2. **@aim-sdk/runtime**
   - Executes compiled AIM documents
   - Manages AI model integrations
   - Handles state management
   - Processes multimedia content

3. **@aim-sdk/server**
   - Serves AIM projects
   - Handles API endpoints
   - Manages routing and request processing
   - Provides development server capabilities

4. **CLI (aimd)**
   - Command-line interface for AIM projects
   - Project initialization and management
   - Development server controls
   - Build and deployment tools

### Project Structure

```
aim/
├── cli/ # Command line interface
├── sdk/ # Core SDK packages
│ ├── packages/
│ │ ├── compiler/ # AIM compiler
│ │ ├── runtime/ # Runtime engine
│ │ ├── server/ # Server implementation
│ │ └── examples/ # Example implementations
│ └── docs/ # SDK documentation
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

