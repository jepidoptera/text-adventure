import { qbColors, black, darkwhite } from "../../game/colors.js";
import { randomChoice } from "../../game/utils.js";

function musicc$(n: number) {
    return Array.from(
        { length: n },
        () => {
            const color1 = randomChoice([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
            const color2 = randomChoice([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter(c => c !== color1))
            return [color1, color2]
        }
    )
}
function play(music: number[][]) {
    for (let i = 0; i < music.length; i++) {
        color(qbColors[music[i][0]], qbColors[music[i][1]]);
        // print music note
        print("♫", 1);
        // Play music[i]
    }
    color(black, darkwhite);
    return music
}

export { musicc$, play };