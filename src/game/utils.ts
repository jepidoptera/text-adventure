import { Character } from './character.js';
import { black, red } from './colors.js';
function caps(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function plural(str: string): string {
    if (str.includes('of')) return plural(str.split('of')[0].trim()) + ' of ' + str.split('of')[1].trim();
    let ans = str;
    let l1 = str.slice(-1);
    let l2 = str.slice(-2);
    if (l1 == "x" || l1 == "s" || l2 == "ch" || l2 == "sh") {
        ans += "e";
    }
    else if (l1 == "f" && l2 != "ff") {
        ans = ans.slice(0, -1) + "ve";
    }
    else if (l1 == "y" && l2 != "ey" && l2 != "ay" && l2 != "oy" && l2 != "iy") {
        ans = ans.slice(0, -1) + "ie";
    }
    ans += "s";
    return ans;
}

function randomChoice<T>(arr: T[]): T {
    if (arr.length <= 1) return arr[0];
    return arr[Math.floor(Math.random() * arr.length)];
}

function highRandom(times = 1): number {
    return Math.sqrt(Math.random()) * times;
}

function lineBreak(text: string) {
    const lineLength = 80;
    let lines = [];
    let currentLine = '';
    if (text.length < lineLength) return text;
    for (let word of text.split(' ')) {
        if (currentLine.length + word.length + 1 > lineLength) {
            lines.push(currentLine);
            currentLine = '';
        }
        currentLine += word + ' ';
    }
    lines.push(currentLine);
    return lines.join('\n');
}

function printCharacters({
    characters,
    basecolor = black,
    charcolor = red,
    capitalize = false
}: { characters: Character[], basecolor?: string, charcolor?: string, capitalize?: boolean }) {
    const enemy_numbers = characters?.reduce((acc, char) => {
        if (acc[char.name]) acc[char.name]++;
        else acc[char.name] = 1;
        return acc;
    }, {} as { [key: string]: number });
    const enemy_names = Object.keys(enemy_numbers).sort((a, b) => enemy_numbers[a] - enemy_numbers[b]);
    const enemy_list = enemy_names.map(name => enemy_numbers[name] > 1 ? plural(name) : name)
    color(basecolor)
    for (let i = 0; i < enemy_list.length; i++) {
        if (enemy_numbers[enemy_names[i]] > 1) print(`${enemy_numbers[enemy_names[i]]} `, 1)
        color(charcolor)
        print(i == 0 && capitalize ? caps(enemy_list[i]) : enemy_list[i], 1)
        color(basecolor)
        if (i < enemy_list.length - 2) print(', ', 1)
        else if (i < enemy_list.length - 1) print(' and ', 1)
    }
}

export { caps, plural, randomChoice, highRandom, lineBreak, printCharacters };