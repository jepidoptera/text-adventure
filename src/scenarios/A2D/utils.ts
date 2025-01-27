import { qbColors, black, darkwhite, colorDict } from "../../game/colors.js";
import { randomChoice } from "../../game/utils.js";

function musicc$(n: number) {
    let music = Array.from(
        { length: n },
        () => {
            const color1 = randomChoice(Object.keys(colorDict))
            const color2 = randomChoice(Object.keys(colorDict).filter(c => c !== color1))
            return [color1, color2]
        }
    )
    let song = '';
    for (let i = 0; i < music.length; i++) {
        song += `<${music[i][0]}, ${music[i][1]}>`;
        // print music note
        song += "♫";
        // Play music[i]
    }
    song += `<black, darkwhite> `;
    return song;
}

export { musicc$ };