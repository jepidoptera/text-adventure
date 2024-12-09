import { WebSocket } from 'ws';
import { Location } from './location.js';
import { Item } from './item.js'
import { Character } from './character.js'

class GameState {
    static current: GameState | null = null;
    private static contextLock: Promise<void> = Promise.resolve();
    private static contextRelease: (() => void) | null = null;
    flags: { [key: string]: any } = {};
    private _locations: Map<string | number, Location> = new Map();
    private batchCommands: { [key: string]: string | number | undefined }[] = [];
    on_input: ((input: string) => void) | null = null;
    send: (output: object) => void;
    _save: (saveName: string, gameState: object) => Promise<void>;
    _load: (saveName: string) => Promise<object | null>;
    constructor(
        wss: WebSocket,
        save: (saveName: string, gameState: object) => Promise<void>,
        load: (saveName: string) => Promise<object | null>
    ) {
        this.send = (output: object) => wss.send(JSON.stringify(output));
        this._save = save;
        this._load = load;
        (global as any).print = this.quote.bind(this);
        (global as any).input = this.query.bind(this);
        (global as any).getKey = this.getKey.bind(this);
        (global as any).pause = this.pause.bind(this);
        (global as any).color = this.color.bind(this);
        (global as any).locate = this.locate.bind(this);
        (global as any).optionBox = this.optionBox.bind(this);
        (global as any).clear = this.clear.bind(this);
    }
    loadScenario(locations: { [key: string | number]: Location }) {
        this._locations = new Map(Object.entries(locations).map(([k, v]) => [k.toString(), v]));
        for (let [key, location] of this.locations.entries()) {
            // since we have to link locations by id initially, we now link to the actual location object
            location.key = key.toString();
            location.game = this;
            location.adjacent = new Map(Object.entries(location.adjacent_ids).map(([direction, id]) => [direction, this.locations.get(id) || location]));
            // link characters to game
            for (let character of location.characters) {
                character.game = this;
                character.relocate(location);
            }
        }
    }
    quote(text?: string, extend?: any) {
        this.batchCommands.push({ command: 'print', text, extend });
    }
    clear() {
        this.batchCommands.push({ command: 'clear' });
    }
    locate(x: number, y?: number) {
        this.batchCommands.push({ command: 'locate', x, y });
    }
    color(fg: string, bg?: string) {
        this.batchCommands.push({ command: 'color', fg, bg });
    }
    optionBox({
        title,
        options,
        colors,
        default_option
    }: {
        title: string,
        options: string[],
        colors?: { box: { fg: string, bg: string }, text: { fg: string, bg: string }, background: string },
        default_option?: number
    }) {
        console.log(options);
        this.send(this.batchCommands);
        this.batchCommands = [];
        this.send([{ command: 'optionBox', title, options, colors, default_option }]);
        return new Promise<number>((resolve) => {
            this.on_input = (response: string) => {
                console.log(response);
                resolve(parseInt(response));
            };
        });
    }
    query(prompt: string): Promise<string> {
        this.send(this.batchCommands);
        this.batchCommands = [];
        this.send([{ command: 'input', prompt }]);
        return new Promise<string>((resolve) => {
            this.on_input = resolve;
        });
    }
    getKey(options?: string[]): Promise<string> {
        if (options) {
            options = options.map(option => option.slice(0, 1).toLowerCase());
        }
        this.send(this.batchCommands);
        this.batchCommands = [];
        this.send([{ command: 'getKey', options }]);
        console.log('waiting for key');
        return new Promise<string>((resolve) => {
            this.on_input = (input: string) => {
                console.log('got key', input);
                if (!options || options.includes(input.toLowerCase())) {
                    console.log('input accepted');
                    resolve(input);
                }
                else {
                    this.send([{ command: 'getKey', options }]);
                }
            };
        });
    }
    pause(seconds: number) {
        this.send(this.batchCommands);
        this.batchCommands = [];
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
    async start() {
        // sample game setup
        this.quote('Welcome to the game!');
        this.quote('press any key');
        await this.getKey();
        this.clear();
        const opt = await this.optionBox({
            title: 'Adventure 2 Setup',
            options: ['Start New', 'Load Game', 'Exit']
        })
        this.quote('You chose ' + opt);
        if (opt === 0) {
            this.quote('Starting new game');
        } else if (opt === 1) {
            this.quote('Loading game');
            // todo: load game
        } else {
            this.quote('Exiting game');
            return;
        }
        const classOptions = ['Warrior', 'Mage', 'Rogue']
        const className = classOptions[await this.optionBox({
            title: "choose your class:",
            options: classOptions
        })];
        let player = new Character({ name: "you" });
        switch (className) {
            case 'Warrior':
                player.strength = 10;
                player.max_hp = 50;
                player.max_sp = 40;
                player.max_mp = 5;
                player.abilities = { 'berserk': 5 }
                break;
            case 'Mage':
                player.strength = 5;
                player.max_hp = 30;
                player.max_sp = 20;
                player.max_mp = 50;
                player.magic_level = 10;
                player.abilities = { 'bolt': 5 }
                break;
            case 'Rogue':
                player.strength = 8;
                player.max_hp = 40;
                player.max_sp = 40;
                player.max_mp = 10;
                player.abilities = { 'sneak': 5 }
                break;
        }
        player.addAction('', async () => { });
        player.addAction('n', async function () { await player.go('north') });
        player.addAction('s', async function () { await player.go('south') });
        player.addAction('e', async function () { await player.go('east') });
        player.addAction('w', async function () { await player.go('west') });
        player.addAction('get', (itemName) => player.getItem(itemName || ''));
        player.addAction('drop', (itemName) => player.dropItem(itemName || ''));
        player.location = this.locations.values().next().value || null;
        let command = ''
        while (command != 'exit') {
            let player_input = await this.query('What do you want to do?');
            let [command, ...args] = player_input.split(' ');
            if (player.actions.has(command)) {
                player.getAction(command)?.(args.join(' '));
            } else {
                for (let item of player.items) {
                    if (item.name === command) {
                        item.getAction(command)?.(args.join(' '));
                    }
                }
                this.quote('I don\'t understand that command');
            }
        }
    }
    shutdown() {
        // clear intervals or whatever
        return;
    }
    async enterContext() {
        // Wait for any existing context to be released
        await GameState.contextLock;

        // Create a new lock
        GameState.contextLock = new Promise(resolve => {
            GameState.contextRelease = resolve;
        });

        GameState.current = this;
        (global as any).print = this.quote.bind(this);
        (global as any).input = this.query.bind(this);
        (global as any).getKey = this.getKey.bind(this);
        (global as any).pause = this.pause.bind(this);
        (global as any).color = this.color.bind(this);
        (global as any).locate = this.locate.bind(this);
        (global as any).optionBox = this.optionBox.bind(this);
        (global as any).clear = this.clear.bind(this);
    }

    exitContext() {
        if (GameState.current === this) {
            GameState.current = null;
            if (GameState.contextRelease) {
                GameState.contextRelease();
                GameState.contextRelease = null;
            }
        }
    }

    // Modify your process_input method
    async process_input(input: string = '') {
        this.enterContext();
        try {
            if (this.on_input) {
                this.on_input(input);
            }
        } finally {
            this.exitContext();
        }
    }
    animate_characters() {
        this.characters.forEach(character => {
            if (character.turn) {
                character.turn();
            }
        });
    }
    find_character(name: string) {
        name = name.toLowerCase();
        const character = this.characters.find(character => character.name.toLowerCase() === name);
        if (!character) {
            console.log(`could not find character ${name}`);
        }
        return character;
    }
    get locations() {
        return this._locations;
    }
    find_location(name: string) {
        name = name.toLowerCase();
        const location = Array.from(this.locations.values()).find(location => location.name.toLowerCase() === name || location.key == name) || null;
        if (!location) {
            console.log(`could not find location ${name}`);
        }
        return location;
    }
    find_all_locations(name: string) {
        name = name.toLowerCase();
        return Array.from(this.locations.values()).filter(location => location.name.toLowerCase() === name);
    }
    get characters() {
        return Array.from(this.locations.values()).flatMap(location => [...location.characters]);
    }
}

function withGameState<This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
    return function (this: This, ...args: Args): Return {
        const gameState = (this as any).game

        if (!gameState) {
            throw new Error('No GameState found for object');
        }

        gameState.enterContext();
        try {
            return target.apply(this, args);
        } finally {
            gameState.exitContext();
        }
    }
}
export { GameState, withGameState };