require("dotenv").config();

const crypto = require("crypto");
const path = require("path");
const cors = require("cors");
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = Number(process.env.PORT || 8765);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
const sessions = new Map();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function publicUser(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    password: user.password,
    functionName: user.function_name,
    functionDescription: user.function_description,
    role: user.role,
  };
}

function toRecord(row) {
  return {
    id: row.id,
    firstNames: row.first_names,
    lastNames: row.last_names,
    fullName: row.full_name,
    birthDate: row.birth_date,
    sex: row.sex,
    documentNumber: row.document_number,
    pollingPlace: row.polling_place,
    tableNumber: row.table_number,
    orderNumber: row.order_number,
    neighborhood: row.neighborhood,
    status: row.status,
    statusLider: row.status_lider || "",
    benefitType: row.benefit_type,
    amount: Number(row.amount || 0),
    city: row.city,
    mobileType: row.mobile_type,
    passedPc: Boolean(row.passed_pc),
    pcMarkedBy: row.pc_marked_by || "",
    voted: Boolean(row.voted),
    blockNumber: row.block_number || "",
    updatedBy: publicUpdatedBy(row.updated_by),
  };
}

function toWatcherRecord(row) {
  return {
    id: row.id,
    firstNames: row.first_names,
    lastNames: row.last_names,
    fullName: row.full_name,
    birthDate: row.birth_date,
    documentNumber: row.document_number,
    pollingPlace: row.polling_place,
    tableNumber: row.table_number,
    orderNumber: row.order_number,
    voted: Boolean(row.voted),
  };
}

function toLiderRecord(row) {
  return {
    id: row.id,
    firstNames: row.first_names,
    lastNames: row.last_names,
    fullName: row.full_name,
    birthDate: row.birth_date,
    sex: row.sex,
    documentNumber: row.document_number,
    pollingPlace: row.polling_place,
    tableNumber: row.table_number,
    orderNumber: row.order_number,
    neighborhood: row.neighborhood,
    status: row.status,
    statusLider: row.status_lider || "",
    voted: Boolean(row.voted),
  };
}

function statusValue(status) {
  const value = normalizeKey(status);
  return ["positivo", "negativo", "dudoso"].includes(value) ? value : "";
}

function fromRecord(record, username = "", existingRecord = null) {
  const existingPcMarkedBy = existingRecord?.pc_marked_by || existingRecord?.pcMarkedBy || "";
  const existingStatusLider = existingRecord?.status_lider || existingRecord?.statusLider || "";
  return {
    id: String(record.id),
    first_names: record.firstNames || "",
    last_names: record.lastNames || "",
    full_name: record.fullName || "",
    birth_date: record.birthDate || "",
    sex: record.sex || "",
    document_number: record.documentNumber || "",
    polling_place: record.pollingPlace || "",
    table_number: record.tableNumber || "",
    order_number: record.orderNumber || "",
    neighborhood: record.neighborhood || "",
    status: record.status || "",
    status_lider: existingRecord ? existingStatusLider : statusValue(record.statusLider),
    benefit_type: record.benefitType || "",
    amount: Number(record.amount || 0),
    city: record.city || "",
    mobile_type: record.mobileType || "",
    passed_pc: Boolean(record.passedPc),
    pc_marked_by: record.passedPc ? (existingPcMarkedBy || username) : "",
    voted: Boolean(record.voted),
    block_number: String(record.blockNumber || ""),
    updated_by: username,
  };
}

async function writeAudit(user, action, detail = "") {
  const userLabel = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
  await supabase.from("audit_log").insert({
    user_label: `${userLabel} (${user.username})`,
    username: user.username,
    action,
    detail,
  });
}

function applyRecordFilters(query, filter = null) {
  if (filter?.passedPc === true) query = query.eq("passed_pc", true);
  if (filter?.pollingPlace) query = query.eq("polling_place", filter.pollingPlace);
  if (filter?.tableNumber) query = query.eq("table_number", filter.tableNumber);
  return query;
}

async function fetchAllRecords(filter = null) {
  const pageSize = 1000;
  let from = 0;
  const allRows = [];

  while (true) {
    let query = supabase
      .from("records")
      .select(filter?.select || "*")
      .order("last_names", { ascending: true })
      .range(from, from + pageSize - 1);

    query = applyRecordFilters(query, filter);

    const { data, error } = await query;
    if (error) throw error;

    allRows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

async function fetchRecordsVersion(filter = null) {
  const countQuery = applyRecordFilters(
    supabase.from("records").select("id", { count: "exact", head: true }),
    filter,
  );
  const latestQuery = applyRecordFilters(
    supabase.from("records").select("updated_at").order("updated_at", { ascending: false }).limit(1),
    filter,
  );
  const [{ count, error: countError }, { data, error: latestError }] = await Promise.all([countQuery, latestQuery]);
  if (countError) throw countError;
  if (latestError) throw latestError;
  return { count: count || 0, updatedAt: data?.[0]?.updated_at || "" };
}

async function fetchWatcherRecords(user) {
  const assignment = parseWatcherAssignment(user.function_description);
  if (!assignment.pollingPlace || !assignment.tableNumber) return [];
  return fetchAllRecords({
    pollingPlace: assignment.pollingPlace,
    tableNumber: assignment.tableNumber,
    select: "id, first_names, last_names, full_name, birth_date, document_number, polling_place, table_number, order_number, voted",
  });
}

function watcherFilter(user) {
  const assignment = parseWatcherAssignment(user.function_description);
  if (!assignment.pollingPlace || !assignment.tableNumber) return null;
  return { pollingPlace: assignment.pollingPlace, tableNumber: assignment.tableNumber };
}

function requireAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const user = sessions.get(token);
  if (!user) return res.status(401).json({ error: "Sesion requerida" });
  req.user = user;
  req.token = token;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Solo administrador" });
  next();
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isWatcher(user) {
  return normalizeKey(user.function_name).includes("veedor");
}

function isConcejaliaLider(user) {
  const functionKey = normalizeKey(user.function_name);
  return functionKey.includes("concejalia") && functionKey.includes("lider");
}

function publicUpdatedBy(username) {
  const userKey = normalizeKey(username);
  if (userKey === "liderconcejal") return "";
  return username || "";
}

function pcSectorLabel(record) {
  if (record.benefit_type === "devolucion") return " Devolucion de Pasaje.";
  if (record.benefit_type === "movil") return " Movil.";
  return "";
}

function pcLockedMessage(record) {
  return `Esta cedula ya pasó por PC. Barrio/compañia: ${record.neighborhood || "Sin dato"}.${pcSectorLabel(record)} Usuario: ${record.pc_marked_by || "Sin dato"}`;
}

function loadedRecordMessage(record) {
  return `Esta cedula ya fue cargada previamente. Zona: ${record.neighborhood || "Sin dato"}. Usuario: ${publicUpdatedBy(record.updated_by) || "Sin dato"}`;
}

function hasOperationalLoad(record) {
  return Boolean(
    record?.benefit_type
    || record?.status
    || Number(record?.amount || 0) > 0
    || record?.city
    || record?.neighborhood
    || record?.mobile_type
    || record?.block_number
  );
}

function sameRecordValue(left, right) {
  return String(left ?? "") === String(right ?? "");
}

function isOnlyPcMark(existingRecord, payload) {
  if (existingRecord.passed_pc || !payload.passed_pc) return false;
  const fields = [
    "first_names",
    "last_names",
    "full_name",
    "birth_date",
    "sex",
    "document_number",
    "polling_place",
    "table_number",
    "order_number",
    "neighborhood",
    "status",
    "status_lider",
    "benefit_type",
    "city",
    "mobile_type",
    "voted",
    "block_number",
  ];
  return fields.every((field) => sameRecordValue(existingRecord[field], payload[field]))
    && Number(existingRecord.amount || 0) === Number(payload.amount || 0);
}

async function findPcLockedRecord(ids) {
  const cleanIds = ids.map((id) => String(id)).filter(Boolean);
  if (!cleanIds.length) return null;
  const { data, error } = await supabase
    .from("records")
    .select("id, passed_pc, pc_marked_by, neighborhood")
    .in("id", cleanIds)
    .eq("passed_pc", true)
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

async function preventPcLockedEdit(req, res, ids) {
  if (req.user.role === "admin") return false;
  const lockedRecord = await findPcLockedRecord(ids);
  if (!lockedRecord) return false;
  res.status(403).json({ error: pcLockedMessage(lockedRecord) });
  return true;
}

function preventLoadedRecordEdit(req, res, existingRecord, payload) {
  if (req.user.role === "admin" || !existingRecord || !hasOperationalLoad(existingRecord)) return false;
  if (isOnlyPcMark(existingRecord, payload)) return false;
  res.status(403).json({ error: loadedRecordMessage(existingRecord) });
  return true;
}

function parseWatcherAssignment(description) {
  const text = String(description || "").trim();
  const labeledMatch = text.match(/local\s*:\s*(.*?)\s*\|\s*mesa\s*:\s*(.+)$/i);
  if (labeledMatch) {
    return { pollingPlace: labeledMatch[1].trim(), tableNumber: labeledMatch[2].trim() };
  }

  const pipeParts = text.split("|").map((part) => part.trim()).filter(Boolean);
  if (pipeParts.length >= 2) return { pollingPlace: pipeParts[0], tableNumber: pipeParts[1].replace(/^mesa\s*:?\s*/i, "").trim() };

  const mesaMatch = text.match(/^(.*?)\s+mesa\s*:?\s*(.+)$/i);
  if (mesaMatch) return { pollingPlace: mesaMatch[1].trim(), tableNumber: mesaMatch[2].trim() };

  return { pollingPlace: "", tableNumber: "" };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/health/db", async (req, res) => {
  const { count, error } = await supabase
    .from("app_users")
    .select("id", { count: "exact", head: true });
  if (error) return res.status(500).json({ ok: false, error: error.message });

  const { data: admin, error: adminError } = await supabase
    .from("app_users")
    .select("username, role, function_name")
    .eq("username", "admin")
    .maybeSingle();
  if (adminError) return res.status(500).json({ ok: false, error: adminError.message });

  res.json({
    ok: true,
    usersCount: count,
    adminExists: Boolean(admin),
    adminRole: admin?.role || "",
    adminFunction: admin?.function_name || "",
  });
});

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) {
    await supabase.from("audit_log").insert({
      user_label: username || "Sin usuario",
      username,
      action: "Intento fallido de ingreso",
      detail: `Usuario: ${username || "sin usuario"}`,
    });
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const token = crypto.randomUUID();
  sessions.set(token, data);
  await writeAudit(data, "Inicio sesion", "Acceso correcto al sistema");
  res.json({ token, user: publicUser(data) });
});

app.post("/api/auth/logout", requireAuth, async (req, res) => {
  await writeAudit(req.user, "Cerro sesion", "Salida del sistema");
  sessions.delete(req.token);
  res.json({ ok: true });
});

app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from("app_users").select("*").order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(publicUser));
});

app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
  const role = String(req.body.functionName || "").toLowerCase() === "admin" ? "admin" : "operator";
  const payload = {
    first_name: String(req.body.firstName || "").trim(),
    last_name: String(req.body.lastName || "").trim(),
    username: String(req.body.username || "").trim(),
    password: String(req.body.password || ""),
    function_name: String(req.body.functionName || "").trim(),
    function_description: String(req.body.functionDescription || "").trim(),
    role,
  };
  const { data, error } = await supabase.from("app_users").insert(payload).select("*").single();
  if (error) return res.status(400).json({ error: error.message });
  await writeAudit(req.user, "Creo usuario", `${payload.username} - ${payload.function_name} - ${payload.function_description}`);
  res.status(201).json(publicUser(data));
});

app.delete("/api/users/:username", requireAuth, requireAdmin, async (req, res) => {
  if (req.params.username === "admin") return res.status(400).json({ error: "No se puede eliminar el admin principal" });
  const { error } = await supabase.from("app_users").delete().eq("username", req.params.username);
  if (error) return res.status(500).json({ error: error.message });
  await writeAudit(req.user, "Elimino usuario", req.params.username);
  res.json({ ok: true });
});

app.get("/api/records/version", requireAuth, async (req, res) => {
  try {
    const filter = isWatcher(req.user) ? watcherFilter(req.user) : null;
    if (isWatcher(req.user) && !filter) return res.json({ count: 0, updatedAt: "" });
    res.json(await fetchRecordsVersion(filter));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/records", requireAuth, async (req, res) => {
  try {
    if (isWatcher(req.user)) {
      const data = await fetchWatcherRecords(req.user);
      return res.json(data.map(toWatcherRecord));
    }

    if (isConcejaliaLider(req.user)) {
      const data = await fetchAllRecords({
        select: "id, first_names, last_names, full_name, birth_date, sex, document_number, polling_place, table_number, order_number, neighborhood, status, status_lider, voted",
      });
      return res.json(data.map(toLiderRecord));
    }

    const data = await fetchAllRecords();
    res.json(data.map(toRecord));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/records/:id", requireAuth, async (req, res) => {
  if (isWatcher(req.user)) return res.status(403).json({ error: "Los veedores solo pueden marcar VOTO/NO VOTO" });
  if (isConcejaliaLider(req.user)) {
    const { data, error } = await supabase
      .from("records")
      .update({ status_lider: statusValue(req.body.statusLider) })
      .eq("id", req.params.id)
      .select("id, first_names, last_names, full_name, birth_date, sex, document_number, polling_place, table_number, order_number, neighborhood, status, status_lider, voted")
      .maybeSingle();
    if (error) {
      const missingColumn = error.message?.includes("status_lider") || error.code === "42703";
      return res.status(400).json({
        error: missingColumn
          ? "Falta aplicar la migracion status_lider en Supabase"
          : error.message,
      });
    }
    if (!data) return res.status(404).json({ error: "No se encontro el registro para marcar estado Lider" });
    await writeAudit(req.user, "Marco estado Lider", `CI ${data.document_number}`);
    return res.json(toLiderRecord(data));
  }
  const { data: existing, error: existingError } = await supabase.from("records").select("*").eq("id", req.params.id).maybeSingle();
  if (existingError) return res.status(400).json({ error: existingError.message });
  const payload = fromRecord({ ...req.body, id: req.params.id }, req.user.username, existing);
  if (req.user.role !== "admin" && existing?.passed_pc) return res.status(403).json({ error: pcLockedMessage(existing) });
  if (preventLoadedRecordEdit(req, res, existing, payload)) return;
  const { data, error } = await supabase.from("records").upsert(payload).select("*").single();
  if (error) return res.status(400).json({ error: error.message });
  await writeAudit(req.user, "Actualizo registro", `CI ${payload.document_number}`);
  res.json(toRecord(data));
});

app.post("/api/records/bulk", requireAuth, async (req, res) => {
  const records = Array.isArray(req.body.records) ? req.body.records : [];
  const ids = records.map((record) => String(record.id));
  if (!ids.length) return res.json({ ok: true, count: 0 });

  if (isWatcher(req.user)) {
    const data = await fetchWatcherRecords(req.user);
    const allowedIds = new Set(data.map((record) => String(record.id)));
    if (ids.some((id) => !allowedIds.has(id))) {
      return res.status(403).json({ error: "El veedor solo puede marcar su local y mesa asignados" });
    }

    const incomingById = new Map(records.map((record) => [String(record.id), Boolean(record.voted)]));
    for (const id of ids) {
      const { data: updatedRows, error } = await supabase
        .from("records")
        .update({ voted: incomingById.get(id) })
        .eq("id", id)
        .select("id");
      if (error) return res.status(400).json({ error: error.message });
      if (!updatedRows?.length) return res.status(404).json({ error: "No se encontro el registro para marcar voto" });
    }
    await writeAudit(req.user, "Marco voto", `${ids.length} registro(s) actualizados por veedor`);
    return res.json({ ok: true, count: ids.length });
  }

  try {
    if (await preventPcLockedEdit(req, res, ids)) return;
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  if (isConcejaliaLider(req.user)) {
    for (const record of records) {
      const { data: updatedRows, error } = await supabase
        .from("records")
        .update({ status_lider: statusValue(record.statusLider) })
        .eq("id", String(record.id))
        .select("id");
      if (error) {
        const missingColumn = error.message?.includes("status_lider") || error.code === "42703";
        return res.status(400).json({
          error: missingColumn
            ? "Falta aplicar la migracion status_lider en Supabase"
            : error.message,
        });
      }
      if (!updatedRows?.length) return res.status(404).json({ error: "No se encontro el registro para marcar estado Lider" });
    }
    await writeAudit(req.user, "Marco estado Lider", `${ids.length} registro(s) actualizados`);
    return res.json({ ok: true, count: ids.length });
  }

  const { data: existingRows, error: existingError } = await supabase.from("records").select("*").in("id", ids);
  if (existingError) return res.status(400).json({ error: existingError.message });
  const existingById = new Map((existingRows || []).map((record) => [record.id, record]));
  const payload = records.map((record) => fromRecord(record, req.user.username, existingById.get(String(record.id))));
  if (req.user.role !== "admin") {
    const pcLockedRecord = payload.map((record) => existingById.get(record.id)).find((record) => record?.passed_pc);
    if (pcLockedRecord) return res.status(403).json({ error: pcLockedMessage(pcLockedRecord) });

    const loadedRecord = payload.find((record) => {
      const existingRecord = existingById.get(record.id);
      return existingRecord && hasOperationalLoad(existingRecord) && !isOnlyPcMark(existingRecord, record);
    });
    if (loadedRecord) return res.status(403).json({ error: loadedRecordMessage(existingById.get(loadedRecord.id)) });
  }
  const { error } = await supabase.from("records").upsert(payload);
  if (error) return res.status(400).json({ error: error.message });
  const pcMarked = payload.filter((record) => record.passed_pc && record.pc_marked_by === req.user.username).length;
  const details = payload.slice(0, 10).map((record) => {
    const type = record.benefit_type || "sin tipo";
    const status = record.status || "sin estado";
    const amount = Number(record.amount || 0).toLocaleString("es-PY");
    return `CI ${record.document_number}: ${type}, estado ${status}, monto ${amount}, PC ${record.passed_pc ? "si" : "no"}`;
  }).join(" | ");
  await writeAudit(req.user, "Actualizo registros", `${payload.length} registro(s). Paso por PC marcado por este usuario: ${pcMarked}. ${details}`);
  res.json({ ok: true, count: payload.length });
});

app.get("/api/audit", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map((item) => ({
    id: item.id,
    date: item.created_at,
    user: item.user_label,
    action: item.action,
    detail: item.detail,
  })));
});

app.post("/api/audit", requireAuth, async (req, res) => {
  await writeAudit(req.user, String(req.body.action || "Accion"), String(req.body.detail || ""));
  res.status(201).json({ ok: true });
});

app.get("/api/reports/pc", requireAuth, requireAdmin, async (req, res) => {
  let data;
  try {
    data = await fetchAllRecords({ passedPc: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  await writeAudit(req.user, "Genero reporte PC", `${data.length} registros`);
  res.json(data.map(toRecord));
});

app.use(express.static(__dirname));

app.listen(port, () => {
  console.log(`Sistema disponible en http://localhost:${port}`);
});
