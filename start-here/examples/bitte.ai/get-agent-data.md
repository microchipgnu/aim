---
input:
  - name: agentId
    type: string
    description: "The agent to use"
---

{% debug($frontmatter) %}


```js {% #getBitteData %}
const getBitteData = async (vars) => {
    const response = await fetch('https://wallet.bitte.ai/api/ai-assistants');
    const data = await response.json();
    
    // Return the first agent from the list
    const firstAgent = data[0];
    return {
        id: firstAgent.id,
        name: firstAgent.name,
        accountId: firstAgent.accountId,
        description: firstAgent.description,
        instructions: firstAgent.instructions,
        tools: firstAgent.tools
    };
}

export default await getBitteData(JSON.parse(env.__AIM_VARIABLES__ || '{}'));

```

{% debug($getBitteData) %}

List information about the agent

{% ai #agentDescription model="openai/gpt-4o-mini" /%}

{% $agentDescription.result %}