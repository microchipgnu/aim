import { aim } from "index";

const doc = await aim`---
execute: true
---

{% set #var array=["John", "Jane", "Jim"] boolean=true /%}


{% loop #greetUser items=$var.array %}

{% set #var2 object={name: $greetUser.item, age: 21} boolean=true /%}

STRING: {% $greetUser.item %}

NAME: {% $var2.object.name %}

{% /loop %}
`

console.log(doc.warnings);


console.log(await doc.execute({
    onLog: (message) => console.log(message),
}));

process.exit(0);