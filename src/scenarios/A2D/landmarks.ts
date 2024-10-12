import { Landmark } from '../../game/location.ts';
import { Item, Container } from '../../game/item.ts';
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts'
import { potions } from './items.ts'

const landmarks = {
    sign(text?: string | string[]): Landmark {
        if (Array.isArray(text)) {
            text = text.join('\n')
        }
        return new Landmark({
            name: 'sign',
            description: 'A Sign',
        }).assign(function (location) {
            location.addAction('read sign', async () => {
                color(gray)
                print(text)
            })
        })
    },
    towering_tree(): Landmark {
        return new Landmark({
            name: 'tree',
            description: 'A Monstrous, Sky-Touching Tree',
        })
    },
    mixing_pot(): Landmark {
        return new Landmark({
            name: 'mixing pot',
            description: 'A Mixing Pot',
        }).assign(function (location) {
            location.addAction('look mixing pot', async (player) => {
                color(gray)
                print("  * A Mixing Pot")
                print()
                color(black)
                this.contents?.items.forEach(item => {
                    print(`    ${item.name}`)
                })
                if (player.flags.assistant) {
                    print(`Assistant -- type \"add\" + an ingredient to add that to the pot.`)
                }
            })
            location.addAction('add', async (player, item: string) => {
                color(black)
                const itemObj = player.inventory.item(item)
                if (itemObj) {
                    player.inventory.transfer(itemObj, this.contents)
                    print(`Added ${itemObj.name} to mixing pot.`)
                    if (player.flags.assistant) {
                        print(`Assistant -- type \"mix potion\" to stir the ingredients together.`)
                    }
                } else {
                    print(`You don't have that.`)
                }
            })
            location.addAction('mix potion', async (player) => {
                color(black)
                print("Mixing Potion", 1);
                await pause(1); print(".", 1);
                await pause(1); print(".", 1);
                await pause(1); print(".", 1);
                const contents = this.contents.items.map(i => i.name).sort().join(', ')
                console.log(contents)
                if (potions.has(contents)) {
                    // made something
                    this.contents.clear()
                    const potion = potions.get(contents)!();
                    player.inventory.add(potion);
                    print(`You remove the potion from the pot and wala! it is now: ${potion.name}.`)
                } else {
                    print("The potion refuses to coalesce.  All ingredients returned.")
                    this.contents.transferAll(player.inventory)
                }
            })
        })
    },
    scarecrow(): Landmark {
        return new Landmark({
            name: 'scarecrow',
            description: 'A Scarecrow'
        })
    },
    locked_gate(): Landmark {
        return new Landmark({
            name: 'gates',
            description: 'Locked Gates'
        })
    },
    open_gate(): Landmark {
        return new Landmark({
            name: 'gates',
            description: 'Open Gates'
        })
    },
    slash_in_the_earth(): Landmark {
        return new Landmark({
            name: 'slash',
            description: 'A Jagged, Oozing Slash in the Earth'
        })
    },
    dead_cleric(): Landmark {
        return new Landmark({
            name: 'dead cleric',
            description: 'corpse of the wise man'
        })
    },
    unknown(n: number): Landmark {
        return new Landmark({
            name: `Unknown Landscape Item ${n}`,
            description: `Unknown Landscape Item ${n}`
        })
    }
}

export { landmarks };