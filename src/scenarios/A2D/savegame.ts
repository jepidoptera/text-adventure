import { WebSocket } from 'ws';
import { GameState } from '../../game/game';
import { A2D } from './game';
import { Location } from '../../game/location';
import { Item } from '../../game/item';
import { Character } from '../../game/character';
import { characters } from './characters';
import { items } from './items';
import { landmarks } from './landmarks';
import { MongoClient, Db, Collection } from 'mongodb';
import "dotenv/config.js";

const mongo_url = process.env.MONGO_DB_URL

interface SaveDocument {
    saveName: string;
    gameState: any;
}

function showenv() {
    console.log('mongoID:', mongo_url)
}

type LandmarkName = keyof typeof landmarks

class GameSaver {
    private client!: MongoClient;
    private db!: Db;
    private savesCollection!: Collection<SaveDocument>;

    constructor(private mongoUrl: string, private dbName: string) {
        this.connect()
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            MongoClient.connect(this.mongoUrl).then(client => {
                this.client = client
                this.db = this.client.db(this.dbName);
                this.savesCollection = this.db.collection<SaveDocument>('saves');
                resolve()
            })
        })
    }

    async saveGame(gameState: GameState, saveName: string): Promise<void> {
        if (!this.client) {
            await this.connect();
        }

        const gameStateObj: any = {
            locations: {},
            flags: {}
        };

        gameState.locations.forEach((location, key) => {
            gameStateObj.locations[key] = {
                name: location.name,
                characters: location.characters.map(char => ({
                    name: char.name,
                    inventory: char.inventory,
                    flags: char.flags
                })),
                landmarks: location.landmarks.map(landmark => ({
                    name: landmark.name
                })),
                items: location.items.map(item => ({
                    name: item.name
                }))
            };
        });

        const saveDocument: SaveDocument = {
            saveName: saveName,
            gameState: gameStateObj
        };

        await this.savesCollection.updateOne(
            { saveName: saveName },
            { $set: saveDocument },
            { upsert: true }
        );

        console.log(`Game saved as '${saveName}'`);
    }

    async loadGame(saveName: string, wss: WebSocket): Promise<GameState | null> {
        const saveDocument = await this.savesCollection.findOne({ saveName: saveName });

        if (!saveDocument) {
            console.log(`No save found with name '${saveName}'`);
            return null;
        }

        const gameState: GameState = new GameState(wss);

        Object.entries(saveDocument.gameState.locations).forEach(([key, locData]: [string, any]) => {
            const location = new Location({
                name: locData.name,
                characters: locData.characters.map((charData: any) => ({
                    name: charData.name,
                    inventory: charData.inventory,
                    flags: charData.flags
                })),
                items: locData.items.map((itemData: any) => ({
                    name: itemData.name
                }))
            });
            locData.landmarks.forEach((landmarkData: any) => {
                const landmarkName = landmarkData.name as LandmarkName
                if (Object.keys(landmarks).includes(landmarkName)) {
                    location.addLandmark(landmarks[landmarkName](landmarkData.args));
                }
            })
            gameState.locations.set(key, location);
        });

        console.log(`Game loaded from save '${saveName}'`);
        return gameState;
    }

    async close(): Promise<void> {
        await this.client.close();
    }
}

export { GameSaver, showenv };
