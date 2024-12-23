import { GameState } from "../../game/game.js"
import { Location, findPath } from "../../game/location.js"
import { Character } from "../../game/character.js"
import { Container, Item, ItemParams } from "../../game/item.js"
import { items } from "./items.js"
import { getLandmark } from "./landmarks.js"
import { GameMap, locationTemplates } from "./map.js"
import { Player } from "./player.js"
import { A2dCharacter, getCharacter, isValidCharacter, characters } from "./characters.js"
import { BuffNames, getBuff, } from "./buffs.js"
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from "./colors.js"
import { get } from "http"

class A2D extends GameState {
    respawnInterval!: ReturnType<typeof setInterval>;
    declare player: Player;
    itemTemplates = items;
    locationTemplates = locationTemplates;
    characterTemplates = characters;
    flags: {
        cleric: boolean,
        ieadon: boolean,
        soldiers_remaining: number,
        colonel_arach: boolean,
        biadon: boolean,
        ziatos: boolean,
        turlin: boolean,
        henge: boolean,
        cradel: boolean,
        orc_mission: boolean,
        ierdale_mission: string,
        sift: boolean,
        soldier_dialogue: string[]
    } = {
            cleric: false,
            ieadon: false,
            soldiers_remaining: 0,
            colonel_arach: false,
            biadon: false,
            ziatos: false,
            turlin: false,
            henge: false,
            cradel: false,
            orc_mission: false,
            ierdale_mission: '',
            sift: false,
            soldier_dialogue: []
        }

    addItem(name: keyof typeof this.itemTemplates, container: Container | null, params?: any): Item | undefined {
        return super.addItem(name, container, params);
    }
    addLocation(name: keyof typeof this.locationTemplates, params: any): Location | undefined {
        return super.addLocation(name, params);
    }
    addCharacter(name: keyof typeof this.characterTemplates, location: string | number | Location, args?: any) {
        return super.addCharacter(name, location, args);
    }

    intro() {
        color(orange, darkwhite);
        clear();
        print()
        this.center("Redstaff Software Presents...")
        print()

        for (let f = 0; f < 16; f++) {
            color(qbColors[f], darkwhite)
            this.center("A  D  V  E  N  T  U  R  E   I I")
        }
        color('black')
        print()
        this.center("DELUX")
        color('gray')
        this.center(">Special Edition<")
    }

    async start() {
        this.intro();
        await getKey();
        this.clear();
        const opt = await this.optionBox({
            title: 'Adventure 2 Setup',
            options: ['Start New', 'Load Game', 'Exit'],
            default_option: 1
        })
        this.clear();
        console.log('chose', opt);
        if (opt === 0) {
            this.loadScenario(new GameMap(this).locations);
            this.player = await this.newPlayer();
            this.player.location?.addCharacter(this.player);
        } else if (opt === 1) {
            this.player = new Player('', '', this);
            await this.player.loadGame();
        } else {
            // glitch on client side
            return;
        }
        this.player.game = this;
        clearInterval(this.respawnInterval);
        this.respawnInterval = setInterval(async () => {
            for (let character of this.characters) {
                if (character.respawnCountdown > 0) {
                    character.respawnCountdown -= 5;
                    if (character.respawnCountdown <= 0) {
                        console.log('respawning', character.name)
                        character.respawnCountdown = -1;
                    }
                }
            }
        }, 5000)
        this.main();
    }

    async main() {
        let command = '';
        console.log('starting main loop');
        while (!(['exit', 'quit'].includes(command)) && !this.player.dead) {
            // await this.player.turn();
            let characters = this.characters.filter(char => !char.dead);
            if (!characters.includes(this.player)) {
                throw new Error('player is not in characters list');
            }
            for (let character of characters) {
                if (!character.dead) {
                    character.tiemCounter += character.speed;
                } else if (character.respawnCountdown < 0) {
                    character.respawnCountdown = 0;
                    await character.respawn();
                }
            }
            console.log(`player turncounter: ${this.player.tiemCounter}`)
            let activeCharacters = characters.filter(char => char.tiemCounter >= 1)
            while (activeCharacters.length > 0) {
                for (let character of activeCharacters.sort((a, b) => b.tiemCounter - a.tiemCounter)) {
                    if (!character.dead) {
                        await character.turn();
                        if (character.buffs) {
                            for (let buff of Object.values(character.buffs)) {
                                await buff.turn();
                            }
                        }
                    }
                    character.tiemCounter -= 1 / character.action_speed;
                }
                activeCharacters = this.characters.filter(char => !char.dead && char.tiemCounter >= 1)
            }
        }
        print('Press any key to continue.')
        await getKey();
        // start over on quit
        this.start();
    }

    newPlayer(): Promise<Player> {
        return new Promise(async (resolve, reject) => {
            const classes = ['Thief', 'Fighter', 'Spellcaster', 'Cleric']
            const new_player = new Player(
                await input('\n\nType a name for yourself:'),
                classes[await this.optionBox({
                    title: "     Choose One          ",
                    options: classes,
                    default_option: 1
                })],
                this
            )
            new_player.location = this.find_location('Cottage of the Young');
            clear();
            color('yellow')
            print("-- ", 1)
            color('red')
            print("You have declared ", 1)
            color('blue')
            print(new_player.class_name, 1)
            color('red')
            print(" Status ", 1)
            color('yellow')
            print("--")
            color('black')
            // show stats
            new_player.checkStats();

            await getKey();
            this.clear();
            print("During-game assistant (recommended)? y/n")
            new_player.flags.assistant = await getKey(['y', 'n']) === 'y';
            print("Type \"assistant off\" or \"assistant on\" to toggle assistant during game.")

            resolve(new_player);
        })
    }

    center(text: string) {
        const x = Math.floor((80 - text.length) / 2);
        print(' '.repeat(x) + text);
    }

    get characters(): A2dCharacter[] {
        return super.characters as A2dCharacter[];
    }

    shutdown() {
        super.shutdown();
        clearInterval(this.respawnInterval);
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

    async load(saveName: string): Promise<boolean> {
        const gamestate: {
            locations: { [key: string]: any },
            flags: any
        } = await this._load(saveName) as any;
        if (gamestate === null) {
            print(`Character ${saveName} not found.`)
            return false;
        }
        const loadScenario: { [key: string]: Location } = {};
        Object.keys(gamestate.locations).forEach(key => {
            const location = gamestate.locations[key];
            // console.log(`loading location ${key}, adjacent to ${Object.entries(location.adjacent).reduce((acc, [dir, loc]) => acc + `${dir}: ${loc}, `, '')}`);
            const newLocation = new Location({
                name: location.name,
                description: location.description,
                characters: location.characters.map((character: any) => {
                    return character.isPlayer
                        ? new Player('', '', this).load(character)
                        : isValidCharacter(character.key) ? Object.assign(getCharacter(character.key, this, { flags: character.flags }), {
                            respawnCountdown: character.respawnCountdown,
                            _respawn: character.respawn,
                            respawnLocation: character.respawnLocationKey || character.respawnLocation,
                            attackPlayer: character.attackPlayer,
                            chase: character.chase,
                            following: character.following,
                            actionQueue: character.actionQueue,
                            buffs: character.buffs ? Object.fromEntries(
                                Object.entries(character.buffs).map(
                                    ([buffName, buffData]: [string, any]) => [buffName, getBuff(buffName as BuffNames)(buffData)]
                                )
                            ) : {}
                        }) : undefined
                }).filter((character: any) => character),
                items: location.items.map((itemData: any) => {
                    console.log('loading item', itemData, `at ${key}`)
                    return this.addItem(itemData.key, null, itemData.quantity)
                }).filter((item: any) => item),
                adjacent: location.adjacent,
                key: key
            });
            location.landmarks.forEach((landmarkData: any) => {
                const newLandmark = getLandmark(landmarkData.key, landmarkData.text);
                landmarkData.items.forEach((itemData: any) => {
                    const item = this.addItem(itemData.key, newLandmark.contents, itemData.quantity)
                });
                newLocation.addLandmark(newLandmark);
            });
            loadScenario[key] = newLocation;
        });
        this.loadScenario(loadScenario);
        this.flags = gamestate.flags;
        this.player = this.characters.find(char => char.isPlayer) as Player;
        this.player.game = this;
        // this.player.relocate(this.player.location);
        return true;
    }
    async enter_the_void() {
        const void_map = (await this.spawnArea('the_void', 37, 0.25, 7)).filter(location => location instanceof Location)
        const origin = void_map[0]
        const grid = new Map((void_map).map(location => [`${location.x},${location.y}`, location]))

        function getFurthestPoint(start: Location) {
            let pathMap = new Map(Array.from(grid.values()).map(location => {
                const path = findPath(start, location)
                return [location, path.length]
            }))
            let longestPath = Array.from(pathMap.entries()).reduce((acc, [location, length]) => {
                if (length > acc[1]) {
                    return [location, length]
                }
                return acc
            }, [start, 0])
            return longestPath
        }

        // find the (probably) longest path through the whole maze
        const startPoint = getFurthestPoint(origin)[0]
        const longestPath = getFurthestPoint(startPoint)
        const endPoint = longestPath[0]
        console.log(`longest path is from ${startPoint.key} to ${endPoint.key} with length ${longestPath[1]}`)
        console.log(`path is ${findPath(startPoint, endPoint)}`)
        endPoint.name = 'the end'

        // the player has to find their way to Ieadon
        await this.player.relocate(startPoint)
        await this.find_character('Ieadon')?.relocate(endPoint)

        // add some monsters and random objects
        this.addCharacter('voidfish', void_map[12])
        this.addCharacter('voidfish', void_map[13])
        this.addCharacter('wraith', void_map[14])
        this.addCharacter('wraith', void_map[15])
        this.addCharacter('voidrat', void_map[16])
        this.addCharacter('voidrat', void_map[17])
        this.addCharacter('voidrat', void_map[18])

        this.addItem('mighty_warfork', void_map[0])
        this.addItem('banana', void_map[1])
        this.addItem('voidstone', void_map[19])
        this.addItem('comb', void_map[20])
        this.addItem('crumpled_paper', void_map[21])
        this.addItem('pen', void_map[22])
        this.addItem('paperclip', void_map[23])
        this.addItem('pokemon_card', void_map[24])
        this.addItem('sock', void_map[25])
        this.addItem('pile_of_gold', void_map[26], 650)
        this.addItem('negative_gold', void_map[27], this.player.itemCount('gold'))

        // all the rest of this is just making a pretty map for the console

        const sortedLocations = Array.from(grid.values()).sort((a, b) => a.y - b.y || a.x - b.x)
        let min_y = sortedLocations[0].y;
        let max_y = sortedLocations[sortedLocations.length - 1].y;
        let min_x = sortedLocations.reduce((acc, loc) => Math.min(acc, loc.x), 0);
        let max_x = sortedLocations.reduce((acc, loc) => Math.max(acc, loc.x), 0);
        let stringRep = '\n';
        for (let y = min_y; y <= max_y; y++) {
            stringRep += '` ';
            let nextRow = '` ';
            for (let x = min_x; x <= max_x; x++) {
                const loc = grid.get(`${x},${y}`)
                const nexLoc = grid.get(`${x + 1},${y}`)
                if (loc) {
                    const voidNumber = parseInt(loc.key.split(' ')[1])
                    stringRep += `${Math.floor(voidNumber / 10)}*${voidNumber % 10}${loc.adjacent.has('east') ? '-' : ' '}`
                    nextRow += loc.adjacent.has('south') ? ' | ' : '   '
                } else if (nexLoc?.adjacent.has('west')) {
                    nextRow += '   '
                    stringRep += '   -'
                } else {
                    stringRep += '    '
                    nextRow += '   '
                }
                if (nexLoc?.adjacent.has('southwest')) {
                    if (!loc?.adjacent.has('southeast')) nextRow += '/'
                    else nextRow += 'X'
                } else if (loc?.adjacent.has('southeast')) nextRow += '\\'
                else nextRow += ' '
            }
            stringRep += ' `\n' + nextRow + ' `\n'
        }
        console.log(stringRep)
    }
}

export { A2D };