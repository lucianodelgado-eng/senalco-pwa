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

function validarLogin(perfil) {
    const usuario = document.getElementById(`usuario-${perfil}`)?.value?.trim() || "";
    const clave = document.getElementById(`clave-${perfil}`)?.value?.trim() || "";

    const claves = { alarmas: "Senalco2025", cctv: "CCTV2025" };

    if (usuario === "admin" && clave === claves[perfil]) {
        localStorage.setItem("logueado", "true");
        localStorage.setItem("perfil", perfil);

        if (perfil === "cctv") {
            window.location.href = "index2.html";
            return;
        }

        ocultarTodo();
        document.getElementById("seleccion-planillas")?.classList.add("active");

        document.getElementById("btn-relevamiento").onclick = () => {
            window.location.href = "relevamiento1.html";
        };
        document.getElementById("btn-base").onclick = () => {
            window.location.href = "index-base.html";
        };

    } else {
        alert("Credenciales incorrectas");
    }
}
