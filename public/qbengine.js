const displayElement = document.getElementById('display');

const rows = 25; // Number of rows in the grid
const cols = 80; // Number of columns in the grid
let currentColor = { fg: 'black', bg: 'lightgray' };
let cursor = { x: 0, y: 0 };
let screenBuffer = Array.from({ length: rows }, () => Array(cols).fill({ char: ' ', fg: currentColor.fg, bg: currentColor.bg }));
let lineHistory = [];
let continueLine = false;
let commandMode = 'input';
let socket;
let gameID;
let keepAliveInterval;
let inputBuffer = [];
let keyCallbacks = [];
let token = localStorage.getItem('gameToken') || null;

// Set up the single global event listener
function initializeInputHandler() {
    document.addEventListener('keydown', (event) => {
        if (keyCallbacks.length > 0) {
            // If there are waiting callbacks, resolve the next one
            const nextCallback = keyCallbacks.shift();
            nextCallback(event.key);
        } else {
            // Otherwise add to buffer
            inputBuffer.push(event.key);
        }
    });
    window.addEventListener('beforeunload', (event) => {
        // Send a message to the server indicating a refresh/close
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'reset' }));
        }
    })
}

// Central function for getting the next keystroke
function getNextKey(sessionID = null) {
    return new Promise((resolve) => {
        if (sessionID && currentSessionID !== sessionID) {
            resolve(null); // Resolve with null if canceled or session ID mismatch
            return;
        }

        if (inputBuffer.length > 0) {
            // Resolve immediately if there's buffered input
            resolve(inputBuffer.shift());
        } else {
            // Otherwise, add to key callbacks
            keyCallbacks.push((key) => {
                if (!sessionID || currentSessionID === sessionID) {
                    resolve(key); // Resolve only for matching session
                } else {
                    resolve(null); // Resolve with null if canceled or mismatched
                }
            });
        }
    });
}

// Initialize the display with empty spans
function initializeDisplay() {
    displayElement.innerHTML = '';
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const span = document.createElement('span');
            span.textContent = ' ';
            span.dataset.x = x;
            span.dataset.y = y;
            displayElement.appendChild(span);
        }
    }
    clear();
}

// Function to update only changed cells
function renderScreen() {
    const spans = displayElement.getElementsByTagName('span');
    screenBuffer.forEach((row, y) => {
        row.forEach((cell, x) => {
            const index = y * cols + x;
            const span = spans[index];
            if (span.textContent !== cell.char ||
                span.style.color !== cell.fg ||
                span.style.backgroundColor !== cell.bg) {
                span.textContent = cell.char;
                span.style.color = cell.fg;
                span.style.backgroundColor = cell.bg;
            }
        });
    });
    // console.log('rendering');
}

// Function to set current colors
function color(fg, bg) {
    currentColor.bg = bg || currentColor.bg;
    currentColor.fg = fg || currentColor.fg;
}

// Function to move the cursor to a specific location
function locate(x, y) {
    cursor.x = parseInt(x);
    cursor.y = parseInt(y) || cursor.y;
    // continueLine = true;
}

// Function to print text at the current cursor location with the current colors
function quote(text = '', extend = false) {
    function lineFeed() {
        // Scroll the buffer up
        screenBuffer.shift();
        screenBuffer.push(Array(cols).fill(null).map(() => { return { char: ' ', fg: currentColor.fg, bg: currentColor.bg } }));
        cursor.y = rows - 1;
    }

    for (let i = 0; i < text.length; i++) {
        if (cursor.x >= cols) {
            cursor.x = 0;
            cursor.y++;
        }
        if (text[i] === '\n') {
            cursor.x = 0;
            cursor.y++;
        }
        if (cursor.y >= rows) lineFeed();
        if (text[i] === '\n') continue;
        screenBuffer[cursor.y][cursor.x] = {
            char: text[i],
            fg: currentColor.fg,
            bg: currentColor.bg
        };
        cursor.x++;
    }
    if (cursor.y >= rows) lineFeed();
    if (!extend) {
        // fill in the line with background color
        for (let i = cursor.x; i < cols; i++) {
            screenBuffer[cursor.y][i] = { char: ' ', fg: currentColor.fg, bg: currentColor.bg };
        }
        cursor.x = 0;
        cursor.y++;
    }
}


// Synchronous input function with in-place updating
function query(promptText = '', sessionID) {
    quote(promptText, true);
    renderScreen();

    return new Promise(async (resolve) => {
        let inputText = '';
        let initialX = cursor.x, initialY = cursor.y;

        // Set up blinking cursor
        const blink = setInterval(() => {
            const blinkLocation = [initialX + inputText.length, initialY];
            screenBuffer[blinkLocation[1]][blinkLocation[0]] = {
                char: '_',
                fg: currentColor.fg,
                bg: currentColor.bg
            };
            renderScreen();
            setTimeout(() => {
                if (blinkLocation[0] < cursor.x || blinkLocation[1] < cursor.y) return;
                screenBuffer[blinkLocation[1]][blinkLocation[0]] = {
                    char: ' ',
                    fg: currentColor.fg,
                    bg: currentColor.bg
                };
                renderScreen();
            }, 400);
        }, 800);

        while (currentSessionID == sessionID) {
            const key = await getNextKey();
            if (key === 'Enter') {
                clearInterval(blink);
                quote('');
                resolve(inputText);
                return;
            } else if (key === 'Backspace') {
                inputText = inputText.slice(0, -1);
                locate(initialX, initialY);
                quote(inputText + '  ', true);
            } else if (key.length === 1) {
                inputText += key;
                locate(initialX, initialY);
                quote(inputText, true);
            }
            renderScreen();
        }
        clearInterval(blink);
        resolve(null);
    });
}

async function optionBox(
    title, options,
    colorOptions = {
        box: { fg: 'lightgray', bg: 'black' },
        selected: { fg: 'black', bg: 'darkred' },
        background: currentColor.bg
    },
    default_option = 0,
    sessionID
) {
    previousColors = [currentColor.fg, currentColor.bg];
    let key = '';
    let selected = default_option;
    if (colorOptions.background) {
        color('black', colorOptions.background);
        clear();
    }

    boxWidth = Math.max(12, Math.max(...[title, ...options].map(option => option.length)) + 2);
    boxHeight = options.length + 1;
    boxTop = parseInt((rows - boxHeight) / 2);
    boxLeft = parseInt((cols - boxWidth) / 2);
    color(colorOptions.box.fg, colorOptions.box.bg);
    locate(boxLeft, boxTop);
    quote(` ${title}${' '.repeat(boxWidth - title.length - 1)}`, true);
    locate(boxLeft, boxTop + 1);
    quote('─'.repeat(boxWidth), true);

    while (key !== 'Enter') {
        if (sessionID !== currentSessionID) return null;
        if (key === 'ArrowUp') {
            selected = (selected - 1 + options.length) % options.length;
        } else if (key === 'ArrowDown') {
            selected = (selected + 1) % options.length;
        }
        for (let i = 0; i < options.length; i++) {
            locate(boxLeft, boxTop + 2 + i);
            if (i === selected) {
                color(colorOptions.selected.fg, colorOptions.selected.bg);
            } else {
                color(colorOptions.box.fg, colorOptions.box.bg);
            }
            quote(` ${options[i]}${' '.repeat(boxWidth - options[i].length - 1)}`, true);
        }
        renderScreen();
        key = await getNextKey(sessionID);
    }
    color(...previousColors);
    quote('');
    console.log('chose', options[selected]);
    return selected;
}

function clear() {
    screenBuffer = Array.from(
        { length: rows },
        () => Array(cols).fill(null).map(() => { return { char: ' ', fg: currentColor.fg, bg: currentColor.bg } })
    );
    cursor.x = 0;
    cursor.y = 0;
}

async function processResponse(batch) {
    for (line of batch) {
        console.log(line);

        // Check if the command is input-related and has a sessionID
        if (line.sessionID) {
            currentSessionID = line.sessionID; // Update the active session ID
        }

        switch (line.command) {
            case 'locate':
                locate(line.x, line.y);
                break;
            case 'color':
                color(line.fg, line.bg);
                break;
            case 'print':
                quote(('text' in line ? line.text : ''), line.extend);
                break;
            case 'getKey':
                renderScreen();
                const key = await getNextKey(currentSessionID);
                if (key !== null) sendCommand({ input: key });
                break;
            case 'input':
                const userInput = await query(line.prompt, currentSessionID);
                if (userInput != null) sendCommand({ input: userInput });
                break;
            case 'clear':
                clear();
                break;
            case 'optionBox':
                const option = await optionBox(line.title, line.options, line.colors, line.default_option, currentSessionID);
                if (option !== null) sendCommand({ input: option });
                break;
        }
    }
    renderScreen();
}

function initializeWebSocket() {
    const socketUrl = window.location.hostname === 'localhost'
        ? 'ws://localhost:3000'
        : `wss://${window.location.hostname}`;

    socket = new WebSocket(socketUrl);

    socket.onopen = function () {
        console.log('Connected to WebSocket server');
        clearInterval(keepAliveInterval);

        // Send the token to the server on connection
        const message = {
            type: 'connect',
            token: token, // Send the token stored in localStorage (or null if no token exists)
        };
        socket.send(JSON.stringify(message));

        // Start keepalive pings
        keepAliveInterval = setInterval(() => {
            sendCommand({ type: 'keepalive' });
        }, 30000);
    };

    socket.onmessage = async function (event) {
        const response = JSON.parse(event.data);

        if (response.type === 'token') {
            // Server sent a new token; store it in localStorage
            token = response.token;
            localStorage.setItem('gameToken', token);
            console.log('Received token from server:', token);
        } else if (Array.isArray(response)) {
            // Server sent cached output for reconnection
            console.log('Processing cached output...');
            await processResponse(response);
        } else {
            // Process regular game commands
            await processResponse(response);
        }
    };

    socket.onclose = function () {
        console.log('Disconnected from WebSocket server');
        clearInterval(keepAliveInterval);
        // Attempt to reconnect after a delay
        setTimeout(initializeWebSocket, 5000);
    };

    socket.onerror = function (error) {
        console.error('WebSocket error:', error);
    };
}


function sendCommand(command) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(command));
    } else {
        console.error('WebSocket is not connected');
    }
}

// Start the game loop
initializeInputHandler();
initializeDisplay();
initializeWebSocket();
