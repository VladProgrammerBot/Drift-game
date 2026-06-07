const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const WORLD_SIZE = 5000; // Трохи зменшив для стабільності
const GRID_SIZE = 400;
let walls = [];

// ГЕНЕРАЦІЯ ЛАБІРИНТУ НА СЕРВЕРІ
function generateMaze() {
    walls = [];
    // Межі світу
    walls.push({ x: 0, y: 0, w: WORLD_SIZE, h: 60 });
    walls.push({ x: 0, y: WORLD_SIZE - 60, w: WORLD_SIZE, h: 60 });
    walls.push({ x: 0, y: 0, w: 60, h: WORLD_SIZE });
    walls.push({ x: WORLD_SIZE - 60, y: 0, w: 60, h: WORLD_SIZE });

    for (let x = GRID_SIZE; x < WORLD_SIZE - GRID_SIZE; x += GRID_SIZE) {
        for (let y = GRID_SIZE; y < WORLD_SIZE - GRID_SIZE; y += GRID_SIZE) {
            let rand = Math.random();

            // Кожна секція тепер має більший шанс отримати стіну
            if (rand < 0.4) {
                // Вертикальна стіна, що перекриває прохід
                walls.push({ x: x, y: y - 100, w: 50, h: GRID_SIZE + 100 });
            }
            if (rand > 0.6) {
                // Горизонтальна стіна
                walls.push({ x: x - 100, y: y, w: GRID_SIZE + 100, h: 50 });
            }

            // Додаткові блоки для звуження кутів
            if (rand > 0.9) {
                walls.push({ x: x + 100, y: y + 100, w: 100, h: 100 });
            }
        }
    }
}
generateMaze();

let players = {};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    // Відправляємо лабіринт і ID новому гравцеві
    socket.emit('init', { id: socket.id, walls: walls });

    players[socket.id] = { x: 300, y: 300, color: '#00ffcc' };

    socket.on('updatePlayer', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].color = data.color;
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

setInterval(() => {
    io.emit('state', players);
}, 1000 / 60);

server.listen(3000, () => console.log('Гра на http://localhost:3000'));