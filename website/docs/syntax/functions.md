---
title: "Functions"
sidebar_position: 6
---

Functions are callable from the body of the document, inside an annotation, or within tag attributes.

Functions are comma-separated. Trailing commas are not supported in function calls.

```aim
{% functionName(arg1, arg2) %}
```

AIM comes out-of-the-box with six built-in functions: `equals`, `and`, `or`, `not`, `default`, and `debug`.

- **equals**: Compares two values and returns `true` if they are equal, otherwise `false`.

- **default**: Returns the second parameter if the first parameter is `undefined`
- **debug**: Serializes the value as JSON and logs it to the console.

### And/Or/Not
Use these logical operators to create complex conditional logic within `if` tags:

- **and**: Returns `true` only when both arguments evaluate to `true`. For example, `and($isAdmin, $hasPermission)` ensures both conditions are met.
- **or**: Returns `true` when at least one argument is `true`. For example, `or($isLoggedIn, $isGuest)` allows either condition to pass.
- **not**: Inverts a boolean value - returns `false` for `true` inputs and vice versa. Useful for checking if something is absent, like `not($isBlocked)`.

These functions can be combined for more sophisticated conditions. For example:
`and(not($isBlocked), or($isAdmin, $hasPermission))` checks that a user isn't blocked AND is either an admin OR has permission.

```aim
This is always shown
{% if and(not($a), or($b, $c)) %}
This is shown only if $a is falsy and either $b or $c is true.
{% /if %}
```

### Equals

Use this function to compare two values.

```aim
{% if equals($a, $b) %}
  $a and $b are equal
{% /if %}
```

### Default

This function is useful to set a value for a variable that might not exist.

```aim
{% if default($showPrompt, true) %}
Hey there!
{% /if %}
```

### Debug

This function simply renders the value as a serialized JSON value in the document. This can be useful for determining what value is in a variable.

```aim
{% debug($myVar) %}
```
