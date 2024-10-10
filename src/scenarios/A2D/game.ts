import { GameState } from '../../game/game.ts'
import {Character, Item, Location} from '../../game/location.ts'
import { items } from './items.ts'
import { GameMap } from './map.ts'
import { Player } from './player.ts'
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts'

class A2D extends GameState {
    
    player!: Player;
    flags: {
        ieadon: boolean,
        soldiers_remaining: number,
        colonel_arach: boolean,
        biadon: boolean,
        ziatos: boolean,
        turlin: boolean,
        henge: boolean,
        forest_pass: boolean,
        cradel: boolean,
        orc_mission: boolean,
        sift: boolean
    } = {
        ieadon: false,
        soldiers_remaining: 0,
        colonel_arach: false,
        biadon: false,
        ziatos: false,
        turlin: false,
        henge: false,
        forest_pass: false,
        cradel: false,
        orc_mission: false,
        sift: false,
    }

    intro() {
        color(orange, darkwhite);
        clear();
        print()
        this.center("Redstaff Software Presents...")
        print()

        for (let f = 0; f < 16; f++) {
            color(qbColors[f], darkwhite)
            this.center ("A  D  V  E  N  T  U  R  E   I I")
        }
        color('black')
        print()
        this.center("DELUX")
        color('gray')
        this.center(">Special Edition<")
    }

    async start() {
        this.loadScenario(new GameMap().locations);
        this.intro();
        await getKey();
        this.clear();
        const opt = await this.optionBox({
            title: 'Adventure 2 Setup', 
            options: ['Start New', 'Load Game', 'Exit']
        })
        this.clear();
        console.log('chose', opt);
        if (opt === 0) {
            this.player = await this.newCharacter();
            this.main();
        }
        else if (opt === 1) {
            // todo: load game
        }
    }

    async main() {
        let command = '';
        console.log('starting main loop');
        this.player.look();
        this.player.hunger = this.player.max_sp / 2
        while (!(command in ['exit', 'quit'])) {
            await this.player.getInput();
            this.characters.forEach(character => {
                if (character.act) {
                    console.log(`${character.name} acting`)
                    character.act(this);
                }
            });
        }
    }

    newCharacter(): Promise<Player> {
        return new Promise(async (resolve, reject) => {
            this.clear();
            const classes = ['Thief', 'Fighter', 'Spellcaster', 'Cleric']
            const new_player = new Player(
                await input('\n\nType a name for yourself:'),
                classes[await this.optionBox({
                    title: "     Choose One          ", 
                    options: classes, 
                    default_option: 1
                })]
            )
            new_player.location = this.find_location('Cottage of the Young');

            color('yellow')
            print("-- ", 1)
            color('red')
            print("You have declared ", 1)
            color('blue')
            print(new_player.class_name, 1)
            color('red')
            print(" Status ", 1)
            color('yellow')
            print("--")
            color('black')
                 
            print(`Archery: ${new_player.archery}`)
            print(`Coordination: ${new_player.coordination}`)
            print(`Agility: ${new_player.agility}`)
            print(`Attack: ${new_player.strength}`)
            print(`Max HP: ${new_player.max_hp}`)
            print(`Max SP: ${new_player.max_sp}`)
            print(`Max MP: ${new_player.max_mp}`)
            print(`Healing: ${new_player.healing}`)
            print(`OffHand: ${Math.floor(new_player.offHand * 100)}%`)
            print(`Magic Level: ${new_player.magic_level}`)

            await getKey();
            this.clear();
            print("During-game assistant (recommended)? y/n")
            new_player.assistant = await getKey(['y', 'n']) === 'y';
            print("Type \"assistant off\" or \"assistant on\" to toggle assistant during game.")

            resolve(new_player);
        })
    }
    center(text: string) {
        const x = Math.floor((80 - text.length) / 2);
        print(' '.repeat(x) + text);
    }
}

export { A2D };