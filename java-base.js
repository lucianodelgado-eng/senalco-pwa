/***********************
 *   Señalco - Base    *
 * java-base.js FULL   *
 * integrado: guardado, padrón, líneas, PT4000
 * corregido: sin duplicados de borrado total
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
  "PT4000",
  "Teclado PT4000",
  "otros"
];

let zonas123Editables = false;

const CURRENT_NAME_KEY = "senalco_current_base_name";
function getCurrentBaseName() { return localStorage.getItem(CURRENT_NAME_KEY) || ""; }
function setCurrentBaseName(name) {
  if (!name) localStorage.removeItem(CURRENT_NAME_KEY);
  else localStorage.setItem(CURRENT_NAME_KEY, name);
}

const PT_KEY = "senalco_pt_state_v1";

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
  return (s || "base").toString().trim().replace(/\\s+/g, "_").replace(/[^\\w\\-()]/g, "_");
}

function getZonaNumberFromText(z) {
  const m = String(z || "").match(/(\\d{1,3})/);
  return m ? parseInt(m[1], 10) : null;
}

function normKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replaceAll("á", "a").replaceAll("é", "e").replaceAll("í", "i").replaceAll("ó", "o").replaceAll("ú", "u")
    .replace(/\\s+/g, " ");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstDefined(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function toLower(v) {
  return String(v || "").trim().toLowerCase();
}

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

function getPTState() {
  try {
    return JSON.parse(localStorage.getItem(PT_KEY) || '{"habilitado":false,"equipos":[]}');
  } catch {
    return { habilitado: false, equipos: [] };
  }
}

function setPTState(data) {
  localStorage.setItem(PT_KEY, JSON.stringify(data));
}

function resetPTState() {
  setPTState({ habilitado: false, equipos: [] });
  renderPTUI();
}

function createEmptyPT() {
  return {
    nombre: "",
    area: "",
    numero: "",
    ip: "",
    clave: "",
    salidas: { clave: "", ip: "", sismico: "", robo: "" },
    entradas: { z1: "", z2: "", z3: "", z4: "", z5: "", z6: "" }
  };
}

function renderPTUI() {
  const state = getPTState();
  const cont = $("pt-contenedor");
  const estado = $("estado-pt");
  if (!cont || !estado) return;

  estado.textContent = state.habilitado
    ? `PT4000 activado • Equipos: ${state.equipos.length}`
    : "PT4000 desactivado";

  cont.innerHTML = "";

  if (!state.habilitado) return;

  if (!state.equipos.length) {
    cont.innerHTML = `<div class="pt-card"><b>No hay PT4000 cargados.</b><div style="margin-top:6px;">Usá "Agregar PT4000".</div></div>`;
    return;
  }

  state.equipos.forEach((pt, idx) => {
    const box = document.createElement("div");
    box.className = "pt-card";
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center;">
        <div style="font-weight:bold;">PT4000 ${idx + 1}</div>
        <button class="mini-btn" type="button" data-del="${idx}" style="background:#b00020;">Borrar PT</button>
      </div>

      <div class="pt-top-grid">
        <div><label>Nombre</label><input data-pt="${idx}" data-field="nombre" value="${escapeHtml(pt.nombre)}"></div>
        <div><label>Área</label><input data-pt="${idx}" data-field="area" value="${escapeHtml(pt.area)}"></div>
        <div><label>Número</label><input data-pt="${idx}" data-field="numero" value="${escapeHtml(pt.numero)}"></div>
        <div><label>IP</label><input data-pt="${idx}" data-field="ip" value="${escapeHtml(pt.ip)}"></div>
        <div><label>Clave</label><input data-pt="${idx}" data-field="clave" value="${escapeHtml(pt.clave)}"></div>
      </div>

      <div class="pt-main-grid" style="margin-top:12px;">
        <div class="pt-subbox">
          <h4>Salidas</h4>
          <label>Salida de Clave</label><input data-pt="${idx}" data-salida="clave" value="${escapeHtml(pt.salidas?.clave || "")}">
          <label>Salida de IP</label><input data-pt="${idx}" data-salida="ip" value="${escapeHtml(pt.salidas?.ip || "")}">
          <label>Salida de Sísmico</label><input data-pt="${idx}" data-salida="sismico" value="${escapeHtml(pt.salidas?.sismico || "")}">
          <label>Salida de Robo</label><input data-pt="${idx}" data-salida="robo" value="${escapeHtml(pt.salidas?.robo || "")}">
        </div>

        <div class="pt-subbox">
          <h4>Entradas / Zonas</h4>
          <label>Z1</label><input data-pt="${idx}" data-entrada="z1" value="${escapeHtml(pt.entradas?.z1 || "")}">
          <label>Z2</label><input data-pt="${idx}" data-entrada="z2" value="${escapeHtml(pt.entradas?.z2 || "")}">
          <label>Z3</label><input data-pt="${idx}" data-entrada="z3" value="${escapeHtml(pt.entradas?.z3 || "")}">
          <label>Z4</label><input data-pt="${idx}" data-entrada="z4" value="${escapeHtml(pt.entradas?.z4 || "")}">
          <label>Z5</label><input data-pt="${idx}" data-entrada="z5" value="${escapeHtml(pt.entradas?.z5 || "")}">
          <label>Z6</label><input data-pt="${idx}" data-entrada="z6" value="${escapeHtml(pt.entradas?.z6 || "")}">
        </div>
      </div>
    `;
    cont.appendChild(box);
  });

  cont.querySelectorAll("input[data-pt]").forEach(inp => {
    inp.addEventListener("input", () => {
      const state = getPTState();
      const idx = parseInt(inp.dataset.pt, 10);
      if (!state.equipos[idx]) return;

      if (inp.dataset.field) state.equipos[idx][inp.dataset.field] = inp.value;
      if (inp.dataset.salida) state.equipos[idx].salidas[inp.dataset.salida] = inp.value;
      if (inp.dataset.entrada) state.equipos[idx].entradas[inp.dataset.entrada] = inp.value;

      setPTState(state);
      autosaveBase();
    });
  });

  cont.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.del, 10);
      const state = getPTState();
      state.equipos.splice(idx, 1);
      setPTState(state);
      renderPTUI();
      autosaveBase();
    });
  });
}

function togglePT() {
  const state = getPTState();
  state.habilitado = !state.habilitado;
  if (state.habilitado && !Array.isArray(state.equipos)) state.equipos = [];
  setPTState(state);
  renderPTUI();
  autosaveBase();
}

function addPT() {
  const state = getPTState();
  state.habilitado = true;
  state.equipos.push(createEmptyPT());
  setPTState(state);
  renderPTUI();
  autosaveBase();
}

function asignarEventosBase() {
  $("btn-limpiar-base")?.addEventListener("click", limpiarBase);
  $("btn-generar-pdf-base")?.addEventListener("click", generarPDF);
  $("btn-excel-base")?.addEventListener("click", generarExcel);

  $("btn-subir-excel")?.addEventListener("click", () => $("input-excel-base")?.click());
  $("input-excel-base")?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (f) await importarExcelBase(f);
    e.target.value = "";
  });

  $("btn-importar-json-top")?.addEventListener("click", () => $("input-json-base-top")?.click());
  $("input-json-base-top")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) importarJSONBase(f);
    e.target.value = "";
  });

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

  $("btn-importar-padron-masivo")?.addEventListener("click", () => $("input-padron-masivo")?.click());
  $("input-padron-masivo")?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (f) await importarPadronMasivoExcel(f);
    e.target.value = "";
  });

  $("btn-lineas-basico")?.addEventListener("click", () => $("input-lineas-basico")?.click());
  $("input-lineas-basico")?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (f) await importarLineasExcelBasico(f);
    e.target.value = "";
  });

  $("btn-lineas-amba")?.addEventListener("click", () => $("input-lineas-amba")?.click());
  $("input-lineas-amba")?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (f) await importarLineasExcelCompleto(f);
    e.target.value = "";
  });

  $("btn-guardar-rapido")?.addEventListener("click", guardarRapidoConBackup);
  $("btn-previsualizar")?.addEventListener("click", abrirPrevisualizacion);
  $("btn-cerrar-prev")?.addEventListener("click", cerrarPrevisualizacion);
  $("btn-descargar-pdf-prev")?.addEventListener("click", generarPDF);

  $("btn-reset-total")?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await borrarTodoBases();
  });

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

  $("btn-toggle-pt")?.addEventListener("click", togglePT);
  $("btn-agregar-pt")?.addEventListener("click", addPT);

  ["entidad", "sucursal", "abonado", "central", "provincia"].forEach(id => {
    $(id)?.addEventListener("input", autosaveBase);
  });
}

function precargarZonas() {
  const tbody = document.querySelector("#tabla-base tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  for (let i = 1; i <= 24; i++) {
    tbody.appendChild(crearFilaZona(i));
  }

  aplicarDefaultsZonas123SiVacias();
  aplicarBloqueoZonas123();
  autosaveBase();
}

function crearFilaZona(numeroZona) {
  const fila = document.createElement("tr");
  fila.dataset.zona = String(numeroZona);

  const celdaZona = document.createElement("td");
  celdaZona.textContent = "Zona " + numeroZona;

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

function limpiarBase() {
  if ($("entidad")) $("entidad").value = "";
  if ($("sucursal")) $("sucursal").value = "";
  if ($("abonado")) $("abonado").value = "";
  if ($("central")) $("central").value = "";
  if ($("provincia")) $("provincia").value = "";

  zonas123Editables = false;
  setCurrentBaseName("");
  precargarZonas();
  resetPTState();
  autosaveBase();
}

function construirJSONBase() {
  const ptState = getPTState();

  const datos = {
    meta: { generado: fechaGeneradoLocal() },
    entidad: $("entidad").value,
    sucursal: $("sucursal").value,
    abonado: $("abonado").value,
    central: $("central").value,
    provincia: $("provincia")?.value || "",
    zonas: [],
    pt4000: {
      habilitado: !!ptState.habilitado,
      equipos: Array.isArray(ptState.equipos) ? ptState.equipos : []
    }
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

function guardarRapidoConBackup() {
  const data = construirJSONBase();
  const current = getCurrentBaseName();
  let nombre = "";

  if (current && localStorage.getItem(baseKey(current))) {
    const decision = prompt(
      `Estás editando la base:\n\n${current}\n\nEscribí una opción:\n- ACTUAL para guardar sobre la actual\n- NUEVA para crear una nueva copia`,
      "ACTUAL"
    );

    if (decision === null) return;

    const modo = String(decision).trim().toUpperCase();

    if (modo === "ACTUAL") {
      nombre = current;
    } else if (modo === "NUEVA") {
      const sugerido = `${current} (mod ${fechaStamp()})`;
      const nuevoNombre = prompt("Nombre de la nueva base:", sugerido);
      if (nuevoNombre === null) return;

      nombre = safeName(nuevoNombre.trim()) || sugerido;

      if (localStorage.getItem(baseKey(nombre))) {
        alert("⚠️ Ya existe una base con ese nombre.");
        return;
      }
    } else {
      alert("Operación cancelada. Escribí ACTUAL o NUEVA.");
      return;
    }
  } else {
    const sugerido = generarNombreAuto();
    const decision = prompt(
      "Base nueva.\n\nIngresá nombre para guardar.\nDejá vacío para usar automático:",
      sugerido
    );

    if (decision === null) return;

    nombre = safeName((decision || "").trim()) || sugerido;

    if (localStorage.getItem(baseKey(nombre))) {
      const sobrescribir = confirm(`Ya existe una base con ese nombre:\n\n${nombre}\n\n¿Querés reemplazarla?`);
      if (!sobrescribir) return;
    }
  }

  localStorage.setItem(baseKey(nombre), JSON.stringify(data));

  if (typeof idbPutBase === "function") {
    idbPutBase(baseKey(nombre), data).catch(console.warn);
  }

  addToIndex(nombre);
  setCurrentBaseName(nombre);

  descargarRawComoJSON(nombre, JSON.stringify(data, null, 2));

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

window.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector("#tabla-base")) return;

  if (typeof migrateLocalStorageToIDB === "function") {
    migrateLocalStorageToIDB().catch(console.warn);
  }

  poblarDatalistEntidades();
  precargarZonas();
  aplicarPreferenciaFiltros();
  renderPTUI();

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
