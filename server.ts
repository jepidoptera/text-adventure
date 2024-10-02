import { A2D } from './scenarios/A2D/game.ts';
import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store active game instances
const activeGames = new Map();

wss.on('connection', (ws) => {  
    const gameState = new A2D(ws);
    const gameId = Date.now().toString(); // Use a timestamp as a simple unique identifier
    activeGames.set(gameId, gameState);

    ws.on('message', (input) => {
        const message = input.toString();
        console.log(`Received message: ${message}`);
        if (message === 'keepalive') {
            console.log('keepalive');
            return;
        }
        gameState.process_input(input.toString());
    });

    ws.on('close', () => {
        // Clean up the game instance when the client disconnects
        activeGames.delete(gameId);
        console.log(`Client disconnected. Game ${gameId} removed.`);
    });

    gameState.start();
    console.log(`New game started with ID: ${gameId}`);
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});