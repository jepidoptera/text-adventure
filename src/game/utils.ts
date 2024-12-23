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

function highRandom() {
    return Math.sqrt(Math.random());
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

export { caps, plural, randomChoice, highRandom, lineBreak };