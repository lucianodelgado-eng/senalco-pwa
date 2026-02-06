function ocultarTodo() {
  const ids = ["login-alarmas", "login-cctv"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function mostrarLogin(tipo) {
  ocultarTodo();

  const id = tipo === "alarmas" ? "login-alarmas" : "login-cctv";
  const box = document.getElementById(id);

  if (!box) {
    console.error("No existe el contenedor:", id);
    return;
  }
  box.style.display = "block";
}

function validarLogin(tipo) {
  const usuario = document.getElementById(`usuario-${tipo}`)?.value || "";
  const clave = document.getElementById(`clave-${tipo}`)?.value || "";

  const claves = {
    alarmas: "Senalco2025",
    cctv: "CCTV2025"
  };

  if (usuario === "admin" && clave === claves[tipo]) {
    localStorage.setItem("logueado", "true");
    localStorage.setItem("perfil", tipo);

    if (tipo === "cctv") {
      window.location.href = "relevamiento.html"; // o el que uses para CCTV
    } else {
      window.location.href = "base.html"; // o el que uses para Alarmas
    }
  } else {
    alert("Credenciales incorrectas");
  }
}
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(() => console.log("✅ Service Worker registrado"))
      .catch(err => console.error("❌ SW error", err));
  });
}