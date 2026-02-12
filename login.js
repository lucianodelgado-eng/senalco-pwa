/* login.js - Señalco (LOGIN ÚNICO + permisos por botones + admin) */

const SENALCO_USERS_KEY = "senalco_users_v1";
const SENALCO_PERMS_KEY = "senalco_perms_active_v1";

// Features / permisos (sumás acá y aparece en el admin)
const FEATURES = [
  { id: "base",      label: "📊 Base de Datos",       default: true },
  { id: "relev",     label: "📋 Relevamiento Alarmas", default: true },
  { id: "cctv",      label: "🎥 Relevamiento CCTV",    default: true },
  { id: "monitoreo", label: "🖥️ Monitoreo Web",        default: true },
];

const MONITOREO_URL = "https://itsenalco.com/monitoreo/web/";

// Admin fijo (luego ofuscás)
const ADMIN_USER = "admin";
const ADMIN_PASS = "Senalco2025";

function $(id){ return document.getElementById(id); }
function norm(s){ return String(s || "").trim(); }

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function defaultPerms() {
  const p = {};
  FEATURES.forEach(f => p[f.id] = !!f.default);
  return p;
}

function saveActivePerms(perms) {
  lsSet(SENALCO_PERMS_KEY, perms || defaultPerms());
}
function getActivePerms() {
  return lsGet(SENALCO_PERMS_KEY, defaultPerms());
}

function getUsers() { return lsGet(SENALCO_USERS_KEY, []); }
function setUsers(list) { lsSet(SENALCO_USERS_KEY, list); }

/* ========= UI show/hide ========= */

function showPanel(idToShow){
  ["login-unico","dashboard"].forEach(id => $(id)?.classList.remove("active"));
  $(idToShow)?.classList.add("active");
}

/* ========= Login único ========= */

function loginUnico() {
  const usuario = norm($("usuario")?.value).toLowerCase();
  const clave   = norm($("clave")?.value);

  if (!usuario || !clave) return alert("Completá usuario y clave.");

  // Admin
  if (usuario === ADMIN_USER && clave === ADMIN_PASS) {
    localStorage.setItem("logueado", "true");
    localStorage.setItem("perfil", "admin");
    saveActivePerms(defaultPerms()); // admin ve todo
    showPanel("dashboard");
    setupDashboard();
    ensureAdminManagerUI();
    return;
  }

  // Usuarios creados por admin
  const users = getUsers();
  const u = users.find(x => x.user === usuario);
  if (!u) return alert("Credenciales incorrectas");
  if (u.pass !== clave) return alert("Credenciales incorrectas");

  localStorage.setItem("logueado", "true");
  localStorage.setItem("perfil", "user");
  saveActivePerms(u.perms || defaultPerms());

  showPanel("dashboard");
  setupDashboard();
}

/* ========= Dashboard ========= */

function setupDashboard() {
  const perms = getActivePerms();

  const btnRelev = $("btn-relevamiento");
  const btnBase  = $("btn-base");
  const btnCctv  = $("btn-cctv");
  const btnMon   = $("btn-monitoreo-web");

  if (btnRelev) {
    btnRelev.style.display = perms.relev ? "inline-block" : "none";
    btnRelev.onclick = () => window.location.href = "relevamiento1.html";
  }
  if (btnBase) {
    btnBase.style.display = perms.base ? "inline-block" : "none";
    btnBase.onclick = () => window.location.href = "index-base.html";
  }
  if (btnCctv) {
    btnCctv.style.display = perms.cctv ? "inline-block" : "none";
    btnCctv.onclick = () => window.location.href = "index2.html";
  }
  if (btnMon) {
    // Si lo querés SIEMPRE visible, poné true acá:
    const can = (typeof perms.monitoreo === "boolean") ? perms.monitoreo : true;
    btnMon.style.display = can ? "inline-block" : "none";
    btnMon.onclick = () => window.open(MONITOREO_URL, "_blank");
  }

  // Si NO es admin, ocultamos panel admin si quedó
  const hook = $("admin-manager-hook");
  if (hook && localStorage.getItem("perfil") !== "admin") hook.innerHTML = "";
}

/* ========= Admin UI ========= */

function buildPermsFromForm(container) {
  const p = defaultPerms();
  if (!container) return p;
  container.querySelectorAll("input[data-perm]").forEach(chk => {
    p[chk.dataset.perm] = !!chk.checked;
  });
  return p;
}

function ensureAdminManagerUI() {
  if (localStorage.getItem("perfil") !== "admin") return;
  const hook = $("admin-manager-hook");
  if (!hook) return;

  if ($("admin-manager")) return;

  const box = document.createElement("div");
  box.id = "admin-manager";
  box.style.marginTop = "14px";
  box.style.padding = "14px";
  box.style.borderRadius = "16px";
  box.style.border = "1px solid rgba(255,255,255,.14)";
  box.style.background = "rgba(0,0,0,.18)";
  box.style.backdropFilter = "blur(10px)";
  box.style.color = "#fff";

  box.innerHTML = `
    <h3 style="margin:0 0 10px 0;">👤 Gestión de usuarios</h3>

    <div style="display:grid; gap:10px; max-width:520px;">
      <input id="adm-new-user" class="login-input" placeholder="Usuario (ej: tecnico1)" />
      <input id="adm-new-pass" class="login-input" placeholder="Clave" />

      <div id="adm-perms" style="display:grid; gap:8px; padding:10px; border-radius:14px; border:1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06);">
        <div style="font-weight:900; margin-bottom:2px;">Permisos</div>
        ${FEATURES.map(f => `
          <label style="display:flex; gap:10px; align-items:center;">
            <input type="checkbox" data-perm="${f.id}" ${f.default ? "checked" : ""} />
            <span>${f.label}</span>
          </label>
        `).join("")}
      </div>

      <button id="adm-btn-create" class="login-btn" type="button">➕ Crear / Actualizar</button>
      <div id="adm-users-list" style="margin-top:8px;"></div>
    </div>
  `;

  hook.appendChild(box);

  $("adm-btn-create").onclick = adminCreateOrUpdateUser;
  adminRenderUsers();
}

function adminCreateOrUpdateUser() {
  const user = norm($("adm-new-user")?.value).toLowerCase();
  const pass = norm($("adm-new-pass")?.value);
  const perms = buildPermsFromForm($("adm-perms"));

  if (!user || user.length < 3) return alert("Usuario inválido (mín. 3).");
  if (!pass || pass.length < 4) return alert("Clave inválida (mín. 4).");
  if (user === ADMIN_USER) return alert("Ese usuario está reservado.");

  const users = getUsers();
  const i = users.findIndex(x => x.user === user);

  const payload = { user, pass, perms, updatedAt: Date.now() };

  if (i >= 0) users[i] = payload;
  else users.push(payload);

  setUsers(users);

  $("adm-new-user").value = "";
  $("adm-new-pass").value = "";

  adminRenderUsers();
  alert("✅ Usuario guardado");
}

function adminDeleteUser(user) {
  if (!confirm(`🗑️ ¿Borrar usuario?\n\n${user}`)) return;
  setUsers(getUsers().filter(x => x.user !== user));
  adminRenderUsers();
}

function adminRenderUsers() {
  const cont = $("adm-users-list");
  if (!cont) return;

  const users = getUsers();
  if (!users.length) {
    cont.innerHTML = `<div style="opacity:.85;">No hay usuarios creados todavía.</div>`;
    return;
  }

  cont.innerHTML = users.map(u => {
    const perms = u.perms || {};
    const resumen = FEATURES
      .filter(f => perms[f.id])
      .map(f => f.label)
      .join(" • ") || "Sin permisos";

    const safeUser = String(u.user).replace(/'/g, "\\'");

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

/* ========= Logout ========= */

function logout() {
  localStorage.removeItem("logueado");
  localStorage.removeItem("perfil");
  localStorage.removeItem(SENALCO_PERMS_KEY);
  showPanel("login-unico");
}

/* ========= Bootstrap ========= */

document.addEventListener("DOMContentLoaded", () => {
  // Si ya estaba logueado, lo mando al dashboard directo
  if (localStorage.getItem("logueado") === "true") {
    showPanel("dashboard");
    setupDashboard();
    ensureAdminManagerUI();
  } else {
    showPanel("login-unico");
  }
});

/* Exponer globales para onclick */
window.loginUnico = loginUnico;
window.logout = logout;
window.adminDeleteUser = adminDeleteUser;
/***********************
 * COMPAT: LOGIN VIEJO *
 * (Alarmas/CCTV)      *
 ***********************/
(function compatLoginViejo(){
  // Si tu HTML viejo está, lo hacemos funcionar igual
  const btnsModulos = document.querySelectorAll(".login-cardbtn");

  // Si no hay botones de módulos, no hacemos nada
  if (!btnsModulos || btnsModulos.length === 0) return;

  // Si tu login.js nuevo usa login único, creamos un puente
  // Caso: tocás Alarmas/CCTV => mostramos el login único (o el panel que corresponda)
  window.mostrarLogin = function(_perfil){
    // 1) Si existe el panel nuevo
    const panelUnico = document.getElementById("login-unico");
    const dash = document.getElementById("dashboard");

    // 2) Si estás logueado -> dashboard, sino -> login único
    if (localStorage.getItem("logueado") === "true" && dash) {
      dash.classList.add("active");
      panelUnico && panelUnico.classList.remove("active");
      if (typeof setupDashboard === "function") setupDashboard();
      if (typeof ensureAdminManagerUI === "function") ensureAdminManagerUI();
      return;
    }

    if (panelUnico) {
      panelUnico.classList.add("active");
      dash && dash.classList.remove("active");
      return;
    }

    // Si no existe el panel único, caemos al comportamiento anterior (si lo tenías)
    console.warn("Compat: no existe #login-unico. Estás usando HTML viejo puro.");
  };

  // Si tu HTML viejo llama ocultarTodo()
  window.ocultarTodo = function(){
    document.getElementById("login-alarmas")?.classList.remove("active");
    document.getElementById("login-cctv")?.classList.remove("active");
    document.getElementById("seleccion-planillas")?.classList.remove("active");
    document.getElementById("admin-panel")?.classList.remove("active");
    document.getElementById("login-unico")?.classList.add("active");
    document.getElementById("dashboard")?.classList.remove("active");
  };

  // Si el HTML viejo llama validarLogin('alarmas') o validarLogin('cctv'),
  // lo redirigimos al login único (sin perfil)
  window.validarLogin = function(){
    if (typeof loginUnico === "function") return loginUnico();
    alert("Login único no encontrado (loginUnico). Revisá login.js.");
  };

  // Enganche extra: si clickean botones Alarmas/CCTV y no había onclick por cambios,
  // igual lo forzamos.
  btnsModulos.forEach(btn => {
    btn.addEventListener("click", () => window.mostrarLogin("unico"));
  });

  console.log("✅ Compat login viejo activado");
})();