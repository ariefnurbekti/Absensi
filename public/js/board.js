document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('kanban-board');

    // --- 1. Fetch Board Data and Render --- 
    async function loadBoard() {
        try {
            const response = await fetch('/api/board');
            if (!response.ok) throw new Error('Failed to load board');
            const board = await response.json();

            boardElement.innerHTML = ''; // Clear existing board

            board.columns.forEach(column => {
                const columnElement = createColumnElement(column.id, column.title);
                const cardsContainer = columnElement.querySelector('.kanban-cards');
                
                column.cards.forEach(card => {
                    const cardElement = createCardElement(card.id, card.text);
                    cardsContainer.appendChild(cardElement);
                });

                boardElement.appendChild(columnElement);
            });

            initializeDragAndDrop();
            initializeAddCardButtons();

        } catch (error) {
            console.error('Error loading board:', error);
            boardElement.innerHTML = '<p class="text-red-500">Error loading board. Please try again.</p>';
        }
    }

    // --- 2. Create DOM Elements ---
    function createColumnElement(id, title) {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.dataset.columnId = id;
        column.innerHTML = `
            <header class="p-4 font-semibold text-lg text-slate-700 border-b border-slate-200 flex justify-between items-center">
                <span>${title}</span>
                <span class="text-sm text-slate-500 bg-slate-200 px-2 rounded-full">0</span>
            </header>
            <div class="kanban-cards p-2"></div>
            <footer class="p-2">
                <button class="w-full text-left p-2 text-slate-500 hover:bg-slate-200 rounded-lg">+ Add a card</button>
            </footer>
        `;
        // Update card count later
        return column;
    }

    function createCardElement(id, text) {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.dataset.cardId = id;
        card.textContent = text;
        return card;
    }

    // --- 3. Initialize Interactivity ---
    function initializeDragAndDrop() {
        const columns = document.querySelectorAll('.kanban-cards');
        columns.forEach(column => {
            new Sortable(column, {
                group: 'kanban',
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: async (evt) => {
                    const cardId = evt.item.dataset.cardId;
                    const newColumnId = evt.to.closest('.kanban-column').dataset.columnId;
                    const newIndex = evt.newDraggableIndex;

                    try {
                        await fetch('/api/cards/move', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cardId, newColumnId, newIndex })
                        });
                    } catch (error) {
                        console.error('Failed to move card:', error);
                        // Optionally, revert the move in the UI
                        alert('Failed to save card move. Please refresh.');
                    }
                }
            });
        });
    }

    function initializeAddCardButtons() {
        const addCardButtons = document.querySelectorAll('.kanban-column footer button');
        addCardButtons.forEach(button => {
            button.addEventListener('click', () => {
                const columnId = button.closest('.kanban-column').dataset.columnId;
                const form = createInputForm(async (text) => {
                    if (text) {
                        try {
                            const response = await fetch('/api/cards', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ columnId, text })
                            });
                            const newCardData = await response.json();
                            const cardElement = createCardElement(newCardData.id, newCardData.text);
                            button.closest('.kanban-column').querySelector('.kanban-cards').appendChild(cardElement);
                        } catch (error) {
                             console.error('Failed to add card:', error);
                             alert('Failed to save new card. Please refresh.');
                        }
                    }
                    document.body.removeChild(form.overlay);
                    document.body.removeChild(form);
                });
                document.body.appendChild(form.overlay);
                document.body.appendChild(form);
                form.querySelector('input').focus();
            });
        });
    }

    function createInputForm(onSubmit) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-30 z-40';

        const form = document.createElement('form');
        form.className = 'fixed top-1/4 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-xl border z-50 w-80';
        form.overlay = overlay; // Reference to the overlay

        form.innerHTML = `
            <input type="text" placeholder="Enter a title for this card..." class="w-full border-gray-300 rounded-md shadow-sm p-2 mb-2">
            <button type="submit" class="w-full bg-sky-600 text-white p-2 rounded-md hover:bg-sky-700">Add card</button>
        `;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            onSubmit(form.querySelector('input').value.trim());
        });

        overlay.addEventListener('click', () => { // Click outside to close
            document.body.removeChild(overlay);
            document.body.removeChild(form);
        });

        return form;
    }

    // --- Initial Load ---
    loadBoard();
});
