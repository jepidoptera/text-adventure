import { GameState } from '../../game/game.ts'
import { Location } from '../../game/location.ts'
import { Character } from '../../game/character.ts'
import { getItem, ItemKey } from './items.ts'
import { getLandmark } from './landmarks.ts'
import { GameMap } from './map.ts'
import { Player } from './player.ts'
import { A2dCharacter, getCharacter } from './characters.ts'
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts'

class A2D extends GameState {
    respawnInterval!: ReturnType<typeof setInterval>;
    player!: Player;
    flags: {
        ieadon: boolean,
        soldiers_remaining: number,
        colonel_arach: boolean,
        biadon: boolean,
        ziatos: boolean,
        turlin: boolean,
        henge: boolean,
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
            this.center("A  D  V  E  N  T  U  R  E   I I")
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
        }
        else if (opt === 1) {
            await this.load(
                await input('Enter save name: ')
            )
            this.player = this.characters.find(char => char.isPlayer) as Player;
        }
        this.player.game = this;
        this.respawnInterval = setInterval(async () => {
            // console.log('respawn interval')
            // console.log(`looping ${this.characters.length} characters`)
            for (let character of this.characters) {
                if (character.respawnCountdown) {
                    character.respawnCountdown -= 5;
                    // console.log(`${character.name} ${character.respawnCountdown}`)
                    if (character.respawnCountdown <= 0) {
                        console.log('respawning', character.name)
                        character.respawnCountdown = 0;
                    }
                }
            }
        }, 5000)
        this.main();
    }

    async main() {
        let command = '';
        console.log('starting main loop');
        await this.player.look();
        while (!(command in ['exit', 'quit'])) {
            await this.player.getInput();
            for (let character of this.characters.sort((a, b) => a.isPlayer ? 1 : -1)) {
                if (character.respawnCountdown == -1) {
                    character.respawnCountdown = 0;
                    await character.respawn();
                }
                if (character.act) {
                    // console.log(`${character.name} acting`)
                    await character.act(this);
                }
            }
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
            // show stats
            new_player.checkStats();

            await getKey();
            this.clear();
            print("During-game assistant (recommended)? y/n")
            new_player.flags.assistant = await getKey(['y', 'n']) === 'y';
            print("Type \"assistant off\" or \"assistant on\" to toggle assistant during game.")

            resolve(new_player);
        })
    }

    center(text: string) {
        const x = Math.floor((80 - text.length) / 2);
        print(' '.repeat(x) + text);
    }

    get characters(): A2dCharacter[] {
        return super.characters as A2dCharacter[];
    }

    async save(saveName: string): Promise<void> {

        const gameStateObj: any = {
            locations: {},
            flags: this.flags
        };

        this.locations.forEach((location, key) => {
            gameStateObj.locations[key] = {
                name: location.name,
                characters: [...location.characters].map(char => (
                    char.save()
                )),
                landmarks: location.landmarks.map(landmark => (
                    landmark.save()
                )),
                items: location.items.map(item => ({
                    key: item.key,
                    name: item.name,
                    quantity: item.quantity
                }))
            };
        });

        this._save(saveName, gameStateObj);
    }

    async load(saveName: string): Promise<void> {
        const gamestate = await this._load(saveName) as any;
        this.locations = new Map()
        Object.keys(gamestate.locations).forEach(key => {
            const location = gamestate.locations[key];
            const newLocation = new Location({
                name: location.name,
                characters: location.characters.map((character: any) => {
                    // TODO: this does not give these characters the ability to retain items other than what they're instantiated with in getCharacter
                    Object.assign(getCharacter(character.key), character)
                }),
                items: location.items.map((itemData: any) => Object.assign(getItem(itemData.key), itemData)),
            });
            location.landmarks.forEach((landmarkData: any) => {
                const newLandmark = getLandmark(landmarkData.name, landmarkData.text);
                newLandmark.contents = landmarkData.contents.map((itemData: any) => Object.assign(getItem(itemData.key), itemData));
            });
            this.locations.set(key, newLocation)
        });
    }
}


export { A2D };