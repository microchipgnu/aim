---
title: "Visual Understanding 🖼️"
description: "Understanding visual information"
---


What's in this image?

{% media #image src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" /%}

<!-- OR if you want to use the markdown syntax for a static image -->

<!-- ![Image](https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png) -->

<!-- For prompts with images you need to use a vision model such as GPT-4 Vision, any of the Claude 3 models or Gemini Vision. Check out the [model documentation](https://wordware.notion.site/Models-615b76d7498f4e06ae522a329695da74)

Here we use the **Haiku** model (from the Anthropic Claude 3 family). You can try different models by selecting the generation below and choosing a different vision-enabled model. -->

{% ai #image_understanding model="anthropic/claude-3-haiku" /%}

{% $image_understanding.result %}