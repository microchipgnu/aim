import { aim } from "./packages/runtime";

const { document, execute } = await aim`---
input:
  - name: message
    schema:
      type: string
      default: "default message"
---

True {if="1===1"}
False {else-if="0===1"}

---

::::if{condition}

IF 

:::else-if{condition}

ELSE IF 1

:::

:::else-if{condition2}

ELSE IF 2

:::

--- 

ELSE

::::

---

::::if{condition}

IF 

:::else-if{condition}

ELSE IF 1

:::

:::else-if{condition2}

ELSE IF 2

:::

:::else

ELSE

:::

::::


How late is in :if{condition} Portugal? :else Spain?

`;

console.log(JSON.stringify(document, null, 2));

// const result = await execute({
//     onLog: console.log,
//     variables: {
//         message: "Hello from test!"
//     }
// });


process.exit(0);