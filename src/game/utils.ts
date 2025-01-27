import { Character } from './character.js';
import { black, red, colorDict } from './colors.js';

function caps(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const pluralExceptions: { [key: string]: string } = {
    'person': 'people',
    'child': 'children',
    'tooth': 'teeth',
    'foot': 'feet',
    'goose': 'geese',
    'engulf': 'engulfs',
}

function plural(str: string): string {
    if (pluralExceptions[str]) return pluralExceptions[str];
    if (str.includes('of')) return plural(str.split('of')[0].trim()) + ' of ' + str.split('of')[1].trim();
    let l1 = str.slice(-1);
    let l2 = str.slice(-2);
    if (l1 == "x" || l1 == "s" || l2 == "ch" || l2 == "sh" || l1 == "z") {
        return str + "es";
    } else if (l1 == "f" && l2 != "ff") {
        return str.slice(0, -1) + "ves";
    } else if (l1 == "y" && l2 != "ey" && l2 != "ay" && l2 != "oy" && l2 != "iy") {
        return str.slice(0, -1) + "ies";
    } else if (l1 == "o" && l2 != "oo") {
        return str + "es";
    } else if (str.slice(3) == "man") {
        return str.slice(0, -3) + 'men';
    } else {
        return str + "s";
    }
}

function singular(str: string): string {
    if (str.includes('of')) return singular(str.split('of')[0].trim()) + ' of ' + str.split('of')[1].trim();
    if (str.slice(-1) != "s") {
        return str;
    } else if (str.slice(-2) == "es") {
        let l1 = str.slice(-4, -3);
        let l2 = str.slice(-4, -2);
        if (l1 == 'x' || l1 == 's' || l2 == 'ch' || l2 == 'sh') {
            str = str.slice(0, -2);
        }
    }
    if (str.slice(-3) == "ies") {
        str = str.slice(0, -3) + "y";
    } else if (str.slice(-3) == "ves") {
        const fToVes = ['leaf', 'wolf', 'half', 'self', 'shelf', 'elf', 'loaf', 'thief', 'life', 'knife', 'wife', 'calf', 'hoof', 'dwarf'];
        const stem = str.slice(0, -3);
        if (fToVes.some(word => word.startsWith(stem))) {
            str = stem + "f";
        } else {
            str = str.slice(0, -1);
        }
    } else {
        str = str.slice(0, -1);
    }
    return str;
}

function randomChoice<T>(arr: T[], weights: { [K in keyof T & string]: number } = {} as any): T {
    if (arr.length <= 1) {
        return arr[0];
    }

    if (Object.keys(weights).length === 0) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    let totalWeight = 0;
    for (const item of arr) {
        const key = String(item) as keyof T & string;
        if (!(key in weights)) {
            weights[key] = 1;
        } else if (weights[key] < 0) {
            weights[key] = 0;
        }
        totalWeight += weights[key];
    }

    if (totalWeight === 0) {
        console.log("randomChoice warning: total weight should be greater than 0.\n", arr, weights);
    }

    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;

    for (const item of arr) {
        const key = String(item) as keyof T & string;
        cumulativeWeight += weights[key];
        if (random <= cumulativeWeight) {
            return item;
        }
    }

    return arr[arr.length - 1];
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
            lines.push(currentLine.trim());
            currentLine = '';
        }
        currentLine += word + ' ';
    }
    lines.push(currentLine);
    return lines.join('\n');
}

function printCharacters({
    characters,
    basecolor = 'black',
    charcolor = 'red',
    capitalize = false
}: { characters: Character[], basecolor?: string, charcolor?: string, capitalize?: boolean }) {
    const enemy_numbers = characters?.reduce((acc, char) => {
        if (acc[char.name]) acc[char.name]++;
        else acc[char.name] = 1;
        return acc;
    }, {} as { [key: string]: number });
    const enemy_names = Object.keys(enemy_numbers).sort((a, b) => enemy_numbers[a] - enemy_numbers[b]);
    const enemy_list = enemy_names.map(name => enemy_numbers[name] > 1 ? plural(name) : name)
    let return_val = `<${basecolor}>`
    for (let i = 0; i < enemy_list.length; i++) {
        if (enemy_numbers[enemy_names[i]] > 1) return_val += `${enemy_numbers[enemy_names[i]]} `
        return_val += `<${charcolor}>`
        return_val += (i == 0 && capitalize ? caps(enemy_list[i]) : enemy_list[i])
        return_val += `<${basecolor}>`
        if (i < enemy_list.length - 2) return_val += ', '
        else if (i < enemy_list.length - 1) return_val += ' and '
    }
    return return_val;
}

function listify({
    items,
    basecolor = 'black',
    charcolor = 'red',
    capitalize = false
}: { items: string[], basecolor?: string, charcolor?: string, capitalize?: boolean }) {
    const enemy_numbers = items?.reduce((acc, name) => {
        if (acc[name]) acc[name]++;
        else acc[name] = 1;
        return acc;
    }, {} as { [key: string]: number });
    const names = Object.keys(enemy_numbers).sort((a, b) => enemy_numbers[a] - enemy_numbers[b]);
    const enemy_list = names.map(name => enemy_numbers[name] > 1 ? plural(name) : name)
    let return_val = `<${basecolor}>`
    for (let i = 0; i < enemy_list.length; i++) {
        if (enemy_numbers[names[i]] > 1) return_val += `${enemy_numbers[names[i]]} `
        return_val += `<${charcolor}>`
        return_val += (i == 0 && capitalize ? caps(enemy_list[i]) : enemy_list[i])
        return_val += `<${basecolor}>`
        if (i < enemy_list.length - 2) return_val += ', '
        else if (i < enemy_list.length - 1) return_val += ' and '
    }
    return return_val;
}

const validColors = Object.keys(colorDict);
const colorPattern = validColors.join('|');
const tagPattern = new RegExp(`<((?:${colorPattern})?)?(?:,\\s*((?:${colorPattern})?))?>`, 'g');

function parseColoredText(text: string): [string, string][] {
    const result: [string, string][] = [];
    let lastIndex = 0;
    let currentColors: string | null = null;

    for (const match of text.matchAll(tagPattern)) {
        const matchStart = match.index!;
        const matchEnd = matchStart + match[0].length;

        // Add text between last match and this color tag
        if (matchStart > lastIndex) {
            const textContent = text.slice(lastIndex, matchStart);
            result.push([currentColors || '', textContent]);
        }

        // Update current colors
        const [_, fg, bg] = match;
        currentColors = `${fg || ''},${bg || ''}`;
        lastIndex = matchEnd;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
        result.push([currentColors || '', text.slice(lastIndex)]);
    }

    return result;
}

function splitFirst(str: string): [string, string] {
    const match = str.match(/^(\S+)(?:\s+(.*))?/);
    if (!match) return ['', ''];
    return [match[1], match[2] || ''];
}

function generateSessionID(): string {
    return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export { caps, plural, singular, randomChoice, highRandom, lineBreak, printCharacters, parseColoredText, splitFirst, generateSessionID };