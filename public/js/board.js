document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('kanban-board');

    // --- 1. Load and Render Board ---
    async function loadBoard() {
        const response = await fetch('/api/board');
        const board = await response.json();
        boardElement.innerHTML = '';
        board.columns.forEach(col => {
            const colEl = createColumnElement(col.id, col.title);
            col.cards.forEach(card => {
                const cardEl = createCardElement(card.id, card.text);
                colEl.querySelector('.kanban-cards').appendChild(cardEl);
            });
            boardElement.appendChild(colEl);
        });
        updateAllCardCounts();
        initializeDragAndDrop();
        initializeAddCardButtons();
        initializeCardClickListeners();
    }

    // --- 2. Create DOM Elements ---
    function createColumnElement(id, title) {
        const el = document.createElement('div');
        el.className = 'kanban-column';
        el.dataset.columnId = id;
        el.innerHTML = `
            <header class="p-4 font-semibold text-lg text-slate-700 border-b border-slate-200 flex justify-between items-center">
                <span>${title}</span>
                <span class="card-count text-sm text-slate-500 bg-slate-200 px-2 rounded-full">0</span>
            </header>
            <div class="kanban-cards p-2"></div>
            <footer class="p-2">
                <button class="w-full text-left p-2 text-slate-500 hover:bg-slate-200 rounded-lg">+ Add a card</button>
            </footer>
        `;
        return el;
    }

    function createCardElement(id, text) {
        const el = document.createElement('div');
        el.className = 'kanban-card';
        el.dataset.cardId = id;
        el.textContent = text;
        return el;
    }

    // --- 3. UI Interactivity ---
    function updateCardCount(columnId) {
        const col = boardElement.querySelector(`[data-column-id="${columnId}"]`);
        if (col) col.querySelector('.card-count').textContent = col.querySelectorAll('.kanban-card').length;
    }

    function updateAllCardCounts() {
        boardElement.querySelectorAll('.kanban-column').forEach(col => updateCardCount(col.dataset.columnId));
    }

    function initializeDragAndDrop() {
        document.querySelectorAll('.kanban-cards').forEach(col => {
            new Sortable(col, {
                group: 'kanban', animation: 150, ghostClass: 'sortable-ghost',
                onEnd: async (e) => {
                    updateCardCount(e.from.closest('.kanban-column').dataset.columnId);
                    updateCardCount(e.to.closest('.kanban-column').dataset.columnId);
                    await fetch('/api/cards/move', {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cardId: e.item.dataset.cardId, newColumnId: e.to.closest('.kanban-column').dataset.columnId, newIndex: e.newDraggableIndex })
                    });
                }
            });
        });
    }

    function initializeAddCardButtons() {
        boardElement.querySelectorAll('.kanban-column footer button').forEach(btn => {
            btn.addEventListener('click', () => {
                const colEl = btn.closest('.kanban-column');
                showInputForm(colEl, async (text) => {
                    const res = await fetch('/api/cards', { 
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ columnId: colEl.dataset.columnId, text })
                    });
                    const newCard = await res.json();
                    const cardEl = createCardElement(newCard.id, newCard.text);
                    colEl.querySelector('.kanban-cards').appendChild(cardEl);
                    updateCardCount(colEl.dataset.columnId);
                    initializeCardClickListeners(cardEl); // Attach listener to the new card
                });
            });
        });
    }
    
    function initializeCardClickListeners(target) {
        const cards = target ? [target] : document.querySelectorAll('.kanban-card');
        cards.forEach(card => {
            card.addEventListener('click', () => showCardDetailModal(card.dataset.cardId));
        });
    }

    // --- 4. Modal Windows (Input & Detail) ---
    function showInputForm(columnEl, onSubmit) {
        // Simplified input form logic from before
        // ... (This function is now part of the larger modal system)
    }
    
    async function showCardDetailModal(cardId) {
        const res = await fetch(`/api/cards/${cardId}`);
        const card = await res.json();

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
                <button class="close-btn absolute top-3 right-3 text-2xl text-slate-500 hover:text-slate-800">&times;</button>
                <input type="text" name="text" value="${card.text}" class="text-2xl font-bold w-full p-2 border-b-2 border-transparent focus:border-sky-500 outline-none mb-4">
                <p class="text-slate-500 mb-2 font-semibold">Description</p>
                <textarea name="description" class="w-full h-40 p-2 border rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500">${card.description || ''}</textarea>
                <div class="mt-4 text-right">
                    <button class="save-btn bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-btn').addEventListener('click', () => document.body.removeChild(modal));
        modal.addEventListener('click', (e) => { if (e.target === modal) document.body.removeChild(modal); });

        modal.querySelector('.save-btn').addEventListener('click', async () => {
            const newText = modal.querySelector('input[name="text"]').value;
            const newDescription = modal.querySelector('textarea[name="description"]').value;
            
            const updateRes = await fetch(`/api/cards/${cardId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newText, description: newDescription })
            });

            if (updateRes.ok) {
                // Update card title on the board in real-time
                const cardElOnBoard = document.querySelector(`[data-card-id="${cardId}"]`);
                if(cardElOnBoard) cardElOnBoard.textContent = newText;
                document.body.removeChild(modal);
            }
        });
    }

    // Initial Load
    loadBoard();
});
