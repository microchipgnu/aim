---
title: "Google Search 🔎"
description: "Searches Google for the given query"
input:
  - name: query
    type: string
    description: "The search query"
---

<!-- This tool uses the Serper API to search Google and return relevant results -->

Searching Google for: v[input.query]

```js
// Reference the input query and remove any quotation marks
const input = v[input.query].trim().replace(/^"+|"+$/g, '');

const hl = "en";
const gl = "us";
const maxResults = 10;
const serperApiKey = "8f1bba1ec8674a3caf4fe3b1e4c87ec93e0a04e3"; 

// Call the serper API
const response = await fetch(`https://google.serper.dev/search?q=${input}&gl=${gl}&hl=${hl}`, {
            method: 'POST',
            headers: {
                "X-API-KEY": serperApiKey,
                "Content-Type": "application/json"
            }
        });

if (!response.ok) {
   throw new Error(`Request failed with status: ${response.status}`);
}

const results = await response.json();

const snippets = [];

if (results.answerBox) {
  const answerBox = results.answerBox;
  if (answerBox.answer) return answerBox.answer;
  if (answerBox.snippet) return answerBox.snippet.replace("\n", " ");
  if (answerBox.snippetHighlighted) return answerBox.snippetHighlighted.join(", ");
}

if (results.knowledgeGraph) {
  const kg = results.knowledgeGraph;
  const title = kg.title;
  const entityType = kg.type;

  if (entityType) snippets.push(`${title}: ${entityType}.`);
  const description = kg.description;
  if (description) snippets.push(description);
  for (const attribute in kg.attributes) {
    snippets.push(`${title} ${attribute}: ${kg.attributes[attribute]}.`);
  }
}

results.organic.slice(0, maxResults).forEach(result => {
  if (result.snippet) snippets.push(`${result.snippet}, ${result.link}`);
  for (const attribute in result.attributes) {
    snippets.push(`${attribute}: ${result.attributes[attribute]}.`);
  }
});

if (snippets.length === 0) {
  return "No good Google Search Result was found";
}

return snippets.join("\n- ");
```