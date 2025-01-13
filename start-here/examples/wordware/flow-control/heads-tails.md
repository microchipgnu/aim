---
title: "Heads or Tails 🪙"
description: "A coin flip game with conditional responses"
---

We just tossed a coin, was it heads or tails?

The last tosses were heads, heads, tails, heads, tails, heads, heads, heads.

Output 'heads' or 'tails' only.

{% ai #flip model="openai/gpt-4o-mini" /%}

<!-- We reference the value of the flip in this if-else block -->

{% if flip == "heads" %}

Heads, I win!

Should I gloat? Write yes or no only.

{% ai #gloat model="google/gemma-2" /%}

<!-- It's possible to nest container blocks inside other container blocks. In fact you can put all the same things in the body of a container block as you can in a prompt -->

{% if gloat == "yes" %}

Now, write a gloating song. Output just the song.

{% ai #song model="openai/gpt-4o-mini" /%}

{% /if %}

{% if gloat != "yes" %}

Now, be humble and congratulate the loser on their well played match.

{% ai #humble model="openai/gpt-4o-mini" /%}

{% /if %}

{% if flip == "tails" %}

Tails, you lose! 😏

{% /if %}

{% if flip != "heads" && flip != "tails" %}

Neither heads nor tails, everyone loses �

{% /if %}

{% $flip.result %}