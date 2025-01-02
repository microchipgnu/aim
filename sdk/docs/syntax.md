## **1. Syntax Overview**

### **1.1 Document Structure**

An AIM document consists of:

- **Global Frontmatter**: YAML metadata defining document-level settings.
- **Commands and Components**: Start with `::` and use indentation for nested content. It uses the directive syntax of the [Generic directives/plugins syntax](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444) proposal.
- **Variables**: Prefixed with `$` for both definition and usage.
- **Plain Text**: Standard Markdown treated as content within commands. 

**Example:**

```markdown
---
title: Example AIM Document
author: Jane Doe
date: 2024-11-28
---

# Welcome to AIM

::set{#userName value="Alice"}

Hello, $userName!

::ai{#greetUser model="openai/gpt-4o-mini"}

$greetUser
```

### **1.2 Key Constructs**

#### **1.2.1 Commands and Components**

- `set`: Define variables.
- `input`: Collect user input dynamically.
- `media`: Embed multimedia content (images, videos, audio).
- `ai`: Integrate AI inference tasks.
- `if`, `elif`, `else`: Conditional logic.
- `for` or `loop`: Iterate over collections.
- `def`, `call`: Define and invoke reusable content blocks.
- `flow`: Reference external AIM flows.
- More commands to be defined

#### **1.2.2 Variables and Substitutions**

- Variables are defined using `set` and referenced as `$variableName`.

**Example:**

```markdown
::set{#userName value="Alice"}
```

---

## **2. Global Frontmatter**

Define global metadata and settings for the document.

**Example:**

```yaml
---
title: AIM Example Document
author: John Doe
date: 2024-11-28
description: A comprehensive example combining all AIM features.
---
```

---

## **3. Constructs and Syntax**

### **3.1 Variables**

Define reusable variables for dynamic substitution.

**Syntax:**

```markdown
/set $variableName = value
```

**Example:**

```markdown
/set $greeting = "Welcome to AIM!"

$greeting
```

---

### **3.2 Inputs**

Collect user input dynamically.

**Syntax:**

```markdown
/input $inputID
  @type = "inputType"
  @placeholder = "Placeholder text"
  @label = "Prompt or label"
  @validation = "Validation rules"
  [Additional properties]

[Content (optional)]
```

**Examples:**

- **Text Input:**

  ```markdown
  /input $userName
    @type = "text"
    @placeholder = "Enter your name"
    @validation = "required"
    @label = "What is your name?"
  ```

- **Choice Input:**

  ```markdown
  /input $userRole
    @type = "choice"
    @options:
      - "Admin"
      - "User"
      - "Guest"
    @placeholder = "Select your role"
    @label = "Select your role:"
  ```

- **Slider Input:**

  ```markdown
  /input $difficulty
    @type = "slider"
    @min = 1
    @max = 10
    @step = 1
    @label = "Rate the difficulty of this task"
  ```

---

### **3.3 Multimedia Embedding**

Embed images, videos, audio, and animations into documents.

**Syntax:**

```markdown
/media
  @type = "mediaType"
  @src = "file_path_or_url"
  @alt = "Alternative text"
  @caption = "Optional caption"
  [Additional properties]

[Content or description (optional)]
```

**Examples:**

- **Image:**

  ```markdown
  /media
    @type = "image"
    @src = "https://example.com/image.png"
    @alt = "A descriptive image"
    @caption = "This is an example image."
  ```

- **Video:**

  ```markdown
  /media
    @type = "video"
    @src = "https://example.com/video.mp4"
    @controls = true
    @autoplay = false
    @loop = true
    @caption = "This is an example video."
  ```

---

### **3.4 AI Blocks**

Integrate AI tasks for text, image, audio, and video processing.

**Syntax:**

```markdown
/ai $inferenceID
  @type = "taskType"
  @model = "modelName"
  @input = "file_path_or_url_or_text"
  @temperature = 0.7
  @max_tokens = 100
  @output_format = "text/image/audio"
  [Additional properties]

[Prompt or instructions (optional)]
```

**Examples:**

- **Text Generation:**

  ```markdown
  /ai $generateSummary
    @model = "gpt-4"
    @input = "Summarize the following text: $documentContent"
    @temperature = 0.5
    @max_tokens = 150
    @output_format = "text"
  ```

- **Text-to-Image:**

  ```markdown
  /ai $generateLandscape
    @type = "image"
    @model = "dalle-2"
    @input = "A sunset over a mountain range"
    @temperature = 0.7
    @output_format = "image"

  Generate a high-quality image.
  ```

---

### **3.5 Conditional Logic**

Conditions evaluate logical expressions to control content rendering.

**Syntax:**

```markdown
/if $condition
  [Content if condition is true]
/else
  [Content if condition is false]
```

**Examples:**

- **String Comparison:**

  ```markdown
  /if $user.role == "admin"
    Welcome, Admin!
  /else
    Access Denied.
  ```

- **Pattern Matching:**

  ```markdown
  /if $message contains "thank you"
    You're welcome!
  ```

---

### **3.6 Loops**

Iterate over arrays or collections. Filters refine the iteration.

**Syntax:**

```markdown
/for $item in $collection
  [Filter conditions (optional)]
  [Content using $item]
```

**Example:**

```markdown
/for $product in $products
  /if $product.stock > 0
    - $product.name: $ $product.price
```

---

### **3.7 Reusable Templates**

Define and reuse content templates.

**Syntax:**

```markdown
/def templateName($param1, $param2, ...)
  [Template content using $param1, $param2, ...]

/call templateName($value1, $value2, ...)
```

**Example:**

```markdown
/def userCard($name, $email)
  ## $name
  Email: $email

/call userCard("Alice", "alice@example.com")
```

---

### **3.8 Flow Calls**

Reuse workflows from other `.aim` files.

**Syntax:**

```markdown
/flow $flowCallID
  @src = "filePath"
  @inputs:
    $inputName1: value1
    $inputName2: value2
  [Additional properties]

[Instructions for flow call (optional)]
```

**Example:**

```markdown
/flow $registrationFlow
  @src = "registerUser.aim"
  @inputs:
    $name: $userName
    $role: $userRole
  @logging = true
  @retryPolicy = 3

Run the registration process for the user.
```
---

## **4. Pattern Language Notation**

The AIM Pattern Language is used in constructs like `/if` and `/for` to match user input or data structures. This section uses a modified BNF (Backus-Naur Form) notation to define the pattern syntax and rules.

### **4.1 Notation Key**

- **Literals**: Written in bold (e.g., `**/if**`).
- **Non-Terminals**: UPPERCASE words represent abstract concepts (e.g., `PATTERN_EXPRESSION`).
- **Optional Elements**: Surrounded by `[ ]` (e.g., `[CONDITION]`).
- **Repetition**: Indicated with `*` for zero or more, `+` for one or more (e.g., `(PATTERN)*`).
- **Alternatives**: Separated by `|` (e.g., `STRING | WILDCARD`).

### **4.2 Syntax Definitions**

#### **4.2.1 Top-Level Syntax**

```plaintext
AIM_FILE ::= FRONTMATTER CONTENT_BLOCK*
FRONTMATTER ::= "---" YAML_METADATA "---"
CONTENT_BLOCK ::= MARKDOWN | AIM_BLOCK
AIM_BLOCK ::= IF_BLOCK | FOR_BLOCK | AI_BLOCK | DEF_BLOCK | INPUT_BLOCK | MEDIA_BLOCK | FLOW_BLOCK 
```

#### **4.2.2 If-Else Block**

```plaintext
IF_BLOCK ::= "/if" CONDITION NEWLINE INDENTED_CONTENT [ELIF_BLOCK] [ELSE_BLOCK]
CONDITION ::= VARIABLE COMPARATOR VALUE | PATTERN
COMPARATOR ::= "==" | "!=" | "contains" | "matches"
VALUE ::= STRING | REGEX
PATTERN ::= STRING | WILDCARD | REGEX
```

#### **4.2.3 For Block**

```plaintext
FOR_BLOCK ::= "/for" VARIABLE "in" COLLECTION NEWLINE INDENTED_CONTENT
COLLECTION ::= ARRAY | OBJECT
```

#### **4.2.4 AI Block**

```plaintext
AI_BLOCK ::= "/ai" VARIABLE NEWLINE INDENTED_PROPERTIES [INDENTED_CONTENT]
PROPERTIES ::= (PROPERTY)*
```

#### **4.2.5 Def and Call Blocks**

```plaintext
DEF_BLOCK ::= "/def" IDENTIFIER "(" PARAMETERS ")" NEWLINE INDENTED_CONTENT
CALL_BLOCK ::= "/call" IDENTIFIER "(" ARGUMENTS ")"
```

---

## **5. Semantics**

### **5.1 Variable Semantics**

- **Scope**:
  - **Global Variables**: Persist throughout the document.
  - **Local Variables**: Limited to specific blocks or functions.

**Example:**

```markdown
/set $globalVar = "Global Value"

/for $item in $items
  /set $localVar = "Local Value"
  $localVar

$globalVar
```

### **5.2 AI Block Semantics**

AI blocks (`/ai`) invoke external AI models. Properties include:

- `@type`: Specifies the AI task type (`text`, `image`, `audio`, `video`, `vision`, etc.).
- `@model`: Specifies the AI model to use.
- `@input`: The prompt or data provided to the model.
- `@output_format`: Expected output type (`text`, `image`, etc.).

**Example:**

```markdown
/ai $generateSummary
  @model = "gpt-4"
  @input = "Summarize this article."
  @output_format = "text"
```

### **5.3 Conditional Semantics**

Conditions evaluate logical expressions to control content rendering.

**Example:**

```markdown
/if $user.isLoggedIn
  Welcome, $user.name!
/else
  Please log in.
```

### **5.4 Loop Semantics**

Loops iterate over arrays or collections. Filters can refine the iteration.

**Example:**

```markdown
/for $product in $products
  /if $product.stock > 0
    - $product.name: $ $product.price
```

---

## **6. Execution Flow**

1. **Parse Global Frontmatter**: Extract document-level metadata and settings.
2. **Evaluate Content Blocks Sequentially**: Process each block in order.
3. **Resolve Variables and Substitutions**: Replace variables with their values.
4. **Match Patterns and Execute Logic**: Evaluate conditions and loops.
5. **Invoke AI Models**: Execute AI tasks in `/ai` blocks.
6. **Render Multimedia Content**: Embed media as specified.
7. **Generate Final Output**: Produce the rendered document with all content.

---

## **7. Full Example Document**

```markdown
---
title: AIM Comprehensive Example
author: John Doe
date: 2024-11-28
description: A comprehensive example combining all AIM features.
---

# Welcome to AIM

/set $userName = "Alice"

/ai $greeting
  @model = "gpt-4"
  @input = "Generate a personalized greeting for $userName."
  @output_format = "text"

$greeting.output

/media
  @type = "image"
  @src = "https://example.com/welcome.png"
  @alt = "Welcome Image"
  @caption = "A warm welcome!"

/if $userName == "Alice"
  Welcome back, $userName!
/else
  Welcome, guest!

/set $products = [
  {"name": "Product A", "price": 10.0, "stock": 5},
  {"name": "Product B", "price": 15.0, "stock": 0},
  {"name": "Product C", "price": 20.0, "stock": 2}
]

/for $product in $products
  /if $product.stock > 0
    - $product.name: $ $product.price

/def userCard($name, $email)
  ## $name
  Email: $email

/call userCard("Bob", "bob@example.com")
```

---

## **8. Multimodal AI Workflow Example**

```markdown
---
title: Multimodal AI Workflow
description: A comprehensive example combining multimedia, inputs, and AI.
---

# Welcome to the Multimodal AI Workflow

## Step 1: Collect User Information

/input $userName
  @type = "text"
  @label = "What's your name?"
  @placeholder = "Enter your name"

## Step 2: Analyze an Image

/media
  @type = "image"
  @src = "sample/landscape.jpg"
  @alt = "Natural landscape"
  @caption = "A beautiful landscape for analysis"

/ai $landscapeAnalysis
  @type = "vision"
  @model = "gpt-4-vision"
  @input = "$media.output"
  @temperature = 0.7
  @max_tokens = 200

Describe the key elements and composition of this landscape image.

## Step 3: Generate a Story Based on the Analysis

/ai $storyGenerator
  @model = "gpt-4"
  @input = "$landscapeAnalysis.output"
  @temperature = 0.8
  @max_tokens = 500

Create a short story inspired by this landscape description.

## Step 4: Create an Illustration

/ai $storyIllustration
  @type = "image"
  @model = "dalle-3"
  @input = "$storyGenerator.output"
  @style = "digital art"
  @size = "1024x1024"

Generate an artistic illustration based on the story.

/flow $saveFeedback
  @src = "feedback.aim"
  @inputs:
    $userName: $userName
    $rating: $userFeedback
    $storyOutput: $storyGenerator.output
  @logging = true

Save user feedback and story for analysis.
```

---

## **9. Conclusion**

The AI Markup Language (AIM) empowers creators to build rich, interactive, and intelligent documents by combining the simplicity of Markdown with advanced programming constructs and AI capabilities. By using `@` for all properties, the syntax becomes more consistent and intuitive, enhancing both readability and ease of use. With AIM, users can seamlessly integrate AI tasks, collect user input, embed multimedia content, and design dynamic workflows—all within a unified and accessible syntax.

---

This official specification updates and unifies the features and syntax from the original AIM Language Specification, incorporating the consistent use of `@` for all properties to provide a comprehensive guide for users to create advanced AIM documents.