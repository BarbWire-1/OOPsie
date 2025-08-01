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
