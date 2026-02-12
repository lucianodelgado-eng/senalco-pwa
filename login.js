/*******************************
 * Señalco - Login + Users DB  *
 *******************************/
const USERS_KEY = "senalco_users_v1";

/**
 * Estructura:
 * {
 *   version: 1,
 *   users: [
 *     { username, password, role: "admin"|"user", enabled: true, modules: { alarmas:true, cctv:true } }
 *   ]
 * }
 */

function loadUsersDB() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveUsersDB(db) {
  localStorage.setItem(USERS_KEY, JSON.stringify(db));
}

function ensureUsersDB() {
  let db = loadUsersDB();
  if (db && Array.isArray(db.users)) return db;

  db = {
    version: 1,
    users: [
      {
        username: "admin",
        password: "LSenalco2025",
        role: "admin",
        enabled: true,
        modules: { alarmas: true, cctv: true }
      }
    ]
  };
  saveUsersDB(db);
  return db;
}

function findUser(username) {
  const db = ensureUsersDB();
  return db.users.find(u => (u.username || "").toLowerCase() === (username || "").toLowerCase()) || null;
}

function validateUser(username, password, perfil) {
  const u = findUser(username);
  if (!u) return { ok: false, msg: "Usuario no habilitado" };
  if (!u.enabled) return { ok: false, msg: "Usuario deshabilitado" };
  if (String(u.password || "") !== String(password || "")) return { ok: false, msg: "Clave incorrecta" };
  if (!u.modules || u.modules[perfil] !== true) return { ok: false, msg: "Sin permiso para este módulo" };
  return { ok: true, user: u };
}

/** =========================
 * UI helpers
 * ========================= */
function ocultarTodo() {
  document.getElementById("login-alarmas")?.classList.remove("active");
  document.getElementById("login-cctv")?.classList.remove("active");
  document.getElementById("seleccion-planillas")?.classList.remove("active");
  document.getElementById("panel-admin")?.classList.remove("active");
}

function mostrarLogin(perfil) {
  ocultarTodo();
  if (perfil === "alarmas") document.getElementById("login-alarmas")?.classList.add("active");
  if (perfil === "cctv") document.getElementById("login-cctv")?.classList.add("active");
}

/** =========================
 * Login flow
 * ========================= */
function validarLogin(perfil) {
  ensureUsersDB();

  const usuario = document.getElementById(`usuario-${perfil}`)?.value?.trim() || "";
  const clave = document.getElementById(`clave-${perfil}`)?.value?.trim() || "";

  const res = validateUser(usuario, clave, perfil);
  if (!res.ok) {
    alert(res.msg || "No autorizado");
    return;
  }

  const u = res.user;

  localStorage.setItem("logueado", "true");
  localStorage.setItem("perfil", perfil);
  localStorage.setItem("usuario", u.username);
  localStorage.setItem("rol", u.role);

  // CCTV directo
  if (perfil === "cctv") {
    window.location.href = "index2.html";
    return;
  }

  // Alarmas => selector de planillas
  ocultarTodo();
  document.getElementById("seleccion-planillas")?.classList.add("active");

  document.getElementById("btn-relevamiento").onclick = () => {
    window.location.href = "relevamiento1.html";
  };
  document.getElementById("btn-base").onclick = () => {
    window.location.href = "index-base.html";
  };

  // Si es admin, mostramos botón de gestión
  if (u.role === "admin") {
    injectAdminPanelOnce();
    document.getElementById("btn-abrir-admin")?.classList.remove("hidden");
  } else {
    document.getElementById("btn-abrir-admin")?.classList.add("hidden");
  }
}

/** =========================
 * Admin Panel (CRUD users)
 * Se inyecta sin romper tu HTML
 * ========================= */
function injectAdminPanelOnce() {
  if (document.getElementById("panel-admin")) return;

  const sel = document.getElementById("seleccion-planillas");
  if (!sel) return;

  // Botonera extra (Monitoreo + Remito + Admin)
  const extra = document.createElement("div");
  extra.style.marginTop = "12px";
  extra.innerHTML = `
    <div style="display:grid; gap:10px;">
      <button id="btn-monitoreo-web" style="padding:14px;border-radius:14px;border:0;font-weight:900;cursor:pointer;background:#25a244;color:#fff;font-size:16px;">
        🌐 Monitoreo Web
      </button>

      <button id="btn-remito-app" style="padding:14px;border-radius:14px;border:0;font-weight:900;cursor:pointer;background:#f4a261;color:#000;font-size:16px;">
        🧾 Remito (APK)
      </button>

      <button id="btn-abrir-admin" class="hidden" style="padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.18);font-weight:900;cursor:pointer;background:transparent;color:#fff;font-size:15px;">
        👤 Gestión de usuarios
      </button>
    </div>
  `;
  sel.appendChild(extra);

  document.getElementById("btn-monitoreo-web")?.addEventListener("click", () => {
    window.open("https://itsenalco.com/monitoreo/web/", "_blank");
  });

  // Esto requiere que subas remito.apk al repo (misma carpeta que index.html)
  document.getElementById("btn-remito-app")?.addEventListener("click", () => {
    window.open("./remito.apk", "_blank");
  });

  document.getElementById("btn-abrir-admin")?.addEventListener("click", () => {
    ocultarTodo();
    document.getElementById("panel-admin")?.classList.add("active");
    renderUsersList();
  });

  // Panel admin
  const adminPanel = document.createElement("section");
  adminPanel.id = "panel-admin";
  adminPanel.className = "login-panel"; // usa tu CSS login-panel
  adminPanel.innerHTML = `
    <h2 style="margin:0 0 10px 0;font-size:18px;">👤 Gestión de usuarios</h2>

    <div style="display:grid; gap:10px; margin-bottom:12px;">
      <div>
        <div style="font-size:12px;opacity:.85;margin-bottom:6px;">Usuario</div>
        <input id="adm-username" class="login-input" placeholder="ej: fernando" />
      </div>

      <div>
        <div style="font-size:12px;opacity:.85;margin-bottom:6px;">Clave</div>
        <input id="adm-password" class="login-input" placeholder="clave" />
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="adm-mod-alarmas" checked> Alarmas
        </label>
        <label style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="adm-mod-cctv"> CCTV
        </label>
        <label style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="adm-role-admin"> Admin
        </label>
      </div>

      <button id="adm-create" class="login-btn" type="button">➕ Crear / Actualizar</button>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,.14); padding-top:12px;">
      <div style="font-size:12px;opacity:.85;margin-bottom:8px;">Usuarios:</div>
      <div id="adm-users-list" style="display:grid; gap:10px;"></div>
    </div>

    <div class="login-actions" style="margin-top:12px;">
      <button class="login-btn ghost" type="button" id="adm-back">Volver</button>
    </div>
  `;
  sel.parentElement?.appendChild(adminPanel);

  document.getElementById("adm-back")?.addEventListener("click", () => {
    ocultarTodo();
    document.getElementById("seleccion-planillas")?.classList.add("active");
  });

  document.getElementById("adm-create")?.addEventListener("click", () => {
    const username = document.getElementById("adm-username")?.value?.trim();
    const password = document.getElementById("adm-password")?.value?.trim();
    const modAlarmas = !!document.getElementById("adm-mod-alarmas")?.checked;
    const modCctv = !!document.getElementById("adm-mod-cctv")?.checked;
    const isAdmin = !!document.getElementById("adm-role-admin")?.checked;

    if (!username || username.length < 3) return alert("Usuario mínimo 3 caracteres.");
    if (!password || password.length < 3) return alert("Clave mínima 3 caracteres.");
    if (!modAlarmas && !modCctv) return alert("Elegí al menos 1 módulo.");

    const db = ensureUsersDB();
    const existing = db.users.find(u => (u.username || "").toLowerCase() === username.toLowerCase());

    const userObj = {
      username,
      password,
      role: isAdmin ? "admin" : "user",
      enabled: true,
      modules: { alarmas: modAlarmas, cctv: modCctv }
    };

    if (existing) {
      Object.assign(existing, userObj);
    } else {
      db.users.push(userObj);
    }

    saveUsersDB(db);
    renderUsersList();
    alert("✅ Usuario guardado");
  });
}

function renderUsersList() {
  const box = document.getElementById("adm-users-list");
  if (!box) return;

  const db = ensureUsersDB();
  const users = (db.users || []).slice().sort((a, b) => (a.username || "").localeCompare(b.username || ""));

  box.innerHTML = "";

  users.forEach(u => {
    const row = document.createElement("div");
    row.style.border = "1px solid rgba(255,255,255,.14)";
    row.style.borderRadius = "14px";
    row.style.padding = "12px";
    row.style.background = "rgba(255,255,255,.06)";

    const mods = [];
    if (u.modules?.alarmas) mods.push("Alarmas");
    if (u.modules?.cctv) mods.push("CCTV");

    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div>
          <div style="font-weight:900">${u.username}</div>
          <div style="font-size:12px;opacity:.85">
            Rol: ${u.role || "user"} • Estado: ${u.enabled ? "✅ habilitado" : "⛔ deshabilitado"} • Módulos: ${mods.join(", ") || "-"}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="login-btn ghost" type="button" data-act="toggle">${u.enabled ? "Deshabilitar" : "Habilitar"}</button>
          <button class="login-btn ghost" type="button" data-act="edit">Editar</button>
          <button class="login-btn" type="button" data-act="del" style="background:#b00020">Borrar</button>
        </div>
      </div>
    `;

    row.querySelector('[data-act="toggle"]').addEventListener("click", () => {
      const db2 = ensureUsersDB();
      const uu = db2.users.find(x => x.username === u.username);
      if (!uu) return;
      if (uu.username === "admin") return alert("No se puede deshabilitar admin.");
      uu.enabled = !uu.enabled;
      saveUsersDB(db2);
      renderUsersList();
    });

    row.querySelector('[data-act="edit"]').addEventListener("click", () => {
      document.getElementById("adm-username").value = u.username || "";
      document.getElementById("adm-password").value = u.password || "";
      document.getElementById("adm-mod-alarmas").checked = !!u.modules?.alarmas;
      document.getElementById("adm-mod-cctv").checked = !!u.modules?.cctv;
      document.getElementById("adm-role-admin").checked = (u.role === "admin");
    });

    row.querySelector('[data-act="del"]').addEventListener("click", () => {
      if (u.username === "admin") return alert("No se puede borrar admin.");
      if (!confirm(`¿Borrar usuario "${u.username}"?`)) return;

      const db2 = ensureUsersDB();
      db2.users = db2.users.filter(x => x.username !== u.username);
      saveUsersDB(db2);
      renderUsersList();
    });

    box.appendChild(row);
  });
}