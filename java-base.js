/***********************
 *   Señalco - Base    *
 * java-base.js FULL   *
 * (corregido + estable)
 ***********************/

/** =========================
 *  Listas
 *  ========================= */
const eventos = [
  "- Sin tipo definido -",
  "Avería de linea",
  "Averia de linea",
  "Falta de 220V",
  "Alarma", "Robo", "Asalto",
  "clave", "Sabotaje", "Apertura de Equipo",
  "Puls. Remoto - Falla Red", "ALM + 4 HS", "Asalto Clave Falsa",
  "Falla activador portátil", "Falla cent. Policial. GPRS OK", "Falla Comunicación GPRS",
  "Falla de Conexión al Servidor GPRS", "Falla de PT", "Falla Enlace Red PT",
  "Incendio", "Otros",
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

/** ==========================================
 *  Flags / State
 *  ========================================== */
let zonas123Editables = false;

/** ✅ Para saber si estás editando una base existente */
const CURRENT_NAME_KEY = "senalco_current_base_name";
function getCurrentBaseName() { return localStorage.getItem(CURRENT_NAME_KEY) || ""; }
function setCurrentBaseName(name) {
  if (!name) localStorage.removeItem(CURRENT_NAME_KEY);
  else localStorage.setItem(CURRENT_NAME_KEY, name);
}

/** ==========================================
 *  Utilidades
 *  ========================================== */
function $(id) { return document.getElementById(id); }
function pad2(n) { return String(n).padStart(2, "0"); }

function fechaGeneradoLocal() {
  const d = new Date();
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function fechaStamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

function safeName(s) {
  return (s || "base").toString().trim().replace(/\s+/g, "_").replace(/[^\w\-()]/g, "_");
}

function getZonaNumberFromText(z) {
  const m = String(z || "").match(/(\d{1,2})/);
  return m ? parseInt(m[1], 10) : null;
}

function normKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replaceAll("á", "a").replaceAll("é", "e").replaceAll("í", "i").replaceAll("ó", "o").replaceAll("ú", "u")
    .replace(/\s+/g, " ");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** ==========================================
 *  Entidades (datalist)
 *  ========================================== */
const ENTIDADES_AR = [
  "Banco de la Nación Argentina",
  "Banco de la Provincia de Buenos Aires",
  "Banco Ciudad",
  "Banco Santander Río",
  "Banco Galicia",
  "BBVA Argentina",
  "Banco Macro",
  "Banco Comafi",
  "Banco Patagonia",
  "Banco Hipotecario",
  "Banco Supervielle",
  "Banco Itaú (operación migrada)",
  "Banco Credicoop",
  "Banco ICBC",
  "Banco Provincia de Córdoba",
  "Banco de Santa Fe",
  "Banco de Entre Ríos",
  "Banco San Juan",
  "Banco Santa Cruz",
  "Banco del Chubut",
  "Banco del Neuquén",
  "Banco Corrientes",
  "Banco Bica",
  "Banco Industrial",
  "Banco CMF",
  "Banco del Sol",
  "Banco Dino",
  "Banco de Formosa",
  "Banco de La Pampa",
  "Banco de Tierra del Fuego",
  "Musimundo",
  "Otros"
];

function poblarDatalistEntidades() {
  const dl = $("lista-entidades");
  if (!dl) return;
  dl.innerHTML = "";
  ENTIDADES_AR.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n;
    dl.appendChild(opt);
  });
}

/** ==========================================
 *  Storage Keys (LS)
 *  ========================================== */
const INDEX_KEY = "senalco_bases_index";
const BASE_PREFIX = "senalco_base_";
const AUTOSAVE_KEY = "senalco_base_autosave";
const FILTER_PREF_KEY = "senalco_base_filtros_v1";

function getIndex() {
  try { return JSON.parse(localStorage.getItem(INDEX_KEY) || "[]"); }
  catch { return []; }
}
function setIndex(list) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(list));
}
function baseKey(nombre) { return BASE_PREFIX + nombre; }

/** ==========================================
 *  DOM Bindings
 *  ========================================== */
function asignarEventosBase() {
  $("btn-limpiar-base")?.addEventListener("click", limpiarBase);
  $("btn-generar-pdf-base")?.addEventListener("click", generarPDF);
  $("btn-excel-base")?.addEventListener("click", generarExcel);

  // Import Excel
  $("btn-subir-excel")?.addEventListener("click", () => $("input-excel-base")?.click());
  $("input-excel-base")?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (f) await importarExcelBase(f);
    e.target.value = "";
  });

  // Import JSON
  $("btn-importar-json-top")?.addEventListener("click", () => $("input-json-base-top")?.click());
  $("input-json-base-top")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) importarJSONBase(f);
    e.target.value = "";
  });

  // Import muchos JSON (Android-friendly)
  $("btn-importar-muchos-json")?.addEventListener("click", () => $("input-json-muchos")?.click());
  $("input-json-muchos")?.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []).filter(f => (f.name || "").toLowerCase().endsWith(".json"));
    if (!files.length) {
      alert("No se seleccionaron JSON.");
      e.target.value = "";
      return;
    }
    await importarMuchosJSON(files);
    e.target.value = "";
  });

  // Guardar rápido + backup
  $("btn-guardar-rapido")?.addEventListener("click", guardarRapidoConBackup);

  // Previsualizar
  $("btn-previsualizar")?.addEventListener("click", abrirPrevisualizacion);
  $("btn-cerrar-prev")?.addEventListener("click", cerrarPrevisualizacion);
  $("btn-descargar-pdf-prev")?.addEventListener("click", generarPDF);

  // Buscador rápido
  $("buscar-rapido")?.addEventListener("input", () => renderBuscadorRapido());

  document.querySelectorAll(".filtro-check").forEach(chk => {
    chk.addEventListener("change", () => {
      guardarPreferenciaFiltros();
      renderBuscadorRapido();
    });
  });

  $("btn-limpiar-buscador")?.addEventListener("click", () => {
    if ($("buscar-rapido")) $("buscar-rapido").value = "";
    renderBuscadorRapido();
  });

  // Zonas 1-3 bloquear/desbloquear
  $("btn-editar-zonas123")?.addEventListener("click", () => {
    zonas123Editables = true;
    aplicarBloqueoZonas123();
    alert("🔓 Zonas 1-3 habilitadas para editar");
  });

  $("btn-bloquear-zonas123")?.addEventListener("click", () => {
    zonas123Editables = false;
    aplicarBloqueoZonas123();
    alert("🔒 Zonas 1-3 bloqueadas");
  });

  // Autosave cabecera
  ["entidad", "sucursal", "abonado", "central", "provincia"].forEach(id => {
    $(id)?.addEventListener("input", autosaveBase);
  });
}

/** ==========================================
 *  Tabla zonas 1..24
 *  ========================================== */
function precargarZonas() {
  const tbody = document.querySelector("#tabla-base tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  for (let i = 1; i <= 24; i++) tbody.appendChild(crearFilaZona(i));

  aplicarDefaultsZonas123SiVacias();
  aplicarBloqueoZonas123();
  autosaveBase();
}

function crearFilaZona(numeroZona) {
  const fila = document.createElement("tr");
  fila.dataset.zona = String(numeroZona);

  const celdaZona = document.createElement("td");
  celdaZona.textContent = "Zona " + numeroZona;

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
    autosaveBase();
  });
  inputEventoOtro.addEventListener("input", autosaveBase);
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
    autosaveBase();
  });
  inputAreaOtro.addEventListener("input", autosaveBase);
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
    autosaveBase();
  });
  inputDispositivoOtro.addEventListener("input", autosaveBase);
  celdaDispositivo.appendChild(selectDispositivo);
  celdaDispositivo.appendChild(inputDispositivoOtro);

  // DESCRIPCIÓN
  const celdaDescripcion = document.createElement("td");
  const inputDescripcion = document.createElement("input");
  inputDescripcion.addEventListener("input", autosaveBase);
  celdaDescripcion.appendChild(inputDescripcion);

  fila.appendChild(celdaZona);
  fila.appendChild(celdaEvento);
  fila.appendChild(celdaArea);
  fila.appendChild(celdaDispositivo);
  fila.appendChild(celdaDescripcion);

  return fila;
}

/** ✅ Defaults y bloqueo zonas 1..3 */
function aplicarDefaultsZonas123SiVacias() {
  const filas = document.querySelectorAll("#tabla-base tbody tr");

  const defaults = {
    1: "Avería de linea",
    2: "Apertura de Equipo",
    3: "Falta de 220V"
  };

  [1, 2, 3].forEach(z => {
    const tr = Array.from(filas).find(r => r.dataset.zona === String(z));
    if (!tr) return;

    const selEvento = tr.querySelector("td:nth-child(2) select");
    const selArea = tr.querySelector("td:nth-child(3) select");
    const selDisp = tr.querySelector("td:nth-child(4) select");
    const desc = tr.querySelector("td:nth-child(5) input");

    const vacia =
      (!selEvento?.value || selEvento.value === "- Sin tipo definido -") &&
      (!selArea?.value || selArea.value === "-") &&
      (!selDisp?.value || selDisp.value === "-") &&
      !(desc?.value || "").trim();

    if (!vacia) return;

    const ev = defaults[z];
    if (selEvento) selEvento.value = eventos.includes(ev) ? ev : "- Sin tipo definido -";
    if (selArea) selArea.value = "-";
    if (selDisp) selDisp.value = "-";
    if (desc) desc.value = "";
  });
}

function aplicarBloqueoZonas123() {
  const filas = document.querySelectorAll("#tabla-base tbody tr");
  filas.forEach(tr => {
    const zona = parseInt(tr.dataset.zona, 10);
    if (![1, 2, 3].includes(zona)) return;

    tr.querySelectorAll("td:nth-child(n+2) select, td:nth-child(n+2) input").forEach(el => {
      el.disabled = !zonas123Editables;
      el.style.opacity = !zonas123Editables ? "0.85" : "1";
    });
  });

  if ($("btn-editar-zonas123")) $("btn-editar-zonas123").style.display = zonas123Editables ? "none" : "inline-block";
  if ($("btn-bloquear-zonas123")) $("btn-bloquear-zonas123").style.display = zonas123Editables ? "inline-block" : "none";
}

/** ==========================================
 *  Limpiar
 *  ========================================== */
function limpiarBase() {
  $("entidad").value = "";
  $("sucursal").value = "";
  $("abonado").value = "";
  $("central").value = "";
  $("provincia").value = "";

  zonas123Editables = false;
  setCurrentBaseName("");
  precargarZonas();
  autosaveBase();
}

/** ==========================================
 *  Construir JSON Base
 *  ========================================== */
function construirJSONBase() {
  const datos = {
    meta: { generado: fechaGeneradoLocal() },
    entidad: $("entidad").value,
    sucursal: $("sucursal").value,
    abonado: $("abonado").value,
    central: $("central").value,
    provincia: $("provincia")?.value || "",
    zonas: []
  };

  const filas = document.querySelectorAll("#tabla-base tbody tr");
  filas.forEach(fila => {
    const celdas = fila.querySelectorAll("td");

    const selectEvento = celdas[1].querySelector("select");
    const inputEventoOtro = celdas[1].querySelector("input");
    const evento = (selectEvento.value === "Otros" && inputEventoOtro.value.trim())
      ? inputEventoOtro.value.trim()
      : selectEvento.value;

    const selectArea = celdas[2].querySelector("select");
    const inputAreaOtro = celdas[2].querySelector("input");
    const area = (selectArea.value === "Otros" && inputAreaOtro.value.trim())
      ? inputAreaOtro.value.trim()
      : selectArea.value;

    const selectDisp = celdas[3].querySelector("select");
    const inputDispOtro = celdas[3].querySelector("input");
    const disp = (selectDisp.value === "otros" && inputDispOtro.value.trim())
      ? inputDispOtro.value.trim()
      : selectDisp.value;

    datos.zonas.push({
      zona: celdas[0].textContent,
      evento,
      area,
      dispositivo: disp,
      descripcion: celdas[4].querySelector("input").value
    });
  });

  return datos;
}

/** ==========================================
 *  Naming + Index
 *  ========================================== */
function generarNombreAuto() {
  const e = safeName($("entidad").value || "Entidad");
  const s = safeName($("sucursal").value || "Suc");
  const a = safeName($("abonado").value || "");
  const base = [e, s, a].filter(Boolean).join("_");
  return base || `Base_${fechaStamp()}`;
}

function addToIndex(nombre) {
  const idx = getIndex();
  const n = idx.filter(x => x !== nombre);
  n.unshift(nombre);
  setIndex(n);
}

/** ==========================================
 *  Guardar rápido + Backup
 *  ========================================== */
function guardarRapidoConBackup() {
  const data = construirJSONBase();
  const current = getCurrentBaseName();
  let nombre = "";

  if (current && localStorage.getItem(baseKey(current))) {
    nombre = `${current} (mod ${fechaStamp()})`;
  } else {
    nombre = generarNombreAuto();
    if (localStorage.getItem(baseKey(nombre))) {
      nombre = `${nombre} (mod ${fechaStamp()})`;
    }
  }

  localStorage.setItem(baseKey(nombre), JSON.stringify(data));

  if (typeof idbPutBase === "function") {
    idbPutBase(baseKey(nombre), data).catch(console.warn);
  }

  addToIndex(nombre);
  setCurrentBaseName(nombre);

  descargarRawComoJSON(nombre, JSON.stringify(data));

  renderBuscadorRapido();
  renderBasesMini();

  alert("✅ Guardado + Backup\n" + nombre);
}

function descargarRawComoJSON(nombre, rawJsonString) {
  const blob = new Blob([rawJsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `base_${safeName(nombre)}_${safeName(fechaStamp())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** ==========================================
 *  Importar JSON (1) => carga pantalla
 *  ========================================== */
function importarJSONBase(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      cargarDataEnPantalla(data);
      setCurrentBaseName("");
      alert("✅ JSON importado (cabecera + zonas)");
    } catch (e) {
      alert("❌ JSON inválido");
    }
  };
  reader.readAsText(file);
}

/** ==========================================
 *  Importar muchos JSON => guarda directo
 *  ========================================== */
async function importarMuchosJSON(files) {
  let ok = 0, bad = 0;

  for (const f of files) {
    try {
      const text = await f.text();
      const data = JSON.parse(text);

      let nombre = safeName(f.name.replace(/\.json$/i, "")) || generarNombreAuto();
      if (localStorage.getItem(baseKey(nombre))) nombre = `${nombre} (mod ${fechaStamp()})`;

      localStorage.setItem(baseKey(nombre), JSON.stringify(data));
      if (typeof idbPutBase === "function") {
        idbPutBase(baseKey(nombre), data).catch(console.warn);
      }

      addToIndex(nombre);
      ok++;
    } catch {
      bad++;
    }
  }

  renderBuscadorRapido();
  renderBasesMini();
  alert(`✅ Importación lista\nOK: ${ok}  •  Fallidos: ${bad}`);
}

/** ==========================================
 *  Cargar data a pantalla
 *  ========================================== */
function cargarDataEnPantalla(data) {
  $("entidad").value = data.entidad || "";
  $("sucursal").value = data.sucursal || "";
  $("abonado").value = data.abonado || "";
  $("central").value = data.central || "";
  $("provincia").value = data.provincia || "";

  precargarZonas();

  (data.zonas || []).forEach(zObj => {
    const n = getZonaNumberFromText(zObj.zona);
    if (!n || n < 1 || n > 24) return;

    const tr = document.querySelector(`#tabla-base tbody tr[data-zona="${n}"]`);
    if (!tr) return;
    const celdas = tr.querySelectorAll("td");

    // Evento
    const se = celdas[1].querySelector("select");
    const ie = celdas[1].querySelector("input");
    if (eventos.includes(zObj.evento)) {
      se.value = zObj.evento;
      ie.value = "";
      ie.style.display = "none";
    } else {
      se.value = "Otros";
      ie.value = zObj.evento || "";
      ie.style.display = "inline-block";
    }

    // Área
    const sa = celdas[2].querySelector("select");
    const ia = celdas[2].querySelector("input");
    if (areas.includes(zObj.area)) {
      sa.value = zObj.area;
      ia.value = "";
      ia.style.display = "none";
    } else {
      sa.value = "Otros";
      ia.value = zObj.area || "";
      ia.style.display = "inline-block";
    }

    // Dispositivo
    const sd = celdas[3].querySelector("select");
    const id = celdas[3].querySelector("input");
    if (dispositivos.includes(zObj.dispositivo)) {
      sd.value = zObj.dispositivo;
      id.value = "";
      id.style.display = "none";
    } else {
      sd.value = "otros";
      id.value = zObj.dispositivo || "";
      id.style.display = "inline-block";
    }

    // Desc
    celdas[4].querySelector("input").value = zObj.descripcion || "";
  });

  aplicarDefaultsZonas123SiVacias();
  aplicarBloqueoZonas123();
  autosaveBase();
}

/** ==========================================
 *  Excel IMPORT (no pisa zonas 1-3)
 *  ========================================== */
async function importarExcelBase(file) {
  try {
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);

    const ws = wb.worksheets[0];
    if (!ws) return alert("❌ El Excel no tiene hojas.");

    precargarZonas();

    const meta = { entidad: "", sucursal: "", abonado: "", central: "", provincia: "" };

    for (let r = 1; r <= Math.min(ws.rowCount, 50); r++) {
      const row = ws.getRow(r);
      const k = normKey(row.getCell(1).value);
      const v = String(row.getCell(2).value ?? "").trim();
      if (!k || !v) continue;

      if (k === "entidad") meta.entidad = v;
      if (k === "sucursal") meta.sucursal = v;
      if (k === "abonado") meta.abonado = v;
      if (k === "central") meta.central = v;
      if (k === "provincia") meta.provincia = v;
    }

    if (meta.entidad) $("entidad").value = meta.entidad;
    if (meta.sucursal) $("sucursal").value = meta.sucursal;
    if (meta.abonado) $("abonado").value = meta.abonado;
    if (meta.central) $("central").value = meta.central;
    if (meta.provincia) $("provincia").value = meta.provincia;

    let headerRow = null;
    ws.eachRow((row, rowNumber) => {
      const vals = (row.values || []).map(v => String(v || "").trim().toLowerCase());
      if (vals.includes("zona") && vals.includes("evento")) headerRow = rowNumber;
    });

    const start = headerRow ? headerRow + 1 : 1;

    for (let r = start; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const A = String(row.getCell(1).value ?? "").trim();
      const B = String(row.getCell(2).value ?? "").trim();
      const C = String(row.getCell(3).value ?? "").trim();
      const D = String(row.getCell(4).value ?? "").trim();
      const E = String(row.getCell(5).value ?? "").trim();

      if (!A && !B && !C && !D && !E) continue;

      const n = getZonaNumberFromText(A);
      if (!n || n < 1 || n > 24) continue;

      if ([1, 2, 3].includes(n)) continue;

      const tr = document.querySelector(`#tabla-base tbody tr[data-zona="${n}"]`);
      if (!tr) continue;

      const celdas = tr.querySelectorAll("td");

      // Evento
      const se = celdas[1].querySelector("select");
      const ie = celdas[1].querySelector("input");
      if (eventos.includes(B)) {
        se.value = B;
        ie.value = "";
        ie.style.display = "none";
      } else if (B) {
        se.value = "Otros";
        ie.value = B;
        ie.style.display = "inline-block";
      }

      // Área
      const sa = celdas[2].querySelector("select");
      const ia = celdas[2].querySelector("input");
      if (areas.includes(C)) {
        sa.value = C;
        ia.value = "";
        ia.style.display = "none";
      } else if (C) {
        sa.value = "Otros";
        ia.value = C;
        ia.style.display = "inline-block";
      }

      // Dispositivo
      const sd = celdas[3].querySelector("select");
      const id = celdas[3].querySelector("input");
      if (dispositivos.includes(D)) {
        sd.value = D;
        id.value = "";
        id.style.display = "none";
      } else if (D) {
        sd.value = "otros";
        id.value = D;
        id.style.display = "inline-block";
      }

      // Desc
      celdas[4].querySelector("input").value = E || "";
    }

    aplicarDefaultsZonas123SiVacias();
    aplicarBloqueoZonas123();
    autosaveBase();
    setCurrentBaseName("");
    alert("✅ Excel importado (cabecera + zonas, 1-3 ignoradas)");
  } catch (e) {
    console.error(e);
    alert("❌ Error leyendo Excel");
  }
}

/** ==========================================
 *  PDF
 *  ========================================== */
function generarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Base de Datos - Señalco", 14, 14);

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
  } catch { }

  const entidad = $("entidad").value;
  const sucursal = $("sucursal").value;
  const abonado = $("abonado").value;
  const central = $("central").value;
  const provincia = $("provincia")?.value || "";
  const generado = fechaGeneradoLocal();

  doc.setFontSize(11);
  doc.text(`Entidad: ${entidad}`, 14, 28);
  doc.text(`Sucursal: ${sucursal}`, 14, 36);
  doc.text(`Abonado: ${abonado}`, 100, 28);
  doc.text(`Central: ${central}`, 100, 36);
  doc.text(`Provincia: ${provincia}`, 14, 44);
  doc.text(`Generado: ${generado}`, 14, 52);

  const columnas = ["Zona", "Evento", "Área", "Dispositivo", "Descripción"];
  const filas = [];

  const filasTabla = document.querySelectorAll("#tabla-base tbody tr");
  filasTabla.forEach(fila => {
    const celdas = fila.querySelectorAll("td");

    const selectEvento = celdas[1].querySelector("select");
    const inputEventoOtro = celdas[1].querySelector("input");
    const evento = (selectEvento.value === "Otros" && inputEventoOtro.value.trim())
      ? inputEventoOtro.value.trim()
      : selectEvento.value;

    const selectArea = celdas[2].querySelector("select");
    const inputAreaOtro = celdas[2].querySelector("input");
    const area = (selectArea.value === "Otros" && inputAreaOtro.value.trim())
      ? inputAreaOtro.value.trim()
      : selectArea.value;

    const selectDisp = celdas[3].querySelector("select");
    const inputDispOtro = celdas[3].querySelector("input");
    const disp = (selectDisp.value === "otros" && inputDispOtro.value.trim())
      ? inputDispOtro.value.trim()
      : selectDisp.value;

    filas.push([
      celdas[0].textContent,
      evento,
      area,
      disp,
      celdas[4].querySelector("input").value
    ]);
  });

  doc.autoTable({ head: [columnas], body: filas, startY: 60 });
  doc.save(`base_${safeName(entidad)}_${safeName(sucursal)}_${safeName(fechaStamp())}.pdf`);
}

/** ==========================================
 *  Excel EXPORT
 *  ========================================== */
function generarExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Base");

  sheet.addRow(["Entidad", $("entidad").value || ""]);
  sheet.addRow(["Sucursal", $("sucursal").value || ""]);
  sheet.addRow(["Abonado", $("abonado").value || ""]);
  sheet.addRow(["Central", $("central").value || ""]);
  sheet.addRow(["Provincia", $("provincia").value || ""]);
  sheet.addRow(["Generado", fechaGeneradoLocal()]);
  sheet.addRow([]);

  sheet.addRow(["Zona", "Evento", "Área", "Dispositivo", "Descripción"]);

  const filas = document.querySelectorAll("#tabla-base tbody tr");
  filas.forEach(fila => {
    const celdas = fila.querySelectorAll("td");

    const selectEvento = celdas[1].querySelector("select");
    const inputEventoOtro = celdas[1].querySelector("input");
    const evento = (selectEvento.value === "Otros" && inputEventoOtro.value.trim())
      ? inputEventoOtro.value.trim()
      : selectEvento.value;

    const selectArea = celdas[2].querySelector("select");
    const inputAreaOtro = celdas[2].querySelector("input");
    const area = (selectArea.value === "Otros" && inputAreaOtro.value.trim())
      ? inputAreaOtro.value.trim()
      : selectArea.value;

    const selectDisp = celdas[3].querySelector("select");
    const inputDispOtro = celdas[3].querySelector("input");
    const disp = (selectDisp.value === "otros" && inputDispOtro.value.trim())
      ? inputDispOtro.value.trim()
      : selectDispositivo.value;

    sheet.addRow([
      celdas[0].textContent,
      evento,
      area,
      disp,
      celdas[4].querySelector("input").value
    ]);
  });

  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `base_${safeName($("entidad").value || "base")}_${safeName($("sucursal").value || "")}_${safeName(fechaStamp())}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/** ==========================================
 *  Previsualización
 *  ========================================== */
function abrirPrevisualizacion() {
  const modal = $("modal-prev");
  const body = $("prev-body");
  if (!modal || !body) return;

  const data = construirJSONBase();
  const generado = data.meta?.generado || fechaGeneradoLocal();

  body.innerHTML = `
    <div style="background:#fff; color:#000; border-radius:12px; padding:12px;">
      <div style="font-weight:bold; margin-bottom:10px; line-height:1.4;">
        Entidad: ${escapeHtml(data.entidad || "-")}<br>
        Sucursal: ${escapeHtml(data.sucursal || "-")}<br>
        Abonado: ${escapeHtml(data.abonado || "-")}<br>
        Central: ${escapeHtml(data.central || "-")}<br>
        Provincia: ${escapeHtml(data.provincia || "-")}<br>
        Generado: ${escapeHtml(generado)}<br>
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
            ${data.zonas.map(z => `
              <tr>
                <td style="padding:6px; border:1px solid #ddd;">${escapeHtml(z.zona)}</td>
                <td style="padding:6px; border:1px solid #ddd;">${escapeHtml(z.evento)}</td>
                <td style="padding:6px; border:1px solid #ddd;">${escapeHtml(z.area)}</td>
                <td style="padding:6px; border:1px solid #ddd;">${escapeHtml(z.dispositivo)}</td>
                <td style="padding:6px; border:1px solid #ddd;">${escapeHtml(z.descripcion)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

function cerrarPrevisualizacion() {
  const modal = $("modal-prev");
  if (modal) modal.style.display = "none";
}

/** ==========================================
 *  Bases: abrir/borrar + JSON
 *  ========================================== */
function leerBase(nombre) {
  const raw = localStorage.getItem(baseKey(nombre));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function abrirBaseGuardada(nombre) {
  const data = leerBase(nombre);
  if (!data) return alert("❌ No se encontró la base");
  cargarDataEnPantalla(data);
  setCurrentBaseName(nombre);
}

function borrarBaseGuardada(nombre) {
  if (!confirm(`🗑️ ¿Borrar esta base?\n\n${nombre}`)) return;
  localStorage.removeItem(baseKey(nombre));
  setIndex(getIndex().filter(x => x !== nombre));
  if (getCurrentBaseName() === nombre) setCurrentBaseName("");

  renderBuscadorRapido();
  renderBasesMini();
}

function descargarBaseComoJSON(nombre) {
  const data = leerBase(nombre);
  if (!data) return alert("❌ No se encontró la base");
  descargarRawComoJSON(nombre, JSON.stringify(data, null, 2));
}

/** ==========================================
 *  Buscador rápido
 *  - ahora filtra SIEMPRE (desde 1 letra)
 *  - a partir de 3 letras, reduce fuerte
 *  ========================================== */
function getCamposSeleccionados() {
  const checks = Array.from(document.querySelectorAll(".filtro-check"))
    .filter(ch => ch.checked)
    .map(ch => ch.value);

  return checks.length ? checks : ["nombre", "entidad", "sucursal", "abonado", "central", "provincia"];
}

function guardarPreferenciaFiltros() {
  try {
    const campos = getCamposSeleccionados();
    localStorage.setItem(FILTER_PREF_KEY, JSON.stringify(campos));
  } catch { }
}

function aplicarPreferenciaFiltros() {
  try {
    const raw = localStorage.getItem(FILTER_PREF_KEY);
    if (!raw) return;

    const campos = JSON.parse(raw);
    if (!Array.isArray(campos) || !campos.length) return;

    document.querySelectorAll(".filtro-check").forEach(ch => {
      ch.checked = campos.includes(ch.value);
    });
  } catch { }
}

function renderBuscadorRapido() {
  const cont = $("buscador-resultados");
  if (!cont) return;
  cont.innerHTML = "";

  const q = ($("buscar-rapido")?.value || "").trim().toLowerCase();
  const idx = getIndex();

  if (!idx.length) {
    cont.innerHTML = `<div class="card"><b>Sin bases todavía</b><div style="opacity:.8;">Guardá una base y te aparece acá.</div></div>`;
    return;
  }

  const campos = getCamposSeleccionados();
  const modoTop = q.length === 0;     // nada escrito => top
  const modoSuave = q.length > 0 && q.length < 3; // 1-2 letras => muestra coincidencias suaves

  const lista = idx; // usamos todo, y el filtro decide

  let count = 0;

  lista.forEach(nombre => {
    const data = leerBase(nombre);
    if (!data) return;

    const map = {
      nombre,
      entidad: (data.entidad || ""),
      sucursal: (data.sucursal || ""),
      abonado: (data.abonado || ""),
      central: (data.central || ""),
      provincia: (data.provincia || "")
    };

    let ok = true;

    if (modoTop) {
      // top sin filtrar
      ok = true;
    } else {
      ok = campos.some(c => String(map[c] || "").toLowerCase().includes(q));
    }

    if (!ok) return;

    // si son 1-2 letras, cortamos a 12 resultados para no saturar
    if (modoSuave && count >= 12) return;

    // si no escribió nada, top 8
    if (modoTop && count >= 8) return;

    count++;

    const card = document.createElement("div");
    card.className = "card";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-weight:bold;">${escapeHtml(nombre)}</div>
          <div style="font-size:12px; opacity:.85;">
            ${escapeHtml(data.entidad || "-")}
            • Suc: ${escapeHtml(data.sucursal || "-")}
            • Ab: ${escapeHtml(data.abonado || "-")}
            • Central: ${escapeHtml(data.central || "-")}
            • ${escapeHtml(data.provincia || "-")}
          </div>
          <div style="margin-top:6px; font-size:12px; opacity:.8;">
            👉 Tocá la tarjeta para importar
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="mini-btn" data-act="json">JSON</button>
          <button class="mini-btn" data-act="borrar" style="background:#b00020;">Borrar</button>
        </div>
      </div>
    `;

    card.addEventListener("click", () => abrirBaseGuardada(nombre));

    card.querySelector('[data-act="json"]').addEventListener("click", (e) => {
      e.stopPropagation();
      descargarBaseComoJSON(nombre);
    });

    card.querySelector('[data-act="borrar"]').addEventListener("click", (e) => {
      e.stopPropagation();
      borrarBaseGuardada(nombre);
    });

    cont.appendChild(card);
  });

  if (count === 0) {
    cont.innerHTML = `<div class="card"><b>Sin resultados</b><div style="opacity:.8;">Probá tildar más casillas o escribir otra palabra.</div></div>`;
  }
}

/** ==========================================
 *  Ventanita abajo (corregido ID)
 *  ========================================== */
function renderBasesMini() {
  const cont = $("lista-bases-inline");
  if (!cont) return;

  const idx = getIndex();
  if (!idx.length) {
    cont.innerHTML = `
      <div class="card">
        <b>Sin bases todavía</b>
        <div style="opacity:.8;">Guardá una base y te aparece acá.</div>
      </div>
    `;
    return;
  }

  cont.innerHTML = "";

  idx.forEach(nombre => {
    const data = leerBase(nombre);
    if (!data) return;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-weight:bold;">${escapeHtml(nombre)}</div>
          <div style="font-size:12px; opacity:.85;">
            ${escapeHtml(data.entidad || "-")} • Suc: ${escapeHtml(data.sucursal || "-")} • Ab: ${escapeHtml(data.abonado || "-")}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="mini-btn" data-act="abrir">Importar</button>
          <button class="mini-btn" data-act="json">JSON</button>
          <button class="mini-btn" data-act="borrar" style="background:#b00020;">Borrar</button>
        </div>
      </div>
    `;

    card.querySelector('[data-act="abrir"]').onclick = () => abrirBaseGuardada(nombre);
    card.querySelector('[data-act="json"]').onclick = () => descargarBaseComoJSON(nombre);
    card.querySelector('[data-act="borrar"]').onclick = () => borrarBaseGuardada(nombre);

    cont.appendChild(card);
  });
}

/** ==========================================
 *  Autosave
 *  ========================================== */
function autosaveBase() {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(construirJSONBase()));
  } catch { }
}

/** ==========================================
 *  Bootstrap
 *  ========================================== */
window.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector("#tabla-base")) return;

  // Migrar a IndexedDB (silencioso)
  if (typeof migrateLocalStorageToIDB === "function") {
    migrateLocalStorageToIDB().catch(console.warn);
  }

  poblarDatalistEntidades();

  // precarga tabla
  precargarZonas();

  // filtros: aplicar preferencia
  aplicarPreferenciaFiltros();

  // recuperar autosave
  const raw = localStorage.getItem(AUTOSAVE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      cargarDataEnPantalla(data);
      setCurrentBaseName("");
    } catch { }
  }

  asignarEventosBase();
  renderBuscadorRapido();
  renderBasesMini();
});