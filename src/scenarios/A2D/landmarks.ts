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
            color(gray)
            print(text)
        })
    },
    towering_tree(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'tree',
            description: 'A Monstrous, Sky-Touching Tree',
        }).action('climb tree', async function (player) {
            color(black)
            if (player.game.flags.turlin) {
                print("Putting one hand above the other, you begin the familiar ascent.")
                print("You climb... ")
                for (let a = 1; a <= 3; a++) {
                    await pause(1)
                    print("and climb...")
                }
                pause(2)
                print("You reach the top and look out. The world spreads before you.")
                player.relocate(player.game.find_location("the top of the tree"))
            }
            print("You begin climbing the tree.")
            await pause(1.8)
            print("You reach the middle of the tree, the climbing gets harder.")
            await pause(3)
            print("You climb...")
            await pause(1)
            for (let a = 1; a <= 3; a++) {
                print("And climb...")
                await pause(1)
            }
            print()
            print("You are now almost at the crown.  Some sort of platform like a tree house seems")
            print("to have been build at the top.  You must be hundreds of feet in the air.  You")
            print("get a sickening stomach-wrenching feeling looking downwards.")
            print()
            await pause(3)
            print("Continue to climb? [y/n]")
            if (await getKey(['y', 'n']) === 'y') {
                print("Using your strength and agility you climb higher, maxing your physical")
                print("abilities.")
                await pause(2)
                if (player.max_sp / 10 + player.strength + player.agility * 2 > 30) {
                    // Made it
                    print("You pull yourself at last onto the hard surface of the platorm")
                    print("You lay breathing hard with only one though in your head:")
                    print("''I am glad to be up here.'', a thought, until now, your mind new to be foreign.")
                    await pause(10)
                    print("You breathe heavily and sigh raising your head...")
                    await pause(4)
                    print("Your intestines feel as if they jumped into your throat and were strangling")
                    print("you from within.  Standing before you is...")
                    await pause(4)
                    player.relocate(player.game.find_location("the top of the tree"))
                } else {
                    // Crash Caboom
                    print("You are almost there...  You gasp")
                    await pause(2)
                    print("As you reach to grip the last branch, you feel")
                    print("your other hand begin to slide off the branch it was holding.")
                    print("Horified you realize that you are no longer on the tree... but in the air")
                    print("and the ground is rushing up ever nearer.")
                    await pause(6)
                    print("You fall...")
                    for (let a = 1; a <= 3; a++) {
                        await pause(0.5)
                        print("and fall...")
                    }
                    await pause(1)
                    print("With a sickening jolt your world fades out...")
                    await pause(2)
                    color(black, black)
                    clear()
                    await pause(1.6)
                    color(black, darkwhite)
                    clear()
                    print("You come to with a stinging sensation all over your body.  You are lucky to")
                    print("be alive.")
                    player.hp = 1
                    player.sp = 1
                    if (player.flags.assistant) {
                        color(magenta)
                        print("Assistant -- ouch.")
                        print("Assistant -- You need to train agility, strength and stamina.")
                    }
                }
            } else {
                print("You decide that you have gone far enough and begin the descent.")
                await pause(2)
                print("You reach the ground safely.")
            }
        })
    },
    treehouse_platform(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'treehouse platform',
            description: 'A Treehouse Platform',
        }).action('climb down', async function (player: Character) {
            color(black)
            print("You begin your descent...")
            await pause(2)
            print("You continue to climb downwards...")
            await pause(3)
            print("After an exhausting climb you feel grateful to be on the ground again!")
            player.relocate(player.game.find_location(64) || null)
        })
    },
    mixing_pot(game: GameState): Landmark {
        return new Landmark({
            game: game,
            name: 'mixing pot',
            description: 'A Mixing Pot',
        }).action('look mixing pot', async function (player) {
            color(gray)
            print("  * A Mixing Pot")
            print()
            color(black)
            this.contents?.items.forEach(item => {
                print(`    ${item.name}`)
            })
            if (player.flags.assistant) {
                color(magenta)
                print(`Assistant -- type \"add\" + an ingredient to add that to the pot.`)
            }
        }).action('add', async function (player, item: string) {
            color(black)
            const itemObj = player.inventory.item(item)
            if (itemObj) {
                player.inventory.transfer(itemObj, this.contents)
                print(`Added ${itemObj.name} to mixing pot.`)
                if (player.flags.assistant) {
                    color(magenta)
                    print(`Assistant -- type \"mix potion\" to stir the ingredients together.`)
                }
            } else {
                print(`You don't have that.`)
            }
        }).action('mix potion', async function (player) {
            color(green)
            print("Mixing Potion", 1);
            await pause(1); print(".", 1);
            await pause(1); print(".", 1);
            await pause(1); print(".");
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
                print(`You remove the potion from the pot and wala! it is now: `, 1)
                color(black)
                print(`${potion?.name}.`)
            } else {
                color(black)
                print("The potion refuses to coalesce.  All ingredients returned.")
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
            color(black)
            print("You can't go that way. The slash is impassable.")
        }).action('go east', async function (player) {
            color(black)
            print("You can't go that way. The slash is impassable.")
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
            color(blue)
            print("You touch the portal stone...")
            await pause(1)
            player.relocate(player.game.find_location("Eldin's Mountain Cottage"))
        })
    },
    slot_canyon(game: GameState): Landmark {
        async function go_down(this: Landmark, player: Character) {
            if (player.isPlayer) {
                color(black)
                print("You climb carefully down the steep canyon, picking your way among the rocks.")
                await pause(2)
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