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
    benefitType: row.benefit_type,
    amount: Number(row.amount || 0),
    city: row.city,
    mobileType: row.mobile_type,
    passedPc: Boolean(row.passed_pc),
    pcMarkedBy: row.pc_marked_by || "",
  };
}

function fromRecord(record, username = "", existingRecord = null) {
  const existingPcMarkedBy = existingRecord?.pc_marked_by || existingRecord?.pcMarkedBy || "";
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
    benefit_type: record.benefitType || "",
    amount: Number(record.amount || 0),
    city: record.city || "",
    mobile_type: record.mobileType || "",
    passed_pc: Boolean(record.passedPc),
    pc_marked_by: record.passedPc ? (existingPcMarkedBy || username) : "",
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

async function fetchAllRecords(filter = null) {
  const pageSize = 1000;
  let from = 0;
  const allRows = [];

  while (true) {
    let query = supabase
      .from("records")
      .select("*")
      .order("last_names", { ascending: true })
      .range(from, from + pageSize - 1);

    if (filter?.passedPc === true) query = query.eq("passed_pc", true);

    const { data, error } = await query;
    if (error) throw error;

    allRows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
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

app.get("/api/records", requireAuth, async (req, res) => {
  try {
    const data = await fetchAllRecords();
    res.json(data.map(toRecord));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/records/:id", requireAuth, async (req, res) => {
  const { data: existing } = await supabase.from("records").select("id, passed_pc, pc_marked_by").eq("id", req.params.id).maybeSingle();
  const payload = fromRecord({ ...req.body, id: req.params.id }, req.user.username, existing);
  const { data, error } = await supabase.from("records").upsert(payload).select("*").single();
  if (error) return res.status(400).json({ error: error.message });
  await writeAudit(req.user, "Actualizo registro", `CI ${payload.document_number}`);
  res.json(toRecord(data));
});

app.post("/api/records/bulk", requireAuth, async (req, res) => {
  const records = Array.isArray(req.body.records) ? req.body.records : [];
  const ids = records.map((record) => String(record.id));
  const { data: existingRows, error: existingError } = await supabase.from("records").select("id, passed_pc, pc_marked_by").in("id", ids);
  if (existingError) return res.status(400).json({ error: existingError.message });
  const existingById = new Map((existingRows || []).map((record) => [record.id, record]));
  const payload = records.map((record) => fromRecord(record, req.user.username, existingById.get(String(record.id))));
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
