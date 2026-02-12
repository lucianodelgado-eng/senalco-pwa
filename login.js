/* login.js - Señalco
   ✅ Login ÚNICO
   ✅ Usuarios desde usuarios.json (repo)
   ✅ Admin descarga usuarios.json (vos lo subís al repo)
   ✅ Permisos por botón (base/relev/cctv/monitoreo)
   ✅ No inicia solo admin: muestra "Continuar / Cerrar sesión"
   ✅ Botón Actualizar app: update SW + reload
*/

const USERS_JSON_URL = "./usuarios.json"; // en el repo (GitHub Pages)
const SESSION_KEY = "senalco_session_v2";
const USERS_CACHE_KEY = "senalco_users_cache_v2";

const MONITOREO_URL = "https://itsenalco.com/monitoreo/web/";

const FEATURES = [
  { id: "relev",     label: "📋 Relevamiento Alarmas", default: true },
  { id: "base",      label: "📊 Base de Datos",        default: true },
  { id: "cctv",      label: "🎥 Relevamiento CCTV",    default: true },
  { id: "monitoreo", label: "🖥️ Monitoreo Web",        default: true }
];

// Admin fijo (sí, está en JS; sin backend no existe “secreto real”)
const ADMIN_USER = "admin";
const ADMIN_PASS = "Senalco2025";

function $(id){ return document.getElementById(id); }

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
function norm(s){ return String(s || "").trim(); }

function defaultPerms(){
  const p = {};
  FEATURES.forEach(f => p[f.id] = !!f.default);
  return p;
}

// ---- Hash (WebCrypto) para no guardar claves en texto plano en usuarios.json
async function sha256Hex(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ---- Sesión
function getSession(){
  return lsGet(SESSION_KEY, null);
}
function setSession(sess){
  lsSet(SESSION_KEY, sess);
}
function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}

// ---- Users: fetch desde repo + fallback cache local
async function fetchUsersFromRepo(){
  const url = `${USERS_JSON_URL}?ts=${Date.now()}`; // cache bust
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo leer usuarios.json");
  const data = await res.json();
  if (!data || !Array.isArray(data.users)) throw new Error("usuarios.json inválido");
  return data;
}
function getUsersCache(){
  return lsGet(USERS_CACHE_KEY, { version: 1, updatedAt: 0, users: [] });
}
function setUsersCache(data){
  lsSet(USERS_CACHE_KEY, data);
}

// ---- UI estado
function setStatus(msg){
  const el = $("estado-login");
  if (el) el.textContent = msg || "";
}

function showPanelAccesos(show){
  const p = $("seleccion-planillas");
  if (!p) return;
  p.classList.toggle("active", !!show);
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

function isAdminSession(){
  const s = getSession();
  return !!s && s.role === "admin" && s.user === ADMIN_USER;
}

// ---- Admin manager UI (se monta en #admin-manager-hook)
function ensureAdminManagerUI(){
  const hook = $("admin-manager-hook");
  if (!hook) return;

  // evitar duplicado
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
      Los usuarios salen de <b>usuarios.json</b> del repo. Acá podés armar la lista y descargar el JSON para subirlo.
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
  // monitoreo por defecto true si no existe
  if (typeof p.monitoreo !== "boolean") p.monitoreo = true;
  return p;
}

function adminGetWorkingUsers(){
  // trabajamos sobre el CACHE local, así podés armar la lista sin depender del fetch
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
  alert("✅ Usuario guardado (en cache local). Ahora descargá usuarios.json y subilo al repo.");
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
    cont.innerHTML = `<div style="opacity:.85;">No hay usuarios cargados en la lista todavía.</div>`;
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

  alert("✅ Descargado: usuarios.json\n\nAhora subilo al repo reemplazando el anterior.");
}

// ---- Login
async function loginGeneral(){
  const usuario = norm($("usuario")?.value).toLowerCase();
  const clave = norm($("clave")?.value);

  if (!usuario || !clave){
    alert("Completá usuario y clave");
    return;
  }

  // Admin fijo
  if (usuario === ADMIN_USER && clave === ADMIN_PASS){
    setSession({
      user: ADMIN_USER,
      role: "admin",
      perms: defaultPerms(),
      ts: Date.now()
    });
    setStatus("✅ Sesión iniciada: admin");
    showAfterLogin();
    return;
  }

  // Técnico: buscamos users desde repo (y si falla, cache)
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
  if (!found){
    alert("Credenciales incorrectas");
    return;
  }

  const passHash = await sha256Hex(clave);
  if (found.passHash !== passHash){
    alert("Credenciales incorrectas");
    return;
  }

  setSession({
    user: usuario,
    role: "user",
    perms: found.perms || defaultPerms(),
    ts: Date.now()
  });

  setStatus(`✅ Sesión iniciada: ${usuario}`);
  showAfterLogin();
}

function logout(){
  clearSession();
  showPanelAccesos(false);
  setStatus("Sesión cerrada.");
  // limpia inputs
  if ($("usuario")) $("usuario").value = "";
  if ($("clave")) $("clave").value = "";
  syncSessionButtons();
}

function showAfterLogin(){
  const s = getSession();
  if (!s) return;

  showPanelAccesos(true);
  applyPermButtons(s.perms || defaultPerms());

  if (s.role === "admin"){
    ensureAdminManagerUI();
  } else {
    // si no es admin, ocultamos panel admin si existía
    const hook = $("admin-manager-hook");
    if (hook) hook.innerHTML = "";
  }

  syncSessionButtons();
}

function syncSessionButtons(){
  const s = getSession();
  const btnLogout = $("btn-cerrar-sesion");
  const btnCont = $("btn-continuar");
  const panel = $("seleccion-planillas");

  if (!btnLogout || !btnCont) return;

  if (s){
    // NO auto-entrar: solo mostramos continuar / cerrar
    btnLogout.style.display = "inline-block";
    btnCont.style.display = "inline-block";
    if (panel) panel.classList.remove("active");
    setStatus(`Sesión detectada: ${s.user} (${s.role}). Tocá “Continuar sesión” o “Cerrar sesión”.`);
  } else {
    btnLogout.style.display = "none";
    btnCont.style.display = "none";
    if (panel) panel.classList.remove("active");
  }
}

// ---- Actualizar app
async function updateApp(){
  try {
    if (!("serviceWorker" in navigator)) {
      window.location.reload();
      return;
    }

    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();

      // si hay waiting, pedirle que active
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    }
  } catch (e) {
    console.warn("updateApp error:", e);
  } finally {
    // recarga fuerte
    window.location.reload();
  }
}

// ---- Boot
document.addEventListener("DOMContentLoaded", async () => {
  // Botones
  $("btn-login")?.addEventListener("click", () => loginGeneral());
  $("btn-cerrar-sesion")?.addEventListener("click", () => logout());
  $("btn-continuar")?.addEventListener("click", () => showAfterLogin());
  $("btn-actualizar-app")?.addEventListener("click", () => updateApp());

  // enter en clave
  $("clave")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginGeneral();
  });

  // Detectar sesión pero NO auto entrar
  syncSessionButtons();

  // precargar cache (no molesta si falla)
  try {
    const data = await fetchUsersFromRepo();
    setUsersCache(data);
  } catch {}
});

// Exponer borrar (lo usa onclick del admin list)
window.adminDeleteUser = adminDeleteUser;