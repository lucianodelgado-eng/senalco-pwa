/* login.js - Señalco (con permisos por botones) */

const SENALCO_USERS_KEY = "senalco_users_v1";
const SENALCO_PERMS_KEY = "senalco_perms_active_v1";

// ✅ Botones / features (futuro: sumás uno acá y aparece en el admin)
const FEATURES = [
  { id: "base",        label: "📊 Base de Datos",       default: true },
  { id: "relev",       label: "📋 Relevamiento Alarmas", default: true },
  { id: "cctv",        label: "🎥 Relevamiento CCTV",    default: true },
  { id: "monitoreo",   label: "🖥️ Monitoreo Web",        default: true }, // ✅ SIEMPRE true por defecto
];

// ✅ Link de monitoreo web
const MONITOREO_URL = "https://itsenalco.com/monitoreo/web/";

// ✅ Credenciales fijas del admin (solo este es admin)
const ADMIN_USER = "admin";
const ADMIN_PASS = "Senalco2025";

// ✅ Claves fijas “perfil” legacy (si querés seguir usando alarmas/cctv)
const LEGACY_CLAVES = { alarmas: "Senalco2025", cctv: "CCTV2025" };

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
function norm(s) {
  return String(s || "").trim();
}

function getUsers() {
  return lsGet(SENALCO_USERS_KEY, []);
}
function setUsers(list) {
  lsSet(SENALCO_USERS_KEY, list);
}

function defaultPerms() {
  const p = {};
  FEATURES.forEach(f => p[f.id] = !!f.default);
  return p;
}

function buildPermsFromForm(container) {
  const p = defaultPerms();
  if (!container) return p;
  container.querySelectorAll("input[data-perm]").forEach(chk => {
    p[chk.dataset.perm] = !!chk.checked;
  });
  // ✅ Monitoreo siempre permitido por defecto (si querés que sea “obligatorio”)
  if (typeof p.monitoreo !== "boolean") p.monitoreo = true;
  return p;
}

function saveActivePerms(perms) {
  lsSet(SENALCO_PERMS_KEY, perms || defaultPerms());
}
function getActivePerms() {
  return lsGet(SENALCO_PERMS_KEY, defaultPerms());
}

function isAdminLogged() {
  return localStorage.getItem("logueado") === "true" && localStorage.getItem("perfil") === "admin";
}

/* ===========================
   UI helpers (no rompe nada)
   =========================== */

function $(id) { return document.getElementById(id); }

function ocultarTodo() {
  $("login-alarmas")?.classList.remove("active");
  $("login-cctv")?.classList.remove("active");
  $("seleccion-planillas")?.classList.remove("active");
  $("admin-panel")?.classList.remove("active");
}

function mostrarLogin(perfil) {
  ocultarTodo();
  if (perfil === "alarmas") $("login-alarmas")?.classList.add("active");
  if (perfil === "cctv") $("login-cctv")?.classList.add("active");
  if (perfil === "admin") $("admin-panel")?.classList.add("active");
}

/* ===========================
   Login principal
   =========================== */

function validarLogin(perfil) {
  const usuario = norm($(`usuario-${perfil}`)?.value);
  const clave = norm($(`clave-${perfil}`)?.value);

  // ✅ Admin fijo
  if (usuario === ADMIN_USER && clave === ADMIN_PASS) {
    localStorage.setItem("logueado", "true");
    localStorage.setItem("perfil", "admin");
    saveActivePerms(defaultPerms()); // admin ve todo
    ocultarTodo();
    $("seleccion-planillas")?.classList.add("active");
    setupPlanillasUI();
    ensureAdminManagerUI(); // crea panel admin si existe hook
    return;
  }

  // ✅ Login legacy (perfil alarmas/cctv) como venía
  if (usuario === "admin" && clave === LEGACY_CLAVES[perfil]) {
    localStorage.setItem("logueado", "true");
    localStorage.setItem("perfil", perfil);

    // permisos por defecto: todo ok
    saveActivePerms(defaultPerms());

    if (perfil === "cctv") {
      window.location.href = "index2.html";
      return;
    }

    ocultarTodo();
    $("seleccion-planillas")?.classList.add("active");
    setupPlanillasUI();
    return;
  }

  // ✅ Login por usuarios creados (técnicos)
  const users = getUsers();
  const u = users.find(x => x.user === usuario);
  if (!u) {
    alert("Credenciales incorrectas");
    return;
  }
  if (u.pass !== clave) {
    alert("Credenciales incorrectas");
    return;
  }

  localStorage.setItem("logueado", "true");
  localStorage.setItem("perfil", "user"); // ✅ nunca admin
  saveActivePerms(u.perms || defaultPerms());

  ocultarTodo();
  $("seleccion-planillas")?.classList.add("active");
  setupPlanillasUI();
}

/* ===========================
   Planillas / Botones
   =========================== */

function setupPlanillasUI() {
  const perms = getActivePerms();

  // botones existentes
  const btnRelev = $("btn-relevamiento");
  const btnBase = $("btn-base");

  if (btnRelev) {
    btnRelev.style.display = perms.relev ? "inline-block" : "none";
    btnRelev.onclick = () => window.location.href = "relevamiento1.html";
  }
  if (btnBase) {
    btnBase.style.display = perms.base ? "inline-block" : "none";
    btnBase.onclick = () => window.location.href = "index-base.html";
  }

  // ✅ Botón Monitoreo Web: SIEMPRE visible por defecto
  ensureMonitoreoButton(perms);

  // (opcional) botón CCTV desde selección (si alguna vez lo agregás ahí)
  const btnCctv = $("btn-cctv");
  if (btnCctv) {
    btnCctv.style.display = perms.cctv ? "inline-block" : "none";
    btnCctv.onclick = () => window.location.href = "index2.html";
  }
}

function ensureMonitoreoButton(perms) {
  const panel = $("seleccion-planillas");
  if (!panel) return;

  let btn = $("btn-monitoreo-web");
  if (!btn) {
    // lo creamos sin tocar tu HTML
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btn-monitoreo-web";
    btn.textContent = "🖥️ Monitoreo Web";
    // estilo safe inline (no pisa tu CSS)
    btn.style.width = "100%";
    btn.style.padding = "14px";
    btn.style.borderRadius = "14px";
    btn.style.border = "0";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "900";
    btn.style.marginTop = "10px";
    btn.style.background = "#2d7dff"; // más claro
    btn.style.color = "#fff";

    // lo metemos dentro del panel, al final
    panel.appendChild(btn);
  }

  // si en el futuro lo querés restringir: perms.monitoreo
  const can = (typeof perms?.monitoreo === "boolean") ? perms.monitoreo : true;
  btn.style.display = can ? "block" : "none";
  btn.onclick = () => window.open(MONITOREO_URL, "_blank");
}

/* ===========================
   Admin: Gestión de usuarios
   (NO rompe nada: solo aparece si existe hook)
   =========================== */

function ensureAdminManagerUI() {
  // Si querés panel admin: poné un <div id="admin-manager-hook"></div> en login.html
  const hook = $("admin-manager-hook");
  if (!hook) return;

  // Evitar duplicar
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

      <button id="adm-btn-create" class="login-btn" type="button">➕ Crear / Actualizar usuario</button>
      <div id="adm-users-list" style="margin-top:8px;"></div>
    </div>
  `;

  hook.appendChild(box);

  $("adm-btn-create").onclick = () => adminCreateOrUpdateUser();
  adminRenderUsers();
}

function adminCreateOrUpdateUser() {
  const user = norm($("adm-new-user")?.value).toLowerCase();
  const pass = norm($("adm-new-pass")?.value);
  const perms = buildPermsFromForm($("adm-perms"));

  if (!user || user.length < 3) return alert("Usuario inválido (mínimo 3 caracteres).");
  if (!pass || pass.length < 4) return alert("Clave inválida (mínimo 4 caracteres).");
  if (user === ADMIN_USER) return alert("Ese usuario está reservado.");

  const users = getUsers();
  const i = users.findIndex(x => x.user === user);

  const payload = { user, pass, perms, updatedAt: Date.now() };

  if (i >= 0) users[i] = payload;
  else users.push(payload);

  setUsers(users);

  // Limpio inputs
  if ($("adm-new-user")) $("adm-new-user").value = "";
  if ($("adm-new-pass")) $("adm-new-pass").value = "";

  adminRenderUsers();
  alert("✅ Usuario guardado");
}

function adminDeleteUser(user) {
  if (!confirm(`🗑️ ¿Borrar usuario?\n\n${user}`)) return;
  const users = getUsers().filter(x => x.user !== user);
  setUsers(users);
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
      .map(f => f.label.replace(/^.. /, "")) // limpia emoji para compacto
      .join(" • ") || "Sin permisos";

    return `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; border-radius:14px; border:1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); margin-top:8px;">
        <div>
          <div style="font-weight:900;">${u.user}</div>
          <div style="font-size:12px; opacity:.85;">${resumen}</div>
        </div>
        <button type="button" class="login-btn ghost" onclick="adminDeleteUser('${u.user.replace(/'/g, "\\'")}')">🗑️ Borrar</button>
      </div>
    `;
  }).join("");
}

/* ===========================
   Exponer funciones globales
   (porque tu HTML llama onclick=...)
   =========================== */
window.ocultarTodo = ocultarTodo;
window.mostrarLogin = mostrarLogin;
window.validarLogin = validarLogin;
window.adminDeleteUser = adminDeleteUser;