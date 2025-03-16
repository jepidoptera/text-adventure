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
    itemcolor = 'red',
    capitalize = false
}: { items: string[], basecolor?: string, itemcolor?: string, capitalize?: boolean }) {
    const item_numbers = items?.reduce((acc, name) => {
        if (acc[name]) acc[name]++;
        else acc[name] = 1;
        return acc;
    }, {} as { [key: string]: number });
    const names = Object.keys(item_numbers).sort((a, b) => item_numbers[a] - item_numbers[b]);
    const item_list = names.map(name => item_numbers[name] > 1 ? plural(name) : name)
    let return_val = `<${basecolor}>`
    for (let i = 0; i < item_list.length; i++) {
        if (item_numbers[names[i]] > 1) return_val += `${item_numbers[names[i]]} `
        return_val += `<${itemcolor}>`
        return_val += (i == 0 && capitalize ? caps(item_list[i]) : item_list[i])
        return_val += `<${basecolor}>`
        if (i < item_list.length - 2) return_val += ', '
        else if (i < item_list.length - 1) return_val += ' and '
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

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // Initialize the matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function weightedLevenshteinDistance(a: string, b: string) {
    const deletionWeight = 0.5;
    const insertionWeight = 1;
    const substitutionWeight = 1;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i * insertionWeight];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j * deletionWeight;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + substitutionWeight,
                    matrix[i][j - 1] + deletionWeight,
                    matrix[i - 1][j] + insertionWeight
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function wordSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1; // Exact matches are perfect!
    const distance = weightedLevenshteinDistance(word1, word2);
    return 1 / (1 + distance); // Inverse relationship: higher distance = lower similarity.  Adding 1 prevents division by zero.
}

function phraseSimilarity(phrase1: string, phrase2: string): number {
    const words1 = phrase1.split(" ");
    const words2 = phrase2.split(" ");

    const matrix: number[][] = [];

    for (let i = 0; i <= words1.length; i++) {
        matrix[i] = new Array(words2.length + 1).fill(0);
    }

    for (let i = 1; i <= words1.length; i++) {
        for (let j = 1; j <= words2.length; j++) {
            matrix[i][j] = wordSimilarity(words1[i - 1], words2[j - 1]);
        }
    }


    let totalSimilarity = 0;
    let matches = 0;

    for (let i = 1; i <= words1.length; i++) {
        let maxSim = 0;
        for (let j = 1; j <= words2.length; j++) {
            maxSim = Math.max(maxSim, matrix[i][j]);
        }
        totalSimilarity += maxSim;

    }

    return totalSimilarity / words1.length; // Average similarity
}

function findClosestMatch(target: string, candidates: string[]) {
    if (candidates.length === 0) return null;

    let closestMatch = candidates[0];
    let greatestSimilarity = phraseSimilarity(target, closestMatch); // Use phraseSimilarity

    for (const candidate of candidates) {
        const similarity = phraseSimilarity(target, candidate);
        if (similarity > greatestSimilarity) {
            greatestSimilarity = similarity;
            closestMatch = candidate;
        }
    }

    return closestMatch;
}

export {
    caps,
    plural,
    singular,
    randomChoice,
    highRandom,
    lineBreak,
    printCharacters,
    parseColoredText,
    splitFirst,
    generateSessionID,
    findClosestMatch
};