/* =========================
   java-base.js COMPLETO
   Base de Datos - Señalco
   ========================= */

const $ = (id) => document.getElementById(id);

/* =========================
   Listas
   ========================= */
const eventos = [
  "- Sin tipo definido -", "Alarma", "Robo", "Asalto",
  "clave", "Sabotaje", "Apertura de Equipo", "Puls. Remoto - Falla Red", "ALM + 4 HS", "Asalto Clave Falsa",
  "Falla activador portátil", "Falla cent. Policial. GPRS OK", "Falla Comunicación GPRS",
  "Falla de Conexión al Servidor GPRS", "Falla de PT", "Falla Enlace Red PT",
  "Falla enlace Supervisión de Radio", "Falta de 220V", "Incendio", "Otros",
  "Prevención con Policía", "Prevención de Red", "Prevención Placa Acicomp",
  "Puerta Abierta", "Sirena Disparada",
  // compatibilidad con otros sistemas
  "Avería de Línea"
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

/* =========================
   Fecha generado
   ========================= */
function fechaGeneracionISO() { return new Date().toISOString(); }
function fechaGeneracionLegible() { return new Date().toLocaleString("es-AR"); }

/* =========================
   Zonas 1-2-3 fijas
   ========================= */
let zonas123Editables = false;

const ZONAS_FIJAS_123 = [
  { zona: "1", evento: "Avería de Línea" },
  { zona: "2", evento: "Apertura de Equipo" },
  { zona: "3", evento: "Falta de 220V" }
];

/* =========================
   Helpers DOM
   ========================= */
function createSelect(options, value = "", onChange) {
  const sel = document.createElement("select");
  options.forEach(opt => {
    const o = document.createElement("option");
    o.textContent = opt;
    o.value = opt;
    sel.appendChild(o);
  });
  if (value && options.includes(value)) sel.value = value;
  if (onChange) sel.addEventListener("change", onChange);
  return sel;
}

function createInput(placeholder = "", value = "") {
  const inp = document.createElement("input");
  inp.type = "text";
  inp.placeholder = placeholder;
  inp.value = value || "";
  return inp;
}

/* =========================
   Guardado temporal (autosave)
   ========================= */
function guardarEstadoTemp() {
  try {
    const data = getCurrentBaseData();
    localStorage.setItem("senalco_base_tmp", JSON.stringify(data));
  } catch { }
}

function cargarEstadoTemp() {
  const raw = localStorage.getItem("senalco_base_tmp");
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (!data || !data.filas) return false;
    cargarBaseDesdeJSON(data);
    return true;
  } catch {
    return false;
  }
}

/* =========================
   Construcción de fila base
   ========================= */
function crearFilaBase({ zona = "", evento = "", area = "", dispositivo = "", descripcion = "" }, idx = 999) {
  const tr = document.createElement("tr");

  // ZONA
  const tdZona = document.createElement("td");
  const inpZona = createInput("", zona);
  inpZona.className = "zonaInput";
  tdZona.appendChild(inpZona);

  // EVENTO
  const tdEvento = document.createElement("td");
  const selectEvento = createSelect(eventos, eventos.includes(evento) ? evento : "Otros");
  const inputEventoOtro = createInput("Especificar evento", eventos.includes(evento) ? "" : (evento || ""));
  inputEventoOtro.style.display = (selectEvento.value === "Otros") ? "inline-block" : "none";
  selectEvento.addEventListener("change", () => {
    inputEventoOtro.style.display = (selectEvento.value === "Otros") ? "inline-block" : "none";
    guardarEstadoTemp();
  });
  inputEventoOtro.addEventListener("input", guardarEstadoTemp);
  tdEvento.appendChild(selectEvento);
  tdEvento.appendChild(inputEventoOtro);

  // ÁREA
  const tdArea = document.createElement("td");
  const selectArea = createSelect(areas, areas.includes(area) ? area : "Otros");
  const inputAreaOtro = createInput("Especificar área", areas.includes(area) ? "" : (area || ""));
  inputAreaOtro.style.display = (selectArea.value === "Otros") ? "inline-block" : "none";
  selectArea.addEventListener("change", () => {
    inputAreaOtro.style.display = (selectArea.value === "Otros") ? "inline-block" : "none";
    guardarEstadoTemp();
  });
  inputAreaOtro.addEventListener("input", guardarEstadoTemp);
  tdArea.appendChild(selectArea);
  tdArea.appendChild(inputAreaOtro);

  // DISPOSITIVO
  const tdDisp = document.createElement("td");
  const selectDisp = createSelect(dispositivos, dispositivos.includes(dispositivo) ? dispositivo : "otros");
  const inputDispOtro = createInput("Especificar dispositivo", dispositivos.includes(dispositivo) ? "" : (dispositivo || ""));
  inputDispOtro.style.display = (selectDisp.value === "otros") ? "inline-block" : "none";
  selectDisp.addEventListener("change", () => {
    inputDispOtro.style.display = (selectDisp.value === "otros") ? "inline-block" : "none";
    guardarEstadoTemp();
  });
  inputDispOtro.addEventListener("input", guardarEstadoTemp);
  tdDisp.appendChild(selectDisp);
  tdDisp.appendChild(inputDispOtro);

  // DESCRIPCIÓN
  const tdDesc = document.createElement("td");
  const inpDesc = createInput("", descripcion);
  inpDesc.addEventListener("input", guardarEstadoTemp);
  tdDesc.appendChild(inpDesc);

  tr.appendChild(tdZona);
  tr.appendChild(tdEvento);
  tr.appendChild(tdArea);
  tr.appendChild(tdDisp);
  tr.appendChild(tdDesc);

  if (idx <= 2) tr.dataset.zona123 = "1";

  [inpZona, selectEvento, selectArea, selectDisp, inpDesc].forEach(el => {
    el.addEventListener("input", guardarEstadoTemp);
    el.addEventListener("change", guardarEstadoTemp);
  });

  return tr;
}

/* =========================
   Precargar zonas
   ========================= */
function precargarZonas() {
  const tbody = document.querySelector("#tabla-base tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  // 1-2-3 fijas
  ZONAS_FIJAS_123.forEach((z, i) => {
    const tr = crearFilaBase({ zona: z.zona, evento: z.evento, area: "-", dispositivo: "-", descripcion: "" }, i);
    tbody.appendChild(tr);
  });

  // 4..24
  for (let i = 4; i <= 24; i++) {
    const tr = crearFilaBase({ zona: `Zona ${i}`, evento: "- Sin tipo definido -", area: "-", dispositivo: "-", descripcion: "" }, i);
    tbody.appendChild(tr);
  }

  zonas123Editables = false;
  aplicarBloqueoZonas123();
  guardarEstadoTemp();
}

/* =========================
   Bloqueo total zonas 1-2-3
   ========================= */
function aplicarBloqueoZonas123() {
  const tbody = document.querySelector("#tabla-base tbody");
  if (!tbody) return;

  const trs = tbody.querySelectorAll("tr");

  trs.forEach((tr, idx) => {
    if (idx <= 2) {
      const inpZona = tr.querySelector("td:nth-child(1) input");
      const selEvento = tr.querySelector("td:nth-child(2) select");
      const inpEventoOtro = tr.querySelector("td:nth-child(2) input");

      const selArea = tr.querySelector("td:nth-child(3) select");
      const inpAreaOtro = tr.querySelector("td:nth-child(3) input");

      const selDisp = tr.querySelector("td:nth-child(4) select");
      const inpDispOtro = tr.querySelector("td:nth-child(4) input");

      const inpDesc = tr.querySelector("td:nth-child(5) input");

      // zona fija
      if (inpZona) {
        inpZona.value = String(idx + 1);
        inpZona.readOnly = true;
      }

      // si NO editable, defaults
      if (!zonas123Editables) {
        const def = ZONAS_FIJAS_123[idx];

        if (selEvento) selEvento.value = eventos.includes(def.evento) ? def.evento : "Otros";
        if (inpEventoOtro) { inpEventoOtro.value = ""; inpEventoOtro.style.display = "none"; }

        if (selArea) selArea.value = "-";
        if (inpAreaOtro) { inpAreaOtro.value = ""; inpAreaOtro.style.display = "none"; }

        if (selDisp) selDisp.value = "-";
        if (inpDispOtro) { inpDispOtro.value = ""; inpDispOtro.style.display = "none"; }

        if (inpDesc) inpDesc.value = "";
      }

      // bloquear/desbloquear todo menos el número de zona
      if (selEvento) selEvento.disabled = !zonas123Editables;
      if (selArea) selArea.disabled = !zonas123Editables;
      if (selDisp) selDisp.disabled = !zonas123Editables;

      if (inpEventoOtro) inpEventoOtro.readOnly = !zonas123Editables;
      if (inpAreaOtro) inpAreaOtro.readOnly = !zonas123Editables;
      if (inpDispOtro) inpDispOtro.readOnly = !zonas123Editables;
      if (inpDesc) inpDesc.readOnly = !zonas123Editables;
    }
  });

  if ($("btn-editar-zonas123") && $("btn-bloquear-zonas123")) {
    $("btn-editar-zonas123").style.display = zonas123Editables ? "none" : "inline-block";
    $("btn-bloquear-zonas123").style.display = zonas123Editables ? "inline-block" : "none";
  }
}

function habilitarEdicionZonas123() {
  zonas123Editables = true;
  aplicarBloqueoZonas123();
  alert("🔓 Zonas 1-3 habilitadas para editar");
}

function bloquearEdicionZonas123() {
  zonas123Editables = false;
  aplicarBloqueoZonas123();
  guardarEstadoTemp();
  alert("🔒 Zonas 1-3 bloqueadas");
}

/* =========================
   Data actual
   ========================= */
function getCurrentBaseData() {
  const meta = {
    entidad: $("entidad")?.value || "",
    sucursal: $("sucursal")?.value || "",
    abonado: $("abonado")?.value || "",
    central: $("central")?.value || "",
    provincia: $("provincia")?.value || ""
  };

  const filas = [];
  document.querySelectorAll("#tabla-base tbody tr").forEach(tr => {
    const zona = tr.querySelector("td:nth-child(1) input")?.value || "";

    const selEvento = tr.querySelector("td:nth-child(2) select");
    const inpEventoOtro = tr.querySelector("td:nth-child(2) input");
    const evento = (selEvento?.value === "Otros") ? (inpEventoOtro?.value || "Otros") : (selEvento?.value || "");

    const selArea = tr.querySelector("td:nth-child(3) select");
    const inpAreaOtro = tr.querySelector("td:nth-child(3) input");
    const area = (selArea?.value === "Otros") ? (inpAreaOtro?.value || "Otros") : (selArea?.value || "");

    const selDisp = tr.querySelector("td:nth-child(4) select");
    const inpDispOtro = tr.querySelector("td:nth-child(4) input");
    const dispositivo = (selDisp?.value === "otros") ? (inpDispOtro?.value || "otros") : (selDisp?.value || "");

    const descripcion = tr.querySelector("td:nth-child(5) input")?.value || "";

    filas.push({ zona, evento, area, dispositivo, descripcion });
  });

  return {
    meta,
    generadoEn: { iso: fechaGeneracionISO(), legible: fechaGeneracionLegible() },
    filas
  };
}

/* =========================
   Modales
   ========================= */
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function abrirModal(id) { const m = $(id); if (m) m.style.display = "flex"; }
function cerrarModal(id) { const m = $(id); if (m) m.style.display = "none"; }

/* =========================
   Previsualización clara
   ========================= */
function abrirPrevisualizacion() {
  const data = getCurrentBaseData();
  const body = $("prev-body");
  if (!body) return;

  body.style.background = "#ffffff";
  body.style.color = "#111111";

  body.innerHTML = `
    <div style="background:#fff;color:#111;border-radius:12px;padding:12px;border:1px solid #e5e7eb;">
      <div style="font-weight:bold;margin-bottom:8px;">Datos</div>
      <div><b>Entidad:</b> ${escapeHtml(data.meta.entidad || "-")}</div>
      <div><b>Sucursal:</b> ${escapeHtml(data.meta.sucursal || "-")}</div>
      <div><b>Abonado:</b> ${escapeHtml(data.meta.abonado || "-")}</div>
      <div><b>Central:</b> ${escapeHtml(data.meta.central || "-")}</div>
      <div><b>Provincia:</b> ${escapeHtml(data.meta.provincia || "-")}</div>
      <div><b>Generado:</b> ${escapeHtml(data.generadoEn.legible)}</div>
    </div>

    <div style="margin-top:12px;background:#fff;color:#111;border-radius:12px;padding:12px;border:1px solid #e5e7eb;">
      <div style="font-weight:bold;margin-bottom:8px;">Tabla</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="border:1px solid #ddd;padding:6px;">Zona</th>
            <th style="border:1px solid #ddd;padding:6px;">Evento</th>
            <th style="border:1px solid #ddd;padding:6px;">Área</th>
            <th style="border:1px solid #ddd;padding:6px;">Dispositivo</th>
            <th style="border:1px solid #ddd;padding:6px;">Descripción</th>
          </tr>
        </thead>
        <tbody>
          ${data.filas.map(f => `
              <tr>
                <td style="border:1px solid #ddd;padding:6px;">${escapeHtml(f.zona)}</td>
                <td style="border:1px solid #ddd;padding:6px;">${escapeHtml(f.evento)}</td>
                <td style="border:1px solid #ddd;padding:6px;">${escapeHtml(f.area)}</td>
                <td style="border:1px solid #ddd;padding:6px;">${escapeHtml(f.dispositivo)}</td>
                <td style="border:1px solid #ddd;padding:6px;">${escapeHtml(f.descripcion)}</td>
              </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  abrirModal("modal-prev");
}

/* =========================
   PDF pro
   ========================= */
function generarPDFBase() {
  const data = getCurrentBaseData();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Base de Datos - Señalco", 14, 14);

  // Logo
  try {
    const logoImg = document.getElementById("logo-pdf");
    if (logoImg && logoImg.complete) {
      const canvas = document.createElement("canvas");
      canvas.width = logoImg.naturalWidth;
      canvas.height = logoImg.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(logoImg, 0, 0);
      const dataURL = canvas.toDataURL("image/jpeg");
      doc.addImage(dataURL, "JPEG", 160, 8, 40, 20);
    }
  } catch (e) {
    console.warn("No se pudo agregar logo", e);
  }

  doc.setFontSize(11);
  doc.text(`Entidad: ${data.meta.entidad}`, 14, 28);
  doc.text(`Sucursal: ${data.meta.sucursal}`, 14, 35);
  doc.text(`Abonado: ${data.meta.abonado}`, 110, 28);
  doc.text(`Central: ${data.meta.central}`, 110, 35);
  doc.text(`Provincia: ${data.meta.provincia}`, 14, 42);
  doc.text(`Generado: ${data.generadoEn.legible}`, 14, 49);

  const columnas = ["Zona", "Evento", "Área", "Dispositivo", "Descripción"];
  const filas = data.filas.map(f => [f.zona, f.evento, f.area, f.dispositivo, f.descripcion]);

  doc.autoTable({
    head: [columnas],
    body: filas,
    startY: 56,
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [197, 0, 0], textColor: 255 }
  });

  const nombre = `base_${(data.meta.entidad || "entidad")}_${(data.meta.sucursal || "sucursal")}.pdf`.replace(/\s+/g, "_");
  doc.save(nombre);
}

/* =========================
   Excel Import/Export
   ========================= */
function normalizarHeaders(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replaceAll("á", "a").replaceAll("é", "e").replaceAll("í", "i").replaceAll("ó", "o").replaceAll("ú", "u");
}

async function importarDesdeExcel(file) {
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("No hay hoja en el Excel");

  // Buscar header
  let headerRow = null;
  let map = null;

  ws.eachRow((row, rowNumber) => {
    if (headerRow) return;
    const vals = row.values.map(v => (v ?? "").toString());
    const joined = vals.join(" ").toLowerCase();
    if (joined.includes("zona") && joined.includes("evento")) {
      headerRow = rowNumber;
      map = {};
      vals.forEach((v, idx) => {
        const key = normalizarHeaders(v);
        if (key.includes("zona")) map.zona = idx;
        if (key.includes("evento")) map.evento = idx;
        if (key.includes("area") || key.includes("área")) map.area = idx;
        if (key.includes("dispositivo")) map.dispositivo = idx;
        if (key.includes("descripcion")) map.descripcion = idx;
      });
    }
  });

  if (!headerRow) {
    headerRow = 1;
    map = { zona: 1, evento: 2, area: 3, dispositivo: 4, descripcion: 5 };
  }

  const filasExcel = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const zona = (row.getCell(map.zona)?.value ?? "").toString().trim();
    const evento = (row.getCell(map.evento)?.value ?? "").toString().trim();
    const area = (row.getCell(map.area)?.value ?? "").toString().trim();
    const dispositivo = (row.getCell(map.dispositivo)?.value ?? "").toString().trim();
    const descripcion = (row.getCell(map.descripcion)?.value ?? "").toString().trim();

    if (!zona && !evento && !area && !dispositivo && !descripcion) continue;
    filasExcel.push({ zona, evento, area, dispositivo, descripcion });
  }

  // Solo 4..24. Ignora 1-2-3
  const filasFiltradas = filasExcel.filter(f => {
    const zRaw = (f.zona || "").toString().toLowerCase();
    const num = parseInt(zRaw.replace("zona", "").trim(), 10);
    return !isNaN(num) && num >= 4 && num <= 24;
  });

  const tbody = document.querySelector("#tabla-base tbody");
  tbody.innerHTML = "";

  // 1-2-3 defaults
  ZONAS_FIJAS_123.forEach((z, i) => {
    tbody.appendChild(crearFilaBase({ zona: z.zona, evento: z.evento, area: "-", dispositivo: "-", descripcion: "" }, i));
  });

  // Map por numero
  const mapPorNum = {};
  filasFiltradas.forEach(f => {
    const num = parseInt((f.zona || "").toString().toLowerCase().replace("zona", "").trim(), 10);
    mapPorNum[num] = {
      zona: `Zona ${num}`,
      evento: f.evento || "- Sin tipo definido -",
      area: f.area || "-",
      dispositivo: f.dispositivo || "-",
      descripcion: f.descripcion || ""
    };
  });

  for (let i = 4; i <= 24; i++) {
    const fila = mapPorNum[i] || { zona: `Zona ${i}`, evento: "- Sin tipo definido -", area: "-", dispositivo: "-", descripcion: "" };
    tbody.appendChild(crearFilaBase(fila, i));
  }

  zonas123Editables = false;
  aplicarBloqueoZonas123();
  guardarEstadoTemp();
}

function descargarBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 700);
}

async function exportarExcel() {
  const data = getCurrentBaseData();
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Base");

  sheet.addRow(["Entidad", data.meta.entidad]);
  sheet.addRow(["Sucursal", data.meta.sucursal]);
  sheet.addRow(["Abonado", data.meta.abonado]);
  sheet.addRow(["Central", data.meta.central]);
  sheet.addRow(["Provincia", data.meta.provincia]);
  sheet.addRow(["Generado", data.generadoEn.legible]);
  sheet.addRow([]);

  sheet.addRow(["Zona", "Evento", "Área", "Dispositivo", "Descripción"]);
  data.filas.forEach(f => sheet.addRow([f.zona, f.evento, f.area, f.dispositivo, f.descripcion]));

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const nombre = `base_${(data.meta.entidad || "entidad")}_${(data.meta.sucursal || "sucursal")}.xlsx`.replace(/\s+/g, "_");
  descargarBlob(blob, nombre);
}

/* =========================
   JSON Descargar / Importar (archivo)
   ========================= */
function descargarJSONActual() {
  const data = getCurrentBaseData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const nombre = `base_${(data.meta.entidad || "entidad")}_${(data.meta.sucursal || "sucursal")}.json`.replace(/\s+/g, "_");
  descargarBlob(blob, nombre);
}

function importarJSONFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      cargarBaseDesdeJSON(data);
      alert("✅ JSON importado");
    } catch {
      alert("❌ JSON inválido");
    }
  };
  reader.readAsText(file);
}

function cargarBaseDesdeJSON(data) {
  $("entidad").value = data.meta?.entidad || "";
  $("sucursal").value = data.meta?.sucursal || "";
  $("abonado").value = data.meta?.abonado || "";
  $("central").value = data.meta?.central || "";
  $("provincia").value = data.meta?.provincia || "";

  const tbody = document.querySelector("#tabla-base tbody");
  tbody.innerHTML = "";

  (data.filas || []).forEach((f, idx) => tbody.appendChild(crearFilaBase(f, idx)));

  zonas123Editables = false;
  aplicarBloqueoZonas123();
  guardarEstadoTemp();
}

/* =========================
   ✅ NUEVO: Mis Bases (guardado REAL en el teléfono)
   ========================= */
const BASES_INDEX_KEY = "senalco_bases_index_v1";
const BASE_PREFIX = "senalco_base_saved__";

function leerIndexBases() {
  try {
    return JSON.parse(localStorage.getItem(BASES_INDEX_KEY)) || [];
  } catch {
    return [];
  }
}
function guardarIndexBases(arr) {
  localStorage.setItem(BASES_INDEX_KEY, JSON.stringify(arr));
}

function sugerirNombreBase() {
  const entidad = ($("entidad")?.value || "").trim().replace(/\s+/g, "_");
  const suc = ($("sucursal")?.value || "").trim().replace(/\s+/g, "_");
  const base = [entidad || "Entidad", suc || "Sucursal"].join("_");
  return base;
}

function guardarBaseEnTelefono(nombre) {
  const n = (nombre || "").trim();
  if (!n) { alert("Poné un nombre para guardar"); return; }

  const data = getCurrentBaseData();
  const key = BASE_PREFIX + n;

  localStorage.setItem(key, JSON.stringify(data));

  const idx = leerIndexBases();
  if (!idx.includes(n)) {
    idx.unshift(n);
    guardarIndexBases(idx);
  } else {
    // mover arriba
    const nuevo = [n, ...idx.filter(x => x !== n)];
    guardarIndexBases(nuevo);
  }

  renderMisBases();
  alert(`✅ Base guardada: ${n}`);
}

function borrarBaseEnTelefono(nombre) {
  if (!confirm(`¿Borrar base "${nombre}"?`)) return;
  localStorage.removeItem(BASE_PREFIX + nombre);
  const idx = leerIndexBases().filter(x => x !== nombre);
  guardarIndexBases(idx);
  renderMisBases();
}

function cargarBaseDesdeTelefono(nombre) {
  const raw = localStorage.getItem(BASE_PREFIX + nombre);
  if (!raw) { alert("No existe esa base"); return; }
  try {
    const data = JSON.parse(raw);
    cargarBaseDesdeJSON(data);
    alert(`✅ Base cargada: ${nombre}`);
  } catch {
    alert("❌ No se pudo cargar esa base (JSON corrupto)");
  }
}

function descargarBaseGuardadaJSON(nombre) {
  const raw = localStorage.getItem(BASE_PREFIX + nombre);
  if (!raw) return;
  const blob = new Blob([raw], { type: "application/json" });
  const filename = `${nombre}.json`.replace(/\s+/g, "_");
  descargarBlob(blob, filename);
}

async function compartirBaseGuardadaJSON(nombre) {
  const raw = localStorage.getItem(BASE_PREFIX + nombre);
  if (!raw) return;
  const blob = new Blob([raw], { type: "application/json" });
  const file = new File([blob], `${nombre}.json`.replace(/\s+/g, "_"), { type: "application/json" });
  await compartirArchivoSeguro(file, "Compartir base JSON");
}

async function compartirBaseGuardadaExcel(nombre) {
  // Genera EXCEL desde lo guardado
  const raw = localStorage.getItem(BASE_PREFIX + nombre);
  if (!raw) return;
  let data;
  try { data = JSON.parse(raw); } catch { return; }

  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Base");

  sheet.addRow(["Entidad", data.meta?.entidad || ""]);
  sheet.addRow(["Sucursal", data.meta?.sucursal || ""]);
  sheet.addRow(["Abonado", data.meta?.abonado || ""]);
  sheet.addRow(["Central", data.meta?.central || ""]);
  sheet.addRow(["Provincia", data.meta?.provincia || ""]);
  sheet.addRow(["Generado", data.generadoEn?.legible || ""]);
  sheet.addRow([]);

  sheet.addRow(["Zona", "Evento", "Área", "Dispositivo", "Descripción"]);
  (data.filas || []).forEach(f => sheet.addRow([f.zona, f.evento, f.area, f.dispositivo, f.descripcion]));

  const buffer = await wb.xlsx.writeBuffer();
  const file = new File([buffer], `${nombre}.xlsx`.replace(/\s+/g, "_"), {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  await compartirArchivoSeguro(file, "Compartir base Excel");
}

function renderMisBases() {
  const cont = $("lista-bases-json");
  if (!cont) return;

  const idx = leerIndexBases();
  if (idx.length === 0) {
    cont.innerHTML = `<div style="padding:10px;border:1px dashed #ccc;border-radius:10px;">No hay bases guardadas todavía.</div>`;
    return;
  }

  cont.innerHTML = idx.map(nombre => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;">
        <div style="font-weight:800;">📄 ${escapeHtml(nombre)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="mini-btn" data-act="cargar" data-n="${escapeHtml(nombre)}">Abrir</button>
          <button class="mini-btn" data-act="json" data-n="${escapeHtml(nombre)}">JSON</button>
          <button class="mini-btn" data-act="sharejson" data-n="${escapeHtml(nombre)}">Compartir JSON</button>
          <button class="mini-btn" data-act="sharexls" data-n="${escapeHtml(nombre)}">Compartir Excel</button>
          <button class="mini-btn" data-act="borrar" data-n="${escapeHtml(nombre)}" style="background:#b00020;">Borrar</button>
        </div>
      </div>
    </div>
  `).join("");

  // Delegación de eventos
  cont.querySelectorAll("button[data-act]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const act = btn.dataset.act;
      const n = btn.dataset.n;
      if (act === "cargar") return cargarBaseDesdeTelefono(n);
      if (act === "borrar") return borrarBaseEnTelefono(n);
      if (act === "json") return descargarBaseGuardadaJSON(n);
      if (act === "sharejson") return compartirBaseGuardadaJSON(n);
      if (act === "sharexls") return compartirBaseGuardadaExcel(n);
    });
  });
}

/* =========================
   ✅ NUEVO: Compartir robusto (sin canShare que a veces rompe)
   ========================= */
async function compartirArchivoSeguro(file, titulo = "Compartir") {
  try {
    if (navigator.share) {
      // IMPORTANT: share directo (en muchos PWA canShare falla)
      await navigator.share({
        title: titulo,
        text: "Archivo generado desde Señalco",
        files: [file]
      });
      return true;
    }
  } catch (e) {
    console.warn("Share falló:", e);
  }

  // fallback: descargar para enviarlo manualmente
  try {
    descargarBlob(file, file.name);
    alert("⚠️ No se pudo abrir el menú Compartir. Te lo descargué para enviarlo por WhatsApp/Mail.");
  } catch {
    alert("❌ No se pudo compartir ni descargar.");
  }
  return false;
}

/* =========================
   Wiring botones
   ========================= */
function asignarEventosBase() {
  // Limpiar
  $("btn-limpiar-base")?.addEventListener("click", () => {
    $("entidad").value = "";
    $("sucursal").value = "";
    $("abonado").value = "";
    $("central").value = "";
    $("provincia").value = "";
    precargarZonas();
  });

  // Subir Excel a modificar
  $("btn-subir-excel")?.addEventListener("click", () => $("input-excel-base")?.click());
  $("input-excel-base")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await importarDesdeExcel(file);
      alert("✅ Excel cargado (Zonas 4..24)");
    } catch (err) {
      console.error(err);
      alert("❌ No se pudo leer el Excel");
    }
  });

  // Previsualizar
  $("btn-previsualizar")?.addEventListener("click", abrirPrevisualizacion);
  $("btn-cerrar-prev")?.addEventListener("click", () => cerrarModal("modal-prev"));
  $("btn-descargar-pdf-prev")?.addEventListener("click", generarPDFBase);

  // PDF / Excel
  $("btn-generar-pdf-base")?.addEventListener("click", generarPDFBase);
  $("btn-excel-base")?.addEventListener("click", exportarExcel);

  // Zonas 1-3
  $("btn-editar-zonas123")?.addEventListener("click", habilitarEdicionZonas123);
  $("btn-bloquear-zonas123")?.addEventListener("click", bloquearEdicionZonas123);

  // ✅ NUEVO: Guardar Base (Local)
  $("btn-guardar-local")?.addEventListener("click", () => {
    const sugerido = sugerirNombreBase();
    const nombre = prompt("Nombre para guardar la base:", sugerido);
    if (nombre === null) return;
    guardarBaseEnTelefono(nombre);
  });

  // ✅ NUEVO: Mis Bases (abre modal y render)
  $("btn-mis-bases")?.addEventListener("click", () => {
    // setear sugerido
    if ($("nombre-base")) $("nombre-base").value = sugerirNombreBase();
    renderMisBases();
    abrirModal("modal-bases");
  });

  $("btn-cerrar-bases")?.addEventListener("click", () => cerrarModal("modal-bases"));

  // ✅ NUEVO: Guardar como (desde modal)
  $("btn-guardar-como")?.addEventListener("click", () => {
    const nombre = ($("nombre-base")?.value || "").trim();
    guardarBaseEnTelefono(nombre);
  });

  // Descargar / Importar JSON (archivo)
  $("btn-descargar-json")?.addEventListener("click", descargarJSONActual);

  $("btn-importar-json")?.addEventListener("click", () => $("input-json-base")?.click());
  $("input-json-base")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) importarJSONFile(file);
  });

  // Compartir JSON / Excel (de la base actual)
  $("btn-compartir-json")?.addEventListener("click", async () => {
    const data = getCurrentBaseData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const nombre = `base_${(data.meta.entidad || "entidad")}_${(data.meta.sucursal || "sucursal")}.json`.replace(/\s+/g, "_");
    const file = new File([blob], nombre, { type: "application/json" });
    await compartirArchivoSeguro(file, "Compartir JSON");
  });

  $("btn-compartir-excel")?.addEventListener("click", async () => {
    // generar excel desde base actual (sin cambiar el exportarExcel)
    const data = getCurrentBaseData();
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Base");

    sheet.addRow(["Entidad", data.meta.entidad]);
    sheet.addRow(["Sucursal", data.meta.sucursal]);
    sheet.addRow(["Abonado", data.meta.abonado]);
    sheet.addRow(["Central", data.meta.central]);
    sheet.addRow(["Provincia", data.meta.provincia]);
    sheet.addRow(["Generado", data.generadoEn.legible]);
    sheet.addRow([]);

    sheet.addRow(["Zona", "Evento", "Área", "Dispositivo", "Descripción"]);
    data.filas.forEach(f => sheet.addRow([f.zona, f.evento, f.area, f.dispositivo, f.descripcion]));

    const buffer = await wb.xlsx.writeBuffer();
    const nombre = `base_${(data.meta.entidad || "entidad")}_${(data.meta.sucursal || "sucursal")}.xlsx`.replace(/\s+/g, "_");
    const file = new File([buffer], nombre, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    await compartirArchivoSeguro(file, "Compartir Excel");
  });

  // autosave cabecera
  ["entidad", "sucursal", "abonado", "central", "provincia"].forEach(id => {
    $(id)?.addEventListener("input", guardarEstadoTemp);
  });
}

/* =========================
   Exponer para onload del HTML
   ========================= */
window.asignarEventosBase = asignarEventosBase;
window.precargarZonas = precargarZonas;

/* =========================
   Init
   ========================= */
(function init() {
  const ok = cargarEstadoTemp();
  if (!ok) precargarZonas();

  zonas123Editables = false;
  aplicarBloqueoZonas123();
})();