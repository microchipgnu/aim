# AIM TODO List

## Overview
Building AIM (a natural markup language for AI) tooling. This includes:
- A server that can be used to serve AIM documents
- A CLI for creating and managing AIM documents
- A UI for visualizing and executing AIM documents
- An SDK for building AIM documents and executing them
- A website for technical documentation, examples, and tutorials. And a blog.

## High-Level Architecture 

0. **Overall Project** [IN PROGRESS]
    - 🚧 llms.txt
    - ✅ README
    - ✅ LICENSE
    - ✅ Syntax highlighting

1. **AIM Server** [IN PROGRESS]
    - ✅ Create a basic server
    - ✅ Introduce NextJS like routing system
    - ✅ Serve UI to navigate AIM documents
    - ✅ Serve API to execute AIM documents
    - ✅ Serve OpenAPI spec for each route (AIM document)
    - 🚧 Serve MCP to manage AIM documents
    - ✅ Authentication
    - ❌ Payments
    - ❌ Chat mode

2. **AIM CLI** [IN PROGRESS]
    - ✅ Create a basic CLI with Commander.js
    - ✅ Add support for starting server (`aim start`)
    - ✅ Add support for compiling AIM files (`aim compile`)
    - ✅ Add support for running AIM files (`aim run`) 
    - ✅ Add configuration options (port, routes dir, UI)
    - ✅ Add error handling and validation
    - ✅ Add colorful console output with chalk
    - ✅ Add loading spinners with ora
    - ❌ Project compiler
    - ❌ Natural language to project
    - ❌ Compiling a project
    - ❌ Compiling shows the projected cost of running a document
    - ❌ Testing 
    - ❌ Generate diagram flow of how things connect

3. **AIM Gateway** [IN PROGRESS]
    - ✅ Navigate AIM documents
    - ✅ Visualize AIM document
    - ✅ Execute AIM document
    - ✅ Sandbox for editing and running AIM documents
    - 🚧 Sandbox: Syntax highlighting
    - 🚧 Add UI for MCP
    - ❌ Add UI for LLMs
    - ❌ Add chat mode

4. **AIM SDK Core** [IN PROGRESS]
    - ✅ Use Markdoc for parsing
    - ✅ Create custom Markdoc nodes for AI, Loop, etc.
    - ✅ Runtime for executing AIM documents
    - ✅ Add plugin system
    - ✅ Add `tool` concept (maybe via tags)
    - ✅ Introduce adapters
    - ❌ Testing 
    - ❌ 100% compatibility with ai-sdk
 
5. **AIM Website** [IN PROGRESS]
    - ✅ Create Docusaurus site
    - ✅ Syntax highlighting
    - ✅ Blog
        - ✅ Prompt-driven Programming
        - ✅ Syntax Decisions
        - ✅ Vibe checking while hackathoning
    - ✅ Docs
        - ✅ Syntax
        - 🚧 Cookbook

6.  **Starter Project** 
    - ✅ Examples
