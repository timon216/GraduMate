//--------------//
// default data //
//--------------//

const defaultSubjects = [
  { id: "s1", name: "Subject 1" },
  { id: "s2", name: "Subject 2" },
  { id: "s3", name: "Subject 3" }
];

const defaultTasks = [
  { id: "t1", title: "Task 1", subjectId: "s1", dueDate: "2026-02-12" },
  { id: "t2", title: "Task 2", subjectId: "s3", dueDate: "2026-02-15" }
];

const defaultEvents = [
  { id: "e1", title: "Event 1", subjectId: "s1", date: "2026-02-13" },
  { id: "e2", title: "Event 2", subjectId: "s2", date: "2026-02-16" }
];


//-------------//
// ui elements //
//-------------//

const viewTitle = document.getElementById("viewTitle");

const viewWeek = document.getElementById("viewWeek");
const viewTasks = document.getElementById("viewTasks");
const viewEvents = document.getElementById("viewEvents");
const viewSubjects = document.getElementById("viewSubjects");

const weekList = document.getElementById("weekList");
const tasksList = document.getElementById("tasksList");
const eventsList = document.getElementById("eventsList");
const subjectsList = document.getElementById("subjectsList");

const navWeek = document.getElementById("navWeek");
const navTasks = document.getElementById("navTasks");
const navEvents = document.getElementById("navEvents");
const navSubjects = document.getElementById("navSubjects");

const addButton = document.getElementById("addButton");

const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");

const modalTypeSelect = document.getElementById("modalTypeSelect");
const chooseSubject = document.getElementById("chooseSubject");
const chooseTask = document.getElementById("chooseTask");
const chooseEvent = document.getElementById("chooseEvent");

const formSubject = document.getElementById("formSubject");
const formTask = document.getElementById("formTask");
const formEvent = document.getElementById("formEvent");

const subjectName = document.getElementById("subjectName");

const taskTitle = document.getElementById("taskTitle");
const taskSubject = document.getElementById("taskSubject");
const taskDueDate = document.getElementById("taskDueDate");

const eventTitle = document.getElementById("eventTitle");
const eventSubject = document.getElementById("eventSubject");
const eventDate = document.getElementById("eventDate");

const deleteSubjectBtn = document.getElementById("deleteSubjectBtn");
const deleteTaskBtn = document.getElementById("deleteTaskBtn");
const deleteEventBtn = document.getElementById("deleteEventBtn");


//-----------//
// app state //
//-----------//

let currentView = "week";
let editMode = false;
let editingType = null; // "subject" | "task" | "event"
let editingId = null;


//---------//
// helpers //
//---------//

function show(el) {
  if (!el) return;
  el.classList.remove("hidden");
}

function hide(el) {
  if (!el) return;
  el.classList.add("hidden");
}

function setActiveNav(activeBtn) {
  const buttons = document.querySelectorAll(".bottom-nav__btn");
  buttons.forEach(btn => btn.classList.remove("active"));
  activeBtn.classList.add("active");
}

function getSubjectName(subjectId) {
  const s = subjects.find(sub => sub.id === subjectId);
  return s ? s.name : "Brak przedmiotu";
}

function clearForms() {
  subjectName.value = "";
  taskTitle.value = "";
  taskDueDate.value = "";
  eventTitle.value = "";
  eventDate.value = "";
}

function hideAllModalSections() {
  hide(modalTypeSelect);
  hide(formSubject);
  hide(formTask);
  hide(formEvent);
}

function openModal() {
  show(modal);
  const content = modal.querySelector('.modal__content');
  if (content) {
    try { trapFocus(content); } catch { }
  }
}

function closeModal() {
  hide(modal);
  hideAllModalSections();
  clearForms();

  hide(deleteSubjectBtn);
  hide(deleteTaskBtn);
  hide(deleteEventBtn);

  editMode = false;
  editingType = null;
  editingId = null;
  releaseFocus();
}

function hideAllViews() {
  hide(viewWeek);
  hide(viewTasks);
  hide(viewEvents);
  hide(viewSubjects);
}

function generateId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
}


//-------------//
// view switch //
//-------------//

function switchView(viewName) {
  currentView = viewName;
  hideAllViews();

  if (viewName === "week") {
    viewTitle.textContent = "This week";
    show(viewWeek);
    setActiveNav(navWeek);
  }

  if (viewName === "tasks") {
    viewTitle.textContent = "Tasks";
    show(viewTasks);
    setActiveNav(navTasks);
  }

  if (viewName === "events") {
    viewTitle.textContent = "Events";
    show(viewEvents);
    setActiveNav(navEvents);
  }

  if (viewName === "subjects") {
    viewTitle.textContent = "Subjects";
    show(viewSubjects);
    setActiveNav(navSubjects);
  }

  renderAll();
}


//--------------//
// render views //
//--------------//

function renderWeekView() {
  weekList.innerHTML = "";

  const weekItems = [];

  events.forEach(ev => {
    weekItems.push({
      kind: "event",
      id: ev.id,
      title: ev.title,
      subjectId: ev.subjectId,
      date: ev.date
    });
  });

  tasks.forEach(task => {
    weekItems.push({
      kind: "task",
      id: task.id,
      title: task.title,
      subjectId: task.subjectId,
      date: task.dueDate
    });
  });

  weekItems.sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date));

  const visible = weekItems.filter(item => isWithinNextDays(item.date, 7));

  visible.forEach(item => {
    let dateMain = null;
    let dateSub = null;

    if (item.kind === "event") {
      dateMain = formatEventMainDate(item.date);
      const d = daysFromToday(item.date);
      if (d === 0) dateSub = "Dzisiaj";
      else if (d > 0 && d <= 7) dateSub = `za ${d} dni`;
    } else {
      const d = daysFromToday(item.date);
      if (d === 0) dateMain = "Dzisiaj";
      else dateMain = `za ${d} dni`;
    }

    const el = createItemElement({
      title: item.title,
      meta: getSubjectName(item.subjectId),
      dateMain,
      dateSub,
      isEvent: item.kind === "event",
      onClick: () => {
        if (item.kind === "event") openEditEvent(item.id);
        if (item.kind === "task") openEditTask(item.id);
      }
    });

    weekList.appendChild(el);
  });
}

function renderTasksView() {
  tasksList.innerHTML = "";

  const sorted = [...tasks].sort((a, b) => toTimestamp(a.dueDate) - toTimestamp(b.dueDate));

  sorted.forEach(task => {
    const d = daysFromToday(task.dueDate);
    const dateMain = d === 0 ? "Dzisiaj" : `za ${d} dni`;

    const el = createItemElement({
      title: task.title,
      meta: getSubjectName(task.subjectId),
      dateMain,
      dateSub: null,
      isEvent: false,
      onClick: () => openEditTask(task.id)
    });

    tasksList.appendChild(el);
  });
}

function renderEventsView() {
  eventsList.innerHTML = "";

  const sorted = [...events].sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date));

  sorted.forEach(ev => {
    const dateMain = formatEventMainDate(ev.date);
    const d = daysFromToday(ev.date);
    const dateSub = d === 0 ? "Dzisiaj" : (d > 0 && d <= 7 ? `za ${d} dni` : null);

    const el = createItemElement({
      title: ev.title,
      meta: getSubjectName(ev.subjectId),
      dateMain,
      dateSub,
      isEvent: true,
      onClick: () => openEditEvent(ev.id)
    });

    eventsList.appendChild(el);
  });
}

function renderSubjectsView() {
  subjectsList.innerHTML = "";

  subjects.forEach(sub => {
    const div = document.createElement("div");
    div.classList.add("subject-item");
    div.textContent = sub.name;

    div.addEventListener("click", () => openEditSubject(sub.id));

    subjectsList.appendChild(div);
  });
}

function renderAll() {
  renderWeekView();
  renderTasksView();
  renderEventsView();
  renderSubjectsView();
}


//------//
// CRUD //
//------//

function addSubject(name) {
  subjects.push({
    id: generateId("s"),
    name
  });
  saveAll();
}

function updateSubject(id, name) {
  const sub = subjects.find(s => s.id === id);
  if (!sub) return;
  sub.name = name;
  saveAll();
}

function deleteSubject(id) {
  subjects = subjects.filter(s => s.id !== id);
  tasks = tasks.filter(t => t.subjectId !== id);
  events = events.filter(e => e.subjectId !== id);
  saveAll();
}

function addTask(title, subjectId, dueDate) {
  tasks.push({
    id: generateId("t"),
    title,
    subjectId,
    dueDate
  });
  saveAll();
}

function updateTask(id, title, subjectId, dueDate) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.title = title;
  task.subjectId = subjectId;
  task.dueDate = dueDate;
  saveAll();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveAll();
}

function addEvent(title, subjectId, date) {
  events.push({
    id: generateId("e"),
    title,
    subjectId,
    date
  });
  saveAll();
}

function updateEvent(id, title, subjectId, date) {
  const ev = events.find(e => e.id === id);
  if (!ev) return;

  ev.title = title;
  ev.subjectId = subjectId;
  ev.date = date;
  saveAll();
}

function deleteEvent(id) {
  events = events.filter(e => e.id !== id);
  saveAll();
}


//-----------------//
// event listeners //
//-----------------//

navWeek.addEventListener("click", () => switchView("week"));
navTasks.addEventListener("click", () => switchView("tasks"));
navEvents.addEventListener("click", () => switchView("events"));
navSubjects.addEventListener("click", () => switchView("subjects"));

addButton.addEventListener("click", openAddMenu);
closeModalBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

chooseSubject.addEventListener("click", openAddSubject);
chooseTask.addEventListener("click", openAddTask);
chooseEvent.addEventListener("click", openAddEvent);


//------//
// init //
//------//

fillSubjectSelects();
switchView("week");
