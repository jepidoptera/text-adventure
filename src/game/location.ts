import { Container, Item } from "./item.ts";
import { Character } from "./character.ts";
import { items } from "../scenarios/A2D/items.ts";

class Landmark {
    name: string;
    description: string;
    location?: Location;
    contents: Container;
    _onAssign?: (location: Location) => void;
    constructor({
        name, description, items = []
    }: {
        name: string, description: string, items?: Item[]
    }) {
        this.name = name;
        this.description = description;
        this.contents = new Container(items);
    }
    assign(action: (this: Landmark, location: Location) => void) {
        this._onAssign = action.bind(this);
        return this
    }
}

class Location extends Container {
    unique_id!: string | number;
    name: string;
    adjacent: Map<string, Location> | undefined;
    _adjacent: { [key: string]: string | number } = {};
    description: string | undefined;
    characters: Character[] = [];
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
        this._adjacent = adjacent;
        for (let character of characters) {
            this.addCharacter(character);
        };
    }
    addAction(name: string, action: (player: Character, ...args: any[]) => Promise<any>) {
        this.actions.set(name, action.bind(this));
        return this;
    }
    addCharacter(character: Character) {
        this.characters.push(character);
        character.location = this;
        return this;
    }
    removeCharacter(character: Character) {
        this.characters = this.characters.filter(c => c !== character);
        return this;
    }
    addLandmark(Landmark: Landmark) {
        Landmark._onAssign?.(this);
        this.landmarks.push(Landmark);
        return this;
    }
    enter(character: Character) {
        this.addCharacter(character);
    }
    exit(character: Character, direction?: string) {
        this.characters = this.characters.filter(c => c !== character);
    }
    character(name: string = ''): Character | undefined {
        if (!name) return;
        const char = (
            this.characters.find(character => character.name === name)
            || this.characters.find(character => character.description === name)
            || this.characters.find(character => character.name.toLowerCase() === name.toLowerCase())
            || this.characters.find(character => character.description.toLowerCase() === name.toLowerCase())
            || this.characters.find(character => character.aliases.includes(name))
        )
        // console.log(`found ${char?.name}`)
        return char;
    }
    get playerPresent(): boolean {
        return this.characters.some(character => character.isPlayer);
    }
}


export { Character, Item, Location, Landmark, Container };