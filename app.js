const STORAGE_KEY = "padron-electoral-registros";
const USERS_KEY = "padron-electoral-usuarios";
const SESSION_KEY = "padron-electoral-sesion";
const AUDIT_KEY = "padron-electoral-auditoria";
const API_BASE = window.location.origin;

const loginScreen = document.querySelector("#loginScreen");
const appScreen = document.querySelector("#appScreen");
const loginForm = document.querySelector("#loginForm");
const loginUsername = document.querySelector("#loginUsername");
const loginPassword = document.querySelector("#loginPassword");
const loginError = document.querySelector("#loginError");
const adminPanel = document.querySelector("#adminPanel");
const userForm = document.querySelector("#userForm");
const newFirstName = document.querySelector("#newFirstName");
const newLastName = document.querySelector("#newLastName");
const newUsername = document.querySelector("#newUsername");
const newPassword = document.querySelector("#newPassword");
const newFunction = document.querySelector("#newFunction");
const newFunctionDescription = document.querySelector("#newFunctionDescription");
const userMessage = document.querySelector("#userMessage");
const usersList = document.querySelector("#usersList");
const logoutButton = document.querySelector("#logoutButton");
const activeUserBadge = document.querySelector("#activeUserBadge");
const summaryPanel = document.querySelector("#summaryPanel");
const summaryCards = document.querySelectorAll("[data-summary]");
const summaryDetail = document.querySelector("#summaryDetail");
const summaryDetailTitle = document.querySelector("#summaryDetailTitle");
const summaryDetailBody = document.querySelector("#summaryDetailBody");
const summaryDetailEmpty = document.querySelector("#summaryDetailEmpty");
const recordsBody = document.querySelector("#recordsBody");
const emptyState = document.querySelector("#emptyState");
const search = document.querySelector("#search");
const filterType = document.querySelector("#filterType");
const filterPc = document.querySelector("#filterPc");
const neighborhoodDropdownButton = document.querySelector("#neighborhoodDropdownButton");
const neighborhoodDropdown = document.querySelector("#neighborhoodDropdown");
const neighborhoodFilters = document.querySelectorAll("[data-neighborhood-filter]");
const tableHead = document.querySelector("#tableHead");
const tableTitle = document.querySelector("#tableTitle");
const tablePanel = document.querySelector(".table-panel");
const toolsPanel = document.querySelector(".tools-panel");
const exitPollPanel = document.querySelector("#exitPollPanel");
const exitPollGeneral = document.querySelector("#exitPollGeneral");
const exitPollChart = document.querySelector("#exitPollChart");
const exitPollBody = document.querySelector("#exitPollBody");
const exitPollEmpty = document.querySelector("#exitPollEmpty");
const surveyPanel = document.querySelector("#surveyPanel");
const surveyGeneral = document.querySelector("#surveyGeneral");
const surveyChart = document.querySelector("#surveyChart");
const surveyBody = document.querySelector("#surveyBody");
const surveyEmpty = document.querySelector("#surveyEmpty");
const reportPanel = document.querySelector("#reportPanel");
const auditLogBody = document.querySelector("#auditLogBody");
const auditLogEmpty = document.querySelector("#auditLogEmpty");
const bulkTools = document.querySelector("#bulkTools");
const editModeHint = document.querySelector("#editModeHint");
const viewSections = document.querySelectorAll(".view-section");
const viewButtons = document.querySelectorAll("[data-view-button]");
const viewOnlyControls = document.querySelectorAll("[data-view-only]");
const bulkFields = {
  benefitType: document.querySelector("#bulkBenefitType"),
  status: document.querySelector("#bulkStatus"),
  amount: document.querySelector("#bulkAmount"),
  city: document.querySelector("#bulkCity"),
  neighborhood: document.querySelector("#bulkNeighborhood"),
  mobileType: document.querySelector("#bulkMobileType"),
  passedPc: document.querySelector("#bulkPassedPc"),
};

let records = repairLoadedRecords(loadRecords());
let users = loadUsers();
let auditLog = loadAuditLog();
let currentUser = loadSession();
let authToken = "";
let selectedRecords = new Set();
let currentView = "operations";
let bulkEditorOpen = false;
let selectedSummary = "";
let lastRecordsJson = localStorage.getItem(STORAGE_KEY) || "";
let lastUsersJson = localStorage.getItem(USERS_KEY) || "";
let lastAuditJson = localStorage.getItem(AUDIT_KEY) || "";

function loadUsers() {
  try {
    const savedUsers = JSON.parse(localStorage.getItem(USERS_KEY));
    if (Array.isArray(savedUsers) && savedUsers.length) return savedUsers;
  } catch {
    // Use the initial admin if saved users are not readable.
  }

  const initialUsers = [{ username: "admin", password: "admin123", role: "admin" }];
  localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
  return initialUsers;
}

function saveUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  lastUsersJson = localStorage.getItem(USERS_KEY) || "";
}

function loadAuditLog() {
  try {
    const savedLog = JSON.parse(localStorage.getItem(AUDIT_KEY));
    return Array.isArray(savedLog) ? savedLog : [];
  } catch {
    return [];
  }
}

function saveAuditLog() {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog));
  lastAuditJson = localStorage.getItem(AUDIT_KEY) || "";
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(data?.error || "Error de servidor");
  return data;
}

async function loadRemoteData() {
  records = repairLoadedRecords(await apiRequest("/api/records"));
  if (isAdmin()) {
    users = await apiRequest("/api/users");
    auditLog = await apiRequest("/api/audit");
  } else {
    users = [currentUser];
    auditLog = [];
  }
}

async function migrateLocalRecordsIfNeeded(localRecords) {
  if (!isAdmin() || records.length || !localRecords.length) return;
  const shouldMigrate = confirm(`La base de datos esta vacia y hay ${localRecords.length} registros guardados en este navegador. Desea subirlos a Supabase ahora?`);
  if (!shouldMigrate) return;
  await apiRequest("/api/records/bulk", {
    method: "POST",
    body: JSON.stringify({ records: localRecords }),
  });
  records = repairLoadedRecords(await apiRequest("/api/records"));
}

function currentUserLabel() {
  if (!currentUser) return "Sin sesion";
  const fullName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ");
  return fullName ? `${fullName} (${currentUser.username})` : currentUser.username;
}

function renderActiveUser() {
  if (!currentUser) {
    activeUserBadge.textContent = "";
    return;
  }
  const fullName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") || "Administrador General";
  activeUserBadge.innerHTML = `<strong>Usuario activo:</strong> ${escapeHtml(fullName)} <span>(${escapeHtml(currentUser.username)})</span>`;
}

function registerAction(action, detail = "") {
  auditLog.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: new Date().toISOString(),
    user: currentUserLabel(),
    action,
    detail,
  });
  auditLog = auditLog.slice(0, 1000);
  saveAuditLog();
  if (authToken) {
    apiRequest("/api/audit", {
      method: "POST",
      body: JSON.stringify({ action, detail }),
    }).catch(() => {});
  }
  if (currentView === "report") renderReport();
}

async function syncLiveData() {
  if (authToken && currentUser) {
    try {
      await loadRemoteData();
      if (!canAccessView(currentView)) currentView = "operations";
      renderUsersList();
      renderTable();
      if (currentView === "report") renderReport();
    } catch {
      // Keep the current screen usable if the network is momentarily unavailable.
    }
    return;
  }

  let shouldRenderTable = false;
  let shouldRenderUsers = false;
  let shouldRenderReport = false;

  const recordsJson = localStorage.getItem(STORAGE_KEY) || "";
  if (recordsJson !== lastRecordsJson) {
    lastRecordsJson = recordsJson;
    records = repairLoadedRecords(loadRecords());
    lastRecordsJson = localStorage.getItem(STORAGE_KEY) || "";
    selectedRecords.clear();
    bulkEditorOpen = false;
    shouldRenderTable = true;
    shouldRenderReport = currentView === "report";
  }

  const usersJson = localStorage.getItem(USERS_KEY) || "";
  if (usersJson !== lastUsersJson) {
    lastUsersJson = usersJson;
    users = loadUsers();
    if (currentUser) currentUser = users.find((user) => user.username === currentUser.username) || currentUser;
    shouldRenderUsers = true;
  }

  const auditJson = localStorage.getItem(AUDIT_KEY) || "";
  if (auditJson !== lastAuditJson) {
    lastAuditJson = auditJson;
    auditLog = loadAuditLog();
    shouldRenderReport = true;
  }

  if (!currentUser) return;
  if (!canAccessView(currentView)) currentView = "operations";
  if (shouldRenderUsers) renderUsersList();
  if (shouldRenderTable || shouldRenderUsers) renderTable();
  if (shouldRenderReport && currentView === "report") renderReport();
}

function loadSession() {
  localStorage.removeItem(SESSION_KEY);
  return null;
}

function saveSession(user) {
  currentUser = user;
}

function clearSession() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
}

function isAdmin() {
  return currentUser?.role === "admin";
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  lastRecordsJson = localStorage.getItem(STORAGE_KEY) || "";
}

function repairLoadedRecords(loadedRecords) {
  let changed = false;
  const repairedRecords = loadedRecords.map((record) => {
    const firstNames = fixNameText(record.firstNames || "");
    const lastNames = fixNameText(record.lastNames || "");
    const fullName = fixNameText(record.fullName || "");
    if (firstNames !== normalize(record.firstNames) || lastNames !== normalize(record.lastNames) || fullName !== normalize(record.fullName)) {
      changed = true;
      return { ...record, firstNames, lastNames, fullName };
    }
    return record;
  });

  if (changed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repairedRecords));
  }
  return repairedRecords;
}

function repairStoredNames() {
  let changedCount = 0;
  records = records.map((record) => {
    const firstNames = fixNameText(record.firstNames || "");
    const lastNames = fixNameText(record.lastNames || "");
    const fullName = fixNameText(record.fullName || "");
    if (firstNames !== normalize(record.firstNames) || lastNames !== normalize(record.lastNames) || fullName !== normalize(record.fullName)) {
      changedCount += 1;
      return { ...record, firstNames, lastNames, fullName };
    }
    return record;
  });

  saveRecords();
  renderTable();
  alert(changedCount ? `Se corrigieron ${changedCount} registros.` : "No se encontraron nombres para corregir.");
}

function money(value) {
  if (normalize(value) === "") return "-";
  return Number(value || 0).toLocaleString("es-PY");
}

function normalize(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function normalizeKey(value) {
  return normalize(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function allowedViewsForUser(user) {
  if (!user) return [];
  if (user.role === "admin") return ["operations", "summary", "mobile", "refund", "survey", "exitPoll", "users", "report"];

  const allowed = ["operations"];
  const functionKey = normalizeKey(user.functionName);
  if (functionKey.includes("movil")) allowed.push("mobile");
  if (functionKey.includes("devolucion") || functionKey.includes("pasaje")) allowed.push("refund");
  return allowed;
}

function canAccessView(view) {
  return allowedViewsForUser(currentUser).includes(view);
}

function viewLabel(view) {
  return {
    operations: "Sistema de Gestion",
    summary: "Resumen",
    mobile: "Moviles",
    refund: "Devolucion de Pasaje",
    survey: "Encuesta",
    exitPoll: "Boca de urna",
    users: "Usuarios",
    report: "Reporte",
  }[view] || view;
}

function fixNameText(value) {
  return normalize(value)
    .replace(/Ã±/g, "ñ")
    .replace(/Ã‘/g, "Ñ")
    .replace(/�/g, "ñ")
    .replace(/([A-Za-zÁÉÍÓÚÜáéíóúü])\s*[,\u201E]+\s*([A-Za-zÁÉÍÓÚÜáéíóúü])/g, (match, before, after) => {
      const letter = before === before.toUpperCase() && after === after.toUpperCase() ? "Ñ" : "ñ";
      return `${before}${letter}${after}`;
    });
}

function formatDate(value) {
  const text = normalize(value);
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) return `${isoMatch[3].padStart(2, "0")}/${isoMatch[2].padStart(2, "0")}/${isoMatch[1]}`;

  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) return `${slashMatch[1].padStart(2, "0")}/${slashMatch[2].padStart(2, "0")}/${slashMatch[3]}`;

  return text;
}

function sexLabel(value) {
  return {
    F: "Femenino",
    M: "Masculino",
    O: "Otro",
  }[value] || "-";
}

function benefitLabel(type) {
  return {
    gratis: "Gratis",
    pago: "Pago",
    devolucion: "Devolucion",
    movil: "Movil",
  }[type] || type;
}

function statusValue(status) {
  const value = normalize(status).toLowerCase();
  return ["positivo", "negativo", "dudoso"].includes(value) ? value : "";
}

function statusLabel(status) {
  return {
    positivo: "POSITIVO",
    negativo: "NEGATIVO",
    dudoso: "DUDOSO",
  }[statusValue(status)] || "-";
}

function getDetail(record) {
  if (record.benefitType === "devolucion") return record.city ? `Ciudad: ${record.city}` : "Sin ciudad";
  if (record.benefitType === "movil") return `Movil ${record.mobileType || "completo"}`;
  return "-";
}

function getFilteredRecords() {
  const term = normalize(search.value).toLowerCase();
  const selectedNeighborhoods = getSelectedNeighborhoods();
  return records.filter((record) => {
    const viewType = currentView === "mobile" ? "movil" : currentView === "refund" ? "devolucion" : "";
    const matchesType = viewType ? record.benefitType === viewType : (!filterType.value || record.benefitType === filterType.value);
    const matchesPc = !filterPc.value || (filterPc.value === "si" ? record.passedPc : !record.passedPc);
    const matchesNeighborhood = !selectedNeighborhoods.length || selectedNeighborhoods.includes(normalize(record.neighborhood).toUpperCase());
    const text = [record.firstNames, fixNameText(record.firstNames), record.lastNames, fixNameText(record.lastNames), record.fullName, fixNameText(record.fullName), record.birthDate, record.sex, record.documentNumber, record.pollingPlace, record.tableNumber, record.orderNumber, record.city, record.neighborhood, record.mobileType, record.status]
      .join(" ")
      .toLowerCase();
    return matchesType && matchesPc && matchesNeighborhood && text.includes(term);
  });
}

function getSelectedNeighborhoods() {
  return Array.from(neighborhoodFilters)
    .filter((item) => item.checked)
    .map((item) => item.value);
}

function updateNeighborhoodDropdownLabel() {
  const selected = getSelectedNeighborhoods();
  neighborhoodDropdownButton.textContent = selected.length
    ? `Barrio/compania: ${selected.length} seleccionados`
    : "Barrio/compania: Todos";
}

function getFilteredRecordIds() {
  return getFilteredRecords().map((record) => record.id);
}

function renderStats() {
  document.querySelector("#totalVoters").textContent = records.length;
  document.querySelector("#pcCount").textContent = records.filter((record) => record.passedPc).length;
  document.querySelector("#budgetedAmount").textContent = money(records.reduce((sum, record) => {
    return record.passedPc ? sum : sum + Number(record.amount || 0);
  }, 0));
  document.querySelector("#paidAmount").textContent = money(records.reduce((sum, record) => {
    return record.passedPc ? sum + Number(record.amount || 0) : sum;
  }, 0));
  document.querySelector("#mobileCount").textContent = records.filter((record) => record.benefitType === "movil").length;
  document.querySelector("#refundCount").textContent = records.filter((record) => record.benefitType === "devolucion").length;
  document.querySelector("#paymentCount").textContent = records.filter((record) => record.benefitType === "pago").length;
  renderSummaryDetail();
}

function getSummaryRecords(type) {
  return {
    all: records,
    pc: records.filter((record) => record.passedPc),
    budgeted: records.filter((record) => !record.passedPc && Number(record.amount || 0) > 0),
    paid: records.filter((record) => record.passedPc && Number(record.amount || 0) > 0),
    mobile: records.filter((record) => record.benefitType === "movil"),
    refund: records.filter((record) => record.benefitType === "devolucion"),
    payment: records.filter((record) => record.benefitType === "pago"),
  }[type] || [];
}

function summaryLabel(type) {
  return {
    all: "Votantes",
    pc: "Pasaron por PC",
    budgeted: "Presupuestado",
    paid: "Pagado",
    mobile: "Moviles",
    refund: "Devolucion de pasajes",
    payment: "Pagos",
  }[type] || "Detalle";
}

function renderSummaryDetail() {
  if (!summaryDetail || !selectedSummary) {
    if (summaryDetail) summaryDetail.hidden = true;
    return;
  }

  const detailRecords = getSummaryRecords(selectedSummary);
  summaryDetail.hidden = false;
  summaryDetailTitle.textContent = `${summaryLabel(selectedSummary)} (${detailRecords.length})`;
  summaryDetailBody.innerHTML = detailRecords.map((record) => `
    <tr>
      <td>${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
      <td>${escapeHtml(fixNameText(record.lastNames))}</td>
      <td>${escapeHtml(record.documentNumber)}</td>
      <td>${escapeHtml(benefitLabel(record.benefitType) || "-")}</td>
      <td>${money(record.amount)}</td>
      <td>${escapeHtml(record.neighborhood)}</td>
      <td><span class="pill ${record.passedPc ? "pc-yes" : "pc-no"}">${record.passedPc ? "Si" : "No"}</span></td>
    </tr>
  `).join("");
  summaryDetailEmpty.hidden = detailRecords.length > 0;
  summaryCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.summary === selectedSummary);
  });
}

function renderAuth() {
  loginScreen.hidden = Boolean(currentUser);
  appScreen.hidden = !currentUser;
  renderActiveUser();
  if (!currentUser) return;

  if (!canAccessView(currentView)) currentView = "operations";

  viewButtons.forEach((button) => { button.hidden = !canAccessView(button.dataset.viewButton); });
  renderUsersList();
  renderTable();
}

function renderUsersList() {
  if (!isAdmin()) {
    usersList.innerHTML = "";
    return;
  }

  const operators = users.filter((user) => user.username !== "admin");
  usersList.innerHTML = operators.length ? operators.map((user) => `
    <div class="user-row">
      <div class="user-info">
        <strong>${escapeHtml([user.firstName, user.lastName].filter(Boolean).join(" ") || user.username)}</strong>
        <span>Usuario: ${escapeHtml(user.username)}</span>
        <span>Contraseña: ${escapeHtml(user.password)}</span>
        <span>Funcion: ${escapeHtml(user.functionName || "Sin funcion asignada")}</span>
        <span>Descripcion: ${escapeHtml(user.functionDescription || "Sin descripcion")}</span>
      </div>
      <button class="row-button delete" type="button" data-delete-user="${escapeHtml(user.username)}">Eliminar</button>
    </div>
  `).join("") : `<p class="hint">Todavia no hay operadores creados.</p>`;
}

async function login(username, password) {
  const localRecords = repairLoadedRecords(loadRecords());
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  authToken = data.token;
  saveSession(data.user);
  await loadRemoteData();
  await migrateLocalRecordsIfNeeded(localRecords);
  currentView = "operations";
  return true;
}

async function createOperator(firstName, lastName, username, password, functionName, functionDescription) {
  const cleanFirstName = normalize(firstName);
  const cleanLastName = normalize(lastName);
  const cleanUsername = normalize(username);
  const cleanFunctionName = normalize(functionName);
  const cleanFunctionDescription = normalize(functionDescription);
  if (!cleanFirstName || !cleanLastName || !cleanUsername || !password || !cleanFunctionName || !cleanFunctionDescription) return "Complete todos los campos.";
  if (users.some((user) => user.username.toLowerCase() === cleanUsername.toLowerCase())) {
    return "Ese usuario ya existe.";
  }

  const createdUser = { firstName: cleanFirstName, lastName: cleanLastName, username: cleanUsername, password, functionName: cleanFunctionName, functionDescription: cleanFunctionDescription };
  users.push(await apiRequest("/api/users", {
    method: "POST",
    body: JSON.stringify(createdUser),
  }));
  renderUsersList();
  return "Usuario creado correctamente.";
}

function renderTable() {
  const filtered = getFilteredRecords();
  renderViewChrome();
  if (currentView === "summary") {
    renderStats();
    return;
  }
  if (currentView === "report") {
    renderReport();
    renderStats();
    return;
  }
  if (currentView === "users") {
    renderStats();
    return;
  }
  if (currentView === "exitPoll") {
    renderExitPoll();
    renderStats();
    return;
  }
  if (currentView === "survey") {
    renderSurvey();
    renderStats();
    return;
  }
  recordsBody.innerHTML = "";
  emptyState.hidden = filtered.length > 0;

  filtered.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = currentView === "mobile" ? mobileRow(record) : currentView === "refund" ? refundRow(record) : operationsRow(record);
    recordsBody.appendChild(row);
  });

  renderStats();
}

function renderViewChrome() {
  const exitPoll = currentView === "exitPoll";
  const survey = currentView === "survey";
  const usersView = currentView === "users";
  const reportView = currentView === "report";
  const summaryView = currentView === "summary";
  tableTitle.textContent = {
    operations: "Sistema de Gestion",
    summary: "Resumen",
    mobile: "Moviles",
    refund: "Devolucion de Pasaje",
    report: "Reporte",
  }[currentView] || "Sistema de Gestion";
  toolsPanel.hidden = exitPoll || survey || usersView || reportView || summaryView;
  tablePanel.hidden = exitPoll || survey || usersView || reportView || summaryView;
  exitPollPanel.hidden = !exitPoll;
  surveyPanel.hidden = !survey;
  reportPanel.hidden = !reportView;
  summaryPanel.hidden = !summaryView;
  adminPanel.hidden = !usersView || !isAdmin();
  tablePanel.classList.toggle("operations", !exitPoll && !survey);
  bulkTools.hidden = exitPoll || survey || usersView || reportView || summaryView || !bulkEditorOpen;
  const selected = records.filter((record) => selectedRecords.has(record.id));
  editModeHint.textContent = selected.length === 1
    ? `Editando: ${fixNameText(selected[0].lastNames)} ${fixNameText(selected[0].firstNames)} - CI ${selected[0].documentNumber}`
    : `Editando ${selected.length} registros seleccionados`;
  viewSections.forEach((section) => {
    section.hidden = section.dataset.view !== currentView;
  });
  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.viewButton === currentView);
  });
  viewOnlyControls.forEach((control) => {
    control.hidden = control.dataset.viewOnly !== currentView;
  });
  tableHead.innerHTML = currentView === "mobile" ? `
    <tr>
      <th>Nombres</th>
      <th>Apellidos</th>
      <th>Cedula</th>
      <th>Tipo movil</th>
      <th>Barrio/compania</th>
      <th>Local</th>
      <th>Mesa</th>
      <th>Orden</th>
      <th>Estado</th>
      <th>PC</th>
      <th>Acciones</th>
    </tr>
  ` : currentView === "refund" ? `
    <tr>
      <th>Nombres</th>
      <th>Apellidos</th>
      <th>Cedula</th>
      <th>Ciudad</th>
      <th>Monto</th>
      <th>Barrio/compania</th>
      <th>Local</th>
      <th>Mesa</th>
      <th>Orden</th>
      <th>Estado</th>
      <th>PC</th>
      <th>Acciones</th>
    </tr>
  ` : `
    <tr>
      <th>Nombres</th>
      <th>Apellidos</th>
      <th>Cedula</th>
      <th>Tipo</th>
      <th>Detalle</th>
      <th>Barrio/compania</th>
      <th>Estado</th>
      <th>Monto</th>
      <th>PC</th>
      <th>Acciones</th>
    </tr>
  `;
}

function emptyExitPollCounts(neighborhood = "") {
  return {
    neighborhood,
    total: 0,
    positivo: 0,
    dudoso: 0,
    negativo: 0,
  };
}

function addToExitPollCounts(counts, record) {
  const status = statusValue(record.status);
  counts.total += 1;
  if (status) counts[status] += 1;
}

function getStatusSummary(summaryRecords) {
  const general = emptyExitPollCounts();
  const byNeighborhood = new Map();

  summaryRecords.forEach((record) => {
    addToExitPollCounts(general, record);
    const neighborhood = normalize(record.neighborhood) || "Sin barrio/compania";
    if (!byNeighborhood.has(neighborhood)) {
      byNeighborhood.set(neighborhood, emptyExitPollCounts(neighborhood));
    }
    addToExitPollCounts(byNeighborhood.get(neighborhood), record);
  });

  return {
    general,
    neighborhoods: Array.from(byNeighborhood.values()).sort((a, b) => a.neighborhood.localeCompare(b.neighborhood, "es")),
  };
}

function renderExitPoll() {
  const passedPcRecords = records.filter((record) => record.passedPc);
  const { general, neighborhoods } = getStatusSummary(passedPcRecords);

  exitPollGeneral.innerHTML = `
    ${exitPollCard("Total PC", general.total)}
    ${exitPollCard("POSITIVO", general.positivo, "status-positivo")}
    ${exitPollCard("DUDOSO", general.dudoso, "status-dudoso")}
    ${exitPollCard("NEGATIVO", general.negativo, "status-negativo")}
  `;
  renderStatusChart(exitPollChart, general, "Grafico de boca de urna");

  exitPollBody.innerHTML = neighborhoods.map((item) => `
    <tr>
      <td>${escapeHtml(item.neighborhood)}</td>
      <td>${item.total}</td>
      <td><span class="pill status-positivo">${item.positivo} (${percentLabel(item.positivo, item.total)})</span></td>
      <td><span class="pill status-dudoso">${item.dudoso} (${percentLabel(item.dudoso, item.total)})</span></td>
      <td><span class="pill status-negativo">${item.negativo} (${percentLabel(item.negativo, item.total)})</span></td>
    </tr>
  `).join("");
  exitPollEmpty.hidden = passedPcRecords.length > 0;
}

function renderSurvey() {
  const surveyRecords = records.filter((record) => statusValue(record.status));
  const { general, neighborhoods } = getStatusSummary(surveyRecords);

  surveyGeneral.innerHTML = `
    ${exitPollCard("Total", general.total)}
    ${exitPollCard("POSITIVO", `${general.positivo} (${percentLabel(general.positivo, general.total)})`, "status-positivo")}
    ${exitPollCard("DUDOSO", `${general.dudoso} (${percentLabel(general.dudoso, general.total)})`, "status-dudoso")}
    ${exitPollCard("NEGATIVO", `${general.negativo} (${percentLabel(general.negativo, general.total)})`, "status-negativo")}
  `;
  renderStatusChart(surveyChart, general, "Grafico de encuesta");

  surveyBody.innerHTML = neighborhoods.map((item) => `
    <tr>
      <td>${escapeHtml(item.neighborhood)}</td>
      <td>${item.total}</td>
      <td><span class="pill status-positivo">${item.positivo} (${percentLabel(item.positivo, item.total)})</span></td>
      <td><span class="pill status-dudoso">${item.dudoso} (${percentLabel(item.dudoso, item.total)})</span></td>
      <td><span class="pill status-negativo">${item.negativo} (${percentLabel(item.negativo, item.total)})</span></td>
    </tr>
  `).join("");
  surveyEmpty.hidden = surveyRecords.length > 0;
}

function renderReport() {
  auditLogBody.innerHTML = auditLog.map((item) => `
    <tr>
      <td>${escapeHtml(new Date(item.date).toLocaleString("es-PY"))}</td>
      <td>${escapeHtml(item.user)}</td>
      <td>${escapeHtml(item.action)}</td>
      <td>${escapeHtml(item.detail)}</td>
    </tr>
  `).join("");
  auditLogEmpty.hidden = auditLog.length > 0;
}

function generatePcReportPdf() {
  const pcRecords = records.filter((record) => record.passedPc);
  const generatedAt = new Date().toLocaleString("es-PY");
  const rows = pcRecords.map((record) => `
    <tr>
      <td>${escapeHtml(fixNameText(record.lastNames))}</td>
      <td>${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
      <td>${escapeHtml(record.documentNumber)}</td>
      <td>${escapeHtml(record.pollingPlace)}</td>
      <td>${escapeHtml(record.tableNumber)}</td>
      <td>${escapeHtml(record.orderNumber)}</td>
      <td>${escapeHtml(record.neighborhood)}</td>
      <td>${escapeHtml(statusLabel(record.status))}</td>
      <td>${escapeHtml(benefitLabel(record.benefitType))}</td>
      <td>${money(record.amount)}</td>
      <td>${escapeHtml(record.pcMarkedBy || "Sin dato")}</td>
    </tr>
  `).join("");
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("El navegador bloqueo la ventana del reporte. Permita ventanas emergentes para generar el PDF.");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Reporte Paso por PC</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
          h1 { margin: 0 0 6px; font-size: 22px; }
          p { margin: 0 0 14px; color: #555; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; vertical-align: top; }
          th { background: #f1f1f1; text-transform: uppercase; font-size: 10px; }
        </style>
      </head>
      <body>
        <h1>Reporte de votantes que pasaron por PC</h1>
        <p>Generado: ${escapeHtml(generatedAt)} | Total: ${pcRecords.length}</p>
        <table>
          <thead>
            <tr>
              <th>Apellidos</th>
              <th>Nombres</th>
              <th>Cedula</th>
              <th>Local</th>
              <th>Mesa</th>
              <th>Orden</th>
              <th>Barrio/compania</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Marcado por</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="11">No hay registros marcados como Paso por PC.</td></tr>`}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  registerAction("Genero reporte PDF", `Paso por PC: ${pcRecords.length} registros`);
  printWindow.print();
}

function exitPollCard(label, value, className = "") {
  return `
    <div class="exit-poll-card ${className}">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function percentLabel(value, total) {
  return total ? `${(value / total * 100).toFixed(1)}%` : "0.0%";
}

function renderStatusChart(container, counts, title) {
  if (!counts.total) {
    container.innerHTML = "";
    return;
  }

  const positivo = counts.positivo / counts.total * 100;
  const dudoso = counts.dudoso / counts.total * 100;
  const negativo = counts.negativo / counts.total * 100;
  const positivoEnd = positivo;
  const dudosoEnd = positivo + dudoso;

  container.innerHTML = `
    <div class="section-title chart-title">
      <h2>${title}</h2>
    </div>
    <div class="chart-layout">
      <div class="pie-chart" style="background: conic-gradient(#12b15b 0 ${positivoEnd}%, #111111 ${positivoEnd}% ${dudosoEnd}%, #d20f1f ${dudosoEnd}% 100%);">
        <span>${counts.total}</span>
      </div>
      <div class="chart-legend">
        ${chartLegendItem("POSITIVO", counts.positivo, positivo, "positive")}
        ${chartLegendItem("DUDOSO", counts.dudoso, dudoso, "doubtful")}
        ${chartLegendItem("NEGATIVO", counts.negativo, negativo, "negative")}
      </div>
    </div>
  `;
}

function chartLegendItem(label, count, percent, className) {
  return `
    <div class="chart-legend-item">
      <span class="legend-dot ${className}"></span>
      <strong>${label}</strong>
      <span>${count} (${percent.toFixed(1)}%)</span>
    </div>
  `;
}

function operationsRow(record) {
  return `
    <td>${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
    <td>${escapeHtml(fixNameText(record.lastNames))}</td>
    <td>${escapeHtml(record.documentNumber)}</td>
    <td><span class="pill">${benefitLabel(record.benefitType)}</span></td>
    <td>${escapeHtml(getDetail(record))}</td>
    <td>${escapeHtml(record.neighborhood)}</td>
    <td><span class="pill status-${statusValue(record.status)}">${statusLabel(record.status)}</span></td>
    <td>${money(record.amount)}</td>
    <td><span class="pill ${record.passedPc ? "pc-yes" : "pc-no"}">${record.passedPc ? "Si" : "No"}</span></td>
    <td class="actions">
      <button class="row-button" data-action="edit" data-id="${record.id}" type="button">Editar</button>
    </td>
  `;
}

function mobileRow(record) {
  return `
    <td>${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
    <td>${escapeHtml(fixNameText(record.lastNames))}</td>
    <td>${escapeHtml(record.documentNumber)}</td>
    <td><span class="pill">${escapeHtml(record.mobileType || "completo")}</span></td>
    <td>${escapeHtml(record.neighborhood)}</td>
    <td>${escapeHtml(record.pollingPlace)}</td>
    <td>${escapeHtml(record.tableNumber)}</td>
    <td>${escapeHtml(record.orderNumber)}</td>
    <td><span class="pill status-${statusValue(record.status)}">${statusLabel(record.status)}</span></td>
    <td><span class="pill ${record.passedPc ? "pc-yes" : "pc-no"}">${record.passedPc ? "Si" : "No"}</span></td>
    <td class="actions">
      <button class="row-button" data-action="edit" data-id="${record.id}" type="button">Editar</button>
    </td>
  `;
}

function refundRow(record) {
  return `
    <td>${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
    <td>${escapeHtml(fixNameText(record.lastNames))}</td>
    <td>${escapeHtml(record.documentNumber)}</td>
    <td>${escapeHtml(record.city || "Sin ciudad")}</td>
    <td>${money(record.amount)}</td>
    <td>${escapeHtml(record.neighborhood)}</td>
    <td>${escapeHtml(record.pollingPlace)}</td>
    <td>${escapeHtml(record.tableNumber)}</td>
    <td>${escapeHtml(record.orderNumber)}</td>
    <td><span class="pill status-${statusValue(record.status)}">${statusLabel(record.status)}</span></td>
    <td><span class="pill ${record.passedPc ? "pc-yes" : "pc-no"}">${record.passedPc ? "Si" : "No"}</span></td>
    <td class="actions">
      <button class="row-button" data-action="edit" data-id="${record.id}" type="button">Editar</button>
    </td>
  `;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[char]));
}

recordsBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const record = records.find((item) => item.id === button.dataset.id);
  if (!record) return;

  if (button.dataset.action === "edit") {
    selectedRecords.clear();
    selectedRecords.add(record.id);
    bulkEditorOpen = true;
    registerAction("Abrio edicion", `${fixNameText(record.lastNames)} ${fixNameText(record.firstNames || record.fullName || "")} - CI ${record.documentNumber}`);
    renderTable();
    bulkTools.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

function resetBulkFields() {
  bulkFields.benefitType.value = "";
  bulkFields.status.value = "";
  bulkFields.amount.value = "";
  bulkFields.city.value = "";
  bulkFields.neighborhood.value = "";
  bulkFields.mobileType.value = "";
  bulkFields.passedPc.value = "";
}

async function applyBulkChanges() {
  const ids = Array.from(selectedRecords);
  if (!ids.length) {
    alert("Seleccione al menos un registro.");
    return;
  }

  const hasAmount = normalize(bulkFields.amount.value) !== "";
  const hasCity = normalize(bulkFields.city.value) !== "";
  records = records.map((record) => {
    if (!selectedRecords.has(record.id)) return record;
    const updated = { ...record };
    if (bulkFields.benefitType.value) updated.benefitType = bulkFields.benefitType.value;
    if (bulkFields.status.value) updated.status = bulkFields.status.value;
    if (hasAmount) updated.amount = Number(bulkFields.amount.value || 0);
    if (hasCity) updated.city = normalize(bulkFields.city.value);
    if (bulkFields.neighborhood.value) updated.neighborhood = bulkFields.neighborhood.value;
    if (bulkFields.mobileType.value) updated.mobileType = bulkFields.mobileType.value;
    if (bulkFields.passedPc.value) updated.passedPc = bulkFields.passedPc.value === "si";
    if (updated.benefitType === "gratis") {
      updated.amount = 0;
      updated.city = "";
      updated.mobileType = "";
    }
    return updated;
  });

  saveRecords();
  try {
    await apiRequest("/api/records/bulk", {
      method: "POST",
      body: JSON.stringify({ records: records.filter((record) => ids.includes(record.id)) }),
    });
  } catch (error) {
    alert(error.message);
    return;
  }
  resetBulkFields();
  bulkEditorOpen = false;
  renderTable();
  alert(`Se actualizaron ${ids.length} registros.`);
}

async function clearSelectedFields() {
  const ids = Array.from(selectedRecords);
  if (!ids.length) {
    alert("Seleccione al menos un registro.");
    return;
  }

  records = records.map((record) => {
    if (!selectedRecords.has(record.id)) return record;
    return {
      ...record,
      benefitType: "",
      status: "",
      amount: "",
      city: "",
      neighborhood: "",
      mobileType: "",
      passedPc: false,
    };
  });

  saveRecords();
  try {
    await apiRequest("/api/records/bulk", {
      method: "POST",
      body: JSON.stringify({ records: records.filter((record) => ids.includes(record.id)) }),
    });
  } catch (error) {
    alert(error.message);
    return;
  }
  resetBulkFields();
  bulkEditorOpen = false;
  selectedRecords.clear();
  renderTable();
  alert(`Se dejaron en blanco ${ids.length} registros.`);
}

function toCsvValue(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportCsv() {
  const headers = ["nombres", "apellidos", "fecha_nacimiento", "sexo", "cedula", "local", "barrio_compania", "estado", "mesa", "orden", "tipo", "monto", "ciudad", "tipo_movil", "paso_pc"];
  const lines = records.map((record) => [
    fixNameText(record.firstNames || record.fullName || ""),
    fixNameText(record.lastNames),
    formatDate(record.birthDate),
    record.sex,
    record.documentNumber,
    record.pollingPlace,
    record.neighborhood,
    statusLabel(record.status),
    record.tableNumber,
    record.orderNumber,
    record.benefitType,
    record.amount,
    record.city,
    record.mobileType,
    record.passedPc ? "si" : "no",
  ].map(toCsvValue).join(","));
  const blob = new Blob(["\uFEFF" + [headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "padron-electoral.csv";
  link.click();
  URL.revokeObjectURL(url);
  registerAction("Exporto CSV", `${records.length} registros exportados`);
}

document.querySelector("#exportCsv").addEventListener("click", exportCsv);
document.querySelector("#printPcReport").addEventListener("click", generatePcReportPdf);
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = normalize(loginUsername.value);
  try {
    await login(username, loginPassword.value);
    loginError.hidden = true;
  } catch {
    loginError.hidden = false;
    registerAction("Intento fallido de ingreso", `Usuario: ${username || "sin usuario"}`);
    return;
  }
  loginForm.reset();
  renderAuth();
});
userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    userMessage.textContent = await createOperator(newFirstName.value, newLastName.value, newUsername.value, newPassword.value, newFunction.value, newFunctionDescription.value);
  } catch (error) {
    userMessage.textContent = error.message;
  }
  userMessage.hidden = false;
  userForm.reset();
});
usersList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-user]");
  if (!button) return;
  try {
    await apiRequest(`/api/users/${encodeURIComponent(button.dataset.deleteUser)}`, { method: "DELETE" });
    users = users.filter((user) => user.username !== button.dataset.deleteUser);
  } catch (error) {
    alert(error.message);
  }
  renderUsersList();
});
logoutButton.addEventListener("click", async () => {
  if (authToken) {
    await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => {});
  }
  authToken = "";
  clearSession();
  bulkEditorOpen = false;
  selectedRecords.clear();
  currentView = "operations";
  renderAuth();
});
document.querySelector("#cancelBulkEdit").addEventListener("click", () => {
  bulkEditorOpen = false;
  selectedRecords.clear();
  renderTable();
});
viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!canAccessView(button.dataset.viewButton)) return;
    const previousView = currentView;
    currentView = button.dataset.viewButton;
    bulkEditorOpen = false;
    if (currentView === "mobile" || currentView === "refund") {
      filterType.value = "";
      filterPc.value = "";
    }
    if (currentView !== "summary") selectedSummary = "";
    selectedRecords.clear();
    if (previousView !== currentView) registerAction("Cambio de vista", viewLabel(currentView));
    renderTable();
  });
});
summaryCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedSummary = card.dataset.summary;
    renderSummaryDetail();
  });
});
document.querySelector("#applyBulk").addEventListener("click", applyBulkChanges);
document.querySelector("#clearBulkFields").addEventListener("click", clearSelectedFields);
neighborhoodDropdownButton.addEventListener("click", () => {
  const isOpen = neighborhoodDropdown.hidden;
  neighborhoodDropdown.hidden = !isOpen;
  neighborhoodDropdownButton.setAttribute("aria-expanded", String(isOpen));
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".filter-dropdown")) return;
  neighborhoodDropdown.hidden = true;
  neighborhoodDropdownButton.setAttribute("aria-expanded", "false");
});
[search, filterType, filterPc].forEach((item) => item.addEventListener("input", renderTable));
neighborhoodFilters.forEach((item) => {
  item.addEventListener("change", () => {
    updateNeighborhoodDropdownLabel();
    renderTable();
  });
});
window.addEventListener("storage", (event) => {
  if (![STORAGE_KEY, USERS_KEY, AUDIT_KEY].includes(event.key)) return;
  syncLiveData();
});
setInterval(syncLiveData, 1000);

updateNeighborhoodDropdownLabel();
renderAuth();
