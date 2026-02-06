let perfilSeleccionado = "";

function mostrarLogin(perfil) {
    document.getElementById("login-caba").style.display = "none";
    document.getElementById("login-interior").style.display = "none";
    document.getElementById("login-cctv").style.display = "none";
    document.getElementById("seleccion-planillas").style.display = "none";

    perfilSeleccionado = perfil;

    if (perfil === "caba") {
        document.getElementById("login-caba").style.display = "block";
    } else if (perfil === "interior") {
        document.getElementById("login-interior").style.display = "block";
    } else if (perfil === "cctv") {
        document.getElementById("login-cctv").style.display = "block";
    }
}

function validarLogin(perfil) {
    let usuario = document.getElementById(`usuario-${perfil}`).value;
    let clave = document.getElementById(`clave-${perfil}`).value;

    const claves = {
        caba: "Senalco2025",
        interior: "Se2025interior",
        cctv: "CCTV2025"
    };

    if (usuario === "admin" && clave === claves[perfil]) {
        localStorage.setItem("logueado", "true");
        localStorage.setItem("perfil", perfil);

        document.getElementById(`login-${perfil}`).style.display = "none";

        if (perfil === "cctv") {
            window.location.href = "index2.html";
        } else {
            document.getElementById("seleccion-planillas").style.display = "block";

            // Redirecciones según perfil
            document.getElementById("btn-relevamiento").onclick = () => {
                window.location.href = perfil === "caba" ? "index.html" : "index-interior.html";
            };

            document.getElementById("btn-base").onclick = () => {
                window.location.href = perfil === "caba" ? "index-base.html" : "index-base-interior.html";
            };
        }
    } else {
        alert("Credenciales incorrectas");
    }
}
