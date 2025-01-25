---
title: Get Agent Data
description: Get agent data from bitte.ai
input:
  - name: agentId
    type: string
    description: "The agent to use"
---


```js {% #getBitteData %}

const getBitteData = async () => {

    const agentId = aimVariables.frontmatter.input.agentId;

    const response = await fetch('https://wallet.bitte.ai/api/ai-assistants');
    const data = await response.json();
    
    const searchTerm = agentId.toLowerCase().trim();
    
    // First try exact match by id
    let agent = data.find(agent => agent.id === searchTerm);
    
    // If not found, try similarity search across multiple fields
    if (!agent) {
        const agents = data.map(agent => {
            // Combine all searchable fields into a single array
            const searchableFields = [
                agent.id,
                agent.name, 
                agent.description,
                agent.accountId,
                agent.instructions,
                // Include tool names and descriptions if they exist
                ...(agent.tools || []).flatMap(tool => [tool.name, tool.description])
            ].filter(Boolean); // Remove any null/undefined values

            // Calculate similarity score using multiple matching strategies
            const score = searchableFields.reduce((maxScore, field) => {
                const fieldLower = field.toLowerCase();
                
                // Prioritize exact matches and full containment
                if (fieldLower === searchTerm) return 1.0;
                if (fieldLower.includes(searchTerm)) return Math.max(maxScore, 0.9);
                
                // For partial matches, combine word and character level similarity
                const searchWords = searchTerm.split(' ');
                const fieldWords = fieldLower.split(' ');
                
                // Word-level matching with length validation and bidirectional inclusion
                const wordScore = searchWords.reduce((sum, sword) => {
                    if (sword.length <= 2) return sum; // Skip very short words
                    const hasMatch = fieldWords.some(fword => 
                        fword.includes(sword) || sword.includes(fword)
                    );
                    return hasMatch ? sum + 1 : sum;
                }, 0) / Math.max(1, searchWords.length) * 0.7; // Weight word matches more heavily
                
                // Character-level matching for handling typos and short terms
                const uniqueChars = new Set(searchTerm);
                const charScore = Array.from(uniqueChars).reduce((sum, char) =>
                    fieldLower.includes(char) ? sum + 1 : sum
                , 0) / uniqueChars.size * 0.3;
                
                return Math.max(maxScore, wordScore + charScore);
            }, 0);

            return { agent, score };
        });

        // Find the agent with highest similarity score above threshold
        const bestMatch = agents.reduce((best, current) => 
            current.score > best.score ? current : best
        , { score: 0 });

        if (bestMatch.score > 0.3) {
            agent = bestMatch.agent;
        }
    }
    
    if (!agent) {
        throw new Error(`Agent with id or similar text '${agentId}' not found. Please try a different search term.`);
    }

    return {
        id: agent.id,
        name: agent.name,
        accountId: agent.accountId,
        description: agent.description,
        instructions: agent.instructions,
        tools: agent.tools
    };
}

const agentData = await getBitteData();

// export default await getBitteData(JSON.parse(env).frontmatter.input.agentId);

return agentData;

```

{% debug($getBitteData) %}

Summarize the agent's instructions in a simple sentence

{% ai #agentDescription model="openai/gpt-4o" /%}

{% $agentDescription.result %}