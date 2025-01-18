---
input:
  - name: duration
    type: number
    description: "The duration of the meditation in minutes"
  - name: purpose
    type: string
    description: "The purpose of the meditation"
  - name: beginner
    type: boolean
    description: "Whether the meditation is beginner friendly"
  - name: maxTechniques
    type: number
    description: "The maximum number of techniques to use"
---

Generate a {% $frontmatter.input.duration %} -minute meditation script for {% $frontmatter.input.purpose %}. Study and emulate these reference examples:
  
      OPENING EXAMPLE:
      """
      Welcome to this 10 minute deep rest meditation.
      
      This is a powerful tool that can allow you to control the relaxation state of your nervous system, and restore your mental and physical vigor. It can be done at anytime of day or nigiht.
  
      Its very simple to do. You want to do this session seated, or lying down. So if you're not already seated, or lying down, please do so now. You also want to cloe your eyes. So if your eyes aren't already close, please close them now.
  
      Throughout this session you want to breathe normally, unless instructed to do otherwise. One pattern of breathing you'll be asked to do is to inhale deeply, ideally through your nose. If you can't do it through your nose, inhale throug your mouth.
      """
  
      BREATHING GUIDANCE EXAMPLE:
      """
      Try that now.
  
      Inhale deeply though your noise and then exhale all of the air thourgh your mouth.
  
      Let's do that again.
  
      Inhale deeply thoughr your nose and then exhale completely through your mouth. And as you exhale, exhale through thinly parsed lips, as if through a small straw.
  
      Let's repeat that two more times.
      """
  
      TECHNIQUE GUIDANCE EXAMPLE:
      """
      Now in your minds eye, imagine yourself looking over yourself, looking at your body which is seated or lying down and imagine holding a flashlight, or a spotlight, and directing it at your feet. Focus your attention on whatever it is that your feet happen to be in contact with...
      """
  
      Create a similar script for {% $frontmatter.input.purpose %} following this structure:
      1. Opening Section (like the first example):
         - Practical explanation
         - When to use it
         - Simple setup instructions
         - Clear breathing guidance
         {% $frontmatter.input.beginner ? '- More detailed explanations of benefits' : '- Brief but informative context' %}
  
      2. Main Experience (exactly {% $frontmatter.input.maxTechniques %} techniques):
         - Use "in your mind's eye" style guidance
         - Use metaphors like spotlight/flashlight
         - Give alternatives
         - Emphasize user control
  
      3. Closing:
         - Guide movement back
         - Explain what was experienced
         - Connect to {% $frontmatter.input.purpose %}
  
      Return JSON with:
      {
        "sections": [
          {
            "type": "breathing" | "technique",
            "techniqueName": string (internal reference only),
            "content": string,
            "durationInSeconds": number,
            "pauseAfterInSeconds": number
          }
        ],
        "techniques": string[],
        "purposeAlignment": string
      }`;

{% ai #prompt model="openai/gpt-4o" /%}

{% $prompt.result %}