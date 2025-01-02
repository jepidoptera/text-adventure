import { WebSocket } from 'ws';
import { Landmark, Location, findPath } from './location.js';
import { Item, ItemParams, Container } from './item.js'
import { Character, Buff } from './character.js'
import { randomChoice } from './utils.js'

abstract class GameState {
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
    itemTemplates: { [key: string]: (game: GameState) => Item } = {};
    locationTemplates: { [key: string]: (game: GameState, args: any) => Location } = {};
    buffTemplates: { [key: string]: ({ character, power, duration }: { character: Character, power: number, duration: number }) => Buff } = {};
    abstract readonly characterTemplates: Record<string, (game: GameState) => Character>;
    player!: Character;
    playerData: any = {};
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
        let player = new Character({ name: "you", game: this });
        switch (className) {
            case 'Warrior':
                player.base_stats.strength = 10;
                player.base_stats.max_hp = 50;
                player.base_stats.max_sp = 40;
                player.base_stats.max_mp = 5;
                player.abilities = { 'berserk': 5 }
                break;
            case 'Mage':
                player.base_stats.strength = 5;
                player.base_stats.max_hp = 30;
                player.base_stats.max_sp = 20;
                player.base_stats.max_mp = 50;
                player.base_stats.magic_level = 10;
                player.abilities = { 'bolt': 5 }
                break;
            case 'Rogue':
                player.base_stats.strength = 8;
                player.base_stats.max_hp = 40;
                player.base_stats.max_sp = 40;
                player.base_stats.max_mp = 10;
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

    // ^^ webinterface stuff ^^ //
    // vv   gamestate stuff  vv //

    async loadScenario(
        scenario: {
            locations: {
                [key: string | number]: {
                    name: string,
                    description?: string,
                    adjacent: { [key: string]: string | number },
                    x?: number,
                    y?: number,
                    landmarks?: {
                        name: string,
                        description?: string,
                        text?: string | string[],
                        items?: { key?: string, name?: string, quantity?: number }[]
                    }[],
                    items?: {
                        key?: string,
                        name?: string,
                        quantity?: number
                    }[],
                    characters?: {
                        key?: string,
                        name?: string,
                        respawn?: boolean,
                        respawnLocation?: string | number,
                        respawnCountdown?: number,
                        attackPlayer?: boolean,
                        chase?: boolean,
                        following?: string,
                        actionQueue?: string[],
                        timeCounter?: number,
                        buffs?: { name: string, power: number, duration: number }[],
                        items?: { key?: string, name?: string, quantity: number }[],
                        isPlayer?: boolean
                    }[]
                }
            },
            flags: { [key: string]: any }
        }
    ) {
        console.log('loading scenario');
        this.locations.clear();
        for (let [key, location] of Object.entries(scenario.locations)) {
            this._locations.set(key.toString(), new Location({
                game: this,
                name: location.name,
                key: key.toString(),
                description: location.description || '',
            }));
        }
        for (let [key, location] of this.locations.entries()) {
            console.log(`loading location ${key}`);
            const temp = scenario.locations[key];
            for (let [direction, adjacent] of Object.entries(temp.adjacent || {})) {
                const neighbor = this.find_location(adjacent.toString());
                if (neighbor) location.adjacent.set(direction, neighbor);
                else (console.log(`could not find location ${adjacent} ${direction} of ${location.name}`));
            }
            for (let character of temp.characters || []) {
                if (!character.isPlayer) {
                    if (character.key) character.name = ''
                    this.addCharacter({
                        location: location,
                        name: character.key || character.name || '',
                        ...character
                    });
                } else {
                    console.log(`found player at ${location.name}`);
                    this.playerData = { location: location, ...character };
                    console.log(this.playerData);
                }
            }
            for (let landmark of temp.landmarks || []) {
                const newLandmark = new Landmark({
                    name: landmark.name,
                    description: landmark.description || '',
                    text: Array.isArray(landmark.text) ? landmark.text?.join('\n') : landmark.text,
                });
                for (let item of landmark.items || []) {
                    this.addItem({ name: item.key || item.name || '', quantity: item.quantity || 1, container: newLandmark.contents });
                }
                location.addLandmark(newLandmark);
            }
            for (let item of temp.items || []) {
                this.addItem({ name: item.key || item.name || '', quantity: item.quantity || 1, container: location });
            }
        }
        this.flags = scenario.flags;
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

    find_all_characters(key: string | string[]) {
        if (typeof key === 'string') {
            key = [key];
        }
        const chars = [] as Character[];
        for (let name of key) {
            name = name.toLowerCase();
            chars.push(...this.characters.filter(character => character.name.toLowerCase() === name || character.key == name));
        }
        return chars;
    }

    addCharacter<K extends keyof this['characterTemplates']>(
        {
            name,
            location,
            respawn = true,
            respawnLocation = null,
            respawnCountdown = 0,
            attackPlayer = false,
            chase = false,
            following = '',
            actionQueue = [],
            timeCounter = 0,
            persist = true,
            items,
            buffs
        }: {
            name: K,
            location: string | number | Location,
            respawn?: boolean,
            respawnLocation?: string | number | null,
            respawnCountdown?: number,
            attackPlayer?: boolean,
            chase?: boolean,
            following?: string,
            actionQueue?: string[],
            timeCounter?: number,
            persist?: boolean,
            buffs?: { name: string, power: number, duration: number }[],
            items?: { name?: string, key?: string, quantity: number }[]
        }
    ) {

        if (!Object.keys(this.characterTemplates).includes(name.toString())) {
            console.log('invalid character name', name);
            return;
        }
        const newCharacter = this.characterTemplates[name as keyof typeof this.characterTemplates](this);
        Object.assign(newCharacter, { respawnLocation, respawnCountdown, attackPlayer, chase, following, actionQueue, timeCounter, persist });
        newCharacter.respawns = respawn;
        newCharacter.key = name.toString();
        const newLocation = location instanceof Location ? location : this.find_location(location.toString());
        newLocation?.addCharacter(newCharacter);
        newCharacter.location = newLocation;
        if (items) {
            newCharacter.clearInventory();
            for (let item of items) {
                this.addItem({ name: item.key || item.name || '', quantity: item.quantity, container: newCharacter.inventory });
            }
        }
        if (buffs) {
            for (let buff of buffs) {
                newCharacter.addBuff(this.buffTemplates[buff.name]({ character: newCharacter, power: buff.power, duration: buff.duration }));
            }
        }
        if (newCharacter?.respawns && newLocation && !respawnLocation) {
            newCharacter.respawnLocation = newLocation.key
        }
        console.log(`Created ${newCharacter.name} at ${newLocation?.name}`)
        return newCharacter;
    }

    async removeCharacter(character: string | number | Character | null) {
        if (typeof character === 'number') {
            character = character.toString();
        }
        if (typeof character === 'string') {
            character = this.find_character(character) || null;
        }
        if (!character) {
            console.log('character not found');
            return;
        }
        character.location?.removeCharacter(character);
    }

    private get locations() {
        return this._locations;
    }

    find_location(name: string | number) {
        name = name.toString().toLowerCase();
        const location = Array.from(this.locations.values()).find(location => location.name.toLowerCase() === name || location.key == name) || null;
        if (!location) {
            console.log(`could not find location ${name}`);
        }
        return location;
    }

    find_all_locations(name: string | number | string[] | number[]) {
        if (typeof name === 'number') {
            name = [name.toString()];
        } else if (typeof name === 'string') {
            name = [name];
        }
        const locs = [] as Location[];
        for (name of name) {
            name = name.toString().toLowerCase();
            locs.push(...Array.from(this.locations.values()).filter(location => location.name.toLowerCase() === name || location.key == name));
        }
        return locs;
    }

    get characters() {
        return Array.from(this.locations.values()).flatMap(location => [...location.characters]);
    }

    addLocation<K extends keyof this['locationTemplates']>(
        {
            name,
            x,
            y,
        }: {
            name: K, x: number, y: number
        }
    ) {
        if (!Object.keys(this.locationTemplates).includes(name.toString())) {
            console.log('invalid location name', name);
            return;
        }
        const newLocation = this.locationTemplates[name as keyof typeof this.locationTemplates](this, { x, y });
        newLocation.game = this;
        newLocation.key = name.toString();
        let i = 0;
        while (this.locations.has(newLocation.key + ` ${i}`)) { i++ }
        newLocation.key += ` ${i}`;
        this.locations.set(newLocation.key, newLocation);
        return newLocation;
    }

    async removeLocation(location: string | number | Location | null) {
        if (typeof location === 'number') {
            location = location.toString();
        }
        if (typeof location === 'string') {
            location = this.find_location(location);
        }
        if (!location) {
            console.log('location not found');
            return;
        }
        this.locations.delete(location.key);
    }

    addItem<K extends keyof typeof this['itemTemplates']>(
        {
            name,
            quantity = 1,
            container,
        }: {
            name: K,
            quantity?: number,
            container?: Container
        }
    ) {
        if (!Object.keys(this.itemTemplates).includes(name.toString())) {
            console.log('invalid item name', name);
            return;
        }
        const newItem = this.itemTemplates[name as keyof typeof this.itemTemplates](this);
        newItem.quantity = quantity;
        newItem.key = name.toString();
        if (container) container.add(newItem);
        return newItem;
    }

    async spawnArea(
        areaName: keyof typeof this.locationTemplates,
        areaSize: number,
        connectedness: number = 0.5,
        portality: number = 0) {

        // spawn the void!
        const origin = this.addLocation({ name: areaName, x: 0, y: 0 })
        if (!origin) return [];
        const grid = new Map([[`0,0`, origin]])

        const adjacents = {
            'north': [0, -1],
            'east': [1, 0],
            'west': [-1, 0],
            'south': [0, 1],
            'northeast': [1, -1],
            'northwest': [-1, -1],
            'southeast': [1, 1],
            'southwest': [-1, 1]
        }
        const oppositeDirection: {} = {
            'north': 'south',
            'east': 'west',
            'west': 'east',
            'south': 'north',
            'northeast': 'southwest',
            'northwest': 'southeast',
            'southeast': 'northwest',
            'southwest': 'northeast'
        } as const
        type Direction = keyof typeof oppositeDirection;
        const alterjacents = {
            'east': [1, 0],
            'north': [0, -1],
            'south': [0, 1],
            'west': [-1, 0],
            'northwest': [-1, -1],
            'northeast': [1, -1],
            'southwest': [-1, 1],
            'southeast': [1, 1],
        }

        function vacancies(location: Location): [number, number][] {
            return Object.entries(adjacents).reduce((acc, [key, direction]) => {
                if (location.adjacent.get(key) === undefined && !grid.has(`${direction[0] + location.x},${direction[1] + location.y}`)) {
                    acc.push([direction[0] + location.x, direction[1] + location.y])
                }
                return acc
            }, [] as [number, number][])
        }

        // grid locations which are adjacent to the existing grid but aren't used yet
        let borderLands = vacancies(origin)

        for (let i = 0; i < areaSize; i++) {
            // console.log(`round ${i}:\n`, borderLands)
            const coors = randomChoice(borderLands)
            // console.log(`chose ${coors}`)
            const newLocation = this.addLocation({ name: areaName, x: coors[0], y: coors[1] })!
            grid.set(`${coors[0]},${coors[1]}`, newLocation)
            // draw connections to existing locations
            let connects = 0;
            for (const [direction, [dx, dy]] of Object.entries(randomChoice([adjacents, alterjacents]))) {
                if (Math.random() * connects > connectedness) continue;
                const neighbor = grid.get(`${coors[0] + dx},${coors[1] + dy}`)
                if (neighbor) {
                    newLocation.adjacent.set(direction, neighbor)
                    neighbor.adjacent.set(Object.keys(adjacents).find(key => {
                        const [x, y] = adjacents[key as keyof typeof adjacents]
                        return x === -dx && y === -dy
                    })!, newLocation)
                    connects++;
                }
            }
            // reset the borders
            borderLands = borderLands.filter(([x, y]) => x !== coors[0] || y !== coors[1])
            borderLands.push(...vacancies(newLocation))
        }
        // console.log(Array.from(grid.entries()).reduce((acc, [key, value]) => {
        //     const [x, y] = key.split(',').map(Number)
        //     acc += `${x},${y}:${value.key}\n${Array.from(value.adjacent.entries()).reduce((acc, [key, value]) => {
        //         acc += `  ${key} -> ${value.x},${value.y}\n`
        //         return acc
        //     }, '')
        //         }\n`
        //     return acc
        // }, ''))

        // hook up some portals
        const portalOptions = Array.from(grid.values()).sort((a, b) => a.adjacent.size - b.adjacent.size)
        const portalLocations = []
        for (let i = 0; i < portality; i++) {
            const loc1 = portalOptions.shift()!
            const loc2 = portalOptions.shift()!
            const portalDirection = randomChoice(Object.keys(adjacents).filter(direction =>
                !loc1.adjacent.has(direction) && !loc2.adjacent.has(oppositeDirection[direction as Direction])
            )) as Direction
            if (!portalDirection) continue;
            loc1.adjacent.set(portalDirection, loc2)
            loc2.adjacent.set(oppositeDirection[portalDirection], loc1)
            portalLocations.push(`${loc1.key.split(' ')[1]}-${loc2.key.split(' ')[1]}`)
        }
        console.log(`portal locations: ${portalLocations.join(', ')}`)

        return Array.from(grid.values())
    }

    async save(saveName: string): Promise<void> {

        const gameStateObj: any = {
            locations: {},
            flags: this.flags
        };

        this.locations.forEach((location, key) => {
            gameStateObj.locations[key] = location.save();
        });

        this._save(saveName, gameStateObj);
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