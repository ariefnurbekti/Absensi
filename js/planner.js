document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('task-list');
    const addTaskForm = document.getElementById('add-task-form');
    const taskTitleInput = document.getElementById('task-title');

    let tasks = [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' },
        { id: 3, title: 'Task 3' },
    ];

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task');
            taskElement.innerHTML = `
                <span>${task.title}</span>
                <button class="check-in-btn" data-task-id="${task.id}">Absen</button>
            `;
            taskList.appendChild(taskElement);
        });
    }

    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTaskTitle = taskTitleInput.value.trim();
        if (newTaskTitle) {
            const newTask = {
                id: tasks.length + 1,
                title: newTaskTitle,
            };
            tasks.push(newTask);
            renderTasks();
            taskTitleInput.value = '';
        }
    });

    taskList.addEventListener('click', (e) => {
        if (e.target.classList.contains('check-in-btn')) {
            const taskId = e.target.dataset.taskId;
            handleCheckIn(taskId);
        }
    });

    function handleCheckIn(taskId) {
        // Placeholder for future functionality
        console.log(`Checking in for task ${taskId}`);
        alert(`Absen untuk tugas ${taskId}`);
    }

    renderTasks();
});
