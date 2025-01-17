---
title: "🤔 Just Answer"
sidebar_position: 1
---


Here we get a model to answer wordy maths questions by just outputting the answer. The results aren't good!

**Try these questions**

1.  There are 15 trees in the grove. Grove workers will plant trees in the grove today. After they are done, there will be 21 trees. How many trees will the grove workers plant today?
    
2.  From March to August, Sam made $460 doing 23 hours of yard work. However, from September to February, Sam was only able to work for 8 hours. If Sam is saving up to buy a video game console that costs $600 and has already spent $340 to fix his car, how many more hours does he need to work before he can buy the video game console?
    
3.  There were nine computers in the server room. Five more computers were installed each day, from Monday to Thursday. How many computers are in the server room at the end of the week?
    
4.  The flowers cost $9, the clay pot costs $20 more than the flower, and the bag of soil costs $2 less than the flower. How much does it cost to plant the flowers?
    
5.  Of the 90 people on William's bus, 3/5 were Dutch. Of the 1/2 of the Dutch who were also American, 1/3 got window seats. What's the number of Dutch Americans who sat at the windows?
    

**Correct answers**

1.  6
    
2.  16
    
3.  29
    
4.  45
    
5.  9 

## Code

```aim
---
title: "Just answer the question"
description: "A simple example of how to use AIM to create a document."
input:
  - name: question
    type: string
    description: "The math question to be answered"
---

Answer the question: {% $frontmatter.input.question %}

Output the number and only the number.

{% ai #answer model="openai/gpt-4o-mini" /%}

{% $answer.result %}

```