require('dotenv').config();
const express = require('express');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const ShortUniqueId = require('short-unique-id');

const adapter = new JSONFile('db.json');
const db = new Low(adapter, { users: [], boards: [] });

const uid = new ShortUniqueId({ length: 10 });

async function initializeDatabase() {
    await db.read();
    db.data = db.data || {};
    db.data.users = db.data.users || [];
    if (!db.data.boards || db.data.boards.length === 0) {
        db.data.boards = [
            {
                id: 'board-main',
                title: 'Project Alpha',
                columns: [
                    {
                        id: 'col-1',
                        title: 'Backlog',
                        cards: [
                            { id: uid.rnd(), text: 'Design the new homepage', description: '' },
                            { id: uid.rnd(), text: 'Develop API for user authentication', description: '' }
                        ]
                    },
                    {
                        id: 'col-2',
                        title: 'In Progress',
                        cards: [
                            { id: uid.rnd(), text: 'Implement the Kanban board UI', description: '' }
                        ]
                    },
                    {
                        id: 'col-3',
                        title: 'Done',
                        cards: []
                    }
                ]
            }
        ];
    }
    await db.write();
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// API Routes
app.get('/api/user', (req, res) => {
    res.json({ name: 'Guest' });
});

app.post('/api/checkin', (req, res) => {
    res.status(403).json({ message: 'Check-in not available' });
});

app.get('/api/checkins', (req, res) => {
    res.json([]);
});

// --- Kanban Board API Endpoints ---

app.get('/api/board', async (req, res) => {
    await db.read();
    res.json(db.data.boards[0]);
});

app.post('/api/cards', async (req, res) => {
    const { columnId, text } = req.body;
    if (!columnId || !text) {
        return res.status(400).json({ message: 'Column ID and text are required' });
    }
    await db.read();
    const board = db.data.boards[0];
    const column = board.columns.find(c => c.id === columnId);
    if (column) {
        const newCard = { id: uid.rnd(), text, description: '' };
        column.cards.push(newCard);
        await db.write();
        res.status(201).json(newCard);
    } else {
        res.status(404).json({ message: 'Column not found' });
    }
});

app.put('/api/cards/move', async (req, res) => {
    const { cardId, newColumnId, newIndex } = req.body;
    await db.read();
    const board = db.data.boards[0];
    let cardToMove = null;
    let sourceColumn = null;

    board.columns.forEach(column => {
        const cardIndex = column.cards.findIndex(c => c.id === cardId);
        if (cardIndex > -1) {
            sourceColumn = column;
            cardToMove = column.cards.splice(cardIndex, 1)[0];
        }
    });

    if (cardToMove) {
        const destinationColumn = board.columns.find(c => c.id === newColumnId);
        if (destinationColumn) {
            destinationColumn.cards.splice(newIndex, 0, cardToMove);
            await db.write();
            res.status(200).json({ message: 'Card moved successfully' });
        } else {
            res.status(404).json({ message: 'Destination column not found' });
        }
    } else {
        res.status(404).json({ message: 'Card not found' });
    }
});

// --- Card Details API Endpoints ---

app.get('/api/cards/:cardId', async (req, res) => {
    await db.read();
    const cardId = req.params.cardId;
    let card = null;
    db.data.boards[0].columns.forEach(column => {
        const foundCard = column.cards.find(c => c.id === cardId);
        if (foundCard) card = foundCard;
    });
    if (card) {
        res.json(card);
    } else {
        res.status(404).json({ message: 'Card not found' });
    }
});

app.put('/api/cards/:cardId', async (req, res) => {
    await db.read();
    const cardId = req.params.cardId;
    const { text, description } = req.body;
    let cardToUpdate = null;
    db.data.boards[0].columns.forEach(column => {
        const foundCard = column.cards.find(c => c.id === cardId);
        if (foundCard) cardToUpdate = foundCard;
    });

    if (cardToUpdate) {
        if (text !== undefined) cardToUpdate.text = text;
        if (description !== undefined) cardToUpdate.description = description;
        await db.write();
        res.json(cardToUpdate);
    } else {
        res.status(404).json({ message: 'Card not found' });
    }
});

app.delete('/api/cards/:cardId', async (req, res) => {
    await db.read();
    const cardId = req.params.cardId;
    let cardFound = false;
    db.data.boards[0].columns.forEach(column => {
        const cardIndex = column.cards.findIndex(c => c.id === cardId);
        if (cardIndex > -1) {
            column.cards.splice(cardIndex, 1);
            cardFound = true;
        }
    });

    if (cardFound) {
        await db.write();
        res.status(200).json({ message: 'Card deleted successfully' });
    } else {
        res.status(404).json({ message: 'Card not found' });
    }
});

// Start the server after initializing the database
initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});
