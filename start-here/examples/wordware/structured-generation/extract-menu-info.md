---
title: "Extract Menu Information 🍽️"
description: "Extract structured menu information from an image"
input:
  - name: image
    type: image/png|image/jpeg|image/jpg|image/webp
    description: "The menu image to extract information from"
---

v[input.image]

<!-- First we'll extract the text from the image using Gemini -->

::ai{#extracted_text model="google/gemini-1.5-pro"}

<!-- Now we'll structure the extracted text into a specific JSON format -->

Based on the text above, format the menu information into the following structure:
{
  "restaurant_name": string,
  "menu_items": [
    {
      "name": string,
      "price": number,
      "description": string
    }
  ]
}

::ai{#structured_menu model="openai/gpt-4"}

<!-- OR -->

::structured-output{#structured_menu_2 type="json" schema="{restaurant_name: string, menu_items: [{name: string, price: number, description: string}]}"}

Output: 

Name: v[structured_menu_2.restaurant_name]

:::loop{for=v[structured_menu_2.menu_items]}

Name: v[item.name]

Price: v[item.price]

Description: v[item.description]

:::


