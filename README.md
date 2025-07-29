# WIP
# Readable on purpose. Practical in result.
**OOPsie** keeps syntax simple, so your ideas stay front and center — while the tool handles code scaffolding, relationships, and output behind the scenes.

It’s not flashy — it just works. Sketch with structure, get real output. That’s **OOPsie**.


## Check it out:

[![Netlify Status](https://api.netlify.com/api/v1/badges/8f737f09-6cf8-44bc-9d21-a855cccc8c28/deploy-status)](https://oopsiebarbl.netlify.app/)

You can find a demo usage at [assets/demo.mp4](assets/demo.mp4).

## ✏️ Syntax Overview

OOPsie is a lightweight, indentation-based DSL for sketching object-oriented designs. It emphasizes readability and fast structure definition for scaffolding and diagram generation.




### 📐 Indentation Rules

- Indentation is **strict** and uses **tabs** (not spaces).
- All top-level entries begin at **indent level 0**.
- Inside classes, structure is defined by increasing indentation:
  - **Level 0**: class names, `functions:`, `schema:`
  - **Level 1**: `props:` and `methods:` blocks inside a class
  - **Level 2**: actual property/method definitions
  - **Level 3** (optional): method/function body

---

### 🧱 Top-Level Constructs

- `ClassName:` — defines a class
  (inheritance: `Child > Parent`)
- `functions:` — declares global functions
- `schema:` — reserved for future metadata/config

---

### 🔹 Inside a Class

- `props:` — declares properties
- `methods:` — declares methods
Both are **indented one level** under the class name.

---

### 🧩 Property & Method Syntax

Properties and methods can be declared in various ways:

**Properties:**

```zsh
propertyName: type
propertyTypeWithDefault: type = defaultValue
```

**Methods:**

```zsh
methodName
methodNameWithParams(type: param1, type: param2)
methodNameWithParamsAndBody(type: param1, type: param2)
	console.log(`do something with any this[prop] or param`)
```

Example:

```zsh
props:
	health:number = 100
	name:string
	createdAt: Date
methods:
	takeDamage(amount: number)
	isAlive
```

- **Types are optional** (especially for JS output)
- Types are **recommended** for UML, conversion to typed languages (e.g., TypeScript, Java, etc.)

### 🏷 Modifiers

You can prefix properties or methods with:

- `a` — **abstract**
- `s` — **static**
- `p` — **private**

Example with modifiers:

```zsh
props:
	p health:number = 100
	s version:string = "1.0"
methods:
	a move(direction: string)
```

---

### 🧠 Optional Bodies

Function or method bodies can be included (indented one level further):

```zsh
methods:
	attack(target: Player)
		console.log("Attacking", target.name)
		target.health -= 10
```

---

> OOPsie is not for writing full implementations — it's for fast OOP scaffolding, diagramming, and code generation in multiple target formats (JS, UML, Mermaid, etc.).

---
🤝 Contributing & Feedback
OOPsie is still a work in progress, and I'd love to hear your thoughts!

Whether you want to:

* Suggest syntax improvements
* Add new output formats (like Python, TypeScript, C++, etc.)
* Help with code generation, refactoring, or testing
* Share feedback or criticisms
* Extend the DSL for interfaces, mixins, or design patterns

You're very welcome to join in!

Feel free to:

* Open an issue
* Fork and submit a PR
* Reach out with questions, feature ideas, or just say hi 🙂

Let’s shape this together into something fun and useful for rapid OOP sketching.
