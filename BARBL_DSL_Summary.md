# BARBL DSL - JavaScript OOP Sketching Tool

## What is BARBL?

BARBL is your personal DSL (Domain-Specific Language) designed for effortless sketching of JavaScript OOP designs. Write your class structures, properties, and methods in a clean, concise syntax that generates:

- Language-neutral JSON describing your design
- Mermaid UML diagrams to visualize your classes and relationships
- JavaScript code skeletons for your designs

All updates are live, with instant parsing and rendering to multiple views.

---

## Syntax Overview

### Classes

```yaml
ClassName:
	props:
		propertyName: type = defaultValue
		nestedProperty: {
			subProp: type = defaultValue
		}
	methods:
		methodName(param1: type, param2: type)
		methodWithoutParams
```

### Inheritance

```yaml
ChildClass > ParentClass:
	props:
		# ...
	methods:
		# ...
```

### Properties

- Defined under `props:`
- Format: `name: type = defaultValue` (defaultValue is optional)
- Nested properties supported with indentation and braces `{}`

### Methods

- Defined under `methods:`
- Format: `methodName(params)`
- Method bodies can be added in extended syntax (with indented code blocks)

### Functions & Schemas

- Global `functions:` section for standalone functions
- `schema` keyword for defining reusable data structures

### Indentation

- Indentation is critical and must be consistent
- Tabs are interpreted as 2 spaces in BARBL DSL

---

## How to Use

1. **Write your class sketches in the BARBL DSL syntax** — describing classes, props, methods, and relationships.

2. **Load the DSL into your tool or edit live in the BARBL text editor with live update** to:
   - Parse it into a language-neutral JSON structure.
   - Generate Mermaid UML diagrams showing class inheritance and composition.
   - Generate JavaScript code skeletons for your classes and methods.

3. **Live editing** — As you type, the tool updates JSON, UML, and JS outputs automatically.

4. **Download your work**:
   - Markdown summary of your sketch
   - Mermaid UML SVG diagrams
   - JavaScript code skeletons

---

## Example BARBL DSL Sketch

```yaml
AnimationEngine:
	props:
		frameRate: number = 60
		isRunning: boolean = false
	methods:
		start
		stop
		update

Weapon:
	props:
		name: string = 'myName'
		damage: number = 10
		range: number = 1
	methods:
		use(target: Player)

Sword > Weapon:
	props:
		sharpness: number = 50
	methods:
		slash(target: Player)

Player:
	props:
		name: string
		health: number = 100
		position: {
			x: number = 0
			y: number = 0
		}
		weapon: Weapon = null
	methods:
		move(direction: string)
		takeDamage(amount: number)
		isAlive()

Game:
	props:
		title: string = "My Game"
		animationEngine: AnimationEngine
		players: Player[] = []
		activePlayer: Player = null
	methods:
		start()
		stop()
		switchActivePlayer(index: number)

functions:
	init()
	shutdown()
```

---

Load the DSL into your tool or edit live in the BARBL text editor with live update!

---

Enjoy designing your JavaScript OOP structures with BARBL!
