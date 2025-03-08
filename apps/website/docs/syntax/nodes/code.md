---
title: "Code"
sidebar_position: 1
---

The `fence` node is used to execute code. It allows you to execute code and return the result.

Right now, only JavaScript is supported. It uses [QuickJS](https://sebastianwessel.github.io/quickjs/) to execute the code.

Set the `id` attribute to a unique identifier for referencing the result. The result will be stored under the `id` variable.

```aim

The next piece of code will return "Hello, world!"

\`\`\`js {% #code %} <!-- ticks are escaped here, remove the slashes in your code -->

const result = "Hello, world!";


export default result;
\`\`\`

{% $code.result %} 


<!-- It will return "Hello, world!" -->
```

#### Accessing variables

You can access runtime variables within the `fence` node. Runtime variables are injected into the `__AIM_VARIABLES__` environment variable.

```aim

{% set #var string="Hello, world!" /%}

\`\`\`js {% #code %}

const result = aimVariables.var.string;

export default result;
\`\`\`

{% $code.result %}
```


#### Async/Await

You can use `async`/`await` to execute asynchronous code.

```aim
\`\`\`js {% #code %}

const result = async (username) => await fetch(`https://api.github.com/users/${username}`);

export default await result("microchipgnu");
\`\`\`

{% $code.result %}
```