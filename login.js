/***********************
 * login.js (con usuarios)
 ***********************/

const USERS_KEY = "senalco_users_v1";

function loadUsers() {
  try {
    const arr = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (Array.isArray(arr)) return arr;
    return [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users || []));
}

function ensureDefaultAdmin() {
  const users = loadUsers();
  if (!users.some(u => u.user === "admin")) {
    users.push({ user: "admin", pass: "Senalco2025", role: "admin", active: true });
    saveUsers(users);
  }
}

function findUser(username) {
  const users = loadUsers();
  return users.find(u => (u.user || "").toLowerCase() === (username || "").toLowerCase()) || null;
}

function ocultarTodo() {
  document.getElementById("login-alarmas")?.classList.remove("active");
  document.getElementById("login-cctv")?.classList.remove("active");
  document.getElementById("seleccion-planillas")?.classList.remove("active");
}

function mostrarLogin(perfil) {
  ocultarTodo();
  if (perfil === "alarmas") document.getElementById("login-alarmas")?.classList.add("active");
  if (perfil === "cctv") document.getElementById("login-cctv")?.classList.add("active");
}

/** Admin manager (prompt-based, cero HTML extra) */
function adminUserManager() {
  const choice = prompt(
    "Gestión de usuarios (admin)\n\n" +
    "1 = Listar\n" +
    "2 = Crear\n" +
    "3 = Borrar\n\n" +
    "Escribí 1, 2 o 3:"
  );
  if (!choice) return;

  if (choice === "1") {
    const users = loadUsers();
    const txt = users
      .map(u => `${u.user}  | role:${u.role || "user"} | ${u.active === false ? "INACTIVO" : "ACTIVO"}`)
      .join("\n");
    alert(txt || "No hay usuarios");
    return;
  }

  if (choice === "2") {
    const user = (prompt("Nuevo usuario (sin espacios):") || "").trim();
    if (!user) return;
    const pass = (prompt("Clave para ese usuario:") || "").trim();
    if (!pass) return;
    const role = (prompt("Rol (admin/tecnico). Enter = tecnico") || "tecnico").trim() || "tecnico";

    const users = loadUsers();
    if (users.some(u => (u.user || "").toLowerCase() === user.toLowerCase())) {
      alert("Ese usuario ya existe.");
      return;
    }

    users.push({ user, pass, role, active: true });
    saveUsers(users);
    alert("✅ Usuario creado: " + user);
    return;
  }

  if (choice === "3") {
    const user = (prompt("Usuario a borrar:") || "").trim();
    if (!user) return;
    if (user.toLowerCase() === "admin") {
      alert("No podés borrar admin.");
      return;
    }

    const users = loadUsers();
    const before = users.length;
    const filtered = users.filter(u => (u.user || "").toLowerCase() !== user.toLowerCase());
    if (filtered.length === before) {
      alert("No existe ese usuario.");
      return;
    }
    saveUsers(filtered);
    alert("🗑️ Usuario borrado: " + user);
    return;
  }

  alert("Opción inválida.");
}

function injectAdminButtonsIfNeeded(role) {
  // Botón Monitoreo Web siempre visible en selección planillas (cuando alarmas loguea)
  const panel = document.getElementById("seleccion-planillas");
  if (!panel) return;

  // Evitar duplicar
  if (!document.getElementById("btn-monitoreo-web")) {
    const btn = document.createElement("button");
    btn.id = "btn-monitoreo-web";
    btn.type = "button";
    btn.className = "login-btn ghost";
    btn.textContent = "🖥️ Monitoreo Web";
    btn.onclick = () => window.open("https://itsenalco.com/monitoreo/web/", "_blank");
    // lo metemos abajo
    panel.appendChild(document.createElement("div")).style.height = "10px";
    panel.appendChild(btn);
  }

  // Botón gestión usuarios solo admin
  if (role === "admin" && !document.getElementById("btn-gestionar-usuarios")) {
    const btn = document.createElement("button");
    btn.id = "btn-gestionar-usuarios";
    btn.type = "button";
    btn.className = "login-btn";
    btn.textContent = "👤 Gestionar usuarios";
    btn.onclick = adminUserManager;
    panel.appendChild(document.createElement("div")).style.height = "10px";
    panel.appendChild(btn);
  }
}

function validarLogin(perfil) {
  ensureDefaultAdmin();

  const usuario = document.getElementById(`usuario-${perfil}`)?.value?.trim() || "";
  const clave = document.getElementById(`clave-${perfil}`)?.value?.trim() || "";

  // CCTV: mantenemos simple (podés migrarlo luego a users también)
  if (perfil === "cctv") {
    const ok = (usuario.toLowerCase() === "admin" && clave === "CCTV2025");
    if (!ok) return alert("Credenciales incorrectas");
    localStorage.setItem("logueado", "true");
    localStorage.setItem("perfil", "cctv");
    localStorage.setItem("user", "admin");
    localStorage.setItem("role", "admin");
    window.location.href = "index2.html";
    return;
  }

  // Alarmas: usuarios gestionables
  const u = findUser(usuario);
  if (!u || u.active === false) return alert("Usuario no habilitado");
  if (u.pass !== clave) return alert("Credenciales incorrectas");

  localStorage.setItem("logueado", "true");
  localStorage.setItem("perfil", "alarmas");
  localStorage.setItem("user", u.user);
  localStorage.setItem("role", u.role || "tecnico");

  ocultarTodo();
  document.getElementById("seleccion-planillas")?.classList.add("active");

  // Botones ya existentes en tu HTML
  document.getElementById("btn-relevamiento").onclick = () => {
    window.location.href = "relevamiento1.html";
  };
  document.getElementById("btn-base").onclick = () => {
    window.location.href = "index-base.html";
  };

  // Inyecta: Monitoreo + Gestión usuarios (si admin)
  injectAdminButtonsIfNeeded(u.role || "tecnico");
}