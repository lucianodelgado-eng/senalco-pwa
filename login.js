/* login.js - Señalco (Login único + permisos + usuarios.json + update app) */

const USERS_JSON_URL = "./usuarios.json";
const SESSION_KEY = "senalco_session_v2";
const USERS_CACHE_KEY = "senalco_users_cache_v2";

// ⏳ Expiración de sesión
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

const MONITOREO_URL = "https://itsenalco.com/monitoreo/web/";

const FEATURES = [
  { id: "relev",     label: "📋 Relevamiento Alarmas", default: true },
  { id: "base",      label: "📊 Base de Datos",        default: true },
  { id: "cctv",      label: "🎥 Relevamiento CCTV",    default: true },
  { id: "monitoreo", label: "🖥️ Monitoreo Web",        default: true }
];

const ADMIN_USER = "admin";
const ADMIN_PASS = "Senalco2025";

function $(id){ return document.getElementById(id); }
function norm(s){ return String(s || "").trim(); }

function safeJsonParse(raw, fallback){
  try { return JSON.parse(raw); } catch { return fallback; }
}
function lsGet(key, fallback){
  const raw = localStorage.getItem(key);
  return raw ? safeJsonParse(raw, fallback) : fallback;
}
function lsSet(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function setStatus(msg){
  const el = $("estado-login");
  if (el) el.textContent = msg || "";
}

function defaultPerms(){
  const p = {};
  FEATURES.forEach(f => p[f.id] = !!f.default);
  return p;
}

/* =========================
   SHA-256 universal
   - usa crypto.subtle si está
   - si no, usa JS puro (para teléfonos “problemáticos”)
   ========================= */
function rotr(n, x){ return (x >>> n) | (x << (32 - n)); }
function sha256PureJS(ascii){
  const maxWord = Math.pow(2, 32);
  let result = "";

  const words = [];
  const asciiBitLength = ascii.length * 8;

  const hash = sha256PureJS.h = sha256PureJS.h || [];
  const k = sha256PureJS.k = sha256PureJS.k || [];
  let primeCounter = k.length;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1/3) * maxWord) | 0;
    }
  }

  ascii += "\x80";
  while (ascii.length % 64 - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = (asciiBitLength) | 0;

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];

      const a = hash[0], e = hash[4];
      const temp1 = (hash[7]
        + (rotr(6, e) ^ rotr(11, e) ^ rotr(25, e))
        + ((e & hash[5]) ^ (~e & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rotr(7, w15) ^ rotr(18, w15) ^ (w15 >>> 3))
            + w[i - 7]
            + (rotr(17, w2) ^ rotr(19, w2) ^ (w2 >>> 10))
          ) | 0)
      ) | 0;

      const temp2 = ((rotr(2, a) ^ rotr(13, a) ^ rotr(22, a))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]))
      ) | 0;

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

async function sha256Hex(text){
  try {
    if (globalThis.crypto?.subtle) {
      const enc = new TextEncoder().encode(text);
      const buf = await crypto.subtle.digest("SHA-256", enc);
      const arr = Array.from(new Uint8Array(buf));
      return arr.map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {}
  return sha256PureJS(String(text));
}

// ---- Sesión
function getSessionRaw(){ return lsGet(SESSION_KEY, null); }

function getSessionValidated(){
  const s = getSessionRaw();
  if (!s) return null;

  const ts = Number(s.ts || 0);
  if (!ts || (Date.now() - ts) > SESSION_TTL_MS){
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return s;
}

function setSession(sess){ lsSet(SESSION_KEY, sess); }
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

// ---- Users cache
function getUsersCache(){ return lsGet(USERS_CACHE_KEY, { version: 1, updatedAt: 0, users: [] }); }
function setUsersCache(data){ lsSet(USERS_CACHE_KEY, data); }

async function fetchUsersFromRepo(){
  const url = `${USERS_JSON_URL}?ts=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo leer usuarios.json");
  const data = await res.json();
  if (!data || !Array.isArray(data.users)) throw new Error("usuarios.json inválido");
  return data;
}

/* =========================
   UI: ocultar login / mostrar accesos
   ========================= */
function setUIState(isLogged){
  const loginBlock = $("login-block");
  const panelAccesos = $("seleccion-planillas");
  const btnLogout = $("btn-cerrar-sesion");

  if (loginBlock) loginBlock.style.display = isLogged ? "none" : "block";
  if (panelAccesos) panelAccesos.classList.toggle("active", !!isLogged);
  if (btnLogout) btnLogout.style.display = isLogged ? "block" : "none";
}

function applyPermButtons(perms){
  const btnRelev = $("btn-relevamiento");
  const btnBase  = $("btn-base");
  const btnCctv  = $("btn-cctv");
  const btnMon   = $("btn-monitoreo-web");

  if (btnRelev){
    btnRelev.style.display = perms.relev ? "block" : "none";
    btnRelev.onclick = () => window.location.href = "relevamiento1.html";
  }
  if (btnBase){
    btnBase.style.display = perms.base ? "block" : "none";
    btnBase.onclick = () => window.location.href = "index-base.html";
  }
  if (btnCctv){
    btnCctv.style.display = perms.cctv ? "block" : "none";
    btnCctv.onclick = () => window.location.href = "index2.html";
  }
  if (btnMon){
    const can = (typeof perms.monitoreo === "boolean") ? perms.monitoreo : true;
    btnMon.style.display = can ? "block" : "none";
    btnMon.onclick = () => window.open(MONITOREO_URL, "_blank");
  }
}

/* =========================
   Admin: gestión usuarios → descarga usuarios.json
   ========================= */
function ensureAdminManagerUI(){
  const hook = $("admin-manager-hook");
  if (!hook) return;
  if ($("admin-manager")) return;

  const box = document.createElement("div");
  box.id = "admin-manager";
  box.style.marginTop = "12px";
  box.style.padding = "14px";
  box.style.borderRadius = "16px";
  box.style.border = "1px solid rgba(255,255,255,.14)";
  box.style.background = "rgba(0,0,0,.18)";
  box.style.backdropFilter = "blur(10px)";
  box.style.color = "#fff";

  box.innerHTML = `
    <h3 style="margin:0 0 10px 0;">👤 Gestión de usuarios (Admin)</h3>
    <div style="opacity:.85;font-size:12px;margin-bottom:10px;">
      Creás usuarios → descargás <b>usuarios.json</b> → lo subís al repo.
    </div>

    <div style="display:grid; gap:10px; max-width:520px;">
      <input id="adm-new-user" class="login-input" placeholder="Usuario (ej: tecnico1)" />
      <input id="adm-new-pass" class="login-input" placeholder="Clave (se guarda hasheada)" />

      <div id="adm-perms"
           style="display:grid; gap:8px; padding:10px; border-radius:14px; border:1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06);">
        <div style="font-weight:900; margin-bottom:2px;">Permisos</div>
        ${FEATURES.map(f => `
          <label style="display:flex; gap:10px; align-items:center;">
            <input type="checkbox" data-perm="${f.id}" ${f.default ? "checked" : ""} />
            <span>${f.label}</span>
          </label>
        `).join("")}
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button id="adm-btn-create" class="login-btn" type="button">➕ Crear / Actualizar</button>
        <button id="adm-btn-download" class="login-btn ghost" type="button">⬇️ Descargar usuarios.json</button>
        <button id="adm-btn-refresh" class="login-btn ghost" type="button">🔁 Cargar desde repo</button>
      </div>

      <div id="adm-users-list" style="margin-top:8px;"></div>
    </div>
  `;

  hook.appendChild(box);

  $("adm-btn-create").onclick = adminCreateOrUpdateUser;
  $("adm-btn-download").onclick = adminDownloadUsersJson;
  $("adm-btn-refresh").onclick = async () => {
    try {
      const data = await fetchUsersFromRepo();
      setUsersCache(data);
      adminRenderUsers();
      alert("✅ Usuarios recargados desde el repo");
    } catch (e) {
      alert("❌ No pude cargar usuarios desde el repo");
      console.warn(e);
    }
  };

  adminRenderUsers();
}

function buildPermsFromForm(container){
  const p = defaultPerms();
  if (!container) return p;
  container.querySelectorAll("input[data-perm]").forEach(chk => {
    p[chk.dataset.perm] = !!chk.checked;
  });
  if (typeof p.monitoreo !== "boolean") p.monitoreo = true;
  return p;
}

function adminGetWorkingUsers(){
  const data = getUsersCache();
  if (!data.users) data.users = [];
  return data;
}
function adminSetWorkingUsers(data){
  setUsersCache(data);
}

async function adminCreateOrUpdateUser(){
  const user = norm($("adm-new-user")?.value).toLowerCase();
  const pass = norm($("adm-new-pass")?.value);
  const perms = buildPermsFromForm($("adm-perms"));

  if (!user || user.length < 3) return alert("Usuario inválido (mínimo 3 caracteres).");
  if (!pass || pass.length < 4) return alert("Clave inválida (mínimo 4 caracteres).");
  if (user === ADMIN_USER) return alert("Ese usuario está reservado.");

  const passHash = await sha256Hex(pass);

  const data = adminGetWorkingUsers();
  const users = data.users;

  const i = users.findIndex(x => x.user === user);
  const payload = { user, passHash, perms, updatedAt: Date.now() };

  if (i >= 0) users[i] = payload;
  else users.push(payload);

  data.updatedAt = Date.now();
  adminSetWorkingUsers(data);

  if ($("adm-new-user")) $("adm-new-user").value = "";
  if ($("adm-new-pass")) $("adm-new-pass").value = "";

  adminRenderUsers();
  alert("✅ Usuario guardado (local). Descargá usuarios.json y subilo al repo.");
}

function adminDeleteUser(user){
  if (!confirm(`🗑️ ¿Borrar usuario?\n\n${user}`)) return;
  const data = adminGetWorkingUsers();
  data.users = (data.users || []).filter(x => x.user !== user);
  data.updatedAt = Date.now();
  adminSetWorkingUsers(data);
  adminRenderUsers();
}

function adminRenderUsers(){
  const cont = $("adm-users-list");
  if (!cont) return;

  const data = adminGetWorkingUsers();
  const users = data.users || [];

  if (!users.length){
    cont.innerHTML = `<div style="opacity:.85;">No hay usuarios en la lista todavía.</div>`;
    return;
  }

  cont.innerHTML = users.map(u => {
    const perms = u.perms || {};
    const resumen = FEATURES.filter(f => perms[f.id]).map(f => f.label).join(" • ") || "Sin permisos";
    const safeUser = String(u.user || "").replace(/'/g, "\\'");

    return `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; border-radius:14px; border:1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); margin-top:8px;">
        <div>
          <div style="font-weight:900;">${u.user}</div>
          <div style="font-size:12px; opacity:.85;">${resumen}</div>
        </div>
        <button type="button" class="login-btn ghost" onclick="adminDeleteUser('${safeUser}')">🗑️ Borrar</button>
      </div>
    `;
  }).join("");
}

function adminDownloadUsersJson(){
  const data = adminGetWorkingUsers();
  const payload = {
    version: 1,
    updatedAt: Date.now(),
    users: (data.users || []).map(u => ({
      user: u.user,
      passHash: u.passHash,
      perms: u.perms || defaultPerms(),
      updatedAt: u.updatedAt || Date.now()
    }))
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "usuarios.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  alert("✅ Descargado: usuarios.json\nSubilo al repo reemplazando el anterior.");
}

/* =========================
   Render principal
   ========================= */
function renderFromSession(){
  const s = getSessionValidated();

  if (!s){
    setUIState(false);
    const hook = $("admin-manager-hook");
    if (hook) hook.innerHTML = "";
    setStatus("Sesión cerrada.");
    return;
  }

  setUIState(true);
  applyPermButtons(s.perms || defaultPerms());

  if (s.role === "admin"){
    ensureAdminManagerUI();
    setStatus(`✅ Sesión iniciada: ${s.user} (admin)`);
  } else {
    const hook = $("admin-manager-hook");
    if (hook) hook.innerHTML = "";
    setStatus(`✅ Sesión iniciada: ${s.user}`);
  }
}

/* =========================
   Login / Logout
   ========================= */
async function loginGeneral(){
  const usuario = norm($("usuario")?.value).toLowerCase();
  const clave = norm($("clave")?.value);

  if (!usuario || !clave){
    alert("Completá usuario y clave");
    return;
  }

  // Admin fijo
  if (usuario === ADMIN_USER && clave === ADMIN_PASS){
    setSession({ user: ADMIN_USER, role: "admin", perms: defaultPerms(), ts: Date.now() });
    renderFromSession();
    return;
  }

  // Users desde repo (o cache)
  let data;
  try {
    data = await fetchUsersFromRepo();
    setUsersCache(data);
  } catch (e) {
    console.warn("fetch users falló, uso cache:", e);
    data = getUsersCache();
  }

  const users = (data && Array.isArray(data.users)) ? data.users : [];
  const found = users.find(u => (u.user || "").toLowerCase() === usuario);
  if (!found){ alert("Credenciales incorrectas"); return; }

  const passHash = await sha256Hex(clave);
  if (found.passHash !== passHash){ alert("Credenciales incorrectas"); return; }

  setSession({ user: usuario, role: "user", perms: found.perms || defaultPerms(), ts: Date.now() });
  renderFromSession();
}

function logout(){
  clearSession();
  if ($("usuario")) $("usuario").value = "";
  if ($("clave")) $("clave").value = "";
  renderFromSession();
}

/* =========================
   Update app
   ========================= */
async function updateApp(){
  try {
    if (!("serviceWorker" in navigator)) { window.location.reload(); return; }
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  } catch (e) {
    console.warn("updateApp error:", e);
  } finally {
    window.location.reload();
  }
}

/* =========================
   Boot
   ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    $("btn-login")?.addEventListener("click", loginGeneral);
    $("btn-cerrar-sesion")?.addEventListener("click", logout);
    $("btn-actualizar-app")?.addEventListener("click", updateApp);

    $("clave")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loginGeneral();
    });

    // precarga cache users
    try {
      const data = await fetchUsersFromRepo();
      setUsersCache(data);
    } catch {}

    renderFromSession();
  } catch (e) {
    console.error(e);
    setStatus("❌ Error en login.js: " + (e?.message || e));
  }
});

window.adminDeleteUser = adminDeleteUser;