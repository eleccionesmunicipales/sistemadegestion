const STORAGE_KEY = "padron-electoral-registros";
const USERS_KEY = "padron-electoral-usuarios";
const SESSION_KEY = "padron-electoral-sesion";
const AUDIT_KEY = "padron-electoral-auditoria";
const API_BASE = window.location.origin;
const LIVE_SYNC_MS = 10000;
const MAX_RENDERED_ROWS = 400;
const DEFAULT_NEIGHBORHOODS = [
  "FATIMA",
  "LOURDES",
  "MERCEDES",
  "CAACUPE",
  "ITACURUBI",
  "SAN FERNANDO",
  "TRINIDAD KUE",
  "TAVAI",
  "CERRO COSTA",
  "COSTA POI",
  "CURUPAYTY",
  "SAN GERONIMO",
  "SAN JUAN BERCHMANS",
  "SAN JORGE",
  "ARROYO KARE",
  "SAN ANTONIO",
  "PARACAU",
];

const loginScreen = document.querySelector("#loginScreen");
const appScreen = document.querySelector("#appScreen");
const loginForm = document.querySelector("#loginForm");
const loginUsername = document.querySelector("#loginUsername");
const loginPassword = document.querySelector("#loginPassword");
const loginSubmit = document.querySelector("#loginSubmit");
const loginLoading = document.querySelector("#loginLoading");
const loginError = document.querySelector("#loginError");
const adminPanel = document.querySelector("#adminPanel");
const userForm = document.querySelector("#userForm");
const newFirstName = document.querySelector("#newFirstName");
const newLastName = document.querySelector("#newLastName");
const newUsername = document.querySelector("#newUsername");
const newPassword = document.querySelector("#newPassword");
const newFunction = document.querySelector("#newFunction");
const newFunctionDescription = document.querySelector("#newFunctionDescription");
const watcherPollingPlaceLabel = document.querySelector("#watcherPollingPlaceLabel");
const watcherTableNumberLabel = document.querySelector("#watcherTableNumberLabel");
const newWatcherPollingPlace = document.querySelector("#newWatcherPollingPlace");
const newWatcherTableNumber = document.querySelector("#newWatcherTableNumber");
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
const neighborhoodSummaryList = document.querySelector("#neighborhoodSummaryList");
const neighborhoodSummaryEmpty = document.querySelector("#neighborhoodSummaryEmpty");
const neighborhoodDetail = document.querySelector("#neighborhoodDetail");
const neighborhoodDetailTitle = document.querySelector("#neighborhoodDetailTitle");
const neighborhoodDetailBody = document.querySelector("#neighborhoodDetailBody");
const neighborhoodDetailEmpty = document.querySelector("#neighborhoodDetailEmpty");
const printNeighborhoodPdf = document.querySelector("#printNeighborhoodPdf");
const printMobilePdf = document.querySelector("#printMobilePdf");
const printRefundPdf = document.querySelector("#printRefundPdf");
const printPaymentPdf = document.querySelector("#printPaymentPdf");
const recordsBody = document.querySelector("#recordsBody");
const emptyState = document.querySelector("#emptyState");
const search = document.querySelector("#search");
const filterType = document.querySelector("#filterType");
const filterPc = document.querySelector("#filterPc");
const filterVote = document.querySelector("#filterVote");
const filterLiderStatus = document.querySelector("#filterLiderStatus");
const neighborhoodDropdownButton = document.querySelector("#neighborhoodDropdownButton");
const neighborhoodDropdown = document.querySelector("#neighborhoodDropdown");
const neighborhoodFilterDropdown = document.querySelector(".filter-dropdown");
let neighborhoodFilters = document.querySelectorAll("[data-neighborhood-filter]");
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
const liderPanel = document.querySelector("#liderPanel");
const liderStatsPanel = document.querySelector("#liderStatsPanel");
const liderMayorSurveyGeneral = document.querySelector("#liderMayorSurveyGeneral");
const liderMayorSurveyChart = document.querySelector("#liderMayorSurveyChart");
const liderMayorExitPollGeneral = document.querySelector("#liderMayorExitPollGeneral");
const liderMayorExitPollChart = document.querySelector("#liderMayorExitPollChart");
const liderGeneral = document.querySelector("#liderGeneral");
const liderChart = document.querySelector("#liderChart");
const liderExitPollGeneral = document.querySelector("#liderExitPollGeneral");
const liderExitPollChart = document.querySelector("#liderExitPollChart");
const liderBody = document.querySelector("#liderBody");
const liderEmpty = document.querySelector("#liderEmpty");
const printLiderVotesPdfButtons = document.querySelectorAll("[data-lider-votes-pdf]");
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
  blockNumber: document.querySelector("#bulkBlockNumber"),
};
const systemModal = document.querySelector("#systemModal");
const systemModalTitle = document.querySelector("#systemModalTitle");
const systemModalMessage = document.querySelector("#systemModalMessage");
const systemModalOk = document.querySelector("#systemModalOk");
const systemModalCancel = document.querySelector("#systemModalCancel");

let records = repairLoadedRecords(loadRecords());
let users = loadUsers();
let auditLog = loadAuditLog();
let currentUser = loadSession();
let authToken = "";
let selectedRecords = new Set();
let currentView = "operations";
let bulkEditorOpen = false;
let selectedSummary = "";
let selectedNeighborhoodSummary = "";
const pendingVoteUpdates = new Map();
let isSyncingRemoteData = false;
let lastRemoteRecordsVersion = "";
let lastRecordsJson = localStorage.getItem(STORAGE_KEY) || "";
let lastUsersJson = localStorage.getItem(USERS_KEY) || "";
let lastAuditJson = localStorage.getItem(AUDIT_KEY) || "";
let systemModalResolve = null;
let systemModalConfirmMode = false;
let systemModalPreviousFocus = null;

function closeSystemModal(result) {
  systemModal.hidden = true;
  if (systemModalPreviousFocus?.focus) systemModalPreviousFocus.focus();
  if (systemModalResolve) systemModalResolve(result);
  systemModalResolve = null;
}

function openSystemModal({ title = "Aviso del sistema", message, confirmMode = false }) {
  systemModalConfirmMode = confirmMode;
  systemModalPreviousFocus = document.activeElement;
  systemModalTitle.textContent = title;
  systemModalMessage.textContent = message;
  systemModalCancel.hidden = !confirmMode;
  systemModalOk.textContent = confirmMode ? "Aceptar" : "Entendido";
  systemModal.hidden = false;
  systemModalOk.focus();

  return new Promise((resolve) => {
    systemModalResolve = resolve;
  });
}

function showSystemAlert(message, title = "Aviso del sistema") {
  return openSystemModal({ title, message: String(message || ""), confirmMode: false });
}

function showSystemConfirm(message, title = "Confirmar accion") {
  return openSystemModal({ title, message: String(message || ""), confirmMode: true });
}

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

async function loadRemoteData({ includeAdminData = false } = {}) {
  const remoteRecords = await apiRequest("/api/records");
  records = repairLoadedRecords(remoteRecords);

  if (isAdmin() && includeAdminData) {
    const [remoteUsers, remoteAuditLog] = await Promise.all([
      apiRequest("/api/users"),
      apiRequest("/api/audit"),
    ]);
    users = remoteUsers;
    auditLog = remoteAuditLog;
  } else if (!isAdmin()) {
    users = [currentUser];
    auditLog = [];
  }

  await refreshRemoteRecordsVersion();
  applyPendingVoteUpdates();
  renderNeighborhoodFilterOptions();
  renderWatcherPollingPlaceOptions();
}

async function refreshRemoteRecordsVersion({ save = true } = {}) {
  const version = await apiRequest("/api/records/version");
  const recordsVersion = `${version.count || 0}:${version.updatedAt || ""}`;
  if (save) lastRemoteRecordsVersion = recordsVersion;
  return recordsVersion;
}

async function loadAdminViewData() {
  if (!isAdmin()) return false;
  if (currentView === "users") {
    users = await apiRequest("/api/users");
    renderUsersList();
    return true;
  }
  if (currentView === "report") {
    auditLog = await apiRequest("/api/audit");
    renderReport();
    return true;
  }
  return false;
}

function applyPendingVoteUpdates() {
  if (!pendingVoteUpdates.size) return;
  records = records.map((record) => pendingVoteUpdates.has(record.id)
    ? { ...record, voted: pendingVoteUpdates.get(record.id) }
    : record);
}

async function migrateLocalRecordsIfNeeded(localRecords) {
  if (!isAdmin() || records.length || !localRecords.length) return;
  const shouldMigrate = await showSystemConfirm(`La base de datos esta vacia y hay ${localRecords.length} registros guardados en este navegador. Desea subirlos a Supabase ahora?`);
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
    if (isSyncingRemoteData) return;
    isSyncingRemoteData = true;
    try {
      let shouldRender = false;
      const remoteVersion = await refreshRemoteRecordsVersion({ save: false });
      if (remoteVersion !== lastRemoteRecordsVersion || pendingVoteUpdates.size) {
        await loadRemoteData({ includeAdminData: false });
        shouldRender = true;
      }
      if (isAdmin() && (currentView === "users" || currentView === "report")) {
        shouldRender = await loadAdminViewData() || shouldRender;
      }
      if (!canAccessView(currentView)) {
        currentView = defaultViewForUser();
        shouldRender = true;
      }
      if (shouldRender) renderTable();
      if (currentView === "report") renderReport();
    } catch {
      // Keep the current screen usable if the network is momentarily unavailable.
    } finally {
      isSyncingRemoteData = false;
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
    renderNeighborhoodFilterOptions();
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
  if (!canAccessView(currentView)) currentView = defaultViewForUser();
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

function publicUpdatedBy(username) {
  return normalizeKey(username) === "liderconcejal" ? "" : username || "";
}

function pcSectorLabel(record) {
  if (record.benefitType === "devolucion") return " Devolucion de Pasaje.";
  if (record.benefitType === "movil") return " Movil.";
  return "";
}

function pcLockedMessage(record) {
  return `Esta cedula ya pasó por PC. Barrio/compañia: ${record.neighborhood || "Sin dato"}.${pcSectorLabel(record)} Usuario: ${record.pcMarkedBy || "Sin dato"}`;
}

function lockedSelectedPcRecord() {
  if (isAdmin()) return null;
  return records.find((record) => selectedRecords.has(record.id) && record.passedPc) || null;
}

function loadedRecordMessage(record) {
  return `Esta cedula ya fue cargada previamente. Zona: ${record.neighborhood || "Sin dato"}. Usuario: ${publicUpdatedBy(record.updatedBy) || "Sin dato"}`;
}

function hasOperationalLoad(record) {
  return Boolean(
    record?.benefitType
    || record?.status
    || Number(record?.amount || 0) > 0
    || record?.city
    || record?.neighborhood
    || record?.mobileType
    || record?.blockNumber
  );
}

function lockedSelectedLoadedRecord() {
  if (isAdmin()) return null;
  return records.find((record) => selectedRecords.has(record.id) && hasOperationalLoad(record)) || null;
}

function hasBulkNonPcChanges() {
  return Boolean(
    bulkFields.benefitType.value
    || bulkFields.status.value
    || normalize(bulkFields.amount.value) !== ""
    || normalize(bulkFields.city.value) !== ""
    || bulkFields.neighborhood.value
    || bulkFields.mobileType.value
    || normalize(bulkFields.blockNumber.value) !== ""
  );
}

function updateBulkEditorForSelection() {
  const loadedRecord = lockedSelectedLoadedRecord();
  const pcOnlyMode = Boolean(loadedRecord && !loadedRecord.passedPc);
  Object.entries(bulkFields).forEach(([field, control]) => {
    control.closest("label").hidden = pcOnlyMode && field !== "passedPc";
  });
  document.querySelector("#clearBulkFields").hidden = pcOnlyMode;
  const noPcOption = bulkFields.passedPc.querySelector('option[value="no"]');
  if (noPcOption) noPcOption.hidden = pcOnlyMode;
  if (!pcOnlyMode) return false;
  editModeHint.textContent = `${loadedRecordMessage(loadedRecord)} Puedes visualizarlos, pero no editarlos.`;
  return true;
}

function isWatcher(user = currentUser) {
  return normalizeKey(user?.functionName).includes("veedor");
}

function isConcejaliaLider(user = currentUser) {
  const functionKey = normalizeKey(user?.functionName);
  return functionKey.includes("concejalia") && functionKey.includes("lider");
}

function defaultViewForUser(user = currentUser) {
  return allowedViewsForUser(user)[0] || "operations";
}

function watcherDescription(pollingPlace, tableNumber) {
  return `Local: ${normalize(pollingPlace)} | Mesa: ${normalize(tableNumber)}`;
}

function localCompareNumeric(a, b) {
  return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
}

function watcherPollingPlaces() {
  const byKey = new Map();
  records.forEach((record) => {
    const pollingPlace = normalize(record.pollingPlace);
    if (!pollingPlace) return;
    const key = normalizeKey(pollingPlace);
    if (!byKey.has(key)) byKey.set(key, pollingPlace);
  });
  return Array.from(byKey.values()).sort(localCompareNumeric);
}

function watcherTablesForPollingPlace(pollingPlace) {
  const pollingPlaceKey = normalizeKey(pollingPlace);
  const byKey = new Map();
  records.forEach((record) => {
    if (normalizeKey(record.pollingPlace) !== pollingPlaceKey) return;
    const tableNumber = normalize(record.tableNumber);
    if (!tableNumber) return;
    const key = normalizeKey(tableNumber).replace(/^mesa\s*/, "");
    if (!byKey.has(key)) byKey.set(key, tableNumber);
  });
  return Array.from(byKey.values()).sort(localCompareNumeric);
}

function renderWatcherTableOptions() {
  const selectedTable = newWatcherTableNumber.value;
  const options = watcherTablesForPollingPlace(newWatcherPollingPlace.value);
  newWatcherTableNumber.innerHTML = `
    <option value="">Seleccione mesa</option>
    ${options.map((tableNumber) => `<option value="${escapeHtml(tableNumber)}">${escapeHtml(tableNumber)}</option>`).join("")}
  `;
  if (options.includes(selectedTable)) newWatcherTableNumber.value = selectedTable;
  newWatcherTableNumber.disabled = !newWatcherPollingPlace.value || !options.length;
}

function renderWatcherPollingPlaceOptions() {
  const selectedPollingPlace = newWatcherPollingPlace.value;
  const options = watcherPollingPlaces();
  newWatcherPollingPlace.innerHTML = `
    <option value="">Seleccione local</option>
    ${options.map((pollingPlace) => `<option value="${escapeHtml(pollingPlace)}">${escapeHtml(pollingPlace)}</option>`).join("")}
  `;
  if (options.includes(selectedPollingPlace)) newWatcherPollingPlace.value = selectedPollingPlace;
  renderWatcherTableOptions();
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
    const repairedRecord = {
      ...record,
      voted: Boolean(record.voted),
      blockNumber: normalize(record.blockNumber),
      statusLider: statusValue(record.statusLider),
    };
    if (firstNames !== normalize(record.firstNames) || lastNames !== normalize(record.lastNames) || fullName !== normalize(record.fullName)) {
      changed = true;
      return { ...repairedRecord, firstNames, lastNames, fullName };
    }
    return repairedRecord;
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
  showSystemAlert(changedCount ? `Se corrigieron ${changedCount} registros.` : "No se encontraron nombres para corregir.");
}

function money(value) {
  if (normalize(value) === "") return "-";
  return `${Number(value || 0).toLocaleString("es-PY")} Gs`;
}

function effectiveAmount(record) {
  return record.benefitType === "pago" ? 100000 : Number(record.amount || 0);
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
  if (isWatcher(user)) return ["operations"];
  if (isConcejaliaLider(user)) return ["lider", "liderStats"];

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
  if (view === "operations" && isWatcher()) return "Control de voto";
  return {
    operations: "Sistema de Gestion",
    summary: "Resumen",
    mobile: "Moviles",
    refund: "Devolucion de Pasaje",
    survey: "Encuesta",
    exitPoll: "Boca de urna",
    lider: "Anexo Lider",
    liderStats: "Encuestas Lider",
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
  const terms = normalizeKey(search.value).split(/\s+/).filter(Boolean);
  const selectedNeighborhoods = getSelectedNeighborhoods();
  return records.filter((record) => {
    const viewType = currentView === "mobile" ? "movil" : currentView === "refund" ? "devolucion" : "";
    const matchesType = viewType ? record.benefitType === viewType : (!filterType.value || record.benefitType === filterType.value);
    const matchesPc = !filterPc.value || (filterPc.value === "si" ? record.passedPc : !record.passedPc);
    const matchesVote = !filterVote.value || (filterVote.value === "si" ? record.voted : !record.voted);
    const liderStatus = statusValue(record.statusLider);
    const matchesLiderStatus = currentView !== "lider" || !filterLiderStatus.value || (filterLiderStatus.value === "sin-marcar" ? !liderStatus : liderStatus === filterLiderStatus.value);
    const matchesNeighborhood = !selectedNeighborhoods.length || selectedNeighborhoods.includes(normalize(record.neighborhood).toUpperCase());
    const text = [record.firstNames, fixNameText(record.firstNames), record.lastNames, fixNameText(record.lastNames), record.fullName, fixNameText(record.fullName), record.birthDate, record.sex, record.documentNumber, record.pollingPlace, record.tableNumber, record.orderNumber, record.city, record.neighborhood, record.mobileType, record.status, record.statusLider, record.blockNumber, record.voted ? "voto" : "no voto"]
      .join(" ")
      .replace(/ñ/g, "n");
    const normalizedText = normalizeKey(text);
    const matchesSearch = terms.every((term) => normalizedText.includes(term));
    return matchesType && matchesPc && matchesVote && matchesLiderStatus && matchesNeighborhood && matchesSearch;
  });
}

function getSelectedNeighborhoods() {
  return Array.from(neighborhoodFilters)
    .filter((item) => item.checked)
    .map((item) => item.value);
}

function renderNeighborhoodFilterOptions() {
  const selected = new Set(getSelectedNeighborhoods());
  const byKey = new Map();
  DEFAULT_NEIGHBORHOODS.forEach((neighborhood) => {
    byKey.set(normalizeKey(neighborhood), neighborhood);
  });
  records.forEach((record) => {
    const neighborhood = normalize(record.neighborhood).toUpperCase();
    if (!neighborhood) return;
    const key = normalizeKey(neighborhood);
    if (!byKey.has(key)) byKey.set(key, neighborhood);
  });

  neighborhoodDropdown.innerHTML = Array.from(byKey.values())
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((neighborhood) => `
      <label class="check-row"><input type="checkbox" value="${escapeHtml(neighborhood)}" ${selected.has(neighborhood) ? "checked" : ""} data-neighborhood-filter> ${escapeHtml(neighborhood)}</label>
    `).join("");
  neighborhoodFilters = document.querySelectorAll("[data-neighborhood-filter]");
  updateNeighborhoodDropdownLabel();
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
  if (currentView !== "summary") return;
  document.querySelector("#totalVoters").textContent = records.length;
  document.querySelector("#pcCount").textContent = records.filter((record) => record.passedPc).length;
  document.querySelector("#budgetedAmount").textContent = money(records.reduce((sum, record) => {
    return sum + effectiveAmount(record);
  }, 0));
  document.querySelector("#paidAmount").textContent = money(records.reduce((sum, record) => {
    return record.passedPc ? sum + effectiveAmount(record) : sum;
  }, 0));
  document.querySelector("#mobileCount").textContent = records.filter((record) => record.benefitType === "movil").length;
  document.querySelector("#refundCount").textContent = records.filter((record) => record.benefitType === "devolucion").length;
  document.querySelector("#paymentCount").textContent = records.filter((record) => record.benefitType === "pago").length;
  renderSummaryDetail();
  renderNeighborhoodSummary();
}

function getSummaryRecords(type) {
  return {
    all: records,
    pc: records.filter((record) => record.passedPc),
    budgeted: records.filter((record) => effectiveAmount(record) > 0),
    paid: records.filter((record) => record.passedPc && effectiveAmount(record) > 0),
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
      <td>${money(effectiveAmount(record))}</td>
      <td>${escapeHtml(record.neighborhood)}</td>
      <td>${escapeHtml(record.blockNumber)}</td>
      <td><span class="pill ${record.passedPc ? "pc-yes" : "pc-no"}">${record.passedPc ? "Si" : "No"}</span></td>
    </tr>
  `).join("");
  summaryDetailEmpty.hidden = detailRecords.length > 0;
  summaryCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.summary === selectedSummary);
  });
}

function getNeighborhoodGroups() {
  const groups = new Map();
  records.forEach((record) => {
    const neighborhood = normalize(record.neighborhood) || "Sin barrio/compañia";
    if (!groups.has(neighborhood)) groups.set(neighborhood, []);
    groups.get(neighborhood).push(record);
  });

  return Array.from(groups.entries())
    .map(([neighborhood, items]) => ({ neighborhood, count: items.length, items }))
    .sort((a, b) => a.neighborhood.localeCompare(b.neighborhood, "es"));
}

function getSelectedNeighborhoodRecords() {
  if (!selectedNeighborhoodSummary) return [];
  return records
    .filter((record) => (normalize(record.neighborhood) || "Sin barrio/compañia") === selectedNeighborhoodSummary)
    .sort((a, b) => {
      const blockA = Number(normalize(a.blockNumber) || Number.MAX_SAFE_INTEGER);
      const blockB = Number(normalize(b.blockNumber) || Number.MAX_SAFE_INTEGER);
      if (blockA !== blockB) return blockA - blockB;
      return fixNameText(a.lastNames).localeCompare(fixNameText(b.lastNames), "es") || fixNameText(a.firstNames || a.fullName || "").localeCompare(fixNameText(b.firstNames || b.fullName || ""), "es");
    });
}

function renderNeighborhoodSummary() {
  if (!neighborhoodSummaryList) return;

  const groups = getNeighborhoodGroups();
  neighborhoodSummaryList.innerHTML = groups.map((group) => `
    <button class="neighborhood-summary-card ${group.neighborhood === selectedNeighborhoodSummary ? "active" : ""}" type="button" data-neighborhood-summary="${escapeHtml(group.neighborhood)}">
      <span>${escapeHtml(group.neighborhood)}</span>
      <strong>${group.count}</strong>
    </button>
  `).join("");
  neighborhoodSummaryEmpty.hidden = groups.length > 0;
  renderNeighborhoodDetail();
}

function renderNeighborhoodDetail() {
  if (!neighborhoodDetail) return;
  if (!selectedNeighborhoodSummary) {
    neighborhoodDetail.hidden = true;
    return;
  }

  const detailRecords = getSelectedNeighborhoodRecords();
  neighborhoodDetail.hidden = false;
  neighborhoodDetailTitle.textContent = `${selectedNeighborhoodSummary} (${detailRecords.length})`;
  neighborhoodDetailBody.innerHTML = detailRecords.map((record) => `
    <tr>
      <td>${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
      <td>${escapeHtml(fixNameText(record.lastNames))}</td>
      <td>${escapeHtml(record.documentNumber)}</td>
      <td>${escapeHtml(record.pollingPlace)}</td>
      <td>${escapeHtml(record.tableNumber)}</td>
      <td>${escapeHtml(record.orderNumber)}</td>
      <td><span class="pill status-${statusValue(record.status)}">${statusLabel(record.status)}</span></td>
      <td>${escapeHtml(benefitLabel(record.benefitType) || "-")}</td>
      <td><span class="pill ${record.voted ? "pc-yes" : "pc-no"}">${record.voted ? "VOTO" : "NO VOTO"}</span></td>
    </tr>
  `).join("");
  neighborhoodDetailEmpty.hidden = detailRecords.length > 0;
}

function generateNeighborhoodPdf() {
  const detailRecords = getSelectedNeighborhoodRecords();
  if (!selectedNeighborhoodSummary) {
    showSystemAlert("Seleccione un barrio/compañia primero.");
    return;
  }

  const generatedAt = new Date().toLocaleString("es-PY");
  const rows = detailRecords.map((record) => `
    <tr>
      <td>${escapeHtml(fixNameText(record.lastNames))}</td>
      <td>${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
      <td>${escapeHtml(record.documentNumber)}</td>
      <td>${escapeHtml(record.pollingPlace)}</td>
      <td>${escapeHtml(record.tableNumber)}</td>
      <td>${escapeHtml(record.orderNumber)}</td>
      <td>${escapeHtml(record.blockNumber)}</td>
      <td>${escapeHtml(statusLabel(record.status))}</td>
      <td>${escapeHtml(benefitLabel(record.benefitType) || "-")}</td>
      <td>${escapeHtml(getDetail(record))}</td>
    </tr>
  `).join("");
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showSystemAlert("El navegador bloqueo la ventana del reporte. Permita ventanas emergentes para generar el PDF.");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Reporte ${escapeHtml(selectedNeighborhoodSummary)}</title>
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
        <h1>Reporte por barrio/compañia: ${escapeHtml(selectedNeighborhoodSummary)}</h1>
        <p>Generado: ${escapeHtml(generatedAt)} | Total: ${detailRecords.length}</p>
        <table>
          <thead>
            <tr>
              <th>Apellidos</th>
              <th>Nombres</th>
              <th>Cedula</th>
              <th>Local</th>
              <th>Mesa</th>
              <th>Orden</th>
              <th>Manzana</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="10">No hay registros para este barrio/compañia.</td></tr>`}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  registerAction("Genero reporte PDF", `Barrio/compañia ${selectedNeighborhoodSummary}: ${detailRecords.length} registros`);
  printWindow.print();
}

function generateBenefitPdf(type, title) {
  const reportRecords = records.filter((record) => record.benefitType === type);
  const generatedAt = new Date().toLocaleString("es-PY");
  const rows = reportRecords.map((record) => `
    <tr>
      <td>${escapeHtml(fixNameText(record.lastNames))}</td>
      <td>${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
      <td>${escapeHtml(record.documentNumber)}</td>
      <td>${escapeHtml(record.pollingPlace)}</td>
      <td>${escapeHtml(record.tableNumber)}</td>
      <td>${escapeHtml(record.orderNumber)}</td>
      <td>${escapeHtml(record.neighborhood)}</td>
      <td>${escapeHtml(record.blockNumber)}</td>
      <td>${escapeHtml(statusLabel(record.status))}</td>
      <td>${escapeHtml(benefitLabel(record.benefitType) || "-")}</td>
      <td>${escapeHtml(getDetail(record))}</td>
      <td>${money(effectiveAmount(record))}</td>
    </tr>
  `).join("");
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showSystemAlert("El navegador bloqueo la ventana del reporte. Permita ventanas emergentes para generar el PDF.");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Reporte ${escapeHtml(title)}</title>
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
        <h1>Reporte ${escapeHtml(title)}</h1>
        <p>Generado: ${escapeHtml(generatedAt)} | Total: ${reportRecords.length}</p>
        <table>
          <thead>
            <tr>
              <th>Apellidos</th>
              <th>Nombres</th>
              <th>Cedula</th>
              <th>Local</th>
              <th>Mesa</th>
              <th>Orden</th>
              <th>Barrio/compañia</th>
              <th>Manzana</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Detalle</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="12">No hay registros para este reporte.</td></tr>`}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  registerAction("Genero reporte PDF", `${title}: ${reportRecords.length} registros`);
  printWindow.print();
}

function renderAuth() {
  loginScreen.hidden = Boolean(currentUser);
  appScreen.hidden = !currentUser;
  renderActiveUser();
  if (!currentUser) return;

  if (!canAccessView(currentView)) currentView = defaultViewForUser();

  viewButtons.forEach((button) => { button.hidden = !canAccessView(button.dataset.viewButton); });
  renderUsersList();
  renderTable();
}

async function switchView(view) {
  if (!canAccessView(view)) return;
  const previousView = currentView;
  currentView = view;
  bulkEditorOpen = false;
  if (currentView === "mobile" || currentView === "refund" || currentView === "lider") {
    filterType.value = "";
    filterPc.value = "";
  }
  if (currentView !== "lider") filterLiderStatus.value = "";
  if (currentView === "operations" && selectedSummary === "payment") {
    filterType.value = "pago";
    filterPc.value = "";
  }
  if (currentView !== "summary") selectedSummary = "";
  selectedRecords.clear();
  if (previousView !== currentView) registerAction("Cambio de vista", viewLabel(currentView));
  renderTable();
  await loadAdminViewData();
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
  await loadRemoteData({ includeAdminData: false });
  await migrateLocalRecordsIfNeeded(localRecords);
  currentView = defaultViewForUser(data.user);
  return true;
}

function setLoginLoading(isLoading) {
  loginSubmit.disabled = isLoading;
  loginUsername.disabled = isLoading;
  loginPassword.disabled = isLoading;
  loginSubmit.textContent = isLoading ? "Ingresando..." : "Entrar";
  loginLoading.hidden = !isLoading;
}

async function createOperator(firstName, lastName, username, password, functionName, functionDescription) {
  const cleanFirstName = normalize(firstName);
  const cleanLastName = normalize(lastName);
  const cleanUsername = normalize(username);
  const cleanFunctionName = normalize(functionName);
  let cleanFunctionDescription = normalize(functionDescription);
  if (normalizeKey(cleanFunctionName).includes("veedor")) {
    const pollingPlace = normalize(newWatcherPollingPlace.value);
    const tableNumber = normalize(newWatcherTableNumber.value);
    if (!pollingPlace || !tableNumber) return "Complete el local de votacion y la mesa del veedor.";
    cleanFunctionDescription = watcherDescription(pollingPlace, tableNumber);
  }
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
  if (currentView === "lider") {
    renderLiderAnexo();
    renderStats();
    return;
  }
  if (currentView === "liderStats") {
    renderLiderStats();
    renderStats();
    return;
  }
  recordsBody.innerHTML = "";
  const visibleRecords = filtered.slice(0, MAX_RENDERED_ROWS);
  const hasMoreRecords = filtered.length > MAX_RENDERED_ROWS;
  emptyState.textContent = hasMoreRecords
    ? `Mostrando ${MAX_RENDERED_ROWS} de ${filtered.length} registros. Use la busqueda o filtros para acotar la lista.`
    : "Todavia no hay registros cargados.";
  emptyState.hidden = filtered.length > 0 && !hasMoreRecords;

  const fragment = document.createDocumentFragment();
  visibleRecords.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = currentView === "mobile" ? mobileRow(record) : currentView === "refund" ? refundRow(record) : operationsRow(record);
    fragment.appendChild(row);
  });
  recordsBody.appendChild(fragment);

  renderStats();
}

function renderViewChrome() {
  const exitPoll = currentView === "exitPoll";
  const survey = currentView === "survey";
  const liderView = currentView === "lider";
  const liderStatsView = currentView === "liderStats";
  const usersView = currentView === "users";
  const reportView = currentView === "report";
  const summaryView = currentView === "summary";
  tableTitle.textContent = isWatcher() ? "Control de voto" : ({
    operations: "Sistema de Gestion",
    summary: "Resumen",
    mobile: "Moviles",
    refund: "Devolucion de Pasaje",
    lider: "Anexo Lider",
    liderStats: "Encuestas Lider",
    report: "Reporte",
  }[currentView] || "Sistema de Gestion");
  toolsPanel.hidden = exitPoll || survey || liderStatsView || usersView || reportView || summaryView;
  search.placeholder = liderView ? "Buscar por nombre, apellido, cedula o barrio..." : "Nombres, apellidos, cedula, local, ciudad...";
  tablePanel.hidden = exitPoll || survey || liderView || liderStatsView || usersView || reportView || summaryView;
  printMobilePdf.hidden = currentView !== "mobile";
  printRefundPdf.hidden = currentView !== "refund";
  printPaymentPdf.hidden = currentView !== "operations" || isWatcher();
  neighborhoodFilterDropdown.hidden = isWatcher();
  exitPollPanel.hidden = !exitPoll;
  surveyPanel.hidden = !survey;
  liderPanel.hidden = !liderView;
  liderStatsPanel.hidden = !liderStatsView;
  reportPanel.hidden = !reportView;
  summaryPanel.hidden = !summaryView;
  adminPanel.hidden = !usersView || !isAdmin();
  tablePanel.classList.toggle("operations", !exitPoll && !survey && !liderView && !liderStatsView);
  bulkTools.hidden = exitPoll || survey || liderView || liderStatsView || usersView || reportView || summaryView || isWatcher() || !bulkEditorOpen;
  const selected = records.filter((record) => selectedRecords.has(record.id));
  editModeHint.textContent = selected.length === 1
    ? `Editando: ${fixNameText(selected[0].lastNames)} ${fixNameText(selected[0].firstNames)} - CI ${selected[0].documentNumber}`
    : `Editando ${selected.length} registros seleccionados`;
  updateBulkEditorForSelection();
  viewSections.forEach((section) => {
    section.hidden = section.dataset.view !== currentView;
  });
  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.viewButton === currentView);
  });
  viewOnlyControls.forEach((control) => {
    control.hidden = control.dataset.viewOnly !== currentView || isWatcher();
  });
  tableHead.innerHTML = isWatcher() ? `
    <tr>
      <th>Cedula</th>
      <th>Nombre completo</th>
      <th>Fecha de nacimiento</th>
      <th>Lugar de votacion</th>
      <th>Mesa</th>
      <th>Orden</th>
      <th>Voto</th>
    </tr>
  ` : currentView === "mobile" ? `
    <tr>
      <th class="name-col">Nombres</th>
      <th class="name-col">Apellidos</th>
      <th class="document-col">Cedula</th>
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
      <th>Votacion</th>
      <th>Tipo</th>
      <th>Detalle</th>
      <th>Barrio/compania</th>
      <th>Manzana</th>
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
  const votedRecords = records.filter((record) => record.voted && statusValue(record.status));
  const { general, neighborhoods } = getStatusSummary(votedRecords);

  exitPollGeneral.innerHTML = `
    ${exitPollCard("Total votos", general.total)}
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
  exitPollEmpty.hidden = votedRecords.length > 0;
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

function getLiderRecords() {
  return records
    .filter((record) => statusValue(record.statusLider))
    .sort((a, b) => statusValue(a.statusLider).localeCompare(statusValue(b.statusLider), "es") || fixNameText(a.lastNames).localeCompare(fixNameText(b.lastNames), "es"));
}

function renderLiderAnexo() {
  const filtered = getFilteredRecords();
  const visibleRecords = filtered;
  liderBody.innerHTML = visibleRecords.map((record) => `
    <tr>
      <td>${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
      <td>${escapeHtml(fixNameText(record.lastNames))}</td>
      <td>${escapeHtml(record.documentNumber)}</td>
      <td class="vote-place">
        <strong>${escapeHtml(record.pollingPlace)}</strong>
        <span>Mesa ${escapeHtml(record.tableNumber || "-")} · Orden ${escapeHtml(record.orderNumber || "-")}</span>
      </td>
      <td>${escapeHtml(record.neighborhood)}</td>
      <td><span class="pill status-${statusValue(record.status)}">${statusLabel(record.status)}</span></td>
      <td>
        <select class="status-lider-select" data-lider-status-id="${escapeHtml(record.id)}">
          <option value="">Sin marcar</option>
          <option value="positivo" ${statusValue(record.statusLider) === "positivo" ? "selected" : ""}>POSITIVO</option>
          <option value="negativo" ${statusValue(record.statusLider) === "negativo" ? "selected" : ""}>NEGATIVO</option>
          <option value="dudoso" ${statusValue(record.statusLider) === "dudoso" ? "selected" : ""}>DUDOSO</option>
        </select>
      </td>
      <td><span class="pill ${record.voted ? "pc-yes" : "pc-no"}">${record.voted ? "VOTO" : "NO VOTO"}</span></td>
    </tr>
  `).join("");
  liderEmpty.textContent = "Todavia no hay registros para mostrar.";
  liderEmpty.hidden = filtered.length > 0;
}

function generateLiderVotesPdf() {
  const reportRecords = getLiderRecords()
    .filter((record) => ["positivo", "dudoso"].includes(statusValue(record.statusLider)));
  const positiveCount = reportRecords.filter((record) => statusValue(record.statusLider) === "positivo").length;
  const doubtfulCount = reportRecords.filter((record) => statusValue(record.statusLider) === "dudoso").length;
  const generatedAt = new Date().toLocaleString("es-PY");
  const rows = reportRecords.map((record) => `
    <tr>
      <td>${escapeHtml(statusLabel(record.statusLider))}</td>
      <td>${escapeHtml(fixNameText(record.lastNames))}</td>
      <td>${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
      <td>${escapeHtml(record.documentNumber)}</td>
      <td>${escapeHtml(record.pollingPlace)}</td>
      <td>${escapeHtml(record.tableNumber)}</td>
      <td>${escapeHtml(record.orderNumber)}</td>
      <td>${escapeHtml(record.neighborhood)}</td>
    </tr>
  `).join("");
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showSystemAlert("El navegador bloqueo la ventana del reporte. Permita ventanas emergentes para generar el PDF.");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Reporte votos Lider</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
          h1 { margin: 0 0 6px; font-size: 22px; }
          p { margin: 0 0 14px; color: #555; }
          .summary { display: flex; gap: 10px; margin: 0 0 16px; }
          .summary span { border: 1px solid #ddd; border-radius: 10px; padding: 8px 10px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; vertical-align: top; }
          th { background: #f1f1f1; text-transform: uppercase; font-size: 10px; }
        </style>
      </head>
      <body>
        <h1>Reporte Lider POSITIVOS y DUDOSOS</h1>
        <p>Generado: ${escapeHtml(generatedAt)} | Total: ${reportRecords.length}</p>
        <div class="summary">
          <span>POSITIVOS: ${positiveCount}</span>
          <span>DUDOSOS: ${doubtfulCount}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Estado Lider</th>
              <th>Apellidos</th>
              <th>Nombres</th>
              <th>Cedula</th>
              <th>Local</th>
              <th>Mesa</th>
              <th>Orden</th>
              <th>Barrio/compania</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="8">No hay registros POSITIVOS o DUDOSOS para Lider.</td></tr>`}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  registerAction("Genero reporte PDF", `Lider positivos/dudosos: ${reportRecords.length}`);
  printWindow.print();
}

function renderStatusCards(container, counts, totalLabel) {
  container.innerHTML = `
    ${exitPollCard(totalLabel, counts.total)}
    ${exitPollCard("POSITIVO", `${counts.positivo} (${percentLabel(counts.positivo, counts.total)})`, "status-positivo")}
    ${exitPollCard("DUDOSO", `${counts.dudoso} (${percentLabel(counts.dudoso, counts.total)})`, "status-dudoso")}
    ${exitPollCard("NEGATIVO", `${counts.negativo} (${percentLabel(counts.negativo, counts.total)})`, "status-negativo")}
  `;
}

function renderLiderStats() {
  const mayorSurvey = getStatusSummary(records.filter((record) => statusValue(record.status))).general;
  const mayorExitPoll = getStatusSummary(records.filter((record) => record.voted && statusValue(record.status))).general;
  const liderSurveyRecords = getLiderRecords().map((record) => ({ ...record, status: record.statusLider }));
  const liderSurvey = getStatusSummary(liderSurveyRecords).general;
  const liderExitPoll = getStatusSummary(liderSurveyRecords.filter((record) => record.voted)).general;

  renderStatusCards(liderMayorSurveyGeneral, mayorSurvey, "Total encuesta");
  renderStatusChart(liderMayorSurveyChart, mayorSurvey, "Grafico de encuesta Intendente");
  renderStatusCards(liderMayorExitPollGeneral, mayorExitPoll, "Total boca de urna");
  renderStatusChart(liderMayorExitPollChart, mayorExitPoll, "Grafico de boca de urna Intendente");
  renderStatusCards(liderGeneral, liderSurvey, "Total encuesta");
  renderStatusChart(liderChart, liderSurvey, "Grafico de encuesta Lider");
  renderStatusCards(liderExitPollGeneral, liderExitPoll, "Total boca de urna");
  renderStatusChart(liderExitPollChart, liderExitPoll, "Grafico de boca de urna Lider");
}

async function setLiderStatus(recordId, statusLider) {
  const previousRecords = records;
  const select = Array.from(liderBody.querySelectorAll("[data-lider-status-id]")).find((item) => item.dataset.liderStatusId === recordId);
  if (select) select.disabled = true;
  records = records.map((record) => record.id === recordId ? { ...record, statusLider: statusValue(statusLider) } : record);
  saveRecords();

  try {
    await apiRequest("/api/records/bulk", {
      method: "POST",
      body: JSON.stringify({ records: records.filter((record) => record.id === recordId) }),
    });
    await loadRemoteData();
    renderTable();
  } catch (error) {
    records = previousRecords;
    saveRecords();
    renderTable();
    showSystemAlert(error.message.includes("status_lider")
      ? "No se pudo guardar Estado Lider. Falta aplicar la migracion status_lider en Supabase."
      : error.message);
  } finally {
    if (select) select.disabled = false;
  }
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
      <td>${escapeHtml(record.blockNumber)}</td>
      <td>${escapeHtml(statusLabel(record.status))}</td>
      <td>${escapeHtml(benefitLabel(record.benefitType))}</td>
      <td>${money(effectiveAmount(record))}</td>
      <td>${escapeHtml(record.pcMarkedBy || "Sin dato")}</td>
    </tr>
  `).join("");
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showSystemAlert("El navegador bloqueo la ventana del reporte. Permita ventanas emergentes para generar el PDF.");
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
              <th>Manzana</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Marcado por</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="12">No hay registros marcados como Paso por PC.</td></tr>`}</tbody>
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
  if (isWatcher()) return watcherRow(record);

  return `
    <td class="name-cell">${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
    <td class="name-cell">${escapeHtml(fixNameText(record.lastNames))}</td>
    <td class="document-cell">${escapeHtml(record.documentNumber)}</td>
    <td class="vote-place">
      <strong>${escapeHtml(record.pollingPlace)}</strong>
      <span>Mesa ${escapeHtml(record.tableNumber || "-")} · Orden ${escapeHtml(record.orderNumber || "-")}</span>
    </td>
    <td><span class="pill">${benefitLabel(record.benefitType)}</span></td>
    <td>${escapeHtml(getDetail(record))}</td>
    <td>${escapeHtml(record.neighborhood)}</td>
    <td>${escapeHtml(record.blockNumber)}</td>
    <td><span class="pill status-${statusValue(record.status)}">${statusLabel(record.status)}</span></td>
    <td>${money(effectiveAmount(record))}</td>
    <td><span class="pill ${record.passedPc ? "pc-yes" : "pc-no"}">${record.passedPc ? "Si" : "No"}</span></td>
    <td class="actions">
      <button class="row-button vote-toggle ${record.voted ? "voted" : "not-voted"}" data-action="toggle-voted" data-id="${record.id}" type="button">${record.voted ? "VOTO" : "NO VOTO"}</button>
      <button class="row-button" data-action="edit" data-id="${record.id}" type="button">Editar</button>
    </td>
  `;
}

function watcherRow(record) {
  const fullName = [fixNameText(record.lastNames), fixNameText(record.firstNames || record.fullName || "")].filter(Boolean).join(" ");
  return `
    <td class="document-cell">${escapeHtml(record.documentNumber)}</td>
    <td class="name-cell">${escapeHtml(fullName)}</td>
    <td>${escapeHtml(formatDate(record.birthDate))}</td>
    <td>${escapeHtml(record.pollingPlace)}</td>
    <td>${escapeHtml(record.tableNumber)}</td>
    <td>${escapeHtml(record.orderNumber)}</td>
    <td class="actions">
      <button class="row-button vote-toggle ${record.voted ? "voted" : "not-voted"}" data-action="toggle-voted" data-id="${record.id}" type="button">${record.voted ? "VOTO" : "NO VOTO"}</button>
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
    <td>${money(effectiveAmount(record))}</td>
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

  if (button.dataset.action === "toggle-voted") {
    toggleVoted(record);
    return;
  }

  if (button.dataset.action === "edit") {
    if (isWatcher()) return;
    if (!isAdmin() && record.passedPc) {
      showSystemAlert(pcLockedMessage(record));
      return;
    }
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
  bulkFields.blockNumber.value = "";
}

async function toggleVoted(record) {
  if (!isAdmin() && !isWatcher() && hasOperationalLoad(record)) {
    showSystemAlert(loadedRecordMessage(record));
    return;
  }
  const previousRecords = records;
  const nextVoted = !record.voted;
  pendingVoteUpdates.set(record.id, nextVoted);
  records = records.map((item) => item.id === record.id ? { ...item, voted: nextVoted } : item);
  saveRecords();
  renderTable();

  try {
    await apiRequest("/api/records/bulk", {
      method: "POST",
      body: JSON.stringify({ records: records.filter((item) => item.id === record.id) }),
    });
    pendingVoteUpdates.delete(record.id);
    await loadRemoteData();
    renderTable();
  } catch (error) {
    pendingVoteUpdates.delete(record.id);
    records = previousRecords;
    saveRecords();
    renderTable();
    showSystemAlert(error.message);
  }
}

async function applyBulkChanges() {
  const ids = Array.from(selectedRecords);
  if (!ids.length) {
    showSystemAlert("Seleccione al menos un registro.");
    return;
  }
  const lockedRecord = lockedSelectedPcRecord();
  if (lockedRecord) {
    showSystemAlert(pcLockedMessage(lockedRecord));
    return;
  }
  const loadedRecord = lockedSelectedLoadedRecord();
  if (loadedRecord && (bulkFields.passedPc.value !== "si" || hasBulkNonPcChanges())) {
    showSystemAlert(loadedRecordMessage(loadedRecord));
    return;
  }

  const hasAmount = normalize(bulkFields.amount.value) !== "";
  const hasCity = normalize(bulkFields.city.value) !== "";
  const hasBlockNumber = normalize(bulkFields.blockNumber.value) !== "";
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
    if (hasBlockNumber) updated.blockNumber = normalize(bulkFields.blockNumber.value);
    if (bulkFields.benefitType.value === "pago") updated.amount = 100000;
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
    showSystemAlert(error.message);
    return;
  }
  resetBulkFields();
  bulkEditorOpen = false;
  renderTable();
  showSystemAlert(`Se actualizaron ${ids.length} registros.`);
}

async function clearSelectedFields() {
  const ids = Array.from(selectedRecords);
  if (!ids.length) {
    showSystemAlert("Seleccione al menos un registro.");
    return;
  }
  const lockedRecord = lockedSelectedPcRecord();
  if (lockedRecord) {
    showSystemAlert(pcLockedMessage(lockedRecord));
    return;
  }
  const loadedRecord = lockedSelectedLoadedRecord();
  if (loadedRecord) {
    showSystemAlert(loadedRecordMessage(loadedRecord));
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
      voted: false,
      blockNumber: "",
    };
  });

  saveRecords();
  try {
    await apiRequest("/api/records/bulk", {
      method: "POST",
      body: JSON.stringify({ records: records.filter((record) => ids.includes(record.id)) }),
    });
  } catch (error) {
    showSystemAlert(error.message);
    return;
  }
  resetBulkFields();
  bulkEditorOpen = false;
  selectedRecords.clear();
  renderTable();
  showSystemAlert(`Se dejaron en blanco ${ids.length} registros.`);
}

function toCsvValue(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportCsv() {
  const headers = ["nombres", "apellidos", "fecha_nacimiento", "sexo", "cedula", "local", "barrio_compania", "estado", "mesa", "orden", "tipo", "monto", "ciudad", "tipo_movil", "paso_pc", "voto", "manzana"];
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
    effectiveAmount(record),
    record.city,
    record.mobileType,
    record.passedPc ? "si" : "no",
    record.voted ? "si" : "no",
    record.blockNumber,
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
  setLoginLoading(true);
  loginError.hidden = true;
  try {
    await login(username, loginPassword.value);
  } catch {
    loginError.hidden = false;
    registerAction("Intento fallido de ingreso", `Usuario: ${username || "sin usuario"}`);
    return;
  } finally {
    setLoginLoading(false);
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
  updateWatcherFields();
});
function updateWatcherFields() {
  const watcherSelected = normalizeKey(newFunction.value).includes("veedor");
  watcherPollingPlaceLabel.hidden = !watcherSelected;
  watcherTableNumberLabel.hidden = !watcherSelected;
  newWatcherPollingPlace.required = watcherSelected;
  newWatcherTableNumber.required = watcherSelected;
  newFunctionDescription.required = !watcherSelected;
  newFunctionDescription.disabled = watcherSelected;
  newFunctionDescription.placeholder = watcherSelected ? "Se completa automaticamente con local y mesa" : "Ej.: Barrio Fatima";
  if (watcherSelected) {
    newFunctionDescription.value = "Asignado por local y mesa";
    renderWatcherPollingPlaceOptions();
  }
}
systemModalOk.addEventListener("click", () => closeSystemModal(true));
systemModalCancel.addEventListener("click", () => closeSystemModal(false));
systemModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-modal-close]")) closeSystemModal(false);
});
document.addEventListener("keydown", (event) => {
  if (systemModal.hidden || event.key !== "Escape") return;
  closeSystemModal(systemModalConfirmMode ? false : true);
});
usersList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-user]");
  if (!button) return;
  try {
    await apiRequest(`/api/users/${encodeURIComponent(button.dataset.deleteUser)}`, { method: "DELETE" });
    users = users.filter((user) => user.username !== button.dataset.deleteUser);
  } catch (error) {
    showSystemAlert(error.message);
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
    switchView(button.dataset.viewButton);
  });
});
summaryCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedSummary = card.dataset.summary;
    if (selectedSummary === "mobile") {
      switchView("mobile");
      return;
    }
    if (selectedSummary === "refund") {
      switchView("refund");
      return;
    }
    if (selectedSummary === "payment") {
      switchView("operations");
      return;
    }
    renderSummaryDetail();
  });
});
neighborhoodSummaryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-neighborhood-summary]");
  if (!button) return;
  selectedNeighborhoodSummary = button.dataset.neighborhoodSummary;
  renderNeighborhoodSummary();
});
liderBody.addEventListener("change", (event) => {
  const select = event.target.closest("[data-lider-status-id]");
  if (!select) return;
  setLiderStatus(select.dataset.liderStatusId, select.value);
});
printNeighborhoodPdf.addEventListener("click", generateNeighborhoodPdf);
printMobilePdf.addEventListener("click", () => generateBenefitPdf("movil", "Moviles"));
printRefundPdf.addEventListener("click", () => generateBenefitPdf("devolucion", "Devolucion de Pasaje"));
printPaymentPdf.addEventListener("click", () => generateBenefitPdf("pago", "Pagos"));
printLiderVotesPdfButtons.forEach((button) => button.addEventListener("click", generateLiderVotesPdf));
document.querySelector("#applyBulk").addEventListener("click", applyBulkChanges);
document.querySelector("#clearBulkFields").addEventListener("click", clearSelectedFields);
bulkFields.benefitType.addEventListener("change", () => {
  if (bulkFields.benefitType.value === "pago") bulkFields.amount.value = "100000";
});
newFunction.addEventListener("change", updateWatcherFields);
newWatcherPollingPlace.addEventListener("change", renderWatcherTableOptions);
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
[search, filterType, filterPc, filterVote, filterLiderStatus].forEach((item) => item.addEventListener("input", renderTable));
neighborhoodDropdown.addEventListener("change", (event) => {
  if (!event.target.matches("[data-neighborhood-filter]")) return;
  updateNeighborhoodDropdownLabel();
  renderTable();
});
window.addEventListener("storage", (event) => {
  if (![STORAGE_KEY, USERS_KEY, AUDIT_KEY].includes(event.key)) return;
  syncLiveData();
});
setInterval(syncLiveData, LIVE_SYNC_MS);

renderNeighborhoodFilterOptions();
updateWatcherFields();
renderAuth();
