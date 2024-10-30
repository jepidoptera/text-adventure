import { Buff, Character, DamageTypes } from "../../game/character.ts";
import { brightcyan, brightred } from "./colors.ts";

type BuffCreator = (({ power, duration }: { power: number, duration: number }) => Buff) | (() => Buff);
const buffs: { [key: string]: BuffCreator } = {
    shield: ({ power, duration }: { power: number, duration: number }) => {
        let shieldPower = power
        return new Buff({
            name: 'shield',
            duration: duration,
            power: power,
            bonuses: {},
            damage_modifier: {
                'magic': (damage) => damage - (1 - Math.random() * (1 - Math.random())) * Math.ceil(shieldPower),
                'fire': (damage) => damage - (1 - Math.random() * (1 - Math.random())) * Math.ceil(shieldPower),
                'electric': (damage) => damage - (1 - Math.random() * (1 - Math.random())) * Math.ceil(shieldPower),
                'blunt': (damage) => damage - (1 - Math.random() * (1 - Math.random())) * Math.ceil(shieldPower),
                'sharp': (damage) => damage - (1 - Math.random() * (1 - Math.random())) * Math.ceil(shieldPower),
                'cold': (damage) => damage - (1 - Math.random() * (1 - Math.random())) * Math.ceil(shieldPower),
                'sonic': (damage) => damage - (1 - Math.random() * (1 - Math.random())) * Math.ceil(shieldPower),
            }
        }).onTurn(async function () {
            // declines linearly
            this.power *= this.duration / (this.duration + 1);
            shieldPower = this.power;
            console.log('shield:', shieldPower)
            if (this.character.isPlayer) {
                color(brightcyan);
                print(`Shield: ${Math.ceil(shieldPower)}`);
            }
        })
    },
    bloodlust: ({ power, duration }: { power: number, duration: number }) => {
        return new Buff({
            name: 'bloodlust',
            duration: duration,
            power: power,
            bonuses: {
                strength: Math.ceil(power),
                coordination: power / 4,
            },
        }).onTurn(async function () {
            // declines linearly
            this.power *= this.duration / (this.duration + 1);
            this.bonuses.strength = Math.ceil(this.power);
            this.bonuses.coordination = this.power / 4;
            if (this.character.isPlayer) {
                color(brightred);
                print(`Bloodlust: ${Math.ceil(this.power)}`);
            }
        })
    },
    fear: ({ power, duration }: { power: number, duration: number }) => {
        return new Buff({
            name: 'fear',
            duration: duration,
            power: power,
            bonuses: {
                strength: -Math.ceil(power),
            },
        })
    }
} as const;

type BuffNames = keyof typeof buffs;

function getBuff<T extends BuffNames>(buffName: T): BuffCreator {
    const buff = buffs[buffName];
    return buff;
}

export { getBuff, BuffNames };
