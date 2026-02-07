/***********************
 *  Listas desplegables
 ***********************/
const eventos = [
  "- Sin tipo definido -", "Alarma", "Robo", "Asalto",
  "clave", "Sabotaje", "Apertura de Equipo", "Puls. Remoto - Falla Red", "ALM + 4 HS", "Asalto Clave Falsa",
  "Falla activador portátil", "Falla cent. Policial. GPRS OK", "Falla Comunicación GPRS",
  "Falla de Conexión al Servidor GPRS", "Falla de PT", "Falla Enlace Red PT",
  "Falla enlace Supervisión de Radio", "Falta de 220V", "Incendio", "Otros",
  "Prevención con Policía", "Prevención de Red", "Prevención Placa Acicomp",
  "Puerta Abierta", "Sirena Disparada",
  // (si querés agregar "Averia de Linea" como en el Excel del otro sistema, descomentá)
  "Averia de Linea"
];

const areas = [
  "-", "Acceso Exterior", "Archivo", "ATM", "AutoConsulta", "Baños", "Bunker",
  "Caja de Seguridad", "Cajas de Pago", "Castillete", "Central Incendio", "Cocina",
  "Deposito", "Gerencia", "Guardia", "Oficinas", "Recinto ATM - Area",
  "Recinto Autocons", "Recinto Caja Seg", "Recinto Tesoro", "Sala Back Office",
  "T.A.S.", "Terraza", "Tesorería", "Tesoro Boveda", "Tesoro Documentos",
  "Tesoro Efectivo", "Tesoro Movil", "Volumetrica", "Otros"
];

const dispositivos = [
  "-",
  "Activado Portatil",
  "Sismico",
  "Puerta",
  "Termico",
  "Sabotaje",
  "Volumetricos",
  "Infrarrojo Pasivo",
  "Puerta Exterior",
  "Pulsador Fijo",
  "Pulsador Remoto",
  "Sensor de Humo",
  "Tamper Teclado",
  "Tapa Superior",
  "otros"
];

/***********************
 *  Init / bindings
 ***********************/
function asignarEventosBase() {
  document.getElementById("btn-limpiar-base")?.addEventListener("click", limpiarBase);
  document.getElementById("btn-generar-pdf-base")?.addEventListener("click", generarPDF);
  document.getElementById("btn-excel-base")?.addEventListener("click", generarExcel);

  document.getElementById("btn-volver")?.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

/***********************
 *  Zonas 1..24 FIX
 ***********************/
function precargarZonas(desde = 1, hasta = 24) {
  const tbody = document.querySelector("#tabla-base tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  for (let i = desde; i <= hasta; i++) {
    const fila = document.createElement("tr");

    // ✅ ZONA FIJA (NO EDITABLE) -> número puro: 1,2,3...
    const celdaZona = document.createElement("td");
    celdaZona.textContent = String(i);

    // EVENTO
    const celdaEvento = document.createElement("td");
    const selectEvento = document.createElement("select");
    eventos.forEach(e => {
      const option = document.createElement("option");
      option.textContent = e;
      option.value = e;
      selectEvento.appendChild(option);
    });
    const inputEventoOtro = document.createElement("input");
    inputEventoOtro.placeholder = "Especificar evento";
    inputEventoOtro.style.display = "none";
    selectEvento.addEventListener("change", () => {
      inputEventoOtro.style.display = selectEvento.value === "Otros" ? "inline-block" : "none";
    });
    celdaEvento.appendChild(selectEvento);
    celdaEvento.appendChild(inputEventoOtro);

    // ÁREA
    const celdaArea = document.createElement("td");
    const selectArea = document.createElement("select");
    areas.forEach(a => {
      const option = document.createElement("option");
      option.textContent = a;
      option.value = a;
      selectArea.appendChild(option);
    });
    const inputAreaOtro = document.createElement("input");
    inputAreaOtro.placeholder = "Especificar área";
    inputAreaOtro.style.display = "none";
    selectArea.addEventListener("change", () => {
      inputAreaOtro.style.display = selectArea.value === "Otros" ? "inline-block" : "none";
    });
    celdaArea.appendChild(selectArea);
    celdaArea.appendChild(inputAreaOtro);

    // DISPOSITIVO
    const celdaDispositivo = document.createElement("td");
    const selectDispositivo = document.createElement("select");
    dispositivos.forEach(d => {
      const option = document.createElement("option");
      option.textContent = d;
      option.value = d;
      selectDispositivo.appendChild(option);
    });
    const inputDispositivoOtro = document.createElement("input");
    inputDispositivoOtro.placeholder = "Especificar dispositivo";
    inputDispositivoOtro.style.display = "none";
    selectDispositivo.addEventListener("change", () => {
      inputDispositivoOtro.style.display = selectDispositivo.value === "otros" ? "inline-block" : "none";
    });
    celdaDispositivo.appendChild(selectDispositivo);
    celdaDispositivo.appendChild(inputDispositivoOtro);

    // DESCRIPCIÓN
    const celdaDescripcion = document.createElement("td");
    const inputDescripcion = document.createElement("input");
    celdaDescripcion.appendChild(inputDescripcion);

    fila.appendChild(celdaZona);
    fila.appendChild(celdaEvento);
    fila.appendChild(celdaArea);
    fila.appendChild(celdaDispositivo);
    fila.appendChild(celdaDescripcion);

    tbody.appendChild(fila);
  }
}

/***********************
 *  Limpiar
 ***********************/
function limpiarBase() {
  document.getElementById("entidad").value = "";
  document.getElementById("sucursal").value = "";
  document.getElementById("abonado").value = "";
  document.getElementById("central").value = "";
  document.getElementById("provincia").value = "";
  // ✅ vuelve a crear zonas 1..24
  precargarZonas(1, 24);
}

/***********************
 *  PDF
 ***********************/
function generarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Base de Datos - Señalco", 14, 14);

  // Logo si existe
  try {
    const logoImg = document.getElementById("logo-pdf");
    if (logoImg && logoImg.complete) {
      const canvas = document.createElement("canvas");
      canvas.width = logoImg.naturalWidth;
      canvas.height = logoImg.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(logoImg, 0, 0);
      const dataURL = canvas.toDataURL("image/jpeg");
      doc.addImage(dataURL, "JPEG", 160, 10, 40, 20);
    }
  } catch (e) {}

  const entidad = document.getElementById("entidad").value;
  const sucursal = document.getElementById("sucursal").value;
  const abonado = document.getElementById("abonado").value;
  const central = document.getElementById("central").value;
  const provincia = document.getElementById("provincia")?.value || "";

  doc.setFontSize(11);
  doc.text(`Entidad: ${entidad}`, 14, 24);
  doc.text(`Sucursal: ${sucursal}`, 14, 32);
  doc.text(`Abonado: ${abonado}`, 100, 24);
  doc.text(`Central: ${central}`, 100, 32);
  doc.text(`Provincia: ${provincia}`, 14, 40);

  const columnas = ["Zona", "Evento", "Área", "Dispositivo", "Descripción"];
  const filas = [];

  const filasTabla = document.querySelectorAll("#tabla-base tbody tr");
  filasTabla.forEach(fila => {
    const celdas = fila.querySelectorAll("td");
    filas.push([
      celdas[0].textContent, // ✅ 1,2,3...
      celdas[1].querySelector("select").value,
      celdas[2].querySelector("select").value,
      celdas[3].querySelector("select").value,
      celdas[4].querySelector("input").value
    ]);
  });

  doc.autoTable({ head: [columnas], body: filas, startY: 50 });

  const nombreArchivo = `base_${entidad}_${sucursal}.pdf`.replace(/\s+/g, "_");
  doc.save(nombreArchivo);
}

/***********************
 *  Excel (export)
 ***********************/
function generarExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Base");

  sheet.addRow(["Zona", "Evento", "Area", "Dispositivo", "Desc"]);

  const filas = document.querySelectorAll("#tabla-base tbody tr");
  filas.forEach(fila => {
    const celdas = fila.querySelectorAll("td");
    sheet.addRow([
      celdas[0].textContent, // ✅ 1,2,3...
      celdas[1].querySelector("select").value,
      celdas[2].querySelector("select").value,
      celdas[3].querySelector("select").value,
      celdas[4].querySelector("input").value
    ]);
  });

  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "base.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  });
}