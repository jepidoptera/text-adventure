import { Landmark } from '../../game/location.ts';
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts'

const landmarks = {
    sign(text?: string | string[]): Landmark {
        if (Array.isArray(text)) {
            text = text.join('\n')
        }
        return new Landmark({
            name: 'sign',
            description: 'A Sign',
            onAssign: (location) => {
                location.actions.set('read sign', () => {
                    color(gray)
                    print(text)
                })
            }
        })
    },
    get towering_tree(): Landmark {
        return new Landmark({
            name: 'tree',
            description: '"A Monstrous, Sky-Touching Tree"',
        })
    },
    get mixing_pot(): Landmark {
        return new Landmark({
            name: 'mixing pot',
            description: 'A Mixing Pot',
            onAssign: (location) => {
                location.actions.set('mix potion', () => {
                    print('You stir the pot')
                    // TODO: Add potion mixing logic
                })
            }
        })
    },
    get scarecrow(): Landmark {
        return new Landmark({
            name: 'scarecrow',
            description: 'A Scarecrow'
        })
    },
    get locked_gate(): Landmark {
        return new Landmark({
            name: 'gates',
            description: 'Locked Gates'
        })
    },
    get slash_in_the_earth(): Landmark {
        return new Landmark({
            name: 'slash',
            description: '"A Jagged, Oozing Slash in the Earth"'
        })
    },
    get dead_cleric(): Landmark {
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