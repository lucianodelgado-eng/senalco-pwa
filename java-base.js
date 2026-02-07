/*************************************************
 * java-base.js (COMPLETO)
 * Base de Datos - Señalco
 * - Importar Excel (.xlsx) con ExcelJS
 * - Previsualización modal
 * - Exportar Excel
 * - Generar PDF (opcional)
 * - Guardar/leer bases como JSON en localStorage
 * - Importar/Descargar/Compartir JSON
 * - Compartir Excel (si el teléfono soporta Web Share)
 * - Zonas 1-2-3 fijas (bloqueadas) por default
 *************************************************/

const STORAGE_KEY_LIST = "senalco_bases_index"; // lista de keys
const STORAGE_KEY_PREFIX = "senalco_base_";     // cada base guardada
const STORAGE_KEY_CURRENT = "senalco_base_current"; // auto-save actual

let zonas123EditMode = false; // false = bloqueadas (default)

/***********************
 * Helpers DOM
 ***********************/
function $(id) { return document.getElementById(id); }

function toast(msg) {
  alert(msg);
}

function safeStr(v) {
  return (v === null || v === undefined) ? "" : String(v);
}

function normalizeHeader(s) {
  return safeStr(s).trim().toLowerCase();
}

/***********************
 * Datos actuales (modelo)
 ***********************/
function getCurrentBaseData() {
  const entidad = safeStr($("entidad")?.value);
  const sucursal = safeStr($("sucursal")?.value);
  const abonado = safeStr($("abonado")?.value);
  const central = safeStr($("central")?.value);
  const provincia = safeStr($("provincia")?.value);

  const rows = readRowsFromTable();

  return {
    version: 1,
    meta: { entidad, sucursal, abonado, central, provincia },
    rows, // [{zona, evento, area, num, dispositivo, desc}]
    updatedAt: new Date().toISOString()
  };
}

function applyBaseData(data) {
  const meta = data?.meta || {};
  if ($("entidad")) $("entidad").value = safeStr(meta.entidad);
  if ($("sucursal")) $("sucursal").value = safeStr(meta.sucursal);
  if ($("abonado")) $("abonado").value = safeStr(meta.abonado);
  if ($("central")) $("central").value = safeStr(meta.central);
  if ($("provincia")) $("provincia").value = safeStr(meta.provincia);

  renderRowsToTable(Array.isArray(data?.rows) ? data.rows : []);
  // mantener el estado de bloqueo de zonas 1-3
  aplicarBloqueoZonas123();
}

/***********************
 * Tabla: render / leer
 ***********************/
function ensureTableHasTbody() {
  const table = $("tabla-base");
  if (!table) return null;
  const tbody = table.querySelector("tbody");
  return tbody;
}

function clearTable() {
  const tbody = ensureTableHasTbody();
  if (tbody) tbody.innerHTML = "";
}

function makeSelect(options, value) {
  const sel = document.createElement("select");
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    sel.appendChild(o);
  });
  sel.value = value || options[0] || "";
  return sel;
}

function makeInput(placeholder, value) {
  const inp = document.createElement("input");
  inp.type = "text";
  inp.placeholder = placeholder || "";
  inp.value = value || "";
  return inp;
}

function createRowObject(zona, evento, area, num, dispositivo, desc) {
  return {
    zona: safeStr(zona),
    evento: safeStr(evento),
    area: safeStr(area),
    num: safeStr(num),
    dispositivo: safeStr(dispositivo),
    desc: safeStr(desc)
  };
}

function isZona123(zonaStr) {
  const z = safeStr(zonaStr).trim();
  return z === "1" || z === "2" || z === "3";
}

function buildRowTr(rowObj) {
  const tr = document.createElement("tr");

  // Columna: ZONA (input)
  const tdZona = document.createElement("td");
  const inpZona = makeInput("Zona", rowObj.zona);
  inpZona.className = "zonaInput";
  tdZona.appendChild(inpZona);
  tr.appendChild(tdZona);

  // Columna: EVENTO (select + input fallback)
  const tdEvento = document.createElement("td");
  const eventoOptions = [
    "Averia de Linea",
    "Apertura de Equipo",
    "Falta de 220V",
    "Asalto",
    "Incendio",
    "Sabotaje",
    "Panico",
    "Otros"
  ];
  const selEvento = makeSelect(eventoOptions, rowObj.evento || "Otros");
  const inpEvento = makeInput("Evento", rowObj.evento);
  inpEvento.style.display = (selEvento.value === "Otros") ? "block" : "none";
  inpEvento.style.marginTop = "6px";

  selEvento.addEventListener("change", () => {
    if (selEvento.value === "Otros") {
      inpEvento.style.display = "block";
      inpEvento.focus();
    } else {
      inpEvento.style.display = "none";
      inpEvento.value = selEvento.value;
    }
    autoSaveCurrent();
  });

  // si viene evento que no está en lista -> “Otros”
  if (rowObj.evento && !eventoOptions.includes(rowObj.evento)) {
    selEvento.value = "Otros";
    inpEvento.style.display = "block";
  } else if (rowObj.evento && eventoOptions.includes(rowObj.evento)) {
    selEvento.value = rowObj.evento;
    inpEvento.value = rowObj.evento;
    inpEvento.style.display = "none";
  }

  tdEvento.appendChild(selEvento);
  tdEvento.appendChild(inpEvento);
  tr.appendChild(tdEvento);

  // Columna: AREA (select + input)
  const tdArea = document.createElement("td");
  const areaOptions = [
    "Bunker",
    "Tesoro",
    "Lobby",
    "Salon",
    "Cajas",
    "Perimetro",
    "Otros"
  ];
  const selArea = makeSelect(areaOptions, rowObj.area || "Otros");
  const inpArea = makeInput("Area", rowObj.area);
  inpArea.style.display = (selArea.value === "Otros") ? "block" : "none";
  inpArea.style.marginTop = "6px";

  selArea.addEventListener("change", () => {
    if (selArea.value === "Otros") {
      inpArea.style.display = "block";
      inpArea.focus();
    } else {
      inpArea.style.display = "none";
      inpArea.value = selArea.value;
    }
    autoSaveCurrent();
  });

  if (rowObj.area && !areaOptions.includes(rowObj.area)) {
    selArea.value = "Otros";
    inpArea.style.display = "block";
  } else if (rowObj.area && areaOptions.includes(rowObj.area)) {
    selArea.value = rowObj.area;
    inpArea.value = rowObj.area;
    inpArea.style.display = "none";
  }

  tdArea.appendChild(selArea);
  tdArea.appendChild(inpArea);
  tr.appendChild(tdArea);

  // Columna: NUM (input)
  const tdNum = document.createElement("td");
  const inpNum = makeInput("Num", rowObj.num);
  tdNum.appendChild(inpNum);
  tr.appendChild(tdNum);

  // Columna: DISPOSITIVO (select + input)
  const tdDisp = document.createElement("td");
  const dispOptions = [
    "Activador Portatil",
    "Pulsador Fijo",
    "Magnetico",
    "Sensor PIR",
    "Detector Humo",
    "Sirena",
    "Central",
    "Teclado",
    "Otros"
  ];
  const selDisp = makeSelect(dispOptions, rowObj.dispositivo || "Otros");
  const inpDisp = makeInput("Dispositivo", rowObj.dispositivo);
  inpDisp.style.display = (selDisp.value === "Otros") ? "block" : "none";
  inpDisp.style.marginTop = "6px";

  selDisp.addEventListener("change", () => {
    if (selDisp.value === "Otros") {
      inpDisp.style.display = "block";
      inpDisp.focus();
    } else {
      inpDisp.style.display = "none";
      inpDisp.value = selDisp.value;
    }
    autoSaveCurrent();
  });

  if (rowObj.dispositivo && !dispOptions.includes(rowObj.dispositivo)) {
    selDisp.value = "Otros";
    inpDisp.style.display = "block";
  } else if (rowObj.dispositivo && dispOptions.includes(rowObj.dispositivo)) {
    selDisp.value = rowObj.dispositivo;
    inpDisp.value = rowObj.dispositivo;
    inpDisp.style.display = "none";
  }

  tdDisp.appendChild(selDisp);
  tdDisp.appendChild(inpDisp);
  tr.appendChild(tdDisp);

  // Columna: DESC (input)
  const tdDesc = document.createElement("td");
  const inpDesc = makeInput("Desc", rowObj.desc);
  tdDesc.appendChild(inpDesc);
  tr.appendChild(tdDesc);

  // Auto-save en cualquier cambio
  tr.addEventListener("input", () => autoSaveCurrent());

  return tr;
}

function renderRowsToTable(rows) {
  const tbody = ensureTableHasTbody();
  if (!tbody) return;

  tbody.innerHTML = "";
  rows.forEach(r => {
    const tr = buildRowTr(createRowObject(r.zona, r.evento, r.area, r.num, r.dispositivo, r.desc));
    tbody.appendChild(tr);
  });

  // Si queda vacía, precargamos algo mínimo (zonas 1-3 + unas filas en blanco)
  if (rows.length === 0) {
    precargarZonas();
  } else {
    aplicarBloqueoZonas123();
  }
}

function readRowsFromTable() {
  const tbody = ensureTableHasTbody();
  if (!tbody) return [];

  const rows = [];
  const trs = Array.from(tbody.querySelectorAll("tr"));

  trs.forEach(tr => {
    const tds = Array.from(tr.querySelectorAll("td"));
    if (tds.length < 6) {
      // Si tu HTML tiene 5 columnas, igual intentamos leer lo que haya
      // zona, evento, area, dispositivo, desc (num vacío)
      const zona = tds[0]?.querySelector("input")?.value ?? "";
      const evento = tds[1]?.querySelector("input")?.value ?? tds[1]?.querySelector("select")?.value ?? "";
      const area = tds[2]?.querySelector("input")?.value ?? tds[2]?.querySelector("select")?.value ?? "";
      const dispositivo = tds[3]?.querySelector("input")?.value ?? tds[3]?.querySelector("select")?.value ?? "";
      const desc = tds[4]?.querySelector("input")?.value ?? "";
      rows.push(createRowObject(zona, evento, area, "", dispositivo, desc));
      return;
    }

    const zona = tds[0].querySelector("input")?.value ?? "";
    const evento = tds[1].querySelector("input")?.value ?? tds[1].querySelector("select")?.value ?? "";
    const area = tds[2].querySelector("input")?.value ?? tds[2].querySelector("select")?.value ?? "";
    const num = tds[3].querySelector("input")?.value ?? "";
    const dispositivo = tds[4].querySelector("input")?.value ?? tds[4].querySelector("select")?.value ?? "";
    const desc = tds[5].querySelector("input")?.value ?? "";

    rows.push(createRowObject(zona, evento, area, num, dispositivo, desc));
  });

  return rows;
}

/***********************
 * Zonas 1-2-3: default fijas
 ***********************/
function precargarZonas() {
  // Crea filas para zona 1,2,3 fijas + algunas filas extras si querés
  const base = [
    createRowObject("1", "", "", "", "", ""),
    createRowObject("2", "", "", "", "", ""),
    createRowObject("3", "", "", "", "", "")
  ];

  // opcional: algunas filas vacías más para agilizar
  for (let i = 4; i <= 12; i++) {
    base.push(createRowObject(String(i), "", "", "", "", ""));
  }

  renderRowsToTable(base);
  autoSaveCurrent();
}

function aplicarBloqueoZonas123() {
  const tbody = ensureTableHasTbody();
  if (!tbody) return;

  const trs = Array.from(tbody.querySelectorAll("tr"));
  trs.forEach(tr => {
    const zonaInput = tr.querySelector("td:nth-child(1) input");
    if (!zonaInput) return;

    const z = safeStr(zonaInput.value).trim();
    if (isZona123(z)) {
      // por default bloqueadas
      zonaInput.readOnly = !zonas123EditMode;
      zonaInput.style.opacity = zonas123EditMode ? "1" : "0.75";
      zonaInput.style.cursor = zonas123EditMode ? "text" : "not-allowed";
    } else {
      zonaInput.readOnly = false;
      zonaInput.style.opacity = "1";
      zonaInput.style.cursor = "text";
    }
  });

  // toggle botones
  const btnEdit = $("btn-editar-zonas123");
  const btnLock = $("btn-bloquear-zonas123");
  if (btnEdit && btnLock) {
    btnEdit.style.display = zonas123EditMode ? "none" : "inline-block";
    btnLock.style.display = zonas123EditMode ? "inline-block" : "none";
  }
}

function activarEdicionZonas123() {
  zonas123EditMode = true;
  aplicarBloqueoZonas123();
  toast("🔓 Zonas 1-2-3 desbloqueadas (solo si necesitás ajustar).");
}

function bloquearZonas123() {
  zonas123EditMode = false;
  aplicarBloqueoZonas123();
  toast("🔒 Zonas 1-2-3 bloqueadas.");
}

/***********************
 * Auto guardado current
 ***********************/
function autoSaveCurrent() {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(getCurrentBaseData()));
  } catch (e) {
    // silencioso
  }
}

/***********************
 * Excel: Importar / Exportar
 ***********************/
async function importarExcel(file) {
  if (!file) return;

  try {
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);

    const ws = wb.worksheets[0];
    if (!ws) {
      toast("No encontré hojas en ese Excel.");
      return;
    }

    // Buscamos la fila de encabezado donde diga "Zona" y "Evento"
    let headerRowNumber = null;
    for (let r = 1; r <= Math.min(ws.rowCount, 50); r++) {
      const v1 = normalizeHeader(ws.getCell(r, 1).value);
      const v2 = normalizeHeader(ws.getCell(r, 2).value);
      if (v1 === "zona" && v2 === "evento") {
        headerRowNumber = r;
        break;
      }
    }

    if (!headerRowNumber) {
      // fallback: asumimos que arranca en fila 3 (como tu ejemplo)
      headerRowNumber = 3;
    }

    const rows = [];
    for (let r = headerRowNumber + 1; r <= ws.rowCount; r++) {
      const zona = ws.getCell(r, 1).value;
      const evento = ws.getCell(r, 2).value;
      const area = ws.getCell(r, 3).value;
      const num = ws.getCell(r, 4).value;
      const dispositivo = ws.getCell(r, 5).value;
      const desc = ws.getCell(r, 6).value;

      const z = safeStr(zona).trim();

      // cortamos si ya viene vacío total al final
      if (!z && !safeStr(evento).trim() && !safeStr(area).trim() && !safeStr(dispositivo).trim() && !safeStr(desc).trim()) {
        continue;
      }

      rows.push(createRowObject(z, safeStr(evento), safeStr(area), safeStr(num), safeStr(dispositivo), safeStr(desc)));
    }

    // Si el Excel no trae filas útiles, no rompemos nada
    if (rows.length === 0) {
      toast("No encontré filas válidas en ese Excel (después del encabezado).");
      return;
    }

    renderRowsToTable(rows);
    autoSaveCurrent();
    toast("✅ Excel importado y aplicado.");
  } catch (e) {
    console.error(e);
    toast("❌ No se pudo leer ese Excel.");
  }
}

async function exportarExcel() {
  try {
    const data = getCurrentBaseData();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Hoja1");

    // A1: título simple
    ws.getCell("A1").value = `${data.meta.entidad || ""}`.trim() || "Base Señalco";
    ws.getCell("A1").font = { bold: true };

    // Encabezado (fila 3 como tu ejemplo)
    const headerRow = 3;
    ws.getRow(headerRow).values = ["Zona", "Evento", "Area", "Num", "Dispositivo", "Desc"];
    ws.getRow(headerRow).font = { bold: true };

    // Data
    let rowIndex = headerRow + 1;
    data.rows.forEach(r => {
      ws.getRow(rowIndex).values = [r.zona, r.evento, r.area, r.num, r.dispositivo, r.desc];
      rowIndex++;
    });

    // auto ancho
    const widths = [8, 22, 18, 10, 22, 28];
    widths.forEach((w, i) => ws.getColumn(i + 1).width = w);

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    const fileName = buildFileName("base", "xlsx", data.meta);
    downloadBlob(blob, fileName);

    toast("✅ Excel exportado.");
  } catch (e) {
    console.error(e);
    toast("❌ No se pudo exportar el Excel.");
  }
}

/***********************
 * PDF (opcional)
 ***********************/
function generarPDFBase() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait" });

    const data = getCurrentBaseData();

    doc.setFontSize(14);
    doc.text("Base de Datos - Señalco", 14, 14);

    doc.setFontSize(10);
    doc.text(`Entidad: ${data.meta.entidad || "-"}`, 14, 24);
    doc.text(`Sucursal: ${data.meta.sucursal || "-"}`, 14, 30);
    doc.text(`Abonado: ${data.meta.abonado || "-"}`, 14, 36);
    doc.text(`Central: ${data.meta.central || "-"}`, 14, 42);
    doc.text(`Provincia: ${data.meta.provincia || "-"}`, 14, 48);

    const rows = data.rows.map(r => [r.zona, r.evento, r.area, r.num, r.dispositivo, r.desc]);
    doc.autoTable({
      startY: 56,
      head: [["Zona", "Evento", "Area", "Num", "Dispositivo", "Desc"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [197, 0, 0], textColor: 255 }
    });

    const fileName = buildFileName("base", "pdf", data.meta);
    doc.save(fileName);
  } catch (e) {
    console.error(e);
    toast("❌ No se pudo generar el PDF.");
  }
}

/***********************
 * Previsualización modal
 ***********************/
function abrirPrevisualizacion() {
  const modal = $("modal-prev");
  const body = $("prev-body");
  if (!modal || !body) return;

  const data = getCurrentBaseData();

  body.innerHTML = `
    <div class="card">
      <div><b>Entidad:</b> ${escapeHtml(data.meta.entidad || "-")}</div>
      <div><b>Sucursal:</b> ${escapeHtml(data.meta.sucursal || "-")}</div>
      <div><b>Abonado:</b> ${escapeHtml(data.meta.abonado || "-")}</div>
      <div><b>Central:</b> ${escapeHtml(data.meta.central || "-")}</div>
      <div><b>Provincia:</b> ${escapeHtml(data.meta.provincia || "-")}</div>
      <div style="margin-top:8px;"><b>Filas:</b> ${data.rows.length}</div>
    </div>
  `;

  // Tabla preview
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Zona</th><th>Evento</th><th>Area</th><th>Num</th><th>Dispositivo</th><th>Desc</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tb = table.querySelector("tbody");
  data.rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.zona)}</td>
      <td>${escapeHtml(r.evento)}</td>
      <td>${escapeHtml(r.area)}</td>
      <td>${escapeHtml(r.num)}</td>
      <td>${escapeHtml(r.dispositivo)}</td>
      <td>${escapeHtml(r.desc)}</td>
    `;
    tb.appendChild(tr);
  });

  body.appendChild(table);

  modal.style.display = "flex";
}

function cerrarPrevisualizacion() {
  const modal = $("modal-prev");
  if (modal) modal.style.display = "none";
}

/***********************
 * Guardado bases en teléfono (JSON localStorage)
 ***********************/
function getIndexList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIST);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function setIndexList(arr) {
  localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(arr));
}

function saveBaseToStorage(name, dataObj) {
  const key = STORAGE_KEY_PREFIX + name;
  localStorage.setItem(key, JSON.stringify(dataObj));

  const index = getIndexList();
  if (!index.includes(name)) {
    index.unshift(name);
    setIndexList(index);
  }
}

function deleteBaseFromStorage(name) {
  const key = STORAGE_KEY_PREFIX + name;
  localStorage.removeItem(key);

  const index = getIndexList().filter(n => n !== name);
  setIndexList(index);
}

function loadBaseFromStorage(name) {
  const key = STORAGE_KEY_PREFIX + name;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function obtenerBasesGuardadas() {
  renderListaBasesModal();
  renderListaBorradoresClasicos();
}

function abrirMisBases() {
  const modal = $("modal-bases");
  if (modal) modal.style.display = "flex";
  renderListaBasesModal();
}

function cerrarMisBases() {
  const modal = $("modal-bases");
  if (modal) modal.style.display = "none";
}

function renderListaBasesModal() {
  const container = $("lista-bases-json");
  if (!container) return;

  const index = getIndexList();
  if (index.length === 0) {
    container.innerHTML = `<div class="card">No hay bases guardadas todavía.</div>`;
    return;
  }

  container.innerHTML = "";
  index.forEach(name => {
    const data = loadBaseFromStorage(name);
    const meta = data?.meta || {};
    const rows = Array.isArray(data?.rows) ? data.rows.length : 0;

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div>
          <div style="font-weight:bold; font-size:16px;">${escapeHtml(name)}</div>
          <div style="font-size:13px; color:#444;">
            ${escapeHtml(meta.entidad || "-")} • Suc ${escapeHtml(meta.sucursal || "-")} • Filas: ${rows}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="mini-btn" data-act="load" data-name="${escapeHtmlAttr(name)}">Abrir</button>
          <button class="mini-btn" data-act="json" data-name="${escapeHtmlAttr(name)}">JSON</button>
          <button class="mini-btn" data-act="del"  data-name="${escapeHtmlAttr(name)}">Borrar</button>
        </div>
      </div>
    `;

    div.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button");
      if (!btn) return;

      const act = btn.getAttribute("data-act");
      const nm = btn.getAttribute("data-name");
      if (!nm) return;

      if (act === "load") {
        const obj = loadBaseFromStorage(nm);
        if (!obj) return toast("No pude abrir esa base.");
        applyBaseData(obj);
        autoSaveCurrent();
        toast("✅ Base cargada.");
      }

      if (act === "json") {
        const obj = loadBaseFromStorage(nm);
        if (!obj) return toast("No pude generar JSON.");
        descargarJSON(obj, nm);
      }

      if (act === "del") {
        if (confirm(`¿Borrar "${nm}"?`)) {
          deleteBaseFromStorage(nm);
          renderListaBasesModal();
          renderListaBorradoresClasicos();
        }
      }
    });

    container.appendChild(div);
  });
}

function guardarComo() {
  const inp = $("nombre-base");
  const nameRaw = safeStr(inp?.value).trim();
  if (!nameRaw) {
    toast("Poné un nombre para guardar (ej: Galicia_Suc123).");
    return;
  }
  const clean = nameRaw.replace(/[^\w\-\.]+/g, "_").slice(0, 60);
  const data = getCurrentBaseData();
  saveBaseToStorage(clean, data);
  toast("✅ Base guardada en el teléfono.");
  renderListaBasesModal();
  renderListaBorradoresClasicos();
}

/***********************
 * JSON: descargar / importar
 ***********************/
function descargarJSON(obj, name) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const fileName = `${name || "base"}_${new Date().toISOString().slice(0,10)}.json`;
  downloadBlob(blob, fileName);
}

function descargarJSONActual() {
  const data = getCurrentBaseData();
  const name = buildBaseNameFromMeta(data.meta) || "base_senalco";
  descargarJSON(data, name);
}

async function importarJSON(file) {
  if (!file) return;

  try {
    const txt = await file.text();
    const obj = JSON.parse(txt);

    // Validación mínima
    if (!obj || !obj.meta || !Array.isArray(obj.rows)) {
      toast("Ese JSON no parece una base válida.");
      return;
    }

    // aplicar
    applyBaseData(obj);
    autoSaveCurrent();

    // guardar en Descargas NO se puede forzar desde web,
    // pero sí lo podés guardar como base local si querés:
    const autoName = buildBaseNameFromMeta(obj.meta) || ("import_" + Date.now());
    saveBaseToStorage(autoName, obj);

    toast("✅ JSON importado y guardado.");
    renderListaBasesModal();
    renderListaBorradoresClasicos();
  } catch (e) {
    console.error(e);
    toast("❌ No se pudo importar ese JSON.");
  }
}

/***********************
 * Compartir (WhatsApp/Mail/etc)
 * Usa Web Share API si existe
 ***********************/
async function compartirBlobComoArchivo(blob, filename, title) {
  try {
    if (!navigator.share) {
      toast("Tu teléfono/navegador no soporta compartir directo. Te lo descargo.");
      downloadBlob(blob, filename);
      return;
    }

    const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });

    // Validación de canShare
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      toast("No puedo compartir como archivo acá. Te lo descargo.");
      downloadBlob(blob, filename);
      return;
    }

    await navigator.share({
      title: title || filename,
      files: [file]
    });
  } catch (e) {
    // si el usuario cancela, no molestamos
    console.warn(e);
  }
}

async function compartirJSONActual() {
  const data = getCurrentBaseData();
  const name = buildBaseNameFromMeta(data.meta) || "base_senalco";
  const filename = `${name}_${new Date().toISOString().slice(0,10)}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  await compartirBlobComoArchivo(blob, filename, "Base Señalco (JSON)");
}

async function compartirExcelActual() {
  try {
    const data = getCurrentBaseData();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Hoja1");

    ws.getCell("A1").value = `${data.meta.entidad || ""}`.trim() || "Base Señalco";
    ws.getCell("A1").font = { bold: true };

    const headerRow = 3;
    ws.getRow(headerRow).values = ["Zona", "Evento", "Area", "Num", "Dispositivo", "Desc"];
    ws.getRow(headerRow).font = { bold: true };

    let rowIndex = headerRow + 1;
    data.rows.forEach(r => {
      ws.getRow(rowIndex).values = [r.zona, r.evento, r.area, r.num, r.dispositivo, r.desc];
      rowIndex++;
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    const filename = buildFileName("base", "xlsx", data.meta);
    await compartirBlobComoArchivo(blob, filename, "Base Señalco (Excel)");
  } catch (e) {
    console.error(e);
    toast("❌ No se pudo compartir el Excel.");
  }
}

/***********************
 * Borradores "clásicos"
 * (mantengo compat con tu UI vieja)
 ***********************/
function guardarBorradorBase(nombre) {
  const data = getCurrentBaseData();
  localStorage.setItem(nombre, JSON.stringify(data));
  renderListaBorradoresClasicos();
  toast("✅ Borrador guardado.");
}

function renderListaBorradoresClasicos() {
  const ul = $("lista-bases");
  if (!ul) return;

  ul.innerHTML = "";
  ["borrador1", "borrador2"].forEach((k, i) => {
    const raw = localStorage.getItem(k);
    if (!raw) return;

    let obj = null;
    try { obj = JSON.parse(raw); } catch { return; }

    const meta = obj?.meta || {};
    const li = document.createElement("li");
    li.style.marginBottom = "8px";
    li.innerHTML = `
      📁 Borrador ${i + 1}: ${escapeHtml(meta.entidad || "-")} - ${escapeHtml(meta.sucursal || "-")}
      <button class="mini-btn" style="margin-left:10px;" data-k="${k}">Abrir</button>
    `;
    li.querySelector("button")?.addEventListener("click", () => {
      const obj2 = JSON.parse(localStorage.getItem(k));
      applyBaseData(obj2);
      autoSaveCurrent();
      toast("✅ Borrador cargado.");
    });
    ul.appendChild(li);
  });
}

/***********************
 * Limpieza
 ***********************/
function limpiarBase() {
  if ($("entidad")) $("entidad").value = "";
  if ($("sucursal")) $("sucursal").value = "";
  if ($("abonado")) $("abonado").value = "";
  if ($("central")) $("central").value = "";
  if ($("provincia")) $("provincia").value = "";

  precargarZonas();
  autoSaveCurrent();
  toast("🧹 Base limpiada.");
}

/***********************
 * Utilidades
 ***********************/
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildBaseNameFromMeta(meta) {
  const parts = [
    safeStr(meta.entidad).trim(),
    safeStr(meta.sucursal).trim(),
    safeStr(meta.abonado).trim()
  ].filter(Boolean);

  if (parts.length === 0) return "";
  return parts.join("_").replace(/[^\w\-\.]+/g, "_").slice(0, 60);
}

function buildFileName(prefix, ext, meta) {
  const base = buildBaseNameFromMeta(meta) || prefix || "archivo";
  return `${base}_${new Date().toISOString().slice(0,10)}.${ext}`;
}

function escapeHtml(s) {
  return safeStr(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeHtmlAttr(s) {
  return escapeHtml(s).replaceAll("`", "&#096;");
}

/***********************
 * Eventos / Inicialización
 ***********************/
function asignarEventosBase() {
  // Botones principales
  $("btn-limpiar-base")?.addEventListener("click", limpiarBase);

  // Subir Excel
  $("btn-subir-excel")?.addEventListener("click", () => {
    $("input-excel-base")?.click();
  });
  $("input-excel-base")?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    await importarExcel(file);
    ev.target.value = ""; // para permitir re-subir el mismo
  });

  // Previsualizar
  $("btn-previsualizar")?.addEventListener("click", abrirPrevisualizacion);
  $("btn-cerrar-prev")?.addEventListener("click", cerrarPrevisualizacion);
  $("modal-prev")?.addEventListener("click", (e) => {
    if (e.target?.id === "modal-prev") cerrarPrevisualizacion();
  });
  $("btn-descargar-pdf-prev")?.addEventListener("click", () => {
    cerrarPrevisualizacion();
    generarPDFBase();
  });

  // PDF opcional
  $("btn-generar-pdf-base")?.addEventListener("click", generarPDFBase);

  // Export Excel
  $("btn-excel-base")?.addEventListener("click", exportarExcel);

  // Guardar local rápido
  $("btn-guardar-local")?.addEventListener("click", () => {
    const data = getCurrentBaseData();
    const name = buildBaseNameFromMeta(data.meta) || ("base_" + Date.now());
    saveBaseToStorage(name, data);
    toast("✅ Guardado local.");
    obtenerBasesGuardadas();
  });

  // Mis bases modal
  $("btn-mis-bases")?.addEventListener("click", abrirMisBases);
  $("btn-cerrar-bases")?.addEventListener("click", cerrarMisBases);
  $("modal-bases")?.addEventListener("click", (e) => {
    if (e.target?.id === "modal-bases") cerrarMisBases();
  });

  // Guardar como
  $("btn-guardar-como")?.addEventListener("click", guardarComo);

  // JSON descargar / importar
  $("btn-descargar-json")?.addEventListener("click", descargarJSONActual);

  $("btn-importar-json")?.addEventListener("click", () => {
    $("input-json-base")?.click();
  });
  $("input-json-base")?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    await importarJSON(file);
    ev.target.value = "";
  });

  // Compartir
  $("btn-compartir-json")?.addEventListener("click", compartirJSONActual);
  $("btn-compartir-excel")?.addEventListener("click", compartirExcelActual);

  // Zonas 1-3
  $("btn-editar-zonas123")?.addEventListener("click", activarEdicionZonas123);
  $("btn-bloquear-zonas123")?.addEventListener("click", bloquearZonas123);

  // Auto-save en campos meta
  ["entidad","sucursal","abonado","central","provincia"].forEach(id => {
    $(id)?.addEventListener("input", () => autoSaveCurrent());
  });
}

/***********************
 * Boot: cargar current si existe
 ***********************/
function cargarCurrentSiExiste() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (!raw) return false;
    const obj = JSON.parse(raw);
    if (!obj || !obj.meta || !Array.isArray(obj.rows)) return false;

    applyBaseData(obj);
    return true;
  } catch {
    return false;
  }
}

/***********************
 * Exponer funciones usadas en HTML inline
 * (por si tu HTML llama estas desde onload)
 ***********************/
window.asignarEventosBase = asignarEventosBase;
window.precargarZonas = precargarZonas;
window.obtenerBasesGuardadas = obtenerBasesGuardadas;
window.guardarBorradorBase = guardarBorradorBase;

/***********************
 * Auto init (por si el onload falla)
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  // Si el body onload ya las llama, esto no molesta.
  try {
    asignarEventosBase();

    const cargado = cargarCurrentSiExiste();
    if (!cargado) {
      precargarZonas();
    } else {
      aplicarBloqueoZonas123();
    }

    obtenerBasesGuardadas();
  } catch (e) {
    console.error(e);
  }
});