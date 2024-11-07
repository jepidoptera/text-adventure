import { Container, Item } from "./item.js";
import { Character } from "./character.js";
import { GameState } from "./game.js";

class Landmark {
    name: string;
    key?: string;
    description: string;
    location?: Location;
    contents: Container;
    text?: string;
    _actions: Map<string, (...args: any[]) => Promise<void>> = new Map();
    constructor({
        name, description, text, items = []
    }: {
        name: string, description: string, text?: string, items?: Item[]
    }) {
        this.name = name;
        this.description = description;
        this.contents = new Container(items);
        this.text = text
    }
    action(name: string, action: (this: Landmark, ...args: any[]) => Promise<any>) {
        this._actions.set(name, action.bind(this));
        return this;
    }
    save() {
        return {
            name: this.name,
            key: this.key,
            items: this.contents.items.map(item => item.save()),
            text: this.text
        }
    }
}

class Location extends Container {
    unique_id!: string | number;
    name: string;
    game!: GameState;
    key!: string | number;
    adjacent: Map<string, Location> | undefined;
    adjacent_ids: { [key: string]: string | number } = {};
    description: string | undefined;
    private _characters: Set<Character> = new Set();
    landmarks: Landmark[] = [];
    _onEnter?: (player: Character) => void;
    actions: Map<string, (...args: any[]) => Promise<void>> = new Map();
    constructor({
        name,
        description = "",
        adjacent = {},
        items = [],
        characters = []
    }: {
        name: string;
        description?: string;
        adjacent?: { [key: string]: string | number };
        items?: Item[];
        characters?: Character[];
    }) {
        super(items);
        this.name = name;
        this.description = description;
        this.adjacent_ids = adjacent;
        for (let character of characters) {
            this._characters.add(character);
        };
    }
    addAction(name: string, action: (player: Character, ...args: any[]) => Promise<any>) {
        this.actions.set(name, action.bind(this));
        return this;
    }
    addCharacter(character: Character) {
        character.respawnLocation = this;
        character.relocate(this);
        return this;
    }
    removeCharacter(character: Character) {
        this._characters.delete(character);
        return this;
    }
    get characters(): Character[] {
        return [...this._characters];
    }
    addLandmark(landmark: Landmark) {
        landmark._actions.forEach((action, name) => {
            this.actions.set(name, action)
        });
        landmark.location = this;
        this.landmarks.push(landmark);
        return this;
    }
    removeLandmark(landmark: Landmark | string) {
        if (typeof landmark === 'string') {
            landmark = (
                this.landmarks.find(l => l.name === landmark) as Landmark
                || this.landmarks.find(l => l.key === landmark) as Landmark
            )
        }
        if (!landmark) return this;
        this.landmarks = this.landmarks.filter(l => l !== landmark);
        landmark._actions.forEach((_, name) => {
            this.actions.delete(name)
        });
        return this;
    }
    enter(character: Character) {
        this._characters.add(character);
    }
    exit(character: Character, direction?: string) {
        this._characters.delete(character);
    }
    character(name: string = ''): Character | undefined {
        if (!name) return;
        const charlist = [...this._characters]
        const char = (
            charlist.find(character => character.name === name)
            || charlist.find(character => character.description === name)
            || charlist.find(character => character.name.toLowerCase() === name.toLowerCase())
            || charlist.find(character => character.description.toLowerCase() === name.toLowerCase())
            || charlist.find(character => character.aliases.includes(name))
        )
        // console.log(`found ${char?.name}`)
        return char;
    }
    get playerPresent(): boolean {
        return [...this._characters].some(character => character.isPlayer);
    }
    save() {
        return {
            name: this.name,
            description: this.description,
            characters: [...this._characters].filter(char => char.persist).map(char => (
                char.save()
            )),
            landmarks: this.landmarks.map(landmark => (
                landmark.save()
            )),
            items: this.items.map(item => ({
                key: item.key,
                name: item.name,
                quantity: item.quantity
            })),
            adjacent: Array.from(this.adjacent?.entries() || []).reduce((acc: Record<string | number, any>, [key, loc]) => {
                acc[key] = loc.key;
                return acc;
            }, {} as Record<string | number, any>)
        }
    }
}

export { Location, Landmark, Container };
