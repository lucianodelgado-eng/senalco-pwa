let perfilSeleccionado = "";

function getEl(id) {
    return document.getElementById(id);
}

// Soporta ambos nombres por si el HTML quedó con id viejo
function getLoginBox(perfil) {
    if (perfil === "alarmas") return getEl("login-alarmas") || getEl("alarmas");
    if (perfil === "cctv") return getEl("login-cctv") || getEl("cctv") || getEl("login-cctv");
    return null;
}

function ocultarTodo() {
    const a = getEl("login-alarmas") || getEl("alarmas");
    const c = getEl("login-cctv") || getEl("cctv");
    const s = getEl("seleccion-planillas");

    if (a) a.style.display = "none";
    if (c) c.style.display = "none";
    if (s) s.style.display = "none";
}

function mostrarLogin(perfil) {
    ocultarTodo();
    perfilSeleccionado = perfil;

    const box = getLoginBox(perfil);
    if (!box) {
        alert("❌ No encuentro el contenedor de login de " + perfil + ". Revisá IDs en el HTML.");
        return;
    }
    box.style.display = "block";
}

function validarLogin(perfil) {
    const userEl = getEl(`usuario-${perfil}`);
    const passEl = getEl(`clave-${perfil}`);

    // Si el HTML quedó con ids viejos, los buscamos
    const usuario = (userEl?.value || "").trim();
    const clave = (passEl?.value || "").trim();

    const claves = {
        alarmas: "Senalco2025",
        cctv: "CCTV2025"
    };

    if (usuario === "admin" && clave === claves[perfil]) {
        localStorage.setItem("logueado", "true");
        localStorage.setItem("perfil", perfil);

        // Oculto el login actual (cualquiera de los IDs)
        const box = getLoginBox(perfil);
        if (box) box.style.display = "none";

        if (perfil === "cctv") {
            window.location.href = "index2.html";
            return;
        }

        // Alarmas -> selector planillas
        const sel = getEl("seleccion-planillas");
        if (!sel) {
            alert("❌ Falta el div #seleccion-planillas en el HTML.");
            return;
        }
        sel.style.display = "block";

        const btnRel = getEl("btn-relevamiento");
        const btnBase = getEl("btn-base");

        if (btnRel) btnRel.onclick = () => window.location.href = "relevamiento1.html";
        if (btnBase) btnBase.onclick = () => window.location.href = "index-base.html";

    } else {
        alert("Credenciales incorrectas");
    }
}