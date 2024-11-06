import { A2D } from "./scenarios/A2D/game.js";
import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, Db, Collection } from 'mongodb';
import "dotenv/config.js";

const mongo_url = process.env.MONGO_DB_URL

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
        this.connect()
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            MongoClient.connect(this.mongoUrl).then(client => {
                this.client = client
                this.db = this.client.db(this.dbName);
                this.savesCollection = this.db.collection<SaveDocument>('A2D');
                console.log('mongo connected')
                resolve()
            })
        })
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
        // console.log(saveDocument.gameState);
        return saveDocument.gameState;
    }

    async close(): Promise<void> {
        await this.client.close();
    }
}

const gameSaver = new GameSaver(mongo_url ?? '', 'save-games');

// server code
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    console.log('sending index.html');
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Store active game instances
const activeGames = new Map();

wss.on('connection', (ws) => {
    const gameState = new A2D(ws, gameSaver.saveGame.bind(gameSaver), gameSaver.loadGame.bind(gameSaver));
    const gameId = Date.now().toString(); // Use a timestamp as a simple unique identifier
    activeGames.set(gameId, gameState);

    ws.on('message', (input) => {
        const message = input.toString();
        if (message === 'keepalive') {
            console.log('keepalive');
            return;
        }
        // else console.log(`Received message: ${message}`);
        gameState.process_input(input.toString());
    });

    ws.on('close', () => {
        // Clean up the game instance when the client disconnects
        activeGames.get(gameId).shutdown()
        activeGames.delete(gameId);
        console.log(`Client disconnected. Game ${gameId} removed.`);
    });

    gameState.start();
    console.log(`New game started with ID: ${gameId}`);
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
