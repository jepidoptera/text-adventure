import { Landmark } from "../../game/location.js";
import { Item, Container } from "../../game/item.js";
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from "../../game/colors.js"
import { potions } from "./items.js"
import { Character } from "../../game/character.js";
import { GameState } from "../../game/game.js";

const landmarks: { [key: string]: (...args: any[]) => Landmark } = {
    sign(game: GameState, text?: string | string[]): Landmark {
        if (Array.isArray(text)) {
            text = text.join('\n')
        }
        // console.log(`Creating sign with text: ${text}`)
        return new Landmark({
            game: game,
            name: 'sign',
            description: 'A Sign',
            text: text
        }).action('read sign', async function () {
            this.game.color(gray)
            this.game.print(text)
        })
    },
    towering_tree(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'tree',
            description: 'A Monstrous, Sky-Touching Tree',
        }).action('climb tree', async function (player) {
            this.game.color(black)
            if (player.game.flags.turlin) {
                this.game.print("Putting one hand above the other, you begin the familiar ascent.")
                this.game.print("You climb... ")
                for (let a = 1; a <= 3; a++) {
                    await this.game.pause(1)
                    this.game.print("and climb...")
                }
                this.game.pause(2)
                this.game.print("You reach the top and look out. The world spreads before you.")
                player.relocate(player.game.find_location("the top of the tree"))
            }
            this.game.print("You begin climbing the tree.")
            await this.game.pause(1.8)
            this.game.print("You reach the middle of the tree, the climbing gets harder.")
            await this.game.pause(3)
            this.game.print("You climb...")
            await this.game.pause(1)
            for (let a = 1; a <= 3; a++) {
                this.game.print("And climb...")
                await this.game.pause(1)
            }
            this.game.print()
            this.game.print("You are now almost at the crown.  Some sort of platform like a tree house seems")
            this.game.print("to have been build at the top.  You must be hundreds of feet in the air.  You")
            this.game.print("get a sickening stomach-wrenching feeling looking downwards.")
            this.game.print()
            await this.game.pause(3)
            this.game.print("Continue to climb? [y/n]")
            if (await this.game.getKey(['y', 'n']) === 'y') {
                this.game.print("Using your strength and agility you climb higher, maxing your physical")
                this.game.print("abilities.")
                await this.game.pause(2)
                if (player.max_sp / 10 + player.strength + player.agility * 2 > 30) {
                    // Made it
                    this.game.print("You pull yourself at last onto the hard surface of the platorm")
                    this.game.print("You lay breathing hard with only one though in your head:")
                    this.game.print("''I am glad to be up here.'', a thought, until now, your mind new to be foreign.")
                    await this.game.pause(10)
                    this.game.print("You breathe heavily and sigh raising your head...")
                    await this.game.pause(4)
                    this.game.print("Your intestines feel as if they jumped into your throat and were strangling")
                    this.game.print("you from within.  Standing before you is...")
                    await this.game.pause(4)
                    player.relocate(player.game.find_location("the top of the tree"))
                } else {
                    // Crash Caboom
                    this.game.print("You are almost there...  You gasp")
                    await this.game.pause(2)
                    this.game.print("As you reach to grip the last branch, you feel")
                    this.game.print("your other hand begin to slide off the branch it was holding.")
                    this.game.print("Horified you realize that you are no longer on the tree... but in the air")
                    this.game.print("and the ground is rushing up ever nearer.")
                    await this.game.pause(6)
                    this.game.print("You fall...")
                    for (let a = 1; a <= 3; a++) {
                        await this.game.pause(0.5)
                        this.game.print("and fall...")
                    }
                    await this.game.pause(1)
                    this.game.print("With a sickening jolt your world fades out...")
                    await this.game.pause(2)
                    this.game.color(black, black)
                    this.game.clear()
                    await this.game.pause(1.6)
                    this.game.color(black, darkwhite)
                    this.game.clear()
                    this.game.print("You come to with a stinging sensation all over your body.  You are lucky to")
                    this.game.print("be alive.")
                    player.hp = 1
                    player.sp = 1
                    if (player.flags.assistant) {
                        this.game.color(magenta)
                        this.game.print("Assistant -- ouch.")
                        this.game.print("Assistant -- You need to train agility, strength and stamina.")
                    }
                }
            } else {
                this.game.print("You decide that you have gone far enough and begin the descent.")
                await this.game.pause(2)
                this.game.print("You reach the ground safely.")
            }
        })
    },
    treehouse_platform(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'treehouse platform',
            description: 'A Treehouse Platform',
        }).action('climb down', async function (player: Character) {
            this.game.color(black)
            this.game.print("You begin your descent...")
            await this.game.pause(2)
            this.game.print("You continue to climb downwards...")
            await this.game.pause(3)
            this.game.print("After an exhausting climb you feel grateful to be on the ground again!")
            player.relocate(player.game.find_location(64) || null)
        })
    },
    mixing_pot(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'mixing pot',
            description: 'A Mixing Pot',
        }).action('look mixing pot', async function (player) {
            this.game.color(gray)
            this.game.print("  * A Mixing Pot")
            this.game.print()
            this.game.color(black)
            this.contents?.items.forEach(item => {
                this.game.print(`    ${item.name}`)
            })
            if (player.flags.assistant) {
                this.game.color(magenta)
                this.game.print(`Assistant -- type \"add\" + an ingredient to add that to the pot.`)
            }
        }).action('add', async function (player, item: string) {
            this.game.color(black)
            const itemObj = player.inventory.item(item)
            if (itemObj) {
                player.inventory.transfer(itemObj, this.contents)
                this.game.print(`Added ${itemObj.name} to mixing pot.`)
                if (player.flags.assistant) {
                    this.game.color(magenta)
                    this.game.print(`Assistant -- type \"mix potion\" to stir the ingredients together.`)
                }
            } else {
                this.game.print(`You don't have that.`)
            }
        }).action('mix potion', async function (player) {
            this.game.color(green)
            this.game.print("Mixing Potion", 1);
            await this.game.pause(1); this.game.print(".", 1);
            await this.game.pause(1); this.game.print(".", 1);
            await this.game.pause(1); this.game.print(".");
            // sort and join ingredients
            const contents = this.contents.items.map(i => i.name).sort().join(', ')
            console.log('mixing', contents)
            const potionName = potions.get(contents);
            if (potionName) {
                // made something
                this.contents.clear()
                const potion = this.game.addItem({ name: potionName });
                console.log(`created: ${potionName}`)
                player.inventory.add(potion);
                this.game.print(`You remove the potion from the pot and wala! it is now: `, 1)
                this.game.color(black)
                this.game.print(`${potion?.name}.`)
            } else {
                this.game.color(black)
                this.game.print("The potion refuses to coalesce.  All ingredients returned.")
                this.contents.transferAll(player.inventory)
            }
        })
    },
    scarecrow(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'scarecrow',
            description: 'A Scarecrow'
        })
    },
    locked_gate(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'gates',
            description: 'Locked Gates'
        })
    },
    open_gate(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'gates',
            description: 'Open Gates'
        })
    },
    slash_in_the_earth(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'slash',
            description: 'A Jagged, Oozing Slash in the Earth'
        }).action('e', async function (player) {
            this.game.color(black)
            this.game.print("You can't go that way. The slash is impassable.")
        }).action('go east', async function (player) {
            this.game.color(black)
            this.game.print("You can't go that way. The slash is impassable.")
        })
    },
    dead_cleric(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'dead cleric',
            description: 'corpse of the wise man'
        })
    },
    large_rock(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'rock',
            description: 'A Large Rock'
        })
    },
    spire(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'spire',
            description: "A Towering Sandstone Spire"
        })
    },
    portal_stone(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'portal stone',
            description: "Eldin's Portal Stone"
        }).action('transport', async function (player) {
            this.game.color(blue)
            this.game.print("You touch the portal stone...")
            await this.game.pause(1)
            player.relocate(player.game.find_location("Eldin's Mountain Cottage"))
        })
    },
    slot_canyon(game: GameState): Landmark {
        async function go_down(this: Landmark, player: Character) {
            if (player.isPlayer) {
                this.game.color(black)
                this.game.print("You climb carefully down the steep canyon, picking your way among the rocks.")
                await this.game.pause(2)
                player.relocate(this.location?.adjacent?.get('down') || null)
            }
        }
        return new Landmark({
            game: game,
            name: 'slot canyon',
            description: "A Steep, Narrow Slot Canyon Descending into Twilight"
        }).action(
            'go down', go_down
        ).action(
            'climb down', go_down
        ).action(
            'down', go_down
        )
    },
    "silver tree"(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'silver tree',
            description: "A Silver Tree as Tall as the Sky"
        }).action('climb tree', async function (player) {
            this.game.print("You put your hand on the tree and feel the thrill of barely-contained magic.")
            this.game.print("Not knowing where this may lead, you forge heedlessly up and up.")
            await this.game.pause(5)
            this.game.print()
            this.game.print("As you climb, you are aware through a faint tingling of your senses that you")
            this.game.print("are leaving the mortal world behind, at a distance that cannot be measured.")
            this.game.print("The ground falls away below you and vanishes into the fog.")
            await this.game.pause(6)
            this.game.print()
            this.game.print("You continue upwards, losing all sense of the passage of time or the extent")
            this.game.print("of space. Passing through a final layer of clouds, you find yourself in...")
            await this.game.pause(6)
            await player.relocate(this.game.find_location("fairy nest"))
        })
    },
    unknown(game: GameState, n?: number): Landmark {
        return new Landmark({
            game: game,
            name: `Unknown Landscape Item ${n}`,
            description: `Unknown Landscape Item ${n}`
        })
    }
} as const

type LandmarkNames = keyof typeof landmarks
function getLandmark(key: LandmarkNames, ...args: any[]) {
    if (!landmarks[key]) {
        throw new Error(`No landmark with key ${key}`)
    }
    const newLandmark = landmarks[key](...args)
    newLandmark.key = key.toString()
    return newLandmark
}

export { landmarks };