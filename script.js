// ===== TASK MANAGEMENT APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const openAdd = document.getElementById('openAdd');
    const addBox = document.getElementById('addBox');
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTask');
    const cancelAdd = document.getElementById('cancelAdd');
    const taskList = document.getElementById('taskList');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const periodTabs = document.querySelectorAll('.period-tab');
    const chartBtns = document.querySelectorAll('.chart-btn');

    const totalTasksEl = document.getElementById('totalTasks');
    const activeTasksEl = document.getElementById('activeTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const dailyPercent = document.getElementById('dailyPercent');
    const dailyDetails = document.getElementById('dailyDetails');
    const weeklyPercent = document.getElementById('weeklyPercent');
    const weeklyDetails = document.getElementById('weeklyDetails');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const currentDateEl = document.getElementById('currentDate');

    const editModal = document.getElementById('editModal');
    const saveEditBtn = document.getElementById('saveEdit');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const editTaskText = document.getElementById('editTaskText');
    const editTaskType = document.getElementById('editTaskType');
    const editTaskPriority = document.getElementById('editTaskPriority');
    const editTaskDeadline = document.getElementById('editTaskDeadline');

    const taskTypeSelect = document.getElementById('taskTypeSelect');
    const taskPrioritySelect = document.getElementById('taskPriority');
    const taskDeadlineInput = document.getElementById('taskDeadline');

    // Chart elements
    const completionChartCanvas = document.getElementById('completionChart');
    const priorityChartCanvas = document.getElementById('priorityChart');

    // State
    let tasks = [];
    let currentFilter = 'all';
    let currentPeriod = 'all';
    let currentSort = 'new';
    let searchQuery = '';
    let nextId = 1;
    let editingTaskId = null;
    let completionChart = null;
    let priorityChart = null;

    const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };

    const priorityColors = {
        urgent: '#FF0000',
        high: '#FF4757',
        medium: '#FFA726',
        low: '#1DBF73'
    };

    // ===== INIT =====
    function init() {
        loadTheme();
        updateCurrentDate();
        loadTasks();
        setupEventListeners();
        updateStats();
        setupCharts();
        updateCharts();
    }

    // ===== THEME =====
    function loadTheme() {
        const saved = localStorage.getItem('theme') || 'light';
        if (saved === 'dark') {
            document.documentElement.classList.add('dark-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.documentElement.classList.remove('dark-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    // ===== DATE DISPLAY =====
    function updateCurrentDate() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        currentDateEl.textContent = now.toLocaleDateString('en-US', options);
    }

    // ===== HELPERS =====
    function stripTime(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function isSameDay(a, b) {
        a = stripTime(a);
        b = stripTime(b);
        return a.getTime() === b.getTime();
    }

    function startOfWeek(d) {
        const date = stripTime(d);
        const day = date.getDay(); // 0=Sun
        const diff = (day + 6) % 7; // Monday as first
        date.setDate(date.getDate() - diff);
        return date;
    }

    function endOfWeek(d) {
        const s = startOfWeek(d);
        s.setDate(s.getDate() + 6);
        return s;
    }

    function isSameWeek(a, b) {
        a = stripTime(a);
        const start = startOfWeek(b);
        const end = endOfWeek(b);
        return a >= start && a <= end;
    }

    function isSameMonth(a, b) {
        a = new Date(a);
        b = new Date(b);
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
    }

    function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    function formatFriendlyDate(date) {
        const d = stripTime(date);
        const today = stripTime(new Date());
        const diffMs = today - d;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
        return d.toLocaleDateString();
    }

    function getRelevantDate(task) {
        return task.deadline || task.createdAt;
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ===== LOCAL STORAGE =====
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            const parsed = JSON.parse(savedTasks);
            tasks = parsed.map(task => ({
                ...task,
                createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                deadline: task.deadline ? new Date(task.deadline) : null
            }));
            if (tasks.length > 0) {
                nextId = Math.max(...tasks.map(t => t.id)) + 1;
            }
        } else {
            // Sample demo tasks for first run
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            const nextMonth = new Date(today);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            tasks = [
                {
                    id: nextId++,
                    text: 'Complete project proposal',
                    completed: false,
                    createdAt: new Date(),
                    type: 'daily',
                    priority: 'high',
                    deadline: tomorrow
                },
                {
                    id: nextId++,
                    text: 'Buy groceries for the week',
                    completed: true,
                    createdAt: new Date(Date.now() - 86400000),
                    type: 'weekly',
                    priority: 'medium',
                    deadline: today
                },
                {
                    id: nextId++,
                    text: 'Schedule team meeting',
                    completed: false,
                    createdAt: new Date(Date.now() - 172800000),
                    type: 'general',
                    priority: 'medium',
                    deadline: nextWeek
                },
                {
                    id: nextId++,
                    text: 'Review design mockups',
                    completed: false,
                    createdAt: new Date(),
                    type: 'daily',
                    priority: 'urgent',
                    deadline: today
                },
                {
                    id: nextId++,
                    text: 'Prepare presentation slides',
                    completed: true,
                    createdAt: new Date(Date.now() - 259200000),
                    type: 'weekly',
                    priority: 'low',
                    deadline: tomorrow
                },
                {
                    id: nextId++,
                    text: 'Monthly budget review',
                    completed: false,
                    createdAt: new Date(),
                    type: 'monthly',
                    priority: 'high',
                    deadline: nextMonth
                }
            ];
            saveTasks();
        }
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // ===== TOAST =====
    function showToast(message, isError = false) {
        toastMessage.textContent = message;
        if (isError) {
            toast.classList.add('error');
        } else {
            toast.classList.remove('error');
        }
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // ===== FILTERS & SORT =====
    function matchesPeriod(task) {
        if (currentPeriod === 'all') return true;
        const date = getRelevantDate(task);
        const today = new Date();
        if (!date) return false;
        if (currentPeriod === 'today') return isSameDay(date, today);
        if (currentPeriod === 'week') return isSameWeek(date, today);
        if (currentPeriod === 'month') return isSameMonth(date, today);
        return true;
    }

    function getFilteredSortedTasks() {
        let list = tasks.slice();

        // Period
        list = list.filter(task => matchesPeriod(task));

        // Status filter
        list = list.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        // Search
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            list = list.filter(task => task.text.toLowerCase().includes(q));
        }

        // Sort
        list.sort((a, b) => {
            if (currentSort === 'new') {
                return b.createdAt - a.createdAt;
            } else if (currentSort === 'old') {
                return a.createdAt - b.createdAt;
            } else if (currentSort === 'priority') {
                return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            } else if (currentSort === 'deadline') {
                if (!a.deadline && !b.deadline) return 0;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return a.deadline - b.deadline;
            } else if (currentSort === 'az') {
                return a.text.localeCompare(b.text);
            } else if (currentSort === 'za') {
                return b.text.localeCompare(a.text);
            }
            return 0;
        });

        return list;
    }

    // ===== RENDER TASKS =====
    function renderTasks() {
        taskList.innerHTML = '';
        const list = getFilteredSortedTasks();

        if (list.length === 0) {
            taskList.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No tasks found</h3>
                    <p>Add a new task to get started!</p>
                </li>
            `;
            return;
        }

        const today = stripTime(new Date());

        list.forEach(task => {
            const li = document.createElement('li');
            li.classList.add('task-item');
            li.dataset.id = task.id;

            const isOverdue = task.deadline && !task.completed && stripTime(task.deadline) < today;
            if (isOverdue) li.classList.add('overdue');

            // Checkbox
            const checkbox = document.createElement('div');
            checkbox.classList.add('task-checkbox');
            checkbox.innerHTML = '<i class="fas fa-check"></i>';
            if (task.completed) checkbox.classList.add('checked');
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTaskCompletion(task.id);
            });

            // Content
            const content = document.createElement('div');
            content.classList.add('task-content');

            const header = document.createElement('div');
            header.classList.add('task-header');

            const textEl = document.createElement('div');
            textEl.classList.add('task-text');
            textEl.textContent = task.text;
            if (task.completed) textEl.classList.add('completed');

            const typeBadge = document.createElement('span');
            typeBadge.classList.add('task-type', task.type);
            typeBadge.textContent = capitalize(task.type);

            header.appendChild(textEl);
            header.appendChild(typeBadge);

            const meta = document.createElement('div');
            meta.classList.add('task-meta');

            const prioritySpan = document.createElement('span');
            prioritySpan.innerHTML = `<i class="fas fa-flag"></i> ${capitalize(task.priority)} priority`;

            const deadlineSpan = document.createElement('span');
            if (task.deadline) {
                const dStr = formatDate(task.deadline);
                deadlineSpan.innerHTML = `<i class="fas fa-clock"></i> ${dStr}`;
                if (isOverdue) deadlineSpan.classList.add('overdue');
            } else {
                deadlineSpan.innerHTML = `<i class="fas fa-clock"></i> No deadline`;
            }

            const createdSpan = document.createElement('span');
            createdSpan.innerHTML = `<i class="fas fa-calendar-plus"></i> Added ${formatFriendlyDate(task.createdAt)}`;

            meta.appendChild(prioritySpan);
            meta.appendChild(deadlineSpan);
            meta.appendChild(createdSpan);

            content.appendChild(header);
            content.appendChild(meta);

            // Actions
            const actions = document.createElement('div');
            actions.classList.add('task-actions');

            const editBtn = document.createElement('button');
            editBtn.className = 'task-action edit';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(task);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-action delete';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            li.appendChild(checkbox);
            li.appendChild(content);
            li.appendChild(actions);

            taskList.appendChild(li);
        });
    }

    // ===== TASK OPERATIONS =====
    function addNewTask() {
        const text = taskInput.value.trim();
        if (!text) {
            showToast('Please enter a task description.', true);
            taskInput.focus();
            return;
        }

        const type = taskTypeSelect.value;
        const priority = taskPrioritySelect.value;
        const deadlineValue = taskDeadlineInput.value;
        const deadlineDate = deadlineValue ? new Date(deadlineValue + 'T00:00:00') : null;

        const newTask = {
            id: nextId++,
            text,
            completed: false,
            createdAt: new Date(),
            type,
            priority,
            deadline: deadlineDate
        };

        tasks.push(newTask);
        saveTasks();
        clearAddForm();
        renderTasks();
        updateStats();
        updateCharts();
        showToast('Task added successfully!');
    }

    function clearAddForm() {
        taskInput.value = '';
        taskTypeSelect.value = 'general';
        taskPrioritySelect.value = 'medium';
        taskDeadlineInput.value = '';
        addBox.classList.remove('active');
    }

    function toggleTaskCompletion(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
        updateCharts();
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
        updateCharts();
        showToast('Task deleted.');
    }

    function openEditModal(task) {
        editingTaskId = task.id;
        editTaskText.value = task.text;
        editTaskType.value = task.type;
        editTaskPriority.value = task.priority;
        editTaskDeadline.value = task.deadline ? formatDate(task.deadline) : '';
        editModal.style.display = 'flex';
    }

    function saveEdit() {
        const task = tasks.find(t => t.id === editingTaskId);
        if (!task) return;

        const newText = editTaskText.value.trim();
        if (!newText) {
            showToast('Task description cannot be empty.', true);
            return;
        }

        task.text = newText;
        task.type = editTaskType.value;
        task.priority = editTaskPriority.value;
        const deadlineVal = editTaskDeadline.value;
        task.deadline = deadlineVal ? new Date(deadlineVal + 'T00:00:00') : null;

        saveTasks();
        renderTasks();
        updateStats();
        updateCharts();
        editModal.style.display = 'none';
        showToast('Task updated successfully!');
    }

    // ===== STATS =====
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const active = total - completed;

        totalTasksEl.textContent = total;
        activeTasksEl.textContent = active;
        completedTasksEl.textContent = completed;

        const overallPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
        progressPercent.textContent = `${overallPercent}%`;
        progressFill.style.width = `${overallPercent}%`;

        const today = new Date();
        const dailyTasks = tasks.filter(t => isSameDay(getRelevantDate(t), today));
        const dailyCompleted = dailyTasks.filter(t => t.completed).length;
        const dailyPct = dailyTasks.length ? Math.round((dailyCompleted / dailyTasks.length) * 100) : 0;

        dailyPercent.textContent = `${dailyPct}%`;
        dailyDetails.textContent = `${dailyCompleted}/${dailyTasks.length} tasks`;

        const weeklyTasks = tasks.filter(t => isSameWeek(getRelevantDate(t), today));
        const weeklyCompleted = weeklyTasks.filter(t => t.completed).length;
        const weeklyPct = weeklyTasks.length ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) : 0;

        weeklyPercent.textContent = `${weeklyPct}%`;
        weeklyDetails.textContent = `${weeklyCompleted}/${weeklyTasks.length} tasks`;
    }

    // ===== CHARTS =====
    function setupCharts() {
        if (completionChartCanvas) {
            completionChart = new Chart(completionChartCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Pending'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: ['#1DBF73', '#E2E8F0'],
                        borderWidth: 0
                    }]
                },
                options: {
                    cutout: '65%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        if (priorityChartCanvas) {
            priorityChart = new Chart(priorityChartCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Urgent', 'High', 'Medium', 'Low'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            priorityColors.urgent,
                            priorityColors.high,
                            priorityColors.medium,
                            priorityColors.low
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    function updateCharts() {
        if (completionChart) {
            const activeBtn = document.querySelector('.chart-btn.active');
            const mode = activeBtn ? activeBtn.dataset.chart : 'daily';
            updateCompletionChart(mode);
        }
        if (priorityChart) {
            updatePriorityChart();
        }
    }

    function updateCompletionChart(mode) {
        const today = new Date();
        const relevantTasks = tasks.filter(t => {
            if (mode === 'daily') return isSameDay(getRelevantDate(t), today);
            if (mode === 'weekly') return isSameWeek(getRelevantDate(t), today);
            return true;
        });

        const completed = relevantTasks.filter(t => t.completed).length;
        const pending = relevantTasks.length - completed;

        completionChart.data.datasets[0].data = [completed, pending];
        completionChart.update();
    }

    function updatePriorityChart() {
        const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
        tasks.forEach(t => {
            if (counts[t.priority] !== undefined) {
                counts[t.priority]++;
            }
        });
        priorityChart.data.datasets[0].data = [
            counts.urgent,
            counts.high,
            counts.medium,
            counts.low
        ];
        priorityChart.update();
    }

    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        // Theme
        themeToggle.addEventListener('click', toggleTheme);

        // Add task form toggle
        openAdd.addEventListener('click', () => {
            addBox.classList.toggle('active');
            if (addBox.classList.contains('active')) {
                taskInput.focus();
            }
        });

        cancelAdd.addEventListener('click', () => {
            clearAddForm();
        });

        // Add task
        addTaskBtn.addEventListener('click', addNewTask);

        taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addNewTask();
            }
        });

        // Auto set deadline for daily/weekly/monthly if empty
        taskTypeSelect.addEventListener('change', () => {
            const todayStr = formatDate(new Date());
            if (!taskDeadlineInput.value) {
                if (taskTypeSelect.value === 'daily') {
                    taskDeadlineInput.value = todayStr;
                } else if (taskTypeSelect.value === 'weekly') {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    taskDeadlineInput.value = formatDate(d);
                } else if (taskTypeSelect.value === 'monthly') {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 1);
                    taskDeadlineInput.value = formatDate(d);
                }
            }
        });

        // Filters (All / Active / Completed)
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
                updateStats();
                updateCharts();
            });
        });

        // Period tabs (All / Today / Week / Month)
        periodTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                periodTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentPeriod = tab.dataset.period;
                renderTasks();
                updateStats();
                updateCharts();
            });
        });

        // Search
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value;
            renderTasks();
        });

        // Sort
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            renderTasks();
        });

        // Edit modal
        saveEditBtn.addEventListener('click', saveEdit);
        cancelEditBtn.addEventListener('click', () => {
            editModal.style.display = 'none';
        });

        // Close modal when clicking outside content
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.style.display = 'none';
            }
        });

        // Chart buttons (Daily / Weekly)
        chartBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                chartBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateCompletionChart(btn.dataset.chart);
            });
        });
    }

    // ===== START APP =====
    init();
});
