document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('add-task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskListDiv = document.getElementById('task-list');

    // --- API Endpoints ---
    const API = {
        GET_TASKS: '/api/tasks',
        ADD_TASK: '/api/tasks',
        DELETE_TASK: (id) => `/api/tasks/${id}`
    };

    // --- Functions ---

    /**
     * Fetches tasks from the server and renders them.
     */
    async function fetchAndRenderTasks() {
        try {
            const response = await fetch(API.GET_TASKS);
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            taskListDiv.innerHTML = '<p class="text-red-500 text-center py-4">Could not load tasks. Please try again later.</p>';
        }
    }

    /**
     * Renders an array of tasks into the task list container.
     * @param {Array} tasks - The array of task objects to render.
     */
    function renderTasks(tasks) {
        taskListDiv.innerHTML = ''; // Clear current list

        if (!tasks || tasks.length === 0) {
            taskListDiv.innerHTML = '<p class="text-slate-500 text-center py-4">No tasks yet. Add one above to get started!</p>';
            return;
        }

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200';
            taskElement.setAttribute('data-task-id', task.id);

            taskElement.innerHTML = `
                <span class="text-slate-800">${escapeHTML(task.title)}</span>
                <button class="delete-task-btn text-slate-400 hover:text-red-500 transition-colors" title="Delete Task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            taskListDiv.appendChild(taskElement);
        });
    }

    /**
     * Handles the form submission to add a new task.
     * @param {Event} event - The form submission event.
     */
    async function handleAddTask(event) {
        event.preventDefault();
        const title = taskTitleInput.value.trim();
        if (!title) return;

        try {
            const response = await fetch(API.ADD_TASK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            taskTitleInput.value = ''; // Clear input
            await fetchAndRenderTasks(); // Refresh list
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add the task. Please try again.');
        }
    }

    /**
     * Handles clicks on the task list, specifically for deleting tasks.
     * @param {Event} event - The click event.
     */
    async function handleDeleteTask(event) {
        const deleteButton = event.target.closest('.delete-task-btn');
        if (!deleteButton) return;

        const taskElement = deleteButton.closest('[data-task-id]');
        const taskId = taskElement.dataset.taskId;

        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await fetch(API.DELETE_TASK(taskId), { method: 'DELETE' });

            if (!response.ok) {
                throw new Error('Server failed to delete the task.');
            }

            taskElement.remove(); // Optimistically remove from UI
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete the task. Please try again.');
        }
    }

    /**
     * Escapes HTML to prevent XSS.
     * @param {string} str - The string to escape.
     */
    function escapeHTML(str) {
        return str.replace(/[&<>'"/]/g, function (s) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                '/': '&#x2F;'
            }[s];
        });
    }

    // --- Event Listeners ---
    taskForm.addEventListener('submit', handleAddTask);
    taskListDiv.addEventListener('click', handleDeleteTask);

    // --- Initial Load ---
    fetchAndRenderTasks();
});
