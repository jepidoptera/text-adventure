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
    private _characters: Set<Character> = new Set();
    private _landmarks: Landmark[] = [];
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
        this._landmarks.push(landmark);
        return this;
    }
    removeLandmark(landmark: Landmark | string) {
        if (typeof landmark === 'string') {
            landmark = (
                this._landmarks.find(l => l.name === landmark) as Landmark
                || this._landmarks.find(l => l.key === landmark) as Landmark
            )
        }
        this._landmarks = this._landmarks.filter(l => l !== landmark);
        landmark._actions.forEach((_, name) => {
            this.actions.delete(name)
        });
        return this;
    }
    get landmarks(): Landmark[] {
        return this._landmarks;
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
            adjacent: this.adjacent_ids,
        }
    }
}


export { Location, Landmark, Container };