import { WebSocket } from 'ws';
import { Location } from './location.ts';
import { Item } from './item.ts'
import { Character } from './character.ts'

class GameState {
    flags: { [key: string]: any } = {};
    locations: Map<string | number, Location> = new Map();
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
        (global as any).print = this.quote.bind(this);
        (global as any).input = this.query.bind(this);
        (global as any).getKey = this.getKey.bind(this);
        (global as any).pause = this.pause.bind(this);
        (global as any).color = this.color.bind(this);
        (global as any).locate = this.locate.bind(this);
        (global as any).optionBox = this.optionBox.bind(this);
        (global as any).clear = this.clear.bind(this);
        this._save = save;
        this._load = load;
    }
    loadScenario(locations: { [key: string | number]: Location }) {
        this.locations = new Map(Object.entries(locations).map(([k, v]) => [isNaN(Number(k)) ? k : Number(k), v]));
        for (let location of this.locations.values()) {
            // since we have to link locations by id initially, we now link to the actual location object
            location.adjacent = new Map(Object.entries(location._adjacent).map(([direction, id]) => [direction, this.locations.get(id) || location]));
            // link characters to locations
            for (let character of location.characters) {
                character.location = location;
                character.game = this;
            }
        }
    }
    quote(text?: string, extend?: any) {
        this.send({ command: 'print', text, extend });
    }
    clear() {
        this.send({ command: 'clear' });
    }
    locate(x: number, y?: number) {
        this.send({ command: 'locate', x, y });
    }
    color(fg: string, bg?: string) {
        this.send({ command: 'color', fg, bg });
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
        this.send({ command: 'optionBox', title, options, colors, default_option });
        return new Promise<number>((resolve) => {
            this.on_input = (response: string) => {
                console.log(response);
                resolve(parseInt(response));
            };
        });
    }
    query(prompt: string): Promise<string> {
        this.send({ command: 'input', prompt });
        return new Promise<string>((resolve) => {
            this.on_input = resolve;
        });
    }
    getKey(options?: string[]): Promise<string> {
        if (options) {
            options = options.map(option => option.slice(0, 1).toLowerCase());
        }
        this.send({ command: 'getKey', options });
        console.log('waiting for key');
        return new Promise<string>((resolve) => {
            this.on_input = (input: string) => {
                console.log('got key', input);
                if (!options || options.includes(input.toLowerCase())) {
                    console.log('input accepted');
                    resolve(input);
                }
                else {
                    this.send({ command: 'getKey', options });
                }
            };
        });
    }
    pause(seconds: number) {
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
        player.addAction('get', player.getItem)
        player.addAction('drop', player.dropItem)
        player.location = this.locations.values().next().value;
        let command = ''
        while (command != 'exit') {
            let player_input = await this.query('What do you want to do?');
            let [command, ...args] = player_input.split(' ');
            if (player.actions.has(command)) {
                player.getAction(command)?.(args.join(' '));
            } else {
                for (let item of player.inventory) {
                    if (item.name === command) {
                        item.getAction(command)?.(args.join(' '));
                    }
                }
                this.quote('I don\'t understand that command');
            }
        }
    }
    async process_input(input: string = '') {
        if (this.on_input) {
            this.on_input(input);
            return;
        }
    }
    animate_characters() {
        this.characters.forEach(character => {
            if (character.act) {
                character.act(this);
            }
        });
    }
    find_character(name: string) {
        name = name.toLowerCase();
        return this.characters.find(character => character.name.toLowerCase() === name);
    }
    find_location(name: string) {
        name = name.toLowerCase();
        return Array.from(this.locations.values()).find(location => location.name.toLowerCase() === name);
    }
    find_all_locations(name: string) {
        name = name.toLowerCase();
        return Array.from(this.locations.values()).filter(location => location.name.toLowerCase() === name);
    }
    get characters() {
        return Array.from(this.locations.values()).flatMap(location => [...location.characters]);
    }
}

export { GameState };