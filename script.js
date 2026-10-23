
/* =====================================
   PocketTasks - JavaScript
   ===================================== */

// 1. SETTINGS AND SAVED DATA

const MAX_TASKS = 10;
const TASKS_KEY = "pocketTasks";
const THEME_KEY = "pocketTasksTheme";

let tasks = loadTasks();


// 2. SELECT HTML ELEMENTS

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const addTaskButton = document.getElementById("add-task-button");

const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const taskProgress = document.getElementById("task-progress");
const completionSummary = document.getElementById("completion-summary");
const emptyState = document.getElementById("empty-state");
const formMessage = document.getElementById("form-message");

const themeToggle = document.getElementById("theme-toggle");

const editDialog = document.getElementById("edit-dialog");
const editForm = document.getElementById("edit-form");
const editInput = document.getElementById("edit-input");
const cancelEditButton = document.getElementById("cancel-edit-button");

const resetButton = document.getElementById("reset-button");
const resetDialog = document.getElementById("reset-dialog");
const cancelResetButton = document.getElementById("cancel-reset-button");
const confirmResetButton = document.getElementById("confirm-reset-button");

let editingTaskId = null;


// 3. LOAD DATA FROM LOCAL STORAGE

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(TASKS_KEY);

    if (!savedTasks) {
      return [];
    }

    const parsedTasks = JSON.parse(savedTasks);

    if (!Array.isArray(parsedTasks)) {
      return [];
    }

    // Validate the saved data before using it.
    return parsedTasks
      .filter(task =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean"
      )
      .slice(0, MAX_TASKS);

  } catch (error) {
    console.error("Could not load saved tasks:", error);
    return [];
  }
}


// 4. SAVE TASKS

function saveTasks() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return true;

  } catch (error) {
    console.error("Could not save tasks:", error);

    showMessage("Unable to save changes in this browser.");
    return false;
  }
}


// 5. DISPLAY MESSAGES

function showMessage(message) {
  formMessage.textContent = message;
}


// 6. RENDER THE TASK LIST

function renderTasks() {
  // Pending tasks appear first.
  const sortedTasks = [...tasks].sort((a, b) => {
    return Number(a.completed) - Number(b.completed);
  });

  // Remove the previous task elements.
  taskList.replaceChildren();

  // Display the empty-state message when necessary.
  emptyState.hidden = tasks.length > 0;

  // Create each task element.
  sortedTasks.forEach(task => {
    const listItem = document.createElement("li");
    listItem.className = "task-item";

    if (task.completed) {
      listItem.classList.add("completed");
    }

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.dataset.action = "toggle";
    checkbox.dataset.id = task.id;
    checkbox.setAttribute(
      "aria-label",
      `Mark ${task.text} ${task.completed ? "incomplete" : "complete"}`
    );

    // Task description
    const taskText = document.createElement("span");
    taskText.className = "task-text";
    taskText.textContent = task.text;

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.dataset.action = "edit";
    editButton.dataset.id = task.id;
    editButton.setAttribute("aria-label", `Edit ${task.text}`);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = task.id;
    deleteButton.setAttribute("aria-label", `Delete ${task.text}`);

    actions.append(editButton, deleteButton);
    listItem.append(checkbox, taskText, actions);
    taskList.appendChild(listItem);
  });

  // Update task count and progress.
  const completedCount = tasks.filter(task => task.completed).length;

  taskCount.textContent = `${tasks.length} / ${MAX_TASKS} tasks`;
  taskProgress.value = tasks.length;

  if (tasks.length === 0) {
    completionSummary.textContent = "No tasks completed yet.";
  } else {
    completionSummary.textContent =
      `${completedCount} of ${tasks.length} tasks completed.`;
  }

  // Prevent adding more than the allowed number.
  addTaskButton.disabled = tasks.length >= MAX_TASKS;

  taskInput.disabled = tasks.length >= MAX_TASKS;

  if (tasks.length >= MAX_TASKS) {
    taskInput.placeholder = "Task limit reached";
  } else {
    taskInput.placeholder = "What needs to be done?";
  }
}


// 7. ADD A NEW TASK

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const text = taskInput.value.trim();

  if (text === "") {
    showMessage("Please enter a task description.");
    taskInput.focus();
    return;
  }

  if (tasks.length >= MAX_TASKS) {
    showMessage("You can add up to 10 tasks only.");
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    text: text,
    completed: false
  };

  tasks.push(newTask);

  if (!saveTasks()) {
    tasks.pop();
    return;
  }

  taskForm.reset();
  showMessage("");
  renderTasks();
  taskInput.focus();
});


// 8. HANDLE TASK CHECKBOXES AND ACTION BUTTONS

taskList.addEventListener("change", function (event) {
  if (!event.target.matches('[data-action="toggle"]')) {
    return;
  }

  const taskId = event.target.dataset.id;
  const task = tasks.find(task => task.id === taskId);

  if (!task) {
    return;
  }

  const previousState = task.completed;
  task.completed = event.target.checked;

  if (!saveTasks()) {
    task.completed = previousState;
  }

  renderTasks();
});


taskList.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");

  if (!button || !taskList.contains(button)) {
    return;
  }

  const taskId = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    openEditDialog(taskId);
  }

  if (action === "delete") {
    deleteTask(taskId);
  }
});


// 9. DELETE A TASK

function deleteTask(taskId) {
  const previousTasks = tasks;

  tasks = tasks.filter(task => task.id !== taskId);

  if (!saveTasks()) {
    tasks = previousTasks;
    return;
  }

  renderTasks();
  showMessage("Task deleted.");
}


// 10. EDIT A TASK

function openEditDialog(taskId) {
  const task = tasks.find(task => task.id === taskId);

  if (!task) {
    return;
  }

  editingTaskId = taskId;
  editInput.value = task.text;

  editDialog.showModal();
  editInput.focus();
}


editForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const newText = editInput.value.trim();

  if (newText === "") {
    editInput.focus();
    return;
  }

  const task = tasks.find(task => task.id === editingTaskId);

  if (!task) {
    editDialog.close();
    return;
  }

  const previousText = task.text;
  task.text = newText;

  if (!saveTasks()) {
    task.text = previousText;
    return;
  }

  editDialog.close();
  editingTaskId = null;

  renderTasks();
  showMessage("Task updated.");
});


cancelEditButton.addEventListener("click", function () {
  editDialog.close();
  editingTaskId = null;
});


// 11. LIGHT / DARK THEME

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.body.classList.toggle("dark-theme", isDark);

  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";

  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme"
  );
}


function loadTheme() {
  let savedTheme = "light";

  try {
    savedTheme = localStorage.getItem(THEME_KEY) || "light";
  } catch (error) {
    console.error("Could not load theme:", error);
  }

  applyTheme(savedTheme === "dark" ? "dark" : "light");
}


themeToggle.addEventListener("click", function () {
  const isCurrentlyDark = document.body.classList.contains("dark-theme");
  const newTheme = isCurrentlyDark ? "light" : "dark";

  applyTheme(newTheme);

  try {
    localStorage.setItem(THEME_KEY, newTheme);
  } catch (error) {
    console.error("Could not save theme:", error);
  }
});


// 12. RESET ALL TASKS

resetButton.addEventListener("click", function () {
  resetDialog.showModal();
});


cancelResetButton.addEventListener("click", function () {
  resetDialog.close();
});


confirmResetButton.addEventListener("click", function () {
  const previousTasks = tasks;

  tasks = [];

  if (!saveTasks()) {
    tasks = previousTasks;
    renderTasks();
    resetDialog.close();
    return;
  }

  resetDialog.close();

  renderTasks();
  showMessage("All tasks have been reset.");
  taskInput.focus();
});


// 13. START THE APP

loadTheme();
renderTasks();
