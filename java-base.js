// ===============================
// LISTAS BASE
// ===============================
const eventos = [
  "- Sin tipo definido -", "Alarma", "Robo", "Asalto",
  "clave", "Sabotaje", "Apertura de Equipo", "Puls. Remoto - Falla Red", "ALM + 4 HS", "Asalto Clave Falsa",
  "Falla activador portátil", "Falla cent. Policial. GPRS OK", "Falla Comunicación GPRS",
  "Falla de Conexión al Servidor GPRS", "Falla de PT", "Falla Enlace Red PT",
  "Falla enlace Supervisión de Radio", "Falta de 220V", "Incendio", "Otros",
  "Prevención con Policía", "Prevención de Red", "Prevención Placa Acicomp",
  "Puerta Abierta", "Sirena Disparada"
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

// ===============================
// INIT
// ===============================
function asignarEventosBase() {
  document.getElementById("btn-limpiar-base")?.addEventListener("click", limpiarBase);
  document.getElementById("btn-generar-pdf-base")?.addEventListener("click", generarPDF);
  document.getElementById("btn-excel-base")?.addEventListener("click", async () => {
    await generarExcel(); // descarga
  });

  // Subir Excel a modificar
  document.getElementById("btn-subir-excel")?.addEventListener("click", () => {
    document.getElementById("input-excel-base")?.click();
  });

  document.getElementById("input-excel-base")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importarDesdeExcel(file);
      cargarBaseEnFormulario(data);
      alert("✅ Excel cargado. Ya podés modificar.");
    } catch (err) {
      console.error(err);
      alert("❌ No pude leer ese Excel.\nAsegurate que sea exportado por la app.");
    } finally {
      e.target.value = "";
    }
  });

  // Previsualizar
  document.getElementById("btn-previsualizar")?.addEventListener("click", () => abrirPrevisualizacion());
  document.getElementById("btn-cerrar-prev")?.addEventListener("click", () => cerrarModal("modal-prev"));
  document.getElementById("btn-descargar-pdf-prev")?.addEventListener("click", () => generarPDF());

  // Guardar local
  document.getElementById("btn-guardar-local")?.addEventListener("click", () => {
    const nombre = prompt("Nombre para guardar (ej: Galicia_Suc123):", "");
    guardarBaseLocal(nombre);
  });

  // Modal mis bases
  document.getElementById("btn-mis-bases")?.addEventListener("click", abrirModalBases);
  document.getElementById("btn-cerrar-bases")?.addEventListener("click", () => cerrarModal("modal-bases"));

  document.getElementById("btn-guardar-como")?.addEventListener("click", () => {
    const nombre = document.getElementById("nombre-base")?.value || "";
    guardarBaseLocal(nombre);
    renderListaBases();
  });

  document.getElementById("btn-descargar-json")?.addEventListener("click", () => {
    const data = capturarBaseDesdeFormulario();
    const nombre = `base_${(data.entidad || "ENTIDAD")}_${(data.sucursal || "SUC")}.json`.replace(/\s+/g, "_");
    descargarArchivo(nombre, JSON.stringify(data, null, 2), "application/json");
  });

  document.getElementById("btn-importar-json")?.addEventListener("click", () => {
    document.getElementById("input-json-base")?.click();
  });

  document.getElementById("input-json-base")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importarBaseDesdeJSONFile(file);
      cargarBaseEnFormulario(data);
      alert("✅ JSON cargado");
      cerrarModal("modal-bases");
    } catch (err) {
      console.error(err);
      alert("❌ No pude importar ese JSON.");
    } finally {
      e.target.value = "";
    }
  });

  // ✅ COMPARTIR (WhatsApp/Mail/etc.)
  document.getElementById("btn-compartir-json")?.addEventListener("click", async () => {
    try {
      const data = capturarBaseDesdeFormulario();
      const nombre = `base_${(data.entidad || "ENTIDAD")}_${(data.sucursal || "SUC")}.json`.replace(/\s+/g, "_");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const file = new File([blob], nombre, { type: "application/json" });
      await compartirArchivoNativo(file, `Base Señalco ${data.entidad || ""} ${data.sucursal || ""}`);
    } catch (e) {
      console.error(e);
      alert("❌ No pude abrir compartir.\nSi no aparece WhatsApp/Mail, descargalo y compartilo desde Descargas.");
    }
  });

  document.getElementById("btn-compartir-excel")?.addEventListener("click", async () => {
    try {
      const { file, name, title } = await generarExcelComoFile();
      await compartirArchivoNativo(file, title || name);
    } catch (e) {
      console.error(e);
      alert("❌ No pude abrir compartir.\nSi no aparece WhatsApp/Mail, exportá el Excel y compartilo desde Descargas.");
    }
  });
}

// ===============================
// TABLE
// ===============================
function precargarZonas() {
  const tbody = document.querySelector("#tabla-base tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  for (let i = 4; i <= 24; i++) {
    const fila = document.createElement("tr");

    const celdaZona = document.createElement("td");
    celdaZona.textContent = "Zona " + i;

    // EVENTO
    const celdaEvento = document.createElement("td");
    const selectEvento = document.createElement("select");
    eventos.forEach(e => {
      const option = document.createElement("option");
      option.textContent = e;
      selectEvento.appendChild(option);
    });
    const inputEventoOtro = document.createElement("input");
    inputEventoOtro.className = "zonaInput";
    inputEventoOtro.placeholder = "Especificar evento";
    inputEventoOtro.style.display = "none";
    selectEvento.addEventListener("change", () => {
      inputEventoOtro.style.display = (selectEvento.value === "Otros") ? "block" : "none";
    });
    celdaEvento.appendChild(selectEvento);
    celdaEvento.appendChild(inputEventoOtro);

    // ÁREA
    const celdaArea = document.createElement("td");
    const selectArea = document.createElement("select");
    areas.forEach(a => {
      const option = document.createElement("option");
      option.textContent = a;
      selectArea.appendChild(option);
    });
    const inputAreaOtro = document.createElement("input");
    inputAreaOtro.className = "zonaInput";
    inputAreaOtro.placeholder = "Especificar área";
    inputAreaOtro.style.display = "none";
    selectArea.addEventListener("change", () => {
      inputAreaOtro.style.display = (selectArea.value === "Otros") ? "block" : "none";
    });
    celdaArea.appendChild(selectArea);
    celdaArea.appendChild(inputAreaOtro);

    // DISPOSITIVO
    const celdaDispositivo = document.createElement("td");
    const selectDispositivo = document.createElement("select");
    dispositivos.forEach(d => {
      const option = document.createElement("option");
      option.textContent = d;
      selectDispositivo.appendChild(option);
    });
    const inputDispositivoOtro = document.createElement("input");
    inputDispositivoOtro.className = "zonaInput";
    inputDispositivoOtro.placeholder = "Especificar dispositivo";
    inputDispositivoOtro.style.display = "none";
    selectDispositivo.addEventListener("change", () => {
      inputDispositivoOtro.style.display = (selectDispositivo.value === "otros") ? "block" : "none";
    });
    celdaDispositivo.appendChild(selectDispositivo);
    celdaDispositivo.appendChild(inputDispositivoOtro);

    // DESCRIPCIÓN
    const celdaDescripcion = document.createElement("td");
    const inputDescripcion = document.createElement("input");
    inputDescripcion.className = "zonaInput";
    celdaDescripcion.appendChild(inputDescripcion);

    fila.appendChild(celdaZona);
    fila.appendChild(celdaEvento);
    fila.appendChild(celdaArea);
    fila.appendChild(celdaDispositivo);
    fila.appendChild(celdaDescripcion);

    tbody.appendChild(fila);
  }
}

function limpiarBase() {
  document.getElementById("entidad").value = "";
  document.getElementById("sucursal").value = "";
  document.getElementById("abonado").value = "";
  document.getElementById("central").value = "";
  document.getElementById("provincia").value = "";
  precargarZonas();
}

function capturarBaseDesdeFormulario() {
  const datos = {
    entidad: document.getElementById("entidad").value || "",
    sucursal: document.getElementById("sucursal").value || "",
    abonado: document.getElementById("abonado").value || "",
    central: document.getElementById("central").value || "",
    provincia: document.getElementById("provincia").value || "",
    zonas: []
  };

  const filas = document.querySelectorAll("#tabla-base tbody tr");
  filas.forEach(fila => {
    const celdas = fila.querySelectorAll("td");
    const zonaTxt = celdas[0].textContent;

    const selectEvento = celdas[1].querySelector("select");
    const inputEvento = celdas[1].querySelector("input");
    const evento = (selectEvento.value === "Otros") ? (inputEvento.value || "Otros") : selectEvento.value;

    const selectArea = celdas[2].querySelector("select");
    const inputArea = celdas[2].querySelector("input");
    const area = (selectArea.value === "Otros") ? (inputArea.value || "Otros") : selectArea.value;

    const selectDisp = celdas[3].querySelector("select");
    const inputDisp = celdas[3].querySelector("input");
    const dispositivo = (selectDisp.value === "otros") ? (inputDisp.value || "otros") : selectDisp.value;

    const descripcion = celdas[4].querySelector("input").value || "";

    datos.zonas.push({ zona: zonaTxt, evento, area, dispositivo, descripcion });
  });

  return datos;
}

function cargarBaseEnFormulario(data) {
  document.getElementById("entidad").value = data.entidad || "";
  document.getElementById("sucursal").value = data.sucursal || "";
  document.getElementById("abonado").value = data.abonado || "";
  document.getElementById("central").value = data.central || "";
  document.getElementById("provincia").value = data.provincia || "";

  precargarZonas();

  const filas = document.querySelectorAll("#tabla-base tbody tr");
  (data.zonas || []).forEach((z, i) => {
    if (!filas[i]) return;
    const celdas = filas[i].querySelectorAll("td");

    // EVENTO
    const selEv = celdas[1].querySelector("select");
    const inpEv = celdas[1].querySelector("input");
    if (eventos.includes(z.evento)) {
      selEv.value = z.evento;
      inpEv.style.display = "none";
      inpEv.value = "";
    } else {
      selEv.value = "Otros";
      inpEv.style.display = "block";
      inpEv.value = z.evento || "";
    }

    // ÁREA
    const selAr = celdas[2].querySelector("select");
    const inpAr = celdas[2].querySelector("input");
    if (areas.includes(z.area)) {
      selAr.value = z.area;
      inpAr.style.display = "none";
      inpAr.value = "";
    } else {
      selAr.value = "Otros";
      inpAr.style.display = "block";
      inpAr.value = z.area || "";
    }

    // DISPOSITIVO
    const selDp = celdas[3].querySelector("select");
    const inpDp = celdas[3].querySelector("input");
    if (dispositivos.includes(z.dispositivo)) {
      selDp.value = z.dispositivo;
      inpDp.style.display = "none";
      inpDp.value = "";
    } else {
      selDp.value = "otros";
      inpDp.style.display = "block";
      inpDp.value = z.dispositivo || "";
    }

    // DESC
    celdas[4].querySelector("input").value = z.descripcion || "";
  });
}

// ===============================
// PREVISUALIZAR
// ===============================
function abrirPrevisualizacion() {
  const data = capturarBaseDesdeFormulario();
  const zonasConDatos = (data.zonas || []).filter(z => {
    const has = (z.evento && z.evento !== "- Sin tipo definido -") ||
                (z.area && z.area !== "-") ||
                (z.dispositivo && z.dispositivo !== "-") ||
                (z.descripcion && z.descripcion.trim() !== "");
    return has;
  });

  const html = `
    <div style="line-height:1.4;">
      <b>Entidad:</b> ${escapeHtml(data.entidad || "-")} <br>
      <b>Sucursal:</b> ${escapeHtml(data.sucursal || "-")} <br>
      <b>Abonado:</b> ${escapeHtml(data.abonado || "-")} <br>
      <b>Central:</b> ${escapeHtml(data.central || "-")} <br>
      <b>Provincia:</b> ${escapeHtml(data.provincia || "-")} <br>
      <br>
      <b>Resumen:</b> ${zonasConDatos.length} de ${(data.zonas || []).length} zonas con datos cargados
      <hr>
      ${zonasConDatos.slice(0, 30).map(z => `
        <div class="card">
          <b>${escapeHtml(z.zona)}</b><br>
          Evento: ${escapeHtml(z.evento || "-")}<br>
          Área: ${escapeHtml(z.area || "-")}<br>
          Dispositivo: ${escapeHtml(z.dispositivo || "-")}<br>
          Descripción: ${escapeHtml(z.descripcion || "-")}
        </div>
      `).join("")}
      ${zonasConDatos.length > 30 ? `<p>Mostrando 30 de ${zonasConDatos.length}…</p>` : ""}
    </div>
  `;

  document.getElementById("prev-body").innerHTML = html;
  abrirModal("modal-prev");
}

function escapeHtml(str) {
  return (str ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===============================
// PDF (opcional salida)
// ===============================
function generarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Base de Datos - Señalco", 14, 14);

  try {
    const logoImg = document.getElementById('logo-pdf');
    if (logoImg && logoImg.complete) {
      const canvas = document.createElement('canvas');
      canvas.width = logoImg.naturalWidth;
      canvas.height = logoImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(logoImg, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg');
      doc.addImage(dataURL, 'JPEG', 160, 10, 40, 20);
    }
  } catch (e) {}

  const data = capturarBaseDesdeFormulario();

  doc.setFontSize(11);
  doc.text(`Entidad: ${data.entidad}`, 14, 24);
  doc.text(`Sucursal: ${data.sucursal}`, 14, 32);
  doc.text(`Abonado: ${data.abonado}`, 100, 24);
  doc.text(`Central: ${data.central}`, 100, 32);
  doc.text(`Provincia: ${data.provincia}`, 14, 40);

  const columnas = ["Zona", "Evento", "Área", "Dispositivo", "Descripción"];
  const filas = (data.zonas || []).map(z => [z.zona, z.evento, z.area, z.dispositivo, z.descripcion]);

  doc.autoTable({ head: [columnas], body: filas, startY: 50 });

  const nombreArchivo = `base_${data.entidad}_${data.sucursal}.pdf`.replace(/\s+/g, "_");
  doc.save(nombreArchivo);
}

// ===============================
// EXCEL (export + import)
// ===============================
async function generarExcel() {
  const { buffer, name } = await generarExcelBufferYNombre();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// Para compartir: genera un File
async function generarExcelComoFile() {
  const { buffer, name, title } = await generarExcelBufferYNombre();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const file = new File([blob], name, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  return { file, name, title };
}

async function generarExcelBufferYNombre() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Base");

  const data = capturarBaseDesdeFormulario();

  sheet.addRow(["Entidad", data.entidad]);
  sheet.addRow(["Sucursal", data.sucursal]);
  sheet.addRow(["Abonado", data.abonado]);
  sheet.addRow(["Central", data.central]);
  sheet.addRow(["Provincia", data.provincia]);
  sheet.addRow([]);
  sheet.addRow(["Zona", "Evento", "Área", "Dispositivo", "Descripción"]);

  (data.zonas || []).forEach(z => {
    sheet.addRow([z.zona, z.evento, z.area, z.dispositivo, z.descripcion]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const name = `base_${(data.entidad || "ENTIDAD")}_${(data.sucursal || "SUC")}.xlsx`.replace(/\s+/g, "_");
  const title = `Base Señalco ${data.entidad || ""} ${data.sucursal || ""}`.trim();
  return { buffer, name, title };
}

async function importarDesdeExcel(file) {
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Excel sin hojas");

  const meta = {};
  for (let r = 1; r <= 10; r++) {
    const k = (ws.getCell(r, 1).value || "").toString().trim().toLowerCase();
    const v = (ws.getCell(r, 2).value || "").toString().trim();
    if (!k) continue;
    if (k.includes("entidad")) meta.entidad = v;
    if (k.includes("sucursal")) meta.sucursal = v;
    if (k.includes("abonado")) meta.abonado = v;
    if (k.includes("central")) meta.central = v;
    if (k.includes("provincia")) meta.provincia = v;
  }

  let headerRow = null;
  for (let r = 1; r <= 60; r++) {
    const a = (ws.getCell(r, 1).value || "").toString().toLowerCase();
    const b = (ws.getCell(r, 2).value || "").toString().toLowerCase();
    if (a.includes("zona") && b.includes("evento")) {
      headerRow = r;
      break;
    }
  }
  if (!headerRow) throw new Error("No encontré el encabezado Zona/Evento");

  const data = {
    entidad: meta.entidad || "",
    sucursal: meta.sucursal || "",
    abonado: meta.abonado || "",
    central: meta.central || "",
    provincia: meta.provincia || "",
    zonas: []
  };

  let r = headerRow + 1;
  while (r <= ws.rowCount + 5) {
    const zona = (ws.getCell(r, 1).value || "").toString().trim();
    const evento = (ws.getCell(r, 2).value || "").toString().trim();
    const area = (ws.getCell(r, 3).value || "").toString().trim();
    const dispositivo = (ws.getCell(r, 4).value || "").toString().trim();
    const descripcion = (ws.getCell(r, 5).value || "").toString().trim();

    const emptyRow = !zona && !evento && !area && !dispositivo && !descripcion;
    if (emptyRow) {
      let vacias = 0;
      for (let k = 0; k < 3; k++) {
        const z2 = (ws.getCell(r + k, 1).value || "").toString().trim();
        const e2 = (ws.getCell(r + k, 2).value || "").toString().trim();
        const a2 = (ws.getCell(r + k, 3).value || "").toString().trim();
        const d2 = (ws.getCell(r + k, 4).value || "").toString().trim();
        const c2 = (ws.getCell(r + k, 5).value || "").toString().trim();
        if (!z2 && !e2 && !a2 && !d2 && !c2) vacias++;
      }
      if (vacias >= 3) break;
      r++;
      continue;
    }

    data.zonas.push({
      zona: zona || `Zona ${data.zonas.length + 4}`,
      evento: evento || "- Sin tipo definido -",
      area: area || "-",
      dispositivo: dispositivo || "-",
      descripcion: descripcion || ""
    });

    r++;
  }

  while (data.zonas.length < 21) {
    const n = data.zonas.length + 4;
    data.zonas.push({
      zona: `Zona ${n}`,
      evento: "- Sin tipo definido -",
      area: "-",
      dispositivo: "-",
      descripcion: ""
    });
  }
  data.zonas = data.zonas.slice(0, 21);

  return data;
}

// ===============================
// SHARE (menú nativo WhatsApp/Mail/etc.)
// ===============================
async function compartirArchivoNativo(file, titulo) {
  if (!navigator.share) {
    throw new Error("Web Share API no disponible");
  }

  // Si soporta archivos, lo manda directo
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: titulo || "Señalco",
      text: "Base generada desde Señalco",
      files: [file]
    });
    return;
  }

  // Fallback: comparte texto (sin archivo)
  await navigator.share({
    title: titulo || "Señalco",
    text: "No se pudo adjuntar archivo automáticamente. Descargalo y compartilo desde Descargas."
  });
}

// ===============================
// MODALES
// ===============================
function abrirModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "flex";
}
function cerrarModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
}

// ===============================
// MINI DB LOCAL (JSON interna)
// ===============================
const DB_KEY = "senalco_bases_v1";

function loadDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; }
  catch { return []; }
}
function saveDB(arr) {
  localStorage.setItem(DB_KEY, JSON.stringify(arr));
}
function nowISO() {
  return new Date().toISOString();
}
function makeId() {
  return "b_" + Math.random().toString(16).slice(2) + "_" + Date.now();
}
function descargarArchivo(nombre, contenido, mime) {
  const blob = new Blob([contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function abrirModalBases() {
  abrirModal("modal-bases");
  renderListaBases();
}

function guardarBaseLocal(nombre) {
  const data = capturarBaseDesdeFormulario();
  const name = (nombre || "").trim() || `${data.entidad || "ENTIDAD"}_${data.sucursal || "SUC"}`;
  const db = loadDB();

  const idx = db.findIndex(x => (x.name || "").toLowerCase() === name.toLowerCase());
  if (idx >= 0) {
    db[idx].data = data;
    db[idx].updatedAt = nowISO();
  } else {
    db.push({ id: makeId(), name, data, updatedAt: nowISO() });
  }
  saveDB(db);
  alert("✅ Guardado en el teléfono");
}

function renderListaBases() {
  const cont = document.getElementById("lista-bases-json");
  if (!cont) return;

  const db = loadDB().sort((a,b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  if (!db.length) {
    cont.innerHTML = "<p>No hay bases guardadas todavía.</p>";
    return;
  }

  cont.innerHTML = "";
  db.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";

    const title = document.createElement("div");
    title.innerHTML = `<b>${escapeHtml(item.name || "(sin nombre)")}</b><br><small>${escapeHtml(item.updatedAt || "")}</small>`;

    const btns = document.createElement("div");
    btns.style.display = "flex";
    btns.style.gap = "8px";
    btns.style.flexWrap = "wrap";
    btns.style.marginTop = "10px";

    const btnCargar = document.createElement("button");
    btnCargar.className = "mini-btn";
    btnCargar.textContent = "Cargar";
    btnCargar.onclick = () => {
      cargarBaseEnFormulario(item.data);
      alert("✅ Base cargada");
      cerrarModal("modal-bases");
    };

    const btnRen = document.createElement("button");
    btnRen.className = "mini-btn";
    btnRen.textContent = "Renombrar";
    btnRen.onclick = () => {
      const nuevo = prompt("Nuevo nombre:", item.name || "");
      if (!nuevo) return;
      const db2 = loadDB();
      const idx = db2.findIndex(x => x.id === item.id);
      if (idx >= 0) {
        db2[idx].name = nuevo;
        db2[idx].updatedAt = nowISO();
        saveDB(db2);
        renderListaBases();
      }
    };

    const btnDesc = document.createElement("button");
    btnDesc.className = "mini-btn";
    btnDesc.textContent = "Descargar JSON";
    btnDesc.onclick = () => {
      const nombre = `${(item.name || "base").replace(/\s+/g, "_")}.json`;
      descargarArchivo(nombre, JSON.stringify(item.data, null, 2), "application/json");
    };

    const btnDel = document.createElement("button");
    btnDel.className = "mini-btn";
    btnDel.textContent = "Eliminar";
    btnDel.onclick = () => {
      if (!confirm("¿Eliminar esta base?")) return;
      const db2 = loadDB().filter(x => x.id !== item.id);
      saveDB(db2);
      renderListaBases();
    };

    btns.appendChild(btnCargar);
    btns.appendChild(btnRen);
    btns.appendChild(btnDesc);
    btns.appendChild(btnDel);

    div.appendChild(title);
    div.appendChild(btns);
    cont.appendChild(div);
  });
}

async function importarBaseDesdeJSONFile(file) {
  const txt = await file.text();
  const data = JSON.parse(txt);
  if (!data || !Array.isArray(data.zonas)) throw new Error("JSON inválido");
  return data;
}

// ===============================
// BORRADORES (clásico)
// ===============================
function guardarBorradorBase(nombreClave) {
  const datos = capturarBaseDesdeFormulario();
  localStorage.setItem(nombreClave, JSON.stringify(datos));
  alert(`✅ Borrador guardado como ${nombreClave}`);
  obtenerBasesGuardadas();
}

function obtenerBasesGuardadas() {
  const ul = document.getElementById("lista-bases");
  if (!ul) return;
  ul.innerHTML = "";

  const claves = ["borrador1", "borrador2"];
  claves.forEach(clave => {
    const base = localStorage.getItem(clave);
    if (base) {
      const li = document.createElement("li");
      li.style.padding = "8px";
      li.style.borderBottom = "1px solid rgba(255,255,255,.2)";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      const left = document.createElement("span");
      left.textContent = `📄 ${clave}`;
      left.style.cursor = "pointer";
      left.onclick = () => precargarBorradorBase(clave);

      const btnEliminar = document.createElement("span");
      btnEliminar.textContent = "🗑️";
      btnEliminar.style.cursor = "pointer";
      btnEliminar.style.color = "#ff5a5a";
      btnEliminar.onclick = (e) => {
        e.stopPropagation();
        localStorage.removeItem(clave);
        obtenerBasesGuardadas();
      };

      li.appendChild(left);
      li.appendChild(btnEliminar);
      ul.appendChild(li);
    }
  });
}

function precargarBorradorBase(clave) {
  const data = JSON.parse(localStorage.getItem(clave));
  if (!data) return;
  cargarBaseEnFormulario(data);
  alert(`✅ Cargado ${clave}`);
}