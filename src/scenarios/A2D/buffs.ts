import { randomChoice } from "../../game/utils.js";
import { Buff } from "../../game/character.js";
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from "../../game/colors.js";
import { Player } from "./player.js";

type BuffCreator = (({ power, duration }: { power: number, duration: number }) => Buff) | (() => Buff);
const buffs: { [key: string]: BuffCreator } = {
    shield: ({ power, duration }: { power: number, duration: number }) => {
        let shieldPower = power
        return new Buff({
            name: 'shield',
            duration: duration,
            power: power,
            plus: {
                defense: {
                    'magic': Math.ceil(shieldPower),
                    'fire': Math.ceil(shieldPower),
                    'electric': Math.ceil(shieldPower),
                    'blunt': Math.ceil(shieldPower),
                    'sharp': Math.ceil(shieldPower),
                    'cold': Math.ceil(shieldPower),
                    'sonic': Math.ceil(shieldPower)
                }
            }
        }).onTurn(async function () {
            // declines linearly
            this.power *= this.duration / (this.duration + 1);
            shieldPower = this.power;
            console.log('shield:', shieldPower)
            if (this.character.isPlayer && this.power > 0) {
                this.game.color(brightcyan);
                this.game.print(`Shield: ${Math.ceil(shieldPower)}`);
            }
        })
    },
    bloodlust: ({ power, duration }: { power: number, duration: number }) => {
        return new Buff({
            name: 'bloodlust',
            duration: duration,
            power: power,
            plus: {
                strength: Math.ceil(power),
                coordination: power / 4,
            },
        }).onTurn(async function () {
            // declines linearly
            this.power *= this.duration / (this.duration + 1);
            this.plus.strength = Math.ceil(this.power);
            this.plus.coordination = this.power / 4;
            if (this.character.isPlayer && this.power > 0) {
                this.game.color(brightred);
                this.game.print(`Bloodlust: ${Math.ceil(this.power)}`);
            }
        })
    },
    fear: ({ power, duration }: { power: number, duration: number }) => {
        return new Buff({
            name: 'fear',
            duration: duration,
            power: power,
            plus: {
                strength: -Math.ceil(power),
            },
        })
    },
    blindness: ({ power, duration }: { power: number, duration: number }) => {
        return new Buff({
            name: 'blindness',
            duration: duration,
            power: power,
            times: {
                coordination: 1 / power,
            },
        }).onExpire(async function () {
            if (this.character.isPlayer) {
                this.game.color(brightcyan);
                this.game.print("You can see again.");
            }
        })
    },
    poison: ({ power, duration }: { power: number, duration: number }) => {
        return new Buff({
            name: 'poison',
            duration: Math.ceil(duration || power || 1),
            power: Math.ceil(power || duration || 1)
        }).onTurn(async function () {
            this.character.hurt(Math.ceil(this.power), "poison");
            this.power *= this.duration / (this.duration + 1);
            if (this.character.isPlayer && this.power > 0) {
                this.game.color(brightgreen);
                this.game.print(`Poison: ${Math.ceil(this.power)}`);
            }
        })
    },
    sleep: ({ power, duration }: { power: number, duration: number }) => {
        return new Buff({
            name: 'sleep',
            duration: duration,
            power: power,
        }).onApply(async function () {
            if (this.character.isPlayer) {
                this.game.color(brightcyan);
                this.game.print(`Sleep: ${Math.ceil(this.duration)}`);
                (this.character as Player).disableCommands(Object.keys((this.character as Player).actions.keys()), 'Shh. You are sleeping.')
            }
        }).onTurn(async function () {
            this.apply(this.character)
        }).onExpire(async function () {
            if (this.character.isPlayer) {
                this.game.color(brightcyan);
                this.game.print("You wake up.");
                const player = this.character as Player;
                player.enableCommands(Object.keys(player.disabledCommands))
            }
        })
    },
    dreams: ({ power, duration }: { power: number, duration: number }) => {
        return new Buff({
            name: 'dreams',
            duration: duration,
            power: power,
        }).onTurn(async function () {
            const player = this.character;
            for (let i = 0; i < randomChoice([0, 0, 1, 1, 2]); i++) {
                const vis = Math.random() * this.power;
                this.game.color(magenta);
                if (vis > 120 + player.max_sp / 50) { // death by overdose
                    // too much, die
                    this.game.print("Hmmmfff..?")
                    player.die("grinning darkeness")

                } else if (vis >= 130) { // something weird should happen here

                    //transport to alternate plane?

                } else if (vis > 100) { // glimpsing an alternate plane of existence
                    const wh = Math.floor(Math.random() * 22) + 1
                    switch (wh) {
                        case (1):
                            this.game.print("A Voice - I don't know what to do with you.  I really don't.")
                            break;
                        case (2):
                            this.game.print("A Voice - Lookit here, Gardner.  Lookit here.  I want -")
                            break;
                        case (3):
                            this.game.print("A Voice - SIR!  Yes SIR!")
                            break;
                        case (4):
                            this.game.print("A Voice - You don't know what you're into here.  You don't have a clue.")
                            break;
                        case (5):
                            this.game.print("A Voice - YOU ARE NOT WANTED HERE GET OUT OUT GET OUT.")
                            break;
                        case (6):
                            this.game.print("A Voice - THIS IS NOT A PLACE FOR YOU YOU'RE GOING TO DIE YOU MUST LEAVE.")
                            break;
                        case (7):
                            this.game.print("A Voice - You are ONE INCH from the edge, bucko.  One lousy inch.")
                            break;
                        case (8):
                            this.game.print("A Voice - Please, do have a care.  The princess is \"sleeping\".")
                            break;
                        case (9):
                            this.game.print("A Voice - Oh, dear.  These bloodstains are so hard to scrub out...")
                            break;
                        case (10):
                            this.game.print("A Voice - By the orders of Sergeant Bunterscotch, SIR!")
                            break;
                        case (11):
                            this.game.print("A Voice - Oh, but it's not about the money, highness.  It's about YOU.")
                            break;
                        case (12):
                            this.game.print("A Voice - What do you think you're doing?  Can't you take a hint?")
                            break;
                        case (13):
                            this.game.print("A Voice - Oh, hohoho.  Ah, hahahaha.  Ha.  You crack me up, princess.")
                            break;
                        case (14):
                            this.game.print("A Voice - Don't make me laugh.  There IS no way out.")
                            break;
                        case (15):
                            this.game.print("A Voice - As sargeant Bunterscotch commands...")
                            break;
                        case (16):
                            this.game.print("A Voice - BACK YOU ARE TOO FAR GO BACK TURN AROUND GO YOU MUST GO")
                            break;
                        case (17):
                            this.game.print("A Voice - I'm truly sorry, but there aren't enough unsevered heads to go around.")
                            break;
                        case (18):
                            this.game.print("A Voice - Yes SIR!  Right away, Sgt. Butterscotch SIR!")
                            break;
                        case (19):
                            this.game.print("A Voice - Tick, tock, princess.  I'm \"waiting\".")
                            break;
                        case (20):
                            this.game.print("A Voice - One more jibe like that, and you'll be drinking your own spinal fluid.")
                            break;
                        case (21):
                            this.game.print("A Voice - BE WARNED IT IS TOO FAR YOU MUST STOP YOU WILL DIE GO OUT")
                        case (22):
                            this.game.print("A Voice - Come on.  I DARE you.")
                            break;

                    }

                } else if (vis > 80) { // losing touch with reality, freaking out
                    const wh = Math.floor(Math.random() * 83) + 1
                    switch (wh) {
                        case (1):
                            this.game.print("A Voice - I warn you, she had better die screaming.")
                            break;
                        case (2):
                            this.game.print("Why are you looking for your left foot?  You don't have one.")
                            break;
                        case (3):
                            this.game.print("A Voice - Not a chance, do you hear me?  Not a CHANCE!")
                            break;
                        case (4):
                            this.game.print("Red... everything is red.  It's melting.")
                            break;
                        case (5):
                            this.game.print("Believe me, I wish it wasn't.")
                            break;
                        case (6):
                            this.game.print("A Voice - look away, look away!")
                            break;
                        case (7):
                            this.game.print("Well - if it isn't sergeant butterscotch.")
                            break;
                        case (8):
                            this.game.print("A Voice - God is behind you.  Turn around.")
                            break;
                        case (9):
                            this.game.print("Where is my other foot?")
                            break;
                        case (10):
                            this.game.print("I said your left head, not that one!")
                            break;
                        case (11):
                            this.game.print("A Voice - you really don't get it, do you?")
                            break;
                        case (12):
                            this.game.print("A Voice - I do NOT want another screw-up.  This time bring me her head!")
                            break;
                        case (13):
                            this.game.print("A Voice - He's a devious one, that.  Dangerous.  Butterscotch.")
                            break;
                        case (14):
                            this.game.print("The king is in the room.  Hail him!")
                            break;
                        case (15):
                            this.game.print("I told you, she's dead.  Now, if you'll excuse me...")
                            break;
                        case (16):
                            this.game.print("A Voice - I like the consistency of this one.  Tell me, what was her name?")
                            break;
                        case (17):
                            this.game.print("A Voice - Don't toy with me, friend.")
                            break;
                        case (18):
                            this.game.print("Doesn't that tree look delicious?  Positively scrumptious?  Bumptious even?")
                            break;
                        case (19):
                            this.game.print("Jess came back.  She - she didn't make it.")
                            break;
                        case (20):
                            this.game.print("The problem is, you missed something.  Something important.")
                            break;
                        case (21):
                            this.game.print("Nice work.  But are you sure the hole's big enough?")
                            break;
                        case (22):
                            this.game.print("I've had it up to HERE, bucko.")
                            break;
                        case (23):
                            this.game.print("A Voice - Don't give it to him, Harry!  He's a murdering bastard!")
                            break;
                        case (24):
                            this.game.print("Show me your tail feathers OR I'LL KILL YOU!!!")
                            break;
                        case (25):
                            this.game.print("We never give up/ we never give in/ we never surrender/ we're going to win...")
                            break;
                        case (26):
                            this.game.print("A Voice - Here they come, lads!  Hold your ground!")
                            break;
                        case (27):
                            this.game.print("A Voice - Rest easy, men. We'll camp here for the night.")
                            break;
                        case (28):
                            this.game.print("Cheers for discordia!  There's hope yet!  AHHG.!.. #-P.  OH NO")
                            break;
                        case (29):
                            this.game.print("ALL RIGHT ALL RIGHT ALL RIGHT ALL RIGHT ALL RIGHT ALL RIGHT ALL RIght al|;,. ")
                            break;
                        case (30):
                            this.game.print("Shhh... we can hear you....                              *")
                            break;
                        case (31):
                            this.game.print("A Voice - Don't let it get to you.  He's like that with everyone.")
                            break;
                        case (32):
                            this.game.print("A Voice - Save it, chump.  The alligators will just LOVE to listen.")
                            break;
                        case (33):
                            this.game.print("A Voice - Better hand it over, son.  Someone could get hurt.")
                            break;
                        case (34):
                            this.game.print("Quote([Text], [carry])")
                            break;
                        case (35):
                            this.game.print("It's true... there's not much time left...")
                            break;
                        case (36):
                            this.game.print("here's your order of bunsen border of broiled chowder thankyou goodbye, ahhh")
                            break;
                        case (37):
                            this.game.print("A Voice - ...I expected, Drio...  we can all see where your loyalties lie...")
                            break;
                        case (38):
                            this.game.print("A Voice - ...terrible.  I think they know.")
                            break;
                        case (39):
                            this.game.print("A Voice - How much did he let on?")
                            break;
                        case (40):
                            this.game.print("I think it's something much fouler than just ", 1)
                            this.game.color(yellow)
                            this.game.print("c", 1)
                            this.game.color(brightmagenta)
                            this.game.print("o", 1)
                            this.game.color(brightcyan)
                            this.game.print("l", 1)
                            this.game.color(brightgreen)
                            this.game.print("o", 1)
                            this.game.color(black)
                            this.game.print("r", 1)
                            this.game.color(brightblue)
                            this.game.print("s", 1)
                            this.game.color(magenta)
                            this.game.print(", if you get me.")
                            break;
                        case (41):
                            this.game.print("Ah, well, it's all over, save yourselves, why not...")
                            break;
                        case (42):
                            this.game.print("DE DE DE DE De De De De de de de de _de _de _de _de...")
                            break;
                        case (43):
                            this.game.print("A Voice - Grin and bear it, lad.  I HIGHLY recommend it.")
                            break;
                        case (44):
                            this.game.print("Salamander stroganoff... casserole... eyes...")
                            break;
                        case (45):
                            this.game.print("A Voice - Having second thoughts, princess?  Well, you know the alternative...")
                            break;
                        case (46):
                            this.game.print("Go ahead and scream. . But I don't think they can hear you.")
                            break;
                        case (47):
                            this.game.print("*grin*")
                            break;
                        case (48):
                            this.game.print("Oh yeah... I forgot... you don't have a face...")
                            break;
                        case (49):
                            this.game.print("A Voice - Oh, god... please don't look")
                            break;
                        case (50):
                            this.game.print("Assistant -- I'm going away now...")
                            break;
                        case (51):
                            this.game.print("A Voice - Time to die now, friend.")
                            break;
                        case (52):
                            this.game.print("A Voice - Would you like some more \"special sauce\", sir?")
                            break;
                        case (53):
                            this.game.print("Assistant -- you're going to scream like a little girl.")
                            break;
                        case (54):
                            this.game.print("Assistant -- do you want some more crumbcake?  I sure do.")
                            break;
                        case (55):
                            this.game.print("A Voice - So they're dead.  Big deal.  Or haven't you got a shovel?")
                            break;
                        case (56):
                            this.game.print("Look at it this way... as long as they're alive, he won't come after US.")
                            break;
                        case (57):
                            this.game.print("We don't know.  He may never wake up.")
                            break;
                        case (58):
                            this.game.print("Look at it this way: at least now he's not snoring.")
                            break;
                        case (59):
                            this.game.print("Here, have another... they're only human livers.")
                            break;
                        case (60):
                            this.game.print("So, whack him again.  What's the problem?")
                            break;
                        case (61):
                            this.game.print("Assistant -- You should DEFINITELY eat that.")
                            break;
                        case (62):
                            this.game.print("Look behind you, my son.  Do it now.")
                            break;
                        case (63):
                            this.game.print("My word!  Who would have guessed the pancreas went so well with crackers?")
                            break;
                        case (64):
                            this.game.print("Glowing eyes, forked tail, no soul - he'll fit right in.")
                            break;
                        case (65):
                            this.game.print("Seven and seven... nine plus nine... all that's yours will soon be mine...")
                            break;
                        case (66):
                            this.game.print("A Voice - They're coming to get you...")
                            break;
                        case (67):
                            this.game.print("Banana + acid + left arm of user = potion of ultimate mega-power! eat one today")
                            break;
                        case (68):
                            this.game.print("A Voice - I'll give you some time to think, princess.  You've got until dawn.")
                            break;
                        case (69):
                            this.game.print("A Voice - It's head cheese, the sargeant's own.  And no, he doesn't use cows.")
                            break;
                        case (70):
                            this.game.print("Assistant -- Never underestimate me again.")
                            break;
                        case (71):
                            this.game.print("Assistant -- Have another mushroom.  It won't kill you.")
                            break;
                        case (72):
                            this.game.print("Assistant -- Type \"𐕁𐕂𐕃𐕄𐕇𐕐𐕕𐕠\" to turn into a magic flying wolf.")
                            break;
                        case (73):
                            this.game.print("A Voice - No one move.  He hasn't seen us yet.")
                            break;
                        case (74):
                            this.game.print("A Voice - All right, hop on.  I can take you to the next crossroads.")
                            break;
                        case (75):
                            this.game.print("A Voice - Never mind that.  Just give me the map.")
                            break;
                        case (76):
                            this.game.print("..so young as a babe, never so old as a hill, the middle-aged the dragons kill..")
                            break;
                        case (77):
                            this.game.print("A Voice - This is my legacy.  All of this.")
                            break;
                        case (78):
                            this.game.print("A Voice - As we've seen, it's never too late to screw up and ruin everything.")
                            break;
                        case (79):
                            this.game.print("A Voice - Just don't ask me what the pancakes are made from.")
                            break;
                        case (80):
                            this.game.print("A Voice - They're ideal finger food.  Haha, Get it?  FINGER food?")
                            break;
                        case (81):
                            this.game.print("A Voice - We DO we eat so many human body parts?  Is it just to be evil?")
                            break;
                        case (82):
                            this.game.print("A Voice - Bar the gates, arm the troops, fortify everything - he's coming.")
                            break;
                        case (83):
                            this.game.print("Nothing doing, buster, I'm still eating your house.")
                    }

                } else if (vis > 60) { // complex hallucinations
                    const wh = Math.floor(Math.random() * 90) + 1
                    switch (wh) {
                        case (1):
                            this.game.print("Frankly, I don't know WHAT he's on about.")
                            break;
                        case (2):
                            this.game.print("A Voice - Give up, you don't have a chance.")
                            break;
                        case (3):
                            this.game.print("If you turn on your head, you'll see a butterfly.")
                            break;
                        case (4):
                            this.game.print("Red... nothing is red.  Nothing has ever been red.  There's no such thing.")
                            break;
                        case (5):
                            this.game.print("A Voice - Y'all have good time, now.")
                            break;
                        case (6):
                            this.game.print("A Voice - If only you hadn't asked me that.")
                            break;
                        case (7):
                            this.game.print("Careful. Sergeant Butterscotch takes no prisoners - at least not for long.")
                            break;
                        case (8):
                            this.game.print("A Voice - Dance, baby, Dance!  Put your head on top of it!")
                            break;
                        case (9):
                            this.game.print("I think someone must be in the room with me.  Hello?")
                            break;
                        case (10):
                            this.game.print("But if it's not mine - then whose IS it?")
                            break;
                        case (11):
                            this.game.print("Shut up!  You jerk!")
                            break;
                        case (12):
                            this.game.print("Molotov, Molotov...  Ah, yes.  He was a good man.")
                            break;
                        case (13):
                            this.game.print("Good heavens!  It's a blowfish.")
                            break;
                        case (14):
                            this.game.print("It's the end, chums.  It's the end, Paratikos.")
                            break;
                        case (15):
                            this.game.print("After all this, he's going to need a scotch.  And some butter.")
                            break;
                        case (16):
                            this.game.print("Right turns are better, anyway.")
                            break;
                        case (17):
                            this.game.print("we don't like it here.")
                            break;
                        case (18):
                            this.game.print("A Voice - You don't get out much, do you?")
                            break;
                        case (19):
                            this.game.print("Put out that candle!  Do you want me to go blind?")
                            break;
                        case (20):
                            this.game.print("A Voice - AHHHHHHH!")
                            break;
                        case (21):
                            this.game.print("Nice one, genius.  Now get off the swingset.")
                            break;
                        case (22):
                            this.game.print("You must keep this to yourself.  It wouldn't do to go spreading like jam.")
                            break;
                        case (23):
                            this.game.print("Now just put your mouth here and blow real hard.")
                            break;
                        case (24):
                            this.game.print("Hang tight, lads!  This ship's going all the way!")
                            break;
                        case (25):
                            this.game.print("We're going to win!  Victory is in the air!")
                            break;
                        case (26):
                            this.game.print("There'd be something on it for you, too, of course.")
                            break;
                        case (27):
                            this.game.print("HA HA HA HA HA HA HA HA HA HA HA HA HA! HA HA Ha Ha ha ha he heh h...")
                            break;
                        case (28):
                            this.game.print("Well, it's not like I eat avacadoes or anything.")
                            break;
                        case (29):
                            this.game.print("Yeah, right.  You wouldn't have the guts.")
                            break;
                        case (30):
                            this.game.print("Give it to me straight... Am I going to die?... or are you?")
                            break;
                        case (31):
                            this.game.print("A carrying case for FOOLS, may be!  Which I ain't.")
                            break;
                        case (32):
                            this.game.print("Ok... Just checking in...")
                            break;
                        case (33):
                            this.game.print("You know, I had a space ship too, when I was your age. and on moon we")
                            break;
                        case (34):
                            this.game.print("Look at that, eh Jess?  Just don't know when to quit, do they?")
                            break;
                        case (35):
                            this.game.print("You know what?  I don't think he's even listening.")
                            break;
                        case (36):
                            this.game.print("Hey old man, here it comes, man!  's like a big one, wot?")
                            break;
                        case (37):
                            this.game.print("Ten ducats if you can guess when his feeding time is.")
                            break;
                        case (38):
                            this.game.print("But how can we do that?  I've never even seen one!")
                            break;
                        case (39):
                            this.game.print("Firin' away, boss!  Jus' like there's no tomorrow!")
                            break;
                        case (40):
                            this.game.print("Better leave, guys.  This place is starting to turn.")
                            break;
                        case (41):
                            this.game.print("A juggernaut, coming fast.  Just over the next hill.")
                            break;
                        case (42):
                            this.game.print("When you get the light, swim for nobody's tomorrow!")
                            break;
                        case (43):
                            this.game.print("At LEAST a dozen, probably more...")
                            break;
                        case (44):
                            this.game.print("And I suppose you'll be wanting a medal?")
                            break;
                        case (45):
                            this.game.print("Get a leg on, mate, we've only just reached the moat.")
                            break;
                        case (46):
                            this.game.print("It'll never sink in... We'll be doing this forever...")
                            break;
                        case (47):
                            this.game.print("It won't last forever.  Wiser men than you have grown old.")
                            break;
                        case (48):
                            this.game.print("Yeah, but you can hardly expect me to tell her... she'd die laughing...")
                            break;
                        case (49):
                            this.game.print("A Voice - Now, now, Perkins.  Don't be brash.")
                            break;
                        case (50):
                            this.game.print("Give me an \"O\"!  Give me a box!  Give me a cake to put it in!")
                            break;
                        case (51):
                            this.game.print("A Voice - B 114... imaginary monster...  paradise... old man. sign")
                            break;
                        case (52):
                            this.game.print("FOr A laRk.!")
                            break;
                        case (53):
                            this.game.print("Just close your eyes, mate!  That's what I did.")
                            break;
                        case (54):
                            this.game.print("Please sir... at least make it quick")
                            break;
                        case (55):
                            this.game.print("Not on my watch, laddie.  Put it down.")
                            break;
                        case (56):
                            this.game.print("Go on, then.  Give me an excuse.  I'd LOVE that.")
                            break;
                        case (57):
                            this.game.print("Ok, if I'm so crazy, then WHERE IS HE?")
                            break;
                        case (58):
                            this.game.print("A Voice - odd... it's always stayed on the ground up til now.")
                            break;
                        case (59):
                            this.game.print("A Voice - Come back to bed, honey.  It's only a fox.")
                            break;
                        case (60):
                            this.game.print("All right, NOW you're going crazy.")
                            break;
                        case (61):
                            this.game.print("I'm growing a tail!  Oh GOD!")
                            break;
                        case (62):
                            this.game.print("For God's sake... put down the hedge clippers...")
                            break;
                        case (63):
                            this.game.print("NO!  EDDIE!!  NOOOOOO!!!")
                            break;
                        case (64):
                            this.game.print("Zookeeper... isn't that sort of an ENTRY level job?")
                            break;
                        case (65):
                            this.game.print("Let it go, man.  You're getting off easy.")
                            break;
                        case (66):
                            this.game.print("Sorry, I think we got off on the wrong foot.  My name's Jim.")
                            break;
                        case (67):
                            this.game.print("My daddy says I can eat anyone I want.")
                            break;
                        case (68):
                            this.game.print("A Voice - Twelve years I've been doing this, and I'm STILL broke.")
                            break;
                        case (69):
                            this.game.print("A Voice - All right, who broke my drumstick?")
                            break;
                        case (70):
                            this.game.print("A Voice - I prefer the spotted variety, myself.")
                            break;
                        case (71):
                            this.game.print("What that man needs, is a good telescope.")
                            break;
                        case (72):
                            this.game.print("Have a blast for me, Neddie-baby!")
                            break;
                        case (73):
                            this.game.print("A Voice - I heard the new one's really good.")
                            break;
                        case (74):
                            this.game.print("How do you turn this thing on?")
                            break;
                        case (75):
                            this.game.print("Sorry - things got a little rowdy while you were out.")
                            break;
                        case (76):
                            this.game.print("How do you eat the new one, pal.")
                            break;
                        case (77):
                            this.game.print("Yeah, but who the hell knows what THAT means?")
                            break;
                        case (78):
                            this.game.print("A Voice - I do, I do!")
                            break;
                        case (79):
                            this.game.print("Seventy percent lard content, and it STILL tastes like goats.")
                            break;
                        case (80):
                            this.game.print("A Voice - Four's strong, three's lucky.")
                            break;
                        case (81):
                            this.game.print("Get out of my house, you shadow-goat!")
                            break;
                        case (82):
                            this.game.print("She's very charming, and she's got a dry streak that I like.")
                            break;
                        case (83):
                            this.game.print("Nine times out of ten he's bluffing - it's the tenth you've got to watch for.")
                            break;
                        case (84):
                            this.game.print("Ha!  I could make a better teacake than THAT!")
                            break;
                        case (85):
                            this.game.print("Don't believe me?  Ask the king!")
                            break;
                        case (86):
                            this.game.print("I'll give you ten to one odds we come out of this alive.")
                            break;
                        case (87):
                            this.game.print("Look, Zolan, we're going to be millionaires!")
                            break;
                        case (88):
                            this.game.print("I'd like a steak and some ham, please.")
                            break;
                        case (89):
                            this.game.print("Mama, the cat won't smile at me!")
                            break;
                        case (90):
                            this.game.print("Chapter 20 - the reverse lathe.")
                    }

                } else if (vis > 40) { // talking to other people who aren't there
                    const wh = Math.floor(Math.random() * 100) + 1
                    switch (wh) {
                        case (1):
                            this.game.print("A Voice - Never mind.")
                            break;
                        case (2):
                            this.game.print("My God, he's a GORILLA!")
                            break;
                        case (3):
                            this.game.print("If, for example, I were to take this ordinary frog, I would find that...")
                            break;
                        case (4):
                            this.game.print("it's all within the neon brown, don't you think?")
                            break;
                        case (5):
                            this.game.print("we cannot find you.  where should we look?")
                            break;
                        case (6):
                            this.game.print("\"Clad in silver, standing astride the dawn, he bows to the spectators.\"")
                            break;
                        case (7):
                            this.game.print("'I didn't ask for sergeant Butterscotch.")
                            break;
                        case (8):
                            this.game.print("Take it back!  I didn't send for this.")
                            break;
                        case (9):
                            this.game.print("But it's mostly a land-dweller!")
                            break;
                        case (10):
                            this.game.print("<shakes head> no... I'm still alive...")
                            break;
                        case (11):
                            this.game.print("You - you don't really think - ")
                            break;
                        case (12):
                            this.game.print("Give me that, please.  It's not safe.")
                            break;
                        case (13):
                            this.game.print("You'll never die, I know you much too well.")
                            break;
                        case (14):
                            this.game.print("To prepare!  A lemon!")
                            break;
                        case (15):
                            this.game.print("Oh, I don't know.  Why don't YOU try it?")
                            break;
                        case (16):
                            this.game.print("Where are you going?  She didn't sing yet.")
                            break;
                        case (17):
                            this.game.print("So long, sun.  It's been a while.")
                            break;
                        case (18):
                            this.game.print("I wouldn't proceed any further, but it's just so enticing.  All that gold!")
                            break;
                        case (19):
                            this.game.print("Tomorrow might not be there anymore.")
                            break;
                        case (20):
                            this.game.print("No more, all right?  I don't want it.")
                            break;
                        case (21):
                            this.game.print("A Voice - I said NOTHING MUCH, alright?  All right?")
                            break;
                        case (22):
                            this.game.print("Oh, dear god.  You're not onto THAT again, are you?")
                            break;
                        case (23):
                            this.game.print("I hope not.  I really do.")
                            break;
                        case (24):
                            this.game.print("Never hurts to try, though, does it?")
                            break;
                        case (25):
                            this.game.print("You have a tendency to look at these things frondly.")
                            break;
                        case (26):
                            this.game.print("Chow.... Chow.  CHOMP")
                            break;
                        case (27):
                            this.game.print("Oh, all right.  But be quick about it.")
                            break;
                        case (28):
                            this.game.print("Oh... ho.  If I only had a chain.")
                            break;
                        case (29):
                            this.game.print("Frippely doodle day, motherf***ers!")
                            break;
                        case (30):
                            this.game.print("Oh yeah?  Well, mine has CARTWHEELS.")
                            break;
                        case (31):
                            this.game.print("I didn't know you had it in you.")
                            break;
                        case (32):
                            this.game.print("Just a hollow tube.  See?")
                            break;
                        case (33):
                            this.game.print("Would you like some turkey?")
                            break;
                        case (34):
                            this.game.print("Just wait a few minutes... it will probably stop on its own.")
                            break;
                        case (35):
                            this.game.print("All that, and a ten-spot to rest your laurels on.")
                            break;
                        case (36):
                            this.game.print("Just give it one good CHOMP and I'll buy you a CANDY BAR.")
                            break;
                        case (37):
                            this.game.print("Oh, I knew you could do it, Bartolomé!")
                            break;
                        case (38):
                            this.game.print("You don't know the half of it.")
                            break;
                        case (40):
                            this.game.print("Can you breathe all right down there?")
                            break;
                        case (41):
                            this.game.print("ja, I' save'd 'em all, 'em all.")
                            break;
                        case (42):
                            this.game.print("\"Here we come, walking the red carpet to nowhere\"")
                            break;
                        case (43):
                            this.game.print("Downhill mover decapitulating WHAT?")
                            break;
                        case (44):
                            this.game.print("Cut me some slack, cheese!  I'm only trying to help!")
                            break;
                        case (45):
                            this.game.print("sell it.  NOW")
                            break;
                        case (46):
                            this.game.print("You don't need that old 5")
                            break;
                        case (47):
                            this.game.print("frinnin, my frin, like a bar in henhouse, for a star")
                            break;
                        case (48):
                            this.game.print("Keep it up, frin, it'll get sharper yet!")
                            break;
                        case (49):
                            this.game.print("Oh, you've got the wit of a parrot, homie!  Who knew?")
                            break;
                        case (50):
                            this.game.print("Just keep walking, you've got ten paces to go.")
                            break;
                        case (51):
                            this.game.print("\"For want of a better want.\"")
                            break;
                        case (52):
                            this.game.print("She said it was \"urgent.\"")
                            break;
                        case (53):
                            this.game.print("Well, stir me in a cupcake!  Never thought I'd see YOU here!")
                            break;
                        case (54):
                            this.game.print("Well, I'm not going to pretend it wasn't interesting!")
                            break;
                        case (55):
                            this.game.print("Speak up, I'm deaf.")
                            break;
                        case (56):
                            this.game.print("Have it your way, I'm leaving...")
                            break;
                        case (57):
                            this.game.print("For a hard-tooth wrench, you're pretty frood, you know?")
                            break;
                        case (58):
                            this.game.print("Here... have a cracker...")
                            break;
                        case (59):
                            this.game.print("Say true, sai?")
                            break;
                        case (60):
                            this.game.print("Ten pounds, anyone?  A rat, maybe?")
                            break;
                        case (61):
                            this.game.print("Ah, he's just peckish.  They'll be all right.")
                            break;
                        case (62):
                            this.game.print("Please leave now.  I'm very busy.")
                            break;
                        case (63):
                            this.game.print("Have a heart cream, puffy.")
                            break;
                        case (64):
                            this.game.print("Take it, take it!")
                            break;
                        case (65):
                            this.game.print("Arms at the ready, all?")
                            break;
                        case (66):
                            this.game.print("What?!  That's not what he told ME!")
                            break;
                        case (67):
                            this.game.print("So they're shaped like animals, you say?")
                            break;
                        case (68):
                            this.game.print("Quick, put it out!  It's turning!")
                            break;
                        case (69):
                            this.game.print("How did it happen?  Hold still!")
                            break;
                        case (70):
                            this.game.print("Will you put that AWAY?")
                            break;
                        case (71):
                            this.game.print("This is the LAST time I let you talk me into this.")
                            break;
                        case (72):
                            this.game.print("Typical doormouse...")
                            break;
                        case (73):
                            this.game.print("But I already GAVE you a flower.")
                            break;
                        case (74):
                            this.game.print("Several times already, today.")
                            break;
                        case (75):
                            this.game.print("Come on!  Hurry up!")
                            break;
                        case (76):
                            this.game.print("If we're late he's going to KILL us!")
                            break;
                        case (77):
                            this.game.print("That's what we did LAST time, remember?")
                            break;
                        case (78):
                            this.game.print("ted's here.  he's angry.  he wants to talk.")
                            break;
                        case (79):
                            this.game.print("Tell me something I don't know.")
                            break;
                        case (80):
                            this.game.print("You can't know that!")
                            break;
                        case (81):
                            this.game.print("Just give him a crumpet and he'll roll over real easy.")
                            break;
                        case (82):
                            this.game.print("Please, sir - a penny for the lazy?")
                            break;
                        case (83):
                            this.game.print("I'll have you in arms, ya hooligan!")
                            break;
                        case (84):
                            this.game.print("Just bear with me for a second.")
                            break;
                        case (85):
                            this.game.print("The monster fiddle-golem.")
                            break;
                        case (86):
                            this.game.print("So you mean EVERYONE forgot?")
                            break;
                        case (87):
                            this.game.print("Time to start looking for a new job, pal.")
                            break;
                        case (88):
                            this.game.print("Nine times nine times nine times nine times nine....  Times two...")
                            break;
                        case (89):
                            this.game.print("Why don't we try something different today?")
                            break;
                        case (90):
                            this.game.print("SOMEONE's been at the cookie jar...")
                            break;
                        case (91):
                            this.game.print("Girl in a red striped raincoat... Boy with a blue plaid sleeve...")
                            break;
                        case (92):
                            this.game.print("Several at once, you say?")
                            break;
                        case (93):
                            this.game.print("But those four are MINE!")
                            break;
                        case (94):
                            this.game.print("...at over two hundred miles per hour, the diving falcon is among the fastest...")
                            break;
                        case (95):
                            this.game.print("Brighten the mood with some food, dude.")
                            break;
                        case (96):
                            this.game.print("Listen to your mother, now.")
                            break;
                        case (97):
                            this.game.print("Not until you finish your peas.")
                            break;
                        case (98):
                            this.game.print("Haven't you ever seen one before?")
                            break;
                        case (99):
                            this.game.print("Assistant -- No one in their right mind would do such a thing.")
                            break;
                        case (100):
                            this.game.print("Assistant -- Every time you do that, I get the shivers.")
                    }

                } else if (vis > 20) { // talking to yourself
                    const wh = Math.floor(Math.random() * 77) + 1
                    switch (wh) {
                        case (1):
                            this.game.print("Who ever really believed that, anyways?")
                            break;
                        case (2):
                            this.game.print("But what if god is real - wouldn't he be angry?")
                            break;
                        case (3):
                            this.game.print("False alarm.")
                            break;
                        case (4):
                            this.game.print("Green... it's fading.")
                            break;
                        case (5):
                            this.game.print("Could be, could be...")
                            break;
                        case (6):
                            this.game.print("Tomorrow might be an alright day to die...")
                            break;
                        case (7):
                            this.game.print("-- Nirvana.")
                            break;
                        case (8):
                            this.game.print("Why is this happening?")
                            break;
                        case (9):
                            this.game.print("Everything has this odd bluish tinge...")
                            break;
                        case (10):
                            this.game.print("That Didn't Really Happen.")
                            break;
                        case (11):
                            this.game.print("My, but you're a clever one.")
                            break;
                        case (12):
                            this.game.print("I've been there already.  It's not actually that great.")
                            break;
                        case (13):
                            this.game.print("All this will seem very funny when you're an octagenarian.")
                            break;
                        case (14):
                            this.game.print("Give it my best.")
                            break;
                        case (15):
                            this.game.print("A comet, a prophecy of doom!  Forsooth!")
                            break;
                        case (16):
                            this.game.print("and you forgot to feed the dog.")
                            break;
                        case (17):
                            this.game.print("Your favorite color is cheese.")
                            break;
                        case (18):
                            this.game.print("You're too late.  You missed it.")
                            break;
                        case (19):
                            this.game.print("Grab hold, heathens!  Save yourselves...")
                            break;
                        case (20):
                            this.game.print("Well, yes, but given the current state of interrency...")
                            break;
                        case (21):
                            this.game.print("Averages are the key here.")
                            break;
                        case (22):
                            this.game.print("Frumply... heh, heh.")
                            break;
                        case (23):
                            this.game.print("Curie, curei, curiathon.")
                            break;
                        case (24):
                            this.game.print("Generally speaking, no.")
                            break;
                        case (25):
                            this.game.print("Once more, chums - from the top.")
                            break;
                        case (26):
                            this.game.print("Well, that was certainly entertaining.")
                            break;
                        case (27):
                            this.game.print("Hard to say, really.  But I think you might be right.")
                            break;
                        case (28):
                            this.game.print("No, I doubt it.")
                            break;
                        case (29):
                            this.game.print("shimmering water")
                            break;
                        case (30):
                            this.game.print("Have a care, will you?  This is a brand-new day!")
                            break;
                        case (31):
                            this.game.print("A very, very, VERY slow horse.")
                            break;
                        case (32):
                            this.game.print("Good one, man.  Touche.")
                            break;
                        case (33):
                            this.game.print("It didn't seem like any big deal to me.")
                            break;
                        case (34):
                            this.game.print("So many fronds in this pond!")
                            break;
                        case (35):
                            this.game.print("Weasely weasely weasely weel - \" -")
                            break;
                        case (36):
                            this.game.print("a bar in a henhouse, a toy in a tree, a cripple is running, a blindy can see")
                            break;
                        case (37):
                            this.game.print("Hey!  What's up?")
                            break;
                        case (38):
                            this.game.print("Ten more paces should finish it, yeah?")
                            break;
                        case (39):
                            this.game.print("Seven years to rensignhouse, seven beers'll do ya.")
                            break;
                        case (40):
                            this.game.print("Let's have a round of applause... for the KING!")
                            break;
                        case (41):
                            this.game.print("What I wouldn't give for a couple of sausages right now!")
                            break;
                        case (42):
                            this.game.print("I met a sorry bloke one evening, coming home from tea...")
                            break;
                        case (43):
                            this.game.print("It's all good...  give it a second.")
                            break;
                        case (44):
                            this.game.print("No, not especially.")
                            break;
                        case (45):
                            this.game.print("everyone has their favorites, it's true...")
                            break;
                        case (46):
                            this.game.print("Well, at least it's not so glossy now...")
                            break;
                        case (47):
                            this.game.print("None too garish, though, is it?")
                            break;
                        case (48):
                            this.game.print("Lie, nut core a lever nun.")
                            break;
                        case (49):
                            this.game.print("No, but nothing does, does it?")
                            break;
                        case (50):
                            this.game.print("Oh, you bloody weasel!")
                            break;
                        case (51):
                            this.game.print("WHEEE!  One more time!")
                            break;
                        case (52):
                            this.game.print("Are we there yet?")
                            break;
                        case (53):
                            this.game.print("Oh what a fine day it is!")
                            break;
                        case (54):
                            this.game.print("Badabum, badabing!")
                            break;
                        case (55):
                            this.game.print("Oh, would you look at the time...")
                            break;
                        case (56):
                            this.game.print("I hope it's tuesday tomorrow...  we haven't had one in such a long time...")
                            break;
                        case (57):
                            this.game.print("ooh, that smarts!")
                            break;
                        case (58):
                            this.game.print("Heh heh heh... oh, that was pretty good...")
                            break;
                        case (59):
                            this.game.print("Hoot Hoot!")
                            break;
                        case (60):
                            this.game.print("Say hello to greener pastures, baby.")
                            break;
                        case (61):
                            this.game.print("Hellooo mister Sun!")
                            break;
                        case (62):
                            this.game.print("Now THIS is what I call consciousness.")
                            break;
                        case (63):
                            this.game.print("How much gold have I got now?  I forget.")
                            break;
                        case (64):
                            this.game.print("Well it isn't easy, being master of your own destiny.")
                            break;
                        case (65):
                            this.game.print("Nice, dude.  Nice.")
                            break;
                        case (66):
                            this.game.print("Never again!")
                            break;
                        case (67):
                            this.game.print("Frum diddle diddle um, frum diddle ay...")
                            break;
                        case (68):
                            this.game.print("Gee, that's glum.")
                            break;
                        case (69):
                            this.game.print("But how could that be?")
                            break;
                        case (70):
                            this.game.print("Whoa-oh, whoa, whoa, whoa, whoa, whoa-oh!")
                            break;
                        case (71):
                            this.game.print("Reality - who needs it?")
                            break;
                        case (72):
                            this.game.print("I do believe I just heard a wombat.")
                            break;
                        case (73):
                            this.game.print("Ok, we don't have time for this.")
                            break;
                        case (74):
                            this.game.print("I've got everything I need, right here.")
                            break;
                        case (75):
                            this.game.print("I'll just give 'em the old one-two.")
                            break;
                        case (76):
                            this.game.print("Just give me a couple of sea-biscuits, and I'm good to go.")
                            break;
                        case (77):
                            this.game.print("Wouldn't you know it, I'm a completely miserable poet.")
                    }
                } else {
                    // mild effects (singing to yourself)
                    const wh = Math.floor(Math.random() * 10) + 1
                    switch (wh) {
                        case (1):
                            this.game.print("-- All you need is love...")
                            break;
                        case (2):
                            this.game.print("-- I am the eggman...  I am the walrus!")
                            break;
                        case (3):
                            this.game.print("-- coo coo cachoo!")
                            break;
                        case (4):
                            this.game.print("-- pick up the duck... emily cries.")
                            break;
                        case (5):
                            this.game.print("-- Who, indeed?")
                            break;
                        case (6):
                            this.game.print("Shhhh...")
                            break;
                        case (7):
                            this.game.print("I am he as you are he as you are me as we are all together!...")
                            break;
                        case (8):
                            this.game.print("What's going on?")
                            break;
                        case (9):
                            this.game.print("'^^^////*'")
                            break;
                        case (10):
                            this.game.print("Hey, I'm alive!")
                    }
                }
            }
        })
    }
} as const;

type BuffNames = keyof typeof buffs;

function getBuff<T extends BuffNames>(buffName: T): BuffCreator {
    const buff = buffs[buffName];
    return buff;
}

export { getBuff, BuffNames, buffs };
