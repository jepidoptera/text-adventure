import { Container, Item } from "./item.ts";
import { Character } from "./character.ts";

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
    key!: string | number;
    adjacent: Map<string, Location> | undefined;
    adjacent_ids: { [key: string]: string | number } = {};
    description: string | undefined;
    characters: Set<Character> = new Set();
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
            this.addCharacter(character);
        };
    }
    addAction(name: string, action: (player: Character, ...args: any[]) => Promise<any>) {
        this.actions.set(name, action.bind(this));
        return this;
    }
    addCharacter(character: Character) {
        this.characters.add(character);
        character.location = this;
        return this;
    }
    removeCharacter(character: Character) {
        this.characters.delete(character);
        return this;
    }
    addLandmark(Landmark: Landmark) {
        Landmark._actions.forEach((action, name) => {
            this.actions.set(name, action)
        });
        this.landmarks.push(Landmark);
        return this;
    }
    enter(character: Character) {
        this.addCharacter(character);
    }
    exit(character: Character, direction?: string) {
        this.characters.delete(character);
    }
    character(name: string = ''): Character | undefined {
        if (!name) return;
        const charlist = [...this.characters]
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
        return [...this.characters].some(character => character.isPlayer);
    }
    save() {
        return {
            name: this.name,
            characters: [...this.characters].map(char => (
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
            adjacent: this.adjacent_ids,
        }
    }
}


export { Location, Landmark, Container };