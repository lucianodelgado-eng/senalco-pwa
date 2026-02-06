let perfilSeleccionado = "";

function mostrarLogin(perfil) {
    // Ocultar todos
    document.getElementById("login-caba").style.display = "none";
    document.getElementById("login-cctv").style.display = "none";
    document.getElementById("seleccion-planillas").style.display = "none";

    perfilSeleccionado = perfil;

    if (perfil === "caba") {
        document.getElementById("login-caba").style.display = "block";
    }
    if (perfil === "cctv") {
        document.getElementById("login-cctv").style.display = "block";
    }
}

function validarLogin(perfil) {
    let usuario = document.getElementById(`usuario-${perfil}`).value;
    let clave = document.getElementById(`clave-${perfil}`).value;

    const claves = {
        caba: "Senalco2025",
        cctv: "CCTV2025"
    };

    if (usuario === "admin" && clave === claves[perfil]) {
        localStorage.setItem("logueado", "true");
        localStorage.setItem("perfil", perfil);

        document.getElementById(`login-${perfil}`).style.display = "none";

        // CCTV sigue con su flujo propio
        if (perfil === "cctv") {
            window.location.href = "index2.html";
            return;
        }

        // CABA (único flujo de planillas)
        document.getElementById("seleccion-planillas").style.display = "block";

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
