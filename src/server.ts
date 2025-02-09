import { A2D } from "./scenarios/A2D/game.js";
import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, Db, Collection } from 'mongodb';
import "dotenv/config.js";

const mongo_url = process.env.MONGO_DB_URL;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SaveDocument {
    saveName: string;
    gameState: any;
}

class GameSaver {
    private client!: MongoClient;
    private db!: Db;
    private savesCollection!: Collection<SaveDocument>;

    constructor(private mongoUrl: string, private dbName: string) {
        if (mongoUrl === '') {
            throw new Error('MongoDB URL not provided');
        }
        this.connect();
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            MongoClient.connect(this.mongoUrl).then(client => {
                this.client = client;
                this.db = this.client.db(this.dbName);
                this.savesCollection = this.db.collection<SaveDocument>('A2D');
                console.log('mongo connected');
                resolve();
            });
        });
    }

    async saveGame(saveName: string, gameState: object): Promise<void> {
        if (!this.client) {
            await this.connect();
        }

        const saveDocument: SaveDocument = {
            saveName: saveName,
            gameState: gameState
        };

        await this.savesCollection.updateOne(
            { saveName: saveName },
            { $set: saveDocument },
            { upsert: true }
        );

        console.log(`Game saved as '${saveName}'`);
    }

    async loadGame(saveName: string): Promise<object | null> {
        const saveDocument = await this.savesCollection.findOne({ saveName: saveName });

        if (!saveDocument) {
            console.log(`No save found with name '${saveName}'`);
            return null;
        }

        console.log(`Game loaded from save '${saveName}'`);
        return saveDocument.gameState;
    }

    async close(): Promise<void> {
        await this.client.close();
    }
}

const gameSaver = new GameSaver(mongo_url ?? '', 'save-games');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
    console.log('sending index.html');
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const activeGames = new Map<string | null, { gameState: any; timeout: NodeJS.Timeout }>();

function generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

wss.on('connection', (ws) => {
    let token: string = '';

    ws.on('message', async (input) => {
        let message;
        try {
            message = JSON.parse(input.toString());
        } catch (e) {
            console.log('Invalid JSON input:', input.toString());
            return;
        }
        if (message.type === 'connect') {
            token = message.token || generateToken();

            if (activeGames.has(token)) {
                clearTimeout(activeGames.get(token)!.timeout);
                activeGames.get(token)!.gameState.reconnect(ws);
                console.log(`Reconnected to game with token: ${token}`);
            } else {
                const gameState = new A2D(ws, gameSaver.saveGame.bind(gameSaver), gameSaver.loadGame.bind(gameSaver));
                activeGames.set(token, {
                    gameState,
                    timeout: scheduleCleanup(token),
                });
                gameState.start();
                console.log(`New game started with token: ${token}`);
            }

            ws.send(JSON.stringify({ type: 'token', token }));
        } else if (message.type === 'keepalive') {
            console.log('keepalive');
        } else if (token && activeGames.has(token)) {
            activeGames.get(token)!.gameState.process_input(message.input);
        }
    });

    ws.on('close', () => {
        if (token && activeGames.has(token)) {
            console.log(`Client disconnected. Scheduling cleanup for game with token: ${token}`);
            activeGames.get(token)!.timeout = scheduleCleanup(token);
        }
    });
});

function scheduleCleanup(token: string): NodeJS.Timeout {
    return setTimeout(() => {
        if (activeGames.has(token)) {
            // save before shutting down
            const game = activeGames.get(token)!.gameState;
            if (game.player && !game.player.dead) {
                game.save();
            }
            activeGames.get(token)!.gameState.shutdown();
            activeGames.delete(token);
            console.log(`Game with token ${token} removed due to inactivity.`);
        }
    }, 86400000); // 24 hours in milliseconds
}

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
