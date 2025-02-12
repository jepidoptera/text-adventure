import { GameState } from "../../game/game.js"
import { Landmark, Location, findPath } from "../../game/location.js"
import { Buff, Character } from "../../game/character.js"
import { Container, Item, ItemParams } from "../../game/item.js"
import { items } from "./items.js"
import { landmarks } from "./landmarks.js"
import { locationTemplates, scenario } from "./map.js"
import { Player } from "./player.js"
import { characters } from "./characters.js"
import { BuffNames, getBuff, buffs } from "./buffs.js"
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors, colorDict } from "../../game/colors.js"


class A2D extends GameState {
    respawnInterval!: ReturnType<typeof setInterval>;
    declare player: Player;
    itemTemplates = items;
    locationTemplates = locationTemplates;
    characterTemplates = characters;
    buffTemplates = buffs;
    landmarkTemplates = landmarks;
    flags: {
        cleric: boolean,
        ieadon: boolean,
        colonel_arach: boolean,
        biadon: boolean,
        ziatos: boolean,
        turlin: boolean,
        henge: boolean,
        cradel: boolean,
        orc_mission: boolean,
        orc_battle: boolean,
        ierdale_mission: string,
        sift: boolean,
        soldier_dialogue: string[]
    } = {
            cleric: false,
            ieadon: false,
            colonel_arach: false,
            biadon: false,
            ziatos: false,
            turlin: false,
            henge: false,
            cradel: false,
            orc_mission: false,
            orc_battle: false,
            ierdale_mission: '',
            sift: false,
            soldier_dialogue: []
        }

    intro() {
        // test out the color parser first thing
        this.color(orange, darkwhite);
        this.clear();
        let introStr = "\n\n                         Redstaff Software Presents... \n\n"
        for (let color of Object.keys(colorDict)) {
            if (color === 'darkwhite') {
                introStr += `                        <darkwhite, gray>A  D  V  E  N  T  U  R  E   I I<,darkwhite>\n`
            } else {
                introStr += `                        <${color}>A  D  V  E  N  T  U  R  E   I I\n`
            }
        }
        introStr += `\n                                     <black>DELUX\n`
        introStr += `                               <gray>>Special Edition<`
        this.print(introStr)
    }

    async start() {
        this.intro();
        await this.getKey();
        this.clear();
        const opt = await this.optionBox({
            title: 'Adventure 2 Setup',
            options: ['Start New', 'Load Game', 'Exit'],
            default_option: 1
        })
        this.clear();
        console.log('chose', opt);
        if (opt === 0) {
            await this.loadScenario(scenario);
            this.player = await this.newPlayer();
            this.player.location?.addCharacter(this.player);
            this.saveName = this.player.name;
        } else if (opt === 1) {
            this.player = new Player('', '', this);
            let success = false;
            while (!success) {
                success = await this.player.loadGame();
            }
            this.saveName = this.player.name;
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
        while (!this.player.dead) {
            // await this.player.turn();
            let characters = this.characters;
            if (!characters.includes(this.player)) {
                throw new Error('player is not in characters list');
            }
            for (let character of characters) {
                if (!character.dead) {
                    character.time += character.speed;
                    if (character.isPlayer) {
                        console.log(`player time: ${character.time}`);
                        console.log(`player next action: ${character.next_action?.command}`);
                        (character as Player).pets.forEach(pet => {
                            console.log(`pet ${pet.name} time: ${pet.time}`);
                            console.log(`pet ${pet.name} next action: ${pet.next_action?.command}`);
                        })
                    }
                    for (let reaction of character.reactionQueue) {
                        reaction.time -= character.speed;
                        if (reaction.time <= 0) {
                            console.log(character.name, 'executing reaction', reaction.command)
                            await character.execute(reaction.command);
                            if (reaction.repeat) {
                                reaction.time += reaction.repeat;
                            } else {
                                character.reactionQueue = character.reactionQueue.filter(r => r !== reaction);
                            }
                        }
                    }
                    if (character.next_action) {
                        if (character.time >= character.next_action.time) {
                            character.time -= character.next_action.time;
                            await character.turn();
                        }
                    } else {
                        character.time = 0;
                        await character.idle()
                    }
                    for (let buff of Object.values(character.buffs)) {
                        await buff.turn();
                    }
                } else if (character.respawnCountdown < 0) {
                    character.respawnCountdown = 0;
                    await character.respawn();
                }
            }
            console.log('------------------------Character loop complete------------------------')
            // while (activeCharacters.length > 0) {
            //     for (let character of activeCharacters.sort((a, b) => b.isPlayer ? -1 : 1)) {
            //         if (!character.dead) {
            //             if (!character.dead) await character.turn();
            //         }
            //         character.time -= 1;
            //     }
            //     activeCharacters = this.characters.filter(char => !char.dead && char.time >= 1)
            // }
        }
        this.print('Press any key to continue.')
        await this.getKey();
        // start over on quit
        this.start();
    }

    newPlayer(): Promise<Player> {
        return new Promise(async (resolve, reject) => {
            const classes = ['Thief', 'Fighter', 'Spellcaster', 'Cleric']
            const new_player = new Player(
                await this.input('\n\nType a name for yourself:'),
                classes[await this.optionBox({
                    title: "     Choose One          ",
                    options: classes,
                    default_option: 1
                })],
                this
            )
            new_player.location = this.find_location('Cottage of the Young');
            this.clear();
            this.color(yellow)
            this.print("-- ", 1)
            this.color(red)
            this.print("You have declared ", 1)
            this.color(blue)
            this.print(new_player.class_name, 1)
            this.color(red)
            this.print(" Status ", 1)
            this.color(yellow)
            this.print("--")
            this.color(black)
            // show stats
            new_player.checkStats();

            await this.getKey();
            this.clear();
            this.print("During-game assistant (recommended)? y/n")
            new_player.flags.assistant = await this.getKey(['y', 'n']) === 'y';
            this.print("Type \"assistant off\" or \"assistant on\" to toggle assistant during game.")

            resolve(new_player);
        })
    }

    center(text: string) {
        const x = Math.floor((80 - text.length) / 2);
        this.print(' '.repeat(x) + text);
    }

    shutdown() {
        super.shutdown();
        clearInterval(this.respawnInterval);
    }

    async load(saveName: string): Promise<boolean> {
        const gamestate = await this._load(saveName) as any;
        if (gamestate === null) {
            this.print(`Character ${saveName} not found.`)
            return false;
        }
        await this.loadScenario(gamestate)
        console.log('loaded scenario')
        this.player = await new Player('', '', this).load(this.playerData);
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
        this.addCharacter({ key: 'voidfish', location: void_map[12] })
        this.addCharacter({ key: 'voidfish', location: void_map[13] })
        this.addCharacter({ key: 'wraith', location: void_map[14] })
        this.addCharacter({ key: 'wraith', location: void_map[15] })
        this.addCharacter({ key: 'voidrat', location: void_map[16] })
        this.addCharacter({ key: 'voidrat', location: void_map[17] })
        this.addCharacter({ key: 'voidrat', location: void_map[18] })

        this.addItem({ name: 'cranberries_cd', container: void_map[6], quantity: 100 })
        this.addItem({ name: 'mighty_warfork', container: void_map[0] })
        this.addItem({ name: 'banana', container: void_map[1] })
        this.addItem({ name: 'voidstone', container: void_map[19] })
        this.addItem({ name: 'comb', container: void_map[20] })
        this.addItem({ name: 'crumpled_paper', container: void_map[21] })
        this.addItem({ name: 'pen', container: void_map[22] })
        this.addItem({ name: 'paperclip', container: void_map[23] })
        this.addItem({ name: 'pokemon_card', container: void_map[24] })
        this.addItem({ name: 'sock', container: void_map[25] })
        this.addItem({ name: 'pile_of_gold', container: void_map[26], quantity: 650 })
        this.addItem({ name: 'negative_gold', container: void_map[27], quantity: this.player.itemCount('gold') })

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