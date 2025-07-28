const syntaxExample =`ClassName:
  props:
    p privateProp: string = 'I"m a public string'
   	publicProp: number = 0
    s staticProp: boolean = true
  methods:
    publicMethod(message: string){
			console.log( this.#privateProp, message )// indent body!
			this.publicProp += 1
			}
    p privateMethod(secretCode: number)
    a abstractMethod(times: number, flag: boolean)

SubClassName > className:
  props:
    publicSubProp: number
    p privateSubProp: string = "hidden"
    s staticSubProp: number = 999
  methods:
    publicSubMethod(value: number): boolean
    p privateSubMethod()
    s staticSubMethod(config: object)

AnotherClassName:
  props:
    publicRef: className
    s staticConfigFlag: boolean = false
  methods:
    run()
    p setup()
    a createDefault(): anotherClassName

schema schemaName:
  props:
    publicField: string
    p privateField: number
    s staticField: boolean = false

functions:
	globalFunction(username: string, age: number)
	anotherGlobalFunction(key: string)
	andTheLastOne(data: object): boolean

`
const game = `AnimationEngine:
	props:
		frameRate: number = 60
		isRunning: boolean = false
	methods:
		start
		stop
		update

Weapon:
	props:
		p name: string = 'myName'
		damage: number = 10
		range: number = 1
	methods:
		p use(target: Player)

Sword > Weapon:
	props:
		sharpness: number = 50
	methods:
		slash(target: Player)

Bow > Weapon:
	props:
		arrowCount: number = 20
	methods:
		shoot(target: Player)

Staff > Weapon:
	props:
		magicPower: number = 100
	methods:
		castSpell(spellName: string, target: Player)

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

Warrior > Player:
	props:
		strength: number = 10
	methods:
		fight()

Archer > Player:
	props:
		accuracy: number = 75
	methods:
		shoot(target: Player)

Mage > Player:
	props:
		mana: number = 100
	methods:
		castSpell(spellName: string, target: Player)

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
	`
const game2 = `PlayerA:
	props:
		p name: string = 'mySecretName'
		health: number = 100
		position: {
			x: number = 0
			y: number = 0
			}
	methods:
		a start()
			console.log(\`Starting player with health \${ this.health }' \`)
		stop()
			console.log(\`Stopping player with health \${ this.health - 20 } \`)
		p update()
			this.health -= 1

AnimationEngine:
	props:
		frameRate: number = 60
		isRunning: boolean = false
	methods:
		start
		stop
		s update

Weapon:
	props:
		name: string
		damage: number = 10
		range: number = 1
	methods:
		use(target: Player)

Sword > Weapon:
	props:
		sharpness: number = 50
		methods:
		slash(target: Player)

Bow > Weapon:
	props:
		arrowCount: number = 20
	methods:
	shoot(target: Player)

Staff > Weapon:
	props:
		magicPower: number = 100
	methods:
		castSpell(spellName: string, target: Player)

Player:
	props:
		name: string
		p health: number = 100
		position: {
			x: number = 0
			y: number = 0
			}
		weapon: Weapon = null
	methods:
		move(direction: string)
		takeDamage(amount: number)
		isAlive()

Warrior > Player:
	props:
		strength: number = 10
	methods:
		fight()

Archer > Player:
	props:
		accuracy: number = 75
	methods:
		shoot(target: Player)

Mage > Player:
	props:
		mana: number = 100
	methods:
		castSpell(spellName: string, target: Player)

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

schema WeaponType:
	props:
		id: string
		damageMade: number
		usage: string`


const ttt = `Board:
	props:
		rows: number = 3
		cols: number = 3
		grid: string[][] = []
	methods:
		init(rows: number, cols: number)
		reset()
		isFull(): boolean
		setCell(x: number, y: number, symbol: string): boolean
		getCell(x: number, y: number): string

Player:
	props:
		name: string
		symbol: string = "X"
	methods:
		makeMove(board: Board, x: number, y: number)

WinChecker:
	props:
		winLength: number = 3
	methods:
		check(board: Board): string 	// returns winning symbol or ""

Game:
	props:
		board: Board
		winChecker: WinChecker
		players: Player[] = []
		currentPlayerIndex: number = 0
		winner: Player = null
		isDraw: boolean = false
	methods:
		start()
		makeMove(x: number, y: number)
		switchPlayer()
		checkGameOver()

functions:
	main()


schema WeaponType:
	props:
		id: string
    	baseDamage: number = 10

class Weapon:
	props:
		weaponType: WeaponType`


const simpleSketch = `Player:
	props:
		name: string
		age: number
		aka: string
		health: 100
		position: {
			x: number
			y: number
			}
		speed: {
			dx: number = 10
			dy: number = 10
			}

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

export const examples = [ syntaxExample, game, game2, ttt, simpleSketch ]
