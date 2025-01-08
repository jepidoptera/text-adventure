import { Container, Item } from "./item.js";
import { Character } from "./character.js";
import { GameState } from "./game.js";

class Landmark {
    name: string;
    game: GameState;
    key?: string;
    description: string;
    location?: Location;
    contents: Container;
    text?: string;
    _actions: Map<string, (...args: any[]) => Promise<void>> = new Map();
    constructor({
        name, game, description, text, items = []
    }: {
        name: string, game: GameState, description: string, text?: string, items?: Item[]
    }) {
        this.name = name;
        this.game = game;
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
            name: this.key,
            items: this.contents.items.map(item => item.save()),
            text: this.text
        }
    }
}

class Location extends Container {
    x: number = 0;
    y: number = 0;
    size: number = 5;
    name: string;
    game!: GameState;
    key!: string;
    adjacent: Map<string, Location>;
    adjacent_ids: { [key: string]: string | number } = {};
    description: string | undefined;
    private _characters: Set<Character> = new Set();
    landmarks: Landmark[] = [];
    _onEnter?: (player: Character) => void;
    actions: Map<string, (...args: any[]) => Promise<void>> = new Map();
    constructor({
        name,
        game,
        description = "",
        key = "",
        adjacent = {},
        items = [],
        characters = [],
        x = 0,
        y = 0,
        size = 5
    }: {
        name: string;
        game?: GameState;
        description?: string;
        key?: string | number;
        adjacent?: { [key: string]: string | number };
        items?: Item[];
        characters?: Character[];
        x?: number;
        y?: number;
        size?: number;
    }) {
        super(items);
        this.name = name;
        this.game = game as GameState;
        this.key = key.toString();
        this.description = description;
        this.adjacent_ids = adjacent;
        this.adjacent = new Map();
        for (let character of characters) {
            this.addCharacter(character);
        };
        this.x = x;
        this.y = y;
        this.size = size;
    }
    addAction(name: string, action: (player: Character, ...args: any[]) => Promise<any>) {
        this.actions.set(name, action.bind(this));
        return this;
    }
    addCharacter(character: Character) {
        this._characters.add(character);
        // character.relocate(this);
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
            size: this.size,
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

class NodeInfo {
    f: number;
    g: number;
    h: number;
    parent: Location | null;
    directionFromParent: string | null;
    location: Location;  // Store the actual location reference

    constructor(location: Location, f: number, g: number, h: number, parent: Location | null, directionFromParent: string | null) {
        this.location = location;
        this.f = f;
        this.g = g;
        this.h = h;
        this.parent = parent;
        this.directionFromParent = directionFromParent;
    }
}

function findPath(start: Location, goal: Location, character?: Character): string[] {
    const openSet = new Map<string, NodeInfo>();
    const closedSet = new Map<string, NodeInfo>();

    function heuristic(a: Location, b: Location): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    // Initialize with start location
    openSet.set(start.key, new NodeInfo(
        start,
        heuristic(start, goal),  // f = g + h, and g = 0 for start
        0,  // g = 0 for start
        heuristic(start, goal),
        null,
        null
    ));

    while (openSet.size > 0) {
        // Find node with lowest f score
        let currentInfo: NodeInfo | null = null;
        let lowestF = Infinity;

        for (const [_, info] of openSet) {
            if (info.f < lowestF) {
                currentInfo = info;
                lowestF = info.f;
            }
        }

        if (!currentInfo) break;
        const current = currentInfo.location;

        if (current.key === goal.key) {
            const directions: string[] = [];

            while (currentInfo?.directionFromParent) {
                directions.unshift(currentInfo.directionFromParent);
                currentInfo = currentInfo.parent ? closedSet.get(currentInfo.parent.key) || null : null;
            }

            return directions;
        }

        // Move current from open to closed
        openSet.delete(current.key);
        closedSet.set(current.key, currentInfo);

        // Check all neighbors
        for (const [direction, neighbor] of current.adjacent.entries().filter(([dir, loc]) => character?.can_go(dir) ?? true)) {
            if (closedSet.has(neighbor.key)) continue;

            const tentativeG = currentInfo.g + 1;
            let neighborInfo = openSet.get(neighbor.key);

            if (!neighborInfo) {
                // Discovered a new node
                neighborInfo = new NodeInfo(
                    neighbor,
                    tentativeG + heuristic(neighbor, goal),
                    tentativeG,
                    heuristic(neighbor, goal),
                    current,
                    direction
                );
                openSet.set(neighbor.key, neighborInfo);
            } else if (tentativeG < neighborInfo.g) {
                // Found a better path to neighbor
                neighborInfo.g = tentativeG;
                neighborInfo.f = tentativeG + neighborInfo.h;
                neighborInfo.parent = current;
                neighborInfo.directionFromParent = direction;
            }
        }
    }

    return []; // No path found
}

export { Location, Landmark, Container, findPath };
