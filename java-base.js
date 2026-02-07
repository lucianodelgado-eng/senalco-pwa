/***********************
 * java-base.js (FULL)
 * - Sin compartir
 * - Sin borradores clásicos
 * - Descargar y Abrir JSON/Excel
 * - Mantiene: Excel import/export, PDF opcional, previsualización, Mis Bases (local)
 ************************/

/** ====== CONFIG ====== **/
const LS_KEYS = {
  ZONAS: "senalco_base_zonas",
  BASES_INDEX: "senalco_bases_index",   // array de nombres
  BASE_PREFIX: "senalco_base_",         // senalco_base_<nombre>
  AUTO_DRAFT: "senalco_base_autosave"   // autosave silencioso
};

const DEFAULT_ZONAS_1_3 = [
  { zona: "1", evento: "Avería de Línea", area: "", dispositivo: "", desc: "" },
  { zona: "2", evento: "Apertura de Equipo", area: "", dispositivo: "", desc: "" },
  { zona: "3", evento: "Falta de 220V", area: "", dispositivo: "", desc: "" }
];

let zonasBloqueadas123 = true; // por defecto bloqueadas

/** ====== HELPERS DOM ====== **/
const $ = (id) => document.getElementById(id);

function safeName(name) {
  return (name || "base").trim().replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "");
}

function nowStamp() {
  // 2026-02-07-18-20-55
  return new Date().toISOString().slice(0, 19).replace("T", "-").replace(/:/g, "-");
}

function downloadBlobAndOpen(blob, filename) {
  const url = URL.createObjectURL(blob);

  // Descargar
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Abrir (para que desde el visor puedas "Compartir")
  setTimeout(() => {
    try { window.open(url, "_blank"); } catch (e) {}
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 400);
}

/** ====== TABLA ====== **/
function tablaBody() {
  return document.querySelector("#tabla-base tbody");
}

function crearFila(row, opts = {}) {
  // row: { zona, evento, area, dispositivo, desc }
  const tr = document.createElement("tr");

  // ZONA
  const tdZona = document.createElement("td");
  const inpZona = document.createElement("input");
  inpZona.className = "zonaInput";
  inpZona.value = row.zona ?? "";
  inpZona.dataset.col = "zona";

  // bloquear zonas 1-3 si corresponde
  if (["1", "2", "3"].includes(String(row.zona)) && zonasBloqueadas123) {
    inpZona.readOnly = true;
  }

  tdZona.appendChild(inpZona);
  tr.appendChild(tdZona);

  // EVENTO
  const tdEvento = document.createElement("td");
  const inpEvento = document.createElement("input");
  inpEvento.value = row.evento ?? "";
  inpEvento.dataset.col = "evento";
  tdEvento.appendChild(inpEvento);
  tr.appendChild(tdEvento);

  // ÁREA
  const tdArea = document.createElement("td");
  const inpArea = document.createElement("input");
  inpArea.value = row.area ?? "";
  inpArea.dataset.col = "area";
  tdArea.appendChild(inpArea);
  tr.appendChild(tdArea);

  // DISPOSITIVO
  const tdDisp = document.createElement("td");
  const inpDisp = document.createElement("input");
  inpDisp.value = row.dispositivo ?? "";
  inpDisp.dataset.col = "dispositivo";
  tdDisp.appendChild(inpDisp);
  tr.appendChild(tdDisp);

  // DESCRIPCIÓN
  const tdDesc = document.createElement("td");
  const inpDesc = document.createElement("input");
  inpDesc.value = row.desc ?? "";
  inpDesc.dataset.col = "desc";
  tdDesc.appendChild(inpDesc);
  tr.appendChild(tdDesc);

  // autosave al tipear
  tr.addEventListener("input", () => autoGuardar());

  return tr;
}

function limpiarTabla() {
  tablaBody().innerHTML = "";
}

function leerTabla() {
  const rows = [];
  tablaBody().querySelectorAll("tr").forEach(tr => {
    const cols = {};
    tr.querySelectorAll("input").forEach(inp => {
      cols[inp.dataset.col] = inp.value ?? "";
    });
    rows.push({
      zona: cols.zona ?? "",
      evento: cols.evento ?? "",
      area: cols.area ?? "",
      dispositivo: cols.dispositivo ?? "",
      desc: cols.desc ?? ""
    });
  });
  return rows;
}

/** ====== ZONAS 1-3 (precarga + bloqueo) ====== **/
function precargarZonas() {
  // si hay autosave, cargarlo, si no, cargar por defecto 1-3
  const auto = localStorage.getItem(LS_KEYS.AUTO_DRAFT);
  if (auto) {
    try {
      const data = JSON.parse(auto);
      cargarDesdeData(data);
      aplicarBloqueoZonas123();
      return;
    } catch (e) {}
  }

  // si existe config de zonas guardadas, usarla
  const cfg = localStorage.getItem(LS_KEYS.ZONAS);
  if (cfg) {
    try {
      const data = JSON.parse(cfg);
      cargarDesdeData(data);
      aplicarBloqueoZonas123();
      return;
    } catch (e) {}
  }

  // default limpio + zonas 1-3
  limpiarTabla();
  DEFAULT_ZONAS_1_3.forEach(r => tablaBody().appendChild(crearFila(r)));
  autoGuardar();
  aplicarBloqueoZonas123();
}

function aplicarBloqueoZonas123() {
  tablaBody().querySelectorAll("tr").forEach(tr => {
    const inpZona = tr.querySelector('input[data-col="zona"]');
    if (!inpZona) return;
    const z = String(inpZona.value || "").trim();
    if (["1", "2", "3"].includes(z)) {
      inpZona.readOnly = zonasBloqueadas123;
    }
  });
}

function desbloquearZonas123() {
  zonasBloqueadas123 = false;
  aplicarBloqueoZonas123();
  const btnEd = $("btn-editar-zonas123");
  const btnBl = $("btn-bloquear-zonas123");
  if (btnEd) btnEd.style.display = "none";
  if (btnBl) btnBl.style.display = "inline-block";
}

function bloquearZonas123() {
  zonasBloqueadas123 = true;
  aplicarBloqueoZonas123();
  const btnEd = $("btn-editar-zonas123");
  const btnBl = $("btn-bloquear-zonas123");
  if (btnEd) btnEd.style.display = "inline-block";
  if (btnBl) btnBl.style.display = "none";
}

/** ====== DATA MODEL ====== **/
function armarDataActual() {
  return {
    meta: {
      generado: new Date().toISOString(),
      version: "1.0"
    },
    header: {
      entidad: $("entidad")?.value ?? "",
      sucursal: $("sucursal")?.value ?? "",
      abonado: $("abonado")?.value ?? "",
      central: $("central")?.value ?? "",
      provincia: $("provincia")?.value ?? ""
    },
    rows: leerTabla()
  };
}

function cargarDesdeData(data) {
  // header
  if (data?.header) {
    $("entidad").value = data.header.entidad ?? "";
    $("sucursal").value = data.header.sucursal ?? "";
    $("abonado").value = data.header.abonado ?? "";
    $("central").value = data.header.central ?? "";
    $("provincia").value = data.header.provincia ?? "";
  }

  // rows
  limpiarTabla();
  const rows = Array.isArray(data?.rows) ? data.rows : [];

  // IMPORTANTE: si vienen rows de excel/json con zonas 1-3, las dejamos,
  // pero NO metemos filas inventadas. Solo usamos lo que viene.
  rows.forEach(r => tablaBody().appendChild(crearFila({
    zona: r.zona ?? "",
    evento: r.evento ?? "",
    area: r.area ?? "",
    dispositivo: r.dispositivo ?? "",
    desc: r.desc ?? ""
  })));

  // si vino vacío, cargamos default 1-3
  if (rows.length === 0) {
    DEFAULT_ZONAS_1_3.forEach(r => tablaBody().appendChild(crearFila(r)));
  }

  aplicarBloqueoZonas123();
  autoGuardar();
}

/** ====== AUTOGUARDADO ====== **/
function autoGuardar() {
  try {
    localStorage.setItem(LS_KEYS.AUTO_DRAFT, JSON.stringify(armarDataActual()));
  } catch (e) {}
}

/** ====== MIS BASES (Local) ====== **/
function obtenerBasesGuardadas() {
  const cont = $("lista-bases-json");
  if (!cont) return;

  const idx = JSON.parse(localStorage.getItem(LS_KEYS.BASES_INDEX) || "[]");
  cont.innerHTML = "";

  if (!idx.length) {
    cont.innerHTML = `<p style="opacity:.75;">No hay bases guardadas todavía.</p>`;
    return;
  }

  idx.forEach(name => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
        <div style="font-weight:bold;">${name}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="mini-btn" data-act="abrir" data-name="${name}">Abrir</button>
          <button class="mini-btn" data-act="json" data-name="${name}">JSON</button>
          <button class="mini-btn" style="background:#b00020;" data-act="borrar" data-name="${name}">Borrar</button>
        </div>
      </div>
    `;

    card.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        const act = b.dataset.act;
        const nm = b.dataset.name;
        if (act === "abrir") abrirBaseGuardada(nm);
        if (act === "json") descargarJSONDeBase(nm);
        if (act === "borrar") borrarBaseGuardada(nm);
      });
    });

    cont.appendChild(card);
  });
}

function guardarBaseComo(nombre) {
  const nm = safeName(nombre);
  if (!nm) return alert("Poné un nombre válido.");

  const key = LS_KEYS.BASE_PREFIX + nm;
  const data = armarDataActual();

  try {
    localStorage.setItem(key, JSON.stringify(data));

    const idx = JSON.parse(localStorage.getItem(LS_KEYS.BASES_INDEX) || "[]");
    if (!idx.includes(nm)) idx.unshift(nm);
    localStorage.setItem(LS_KEYS.BASES_INDEX, JSON.stringify(idx));

    obtenerBasesGuardadas();
    alert("✅ Base guardada en el teléfono: " + nm);
  } catch (e) {
    alert("❌ No se pudo guardar (storage lleno o bloqueado).");
  }
}

function abrirBaseGuardada(nombre) {
  const nm = safeName(nombre);
  const key = LS_KEYS.BASE_PREFIX + nm;
  const raw = localStorage.getItem(key);
  if (!raw) return alert("No existe esa base.");

  try {
    const data = JSON.parse(raw);
    cargarDesdeData(data);
    cerrarModalBases();
  } catch (e) {
    alert("❌ JSON inválido en esa base.");
  }
}

function borrarBaseGuardada(nombre) {
  const nm = safeName(nombre);
  const key = LS_KEYS.BASE_PREFIX + nm;
  localStorage.removeItem(key);

  let idx = JSON.parse(localStorage.getItem(LS_KEYS.BASES_INDEX) || "[]");
  idx = idx.filter(x => x !== nm);
  localStorage.setItem(LS_KEYS.BASES_INDEX, JSON.stringify(idx));

  obtenerBasesGuardadas();
}

function descargarJSONDeBase(nombre) {
  const nm = safeName(nombre);
  const key = LS_KEYS.BASE_PREFIX + nm;
  const raw = localStorage.getItem(key);
  if (!raw) return alert("No existe esa base.");

  try {
    const data = JSON.parse(raw);
    const filename = `${nm}_${nowStamp()}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlobAndOpen(blob, filename);
  } catch (e) {
    alert("❌ No se pudo generar JSON.");
  }
}

/** ====== JSON IMPORT/EXPORT (actual) ====== **/
function descargarJSONActual() {
  const data = armarDataActual();
  const nombre = safeName($("entidad")?.value || "base");
  const filename = `${nombre}_${nowStamp()}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlobAndOpen(blob, filename);
}

function importarJSONDesdeArchivo(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(String(e.target.result || "{}"));
      cargarDesdeData(data);
      alert("✅ JSON importado.");
    } catch (err) {
      alert("❌ Ese JSON no es válido.");
    }
  };
  reader.readAsText(file);
}

/** ====== EXCEL IMPORT/EXPORT ====== **/
async function exportarExcelActual() {
  const data = armarDataActual();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Base");

  // Header
  ws.addRow(["Entidad", data.header.entidad]);
  ws.addRow(["Sucursal", data.header.sucursal]);
  ws.addRow(["Abonado", data.header.abonado]);
  ws.addRow(["Central", data.header.central]);
  ws.addRow(["Provincia", data.header.provincia]);
  ws.addRow(["Generado", new Date(data.meta.generado).toLocaleString("es-AR")]);
  ws.addRow([]);

  // Tabla
  ws.addRow(["Zona", "Evento", "Área", "Dispositivo", "Descripción"]);
  data.rows.forEach(r => ws.addRow([r.zona, r.evento, r.area, r.dispositivo, r.desc]));

  const buffer = await wb.xlsx.writeBuffer();
  const nombre = safeName(data.header.entidad || "base");
  const filename = `${nombre}_${nowStamp()}.xlsx`;
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  downloadBlobAndOpen(blob, filename);
}

async function importarExcelBase(file) {
  try {
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);

    const ws = wb.worksheets[0];
    if (!ws) return alert("❌ No se encontró hoja en el Excel.");

    // Intento flexible: buscar encabezados Zona/Evento/Área/Dispositivo/Descripción
    // Si el Excel no tiene header, igual intentamos por columnas A-E
    let startRow = 1;
    let headerRow = null;

    ws.eachRow((row, rowNumber) => {
      const vals = row.values.map(v => String(v ?? "").trim().toLowerCase());
      if (vals.includes("zona") && vals.includes("evento")) {
        headerRow = rowNumber;
      }
    });

    if (headerRow) startRow = headerRow + 1;

    const rows = [];
    for (let r = startRow; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const A = String(row.getCell(1).value ?? "").trim();
      const B = String(row.getCell(2).value ?? "").trim();
      const C = String(row.getCell(3).value ?? "").trim();
      const D = String(row.getCell(4).value ?? "").trim();
      const E = String(row.getCell(5).value ?? "").trim();

      // saltar filas vacías
      if (!A && !B && !C && !D && !E) continue;

      // solo si tiene zona numérica
      rows.push({ zona: A, evento: B, area: C, dispositivo: D, desc: E });
    }

    // IMPORTANTE:
    // - NO inventamos zonas 1-3 si el excel no trae. (Si querés siempre las 1-3 fijas, se mantienen si ya estaban)
    // - Si el excel trae 1-3, las respeta pero quedan bloqueadas salvo que destrabes.
    const current = armarDataActual();
    const tiene123Actual = current.rows.some(x => ["1","2","3"].includes(String(x.zona).trim()));

    let finalRows = rows;

    // Si el excel no trae 1-3 y vos querés mantener las fijas actuales, las preservamos:
    const excelTrae123 = rows.some(x => ["1","2","3"].includes(String(x.zona).trim()));
    if (!excelTrae123 && tiene123Actual) {
      const solo123 = current.rows.filter(x => ["1","2","3"].includes(String(x.zona).trim()));
      const sin123Excel = rows.filter(x => !["1","2","3"].includes(String(x.zona).trim()));
      finalRows = [...solo123, ...sin123Excel];
    }

    const data = {
      meta: { generado: new Date().toISOString(), version: "1.0" },
      header: current.header, // no tocar header por importar
      rows: finalRows
    };

    cargarDesdeData(data);
    alert("✅ Excel importado.");
  } catch (e) {
    alert("❌ No se pudo leer el Excel.");
  }
}

/** ====== PDF (opcional) ====== **/
async function generarPDFBase() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait" });

  const data = armarDataActual();
  const h = data.header;

  // Logo si existe
  try {
    const logo = $("logo-pdf");
    if (logo && logo.complete) {
      const c = document.createElement("canvas");
      c.width = logo.naturalWidth;
      c.height = logo.naturalHeight;
      c.getContext("2d").drawImage(logo, 0, 0);
      doc.addImage(c.toDataURL("image/jpeg"), "JPEG", 155, 8, 40, 18);
    }
  } catch (e) {}

  doc.setFontSize(14);
  doc.text("Base de Datos - Señalco", 14, 18);

  doc.setFontSize(10);
  const gen = new Date(data.meta.generado).toLocaleString("es-AR");
  doc.text(`Entidad: ${h.entidad || "-"}`, 14, 28);
  doc.text(`Sucursal: ${h.sucursal || "-"}`, 14, 34);
  doc.text(`Abonado: ${h.abonado || "-"}`, 14, 40);
  doc.text(`Central: ${h.central || "-"}`, 14, 46);
  doc.text(`Provincia: ${h.provincia || "-"}`, 14, 52);
  doc.text(`Generado: ${gen}`, 14, 58);

  const body = data.rows.map(r => [r.zona, r.evento, r.area, r.dispositivo, r.desc]);

  doc.autoTable({
    startY: 66,
    head: [["Zona", "Evento", "Área", "Dispositivo", "Descripción"]],
    body,
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [25, 118, 210], textColor: 255 }
  });

  const nombre = safeName(h.entidad || "base");
  doc.save(`${nombre}_${nowStamp()}.pdf`);
}

/** ====== PREVISUALIZACIÓN (modal) ====== **/
function abrirModalPrev() {
  const modal = $("modal-prev");
  const body = $("prev-body");
  if (!modal || !body) return;

  const data = armarDataActual();
  const h = data.header;

  body.innerHTML = `
    <div style="background:#fff; border-radius:12px; padding:12px;">
      <div style="margin-bottom:10px; font-weight:bold;">
        Entidad: ${h.entidad || "-"}<br>
        Sucursal: ${h.sucursal || "-"}<br>
        Abonado: ${h.abonado || "-"}<br>
        Central: ${h.central || "-"}<br>
        Provincia: ${h.provincia || "-"}<br>
        Generado: ${new Date(data.meta.generado).toLocaleString("es-AR")}<br>
        Filas: ${data.rows.length}
      </div>

      <div style="overflow:auto; border:1px solid #ddd; border-radius:10px;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#1976d2; color:#fff;">
              <th style="padding:6px; border:1px solid #ddd;">Zona</th>
              <th style="padding:6px; border:1px solid #ddd;">Evento</th>
              <th style="padding:6px; border:1px solid #ddd;">Área</th>
              <th style="padding:6px; border:1px solid #ddd;">Dispositivo</th>
              <th style="padding:6px; border:1px solid #ddd;">Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${data.rows.map(r => `
              <tr>
                <td style="padding:6px; border:1px solid #ddd;">${escapeHtml(r.zona)}</td>
                <td style="padding:6px; border:1px solid #ddd;">${escapeHtml(r.evento)}</td>
                <td style="padding:6px; border:1px solid #ddd;">${escapeHtml(r.area)}</td>
                <td style="padding:6px; border:1px solid #ddd;">${escapeHtml(r.dispositivo)}</td>
                <td style="padding:6px; border:1px solid #ddd;">${escapeHtml(r.desc)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

function cerrarModalPrev() {
  const modal = $("modal-prev");
  if (modal) modal.style.display = "none";
}

function abrirModalBases() {
  const modal = $("modal-bases");
  if (!modal) return;
  obtenerBasesGuardadas();
  modal.style.display = "flex";
}

function cerrarModalBases() {
  const modal = $("modal-bases");
  if (modal) modal.style.display = "none";
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** ====== LIMPIAR ====== **/
function limpiarTodo() {
  $("entidad").value = "";
  $("sucursal").value = "";
  $("abonado").value = "";
  $("central").value = "";
  $("provincia").value = "";

  limpiarTabla();
  DEFAULT_ZONAS_1_3.forEach(r => tablaBody().appendChild(crearFila(r)));
  bloquearZonas123();
  autoGuardar();
}

/** ====== EVENTOS ====== **/
function asignarEventosBase() {
  // Botones principales
  $("btn-limpiar-base")?.addEventListener("click", limpiarTodo);

  $("btn-subir-excel")?.addEventListener("click", () => {
    $("input-excel-base")?.click();
  });

  $("input-excel-base")?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await importarExcelBase(f);
    e.target.value = "";
  });

  $("btn-excel-base")?.addEventListener("click", exportarExcelActual);
  $("btn-generar-pdf-base")?.addEventListener("click", generarPDFBase);

  $("btn-previsualizar")?.addEventListener("click", abrirModalPrev);
  $("btn-cerrar-prev")?.addEventListener("click", cerrarModalPrev);
  $("btn-descargar-pdf-prev")?.addEventListener("click", generarPDFBase);

  // Mis Bases
  $("btn-mis-bases")?.addEventListener("click", abrirModalBases);
  $("btn-cerrar-bases")?.addEventListener("click", cerrarModalBases);

  $("btn-guardar-local")?.addEventListener("click", () => {
    // guarda directo como autosave "config" también
    try {
      localStorage.setItem(LS_KEYS.ZONAS, JSON.stringify(armarDataActual()));
      alert("✅ Guardado local OK.");
    } catch (e) {
      alert("❌ No se pudo guardar local.");
    }
  });

  $("btn-guardar-como")?.addEventListener("click", () => {
    const nm = $("nombre-base")?.value || "";
    guardarBaseComo(nm);
  });

  $("btn-descargar-json")?.addEventListener("click", descargarJSONActual);

  $("btn-importar-json")?.addEventListener("click", () => {
    $("input-json-base")?.click();
  });

  $("input-json-base")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    importarJSONDesdeArchivo(f);
    e.target.value = "";
  });

  // Zonas 1-3 lock/unlock
  $("btn-editar-zonas123")?.addEventListener("click", desbloquearZonas123);
  $("btn-bloquear-zonas123")?.addEventListener("click", bloquearZonas123);

  // Autosave header
  ["entidad", "sucursal", "abonado", "central", "provincia"].forEach(id => {
    $(id)?.addEventListener("input", () => autoGuardar());
  });

  // Cerrar modales tocando afuera
  $("modal-prev")?.addEventListener("click", (e) => {
    if (e.target?.id === "modal-prev") cerrarModalPrev();
  });
  $("modal-bases")?.addEventListener("click", (e) => {
    if (e.target?.id === "modal-bases") cerrarModalBases();
  });
}