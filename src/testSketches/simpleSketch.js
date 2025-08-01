const simpleSketch = `Player:
	props:
		name: string
		age: number
		aka: string
		health: 100
		position: { x: number, y: number }
		speed: {dx: number = 10, dy: number = 10}

	methods:
		shout
		fight
		sing

Weapon:
	props:
		name: string
		power: 100
		owner: Player

	wound()
	fight()`
