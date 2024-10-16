function caps(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function plural(str: string): string {
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
    return arr[Math.floor(Math.random() * arr.length)];
}

export { caps, plural, randomChoice };