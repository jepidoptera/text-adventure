import { GameState } from "../../game/game.js"
import { Location } from "../../game/location.js"
import { Character } from "../../game/character.js"
import { Container } from "../../game/item.js"
import { getItem, isValidItemKey, ItemKey } from "./items.js"
import { getLandmark } from "./landmarks.js"
import { GameMap } from "./map.js"
import { Player } from "./player.js"
import { A2dCharacter, getCharacter, isValidCharacter } from "./characters.js"
import { BuffNames, getBuff, } from "./buffs.js"
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from "./colors.js"

class A2D extends GameState {
    respawnInterval!: ReturnType<typeof setInterval>;
    player!: Player;
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
        sift: boolean
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
            sift: false,
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
            for (let character of this.characters) {
                if (!character.dead) {
                    character.turnCounter += character.speed;
                } else if (character.respawnCountdown < 0) {
                    character.respawnCountdown = 0;
                    await character.respawn();
                }
            }
            console.log(`player turncounter: ${this.player.turnCounter}`)
            let activeCharacters = this.characters.filter(char => char.turnCounter >= 1)
            while (activeCharacters.length > 0) {
                for (let character of activeCharacters.sort((a, b) => a === this.player ? -1 : b === this.player ? 1 : b.turnCounter - a.turnCounter)) {
                    if (!character.dead) {
                        await character.turn();
                        if (character.buffs) {
                            for (let buff of Object.values(character.buffs)) {
                                await buff.turn();
                            }
                        }
                    }
                    character.turnCounter -= 1;
                }
                activeCharacters = this.characters.filter(char => !char.dead && char.turnCounter >= 1)
            }
        }
        print('Press any key to continue.')
        await getKey();
        // start over on quit
        this.start();
    }

    newPlayer(): Promise<Player> {
        return new Promise(async (resolve, reject) => {
            this.clear();
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

    addCharacter(name: string, location: string) {
        if (!isValidCharacter(name)) {
            console.log('invalid character name', name);
            return;
        }
        const newCharacter = getCharacter(name, this);
        const newLocation = this.locations.get(location);
        newLocation?.addCharacter(newCharacter);
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
        const gamestate = await this._load(saveName) as any;
        if (gamestate === null) {
            print(`Character ${saveName} not found.`)
            return false;
        }
        const loadScenario: { [key: string]: Location } = {};
        Object.keys(gamestate.locations).forEach(key => {
            const location = gamestate.locations[key];
            const newLocation = new Location({
                name: location.name,
                description: location.description,
                characters: location.characters.map((character: any) => {
                    return character.isPlayer
                        ? new Player('', '', this).load(character)
                        : isValidCharacter(character.key) ? Object.assign(getCharacter(character.key, this, character), {
                            items: character.items?.map(
                                (itemData: any) => isValidItemKey(itemData.key) ? getItem(itemData.key, itemData) : undefined
                            ).filter((item: any) => item),
                            flags: character.flags,
                            respawnCountdown: character.respawnCountdown,
                            _respawn: character.respawn,
                            attackPlayer: character.attackPlayer,
                            chase: character.chase,
                            buffs: character.buffs ? Object.fromEntries(
                                Object.entries(character.buffs).map(
                                    ([buffName, buffData]: [string, any]) => [buffName, getBuff(buffName as BuffNames)(buffData)]
                                )
                            ) : {},
                            game: this
                        }) : undefined
                }).filter((character: any) => character),
                items: location.items.map((itemData: any) => Object.assign(getItem(itemData.key), itemData)),
                adjacent: location.adjacent,
                key: key
            });
            location.landmarks.forEach((landmarkData: any) => {
                const newLandmark = getLandmark(landmarkData.key, landmarkData.text);
                landmarkData.items.forEach((itemData: any) => {
                    if (isValidItemKey(itemData.key))
                        newLandmark.contents.add(getItem(itemData.key, itemData))
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
}

export { A2D };