/***********************
 *   Señalco - Base    *
 * java-base.js FULL   *
 * integrado: guardado, padrón, líneas, PT4000
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

/** ==========================================
 *  Estado
 *  ========================================== */
let zonas123Editables = false;

const CURRENT_NAME_KEY = "senalco_current_base_name";
function getCurrentBaseName() { return localStorage.getItem(CURRENT_NAME_KEY) || ""; }
function setCurrentBaseName(name) {
  if (!name) localStorage.removeItem(CURRENT_NAME_KEY);
  else localStorage.setItem(CURRENT_NAME_KEY, name);
}

const PT_KEY = "senalco_pt_state_v1";

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
  const m = String(z || "").match(/(\d{1,3})/);
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

function firstDefined(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function toLower(v) {
  return String(v || "").trim().toLowerCase();
}

/** ==========================================
 *  Entidades
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
 *  Storage Keys
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
 *  PT4000 / RS485
 *  ========================================== */
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
    salidas: {
      clave: "",
      ip: "",
      sismico: "",
      robo: ""
    },
    entradas: {
      z1: "",
      z2: "",
      z3: "",
      z4: "",
      z5: "",
      z6: ""
    }
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
        <button class="mini-btn" data-del="${idx}" style="background:#b00020;">Borrar PT</button>
      </div>

      <div class="pt-top-grid">
        <div>
          <label>Nombre</label>
          <input data-pt="${idx}" data-field="nombre" value="${escapeHtml(pt.nombre)}">
        </div>
        <div>
          <label>Área</label>
          <input data-pt="${idx}" data-field="area" value="${escapeHtml(pt.area)}">
        </div>
        <div>
          <label>Número</label>
          <input data-pt="${idx}" data-field="numero" value="${escapeHtml(pt.numero)}">
        </div>
        <div>
          <label>IP</label>
          <input data-pt="${idx}" data-field="ip" value="${escapeHtml(pt.ip)}">
        </div>
        <div>
          <label>Clave</label>
          <input data-pt="${idx}" data-field="clave" value="${escapeHtml(pt.clave)}">
        </div>
      </div>

      <div class="pt-main-grid" style="margin-top:12px;">
        <div class="pt-subbox">
          <h4>Salidas</h4>
          <label>Salida de Clave</label>
          <input data-pt="${idx}" data-salida="clave" value="${escapeHtml(pt.salidas?.clave || "")}">
          <label>Salida de IP</label>
          <input data-pt="${idx}" data-salida="ip" value="${escapeHtml(pt.salidas?.ip || "")}">
          <label>Salida de Sísmico</label>
          <input data-pt="${idx}" data-salida="sismico" value="${escapeHtml(pt.salidas?.sismico || "")}">
          <label>Salida de Robo</label>
          <input data-pt="${idx}" data-salida="robo" value="${escapeHtml(pt.salidas?.robo || "")}">
        </div>

        <div class="pt-subbox">
          <h4>Entradas / Zonas</h4>
          <label>Z1</label>
          <input data-pt="${idx}" data-entrada="z1" value="${escapeHtml(pt.entradas?.z1 || "")}">
          <label>Z2</label>
          <input data-pt="${idx}" data-entrada="z2" value="${escapeHtml(pt.entradas?.z2 || "")}">
          <label>Z3</label>
          <input data-pt="${idx}" data-entrada="z3" value="${escapeHtml(pt.entradas?.z3 || "")}">
          <label>Z4</label>
          <input data-pt="${idx}" data-entrada="z4" value="${escapeHtml(pt.entradas?.z4 || "")}">
          <label>Z5</label>
          <input data-pt="${idx}" data-entrada="z5" value="${escapeHtml(pt.entradas?.z5 || "")}">
          <label>Z6</label>
          <input data-pt="${idx}" data-entrada="z6" value="${escapeHtml(pt.entradas?.z6 || "")}">
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

      if (inp.dataset.field) {
        state.equipos[idx][inp.dataset.field] = inp.value;
      }
      if (inp.dataset.salida) {
        state.equipos[idx].salidas[inp.dataset.salida] = inp.value;
      }
      if (inp.dataset.entrada) {
        state.equipos[idx].entradas[inp.dataset.entrada] = inp.value;
      }

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
async function borrarIndexedDBSenalco() {
  try {
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();

      const objetivos = dbs
        .map(db => db.name)
        .filter(name =>
          name &&
          (
            name.toLowerCase().includes("senalco") ||
            name.toLowerCase().includes("base")
          )
        );

      for (const name of objetivos) {
        await new Promise((resolve) => {
          const req = indexedDB.deleteDatabase(name);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
          req.onblocked = () => resolve(false);
        });
      }

      return objetivos.length;
    }
  } catch (e) {
    console.warn("No se pudo listar IndexedDB:", e);
  }

  const posibles = [
    "senalcoBaseDB",
    "SeñalcoBaseDB",
    "senalco-base-db",
    "senalco_bases_db",
    "bases"
  ];

  let borradas = 0;

  for (const name of posibles) {
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => {
        borradas++;
        resolve(true);
      };
      req.onerror = () => resolve(false);
      req.onblocked = () => resolve(false);
    });
  }

  return borradas;
}

async function borrarTodoBases() {
  const confirm1 = confirm("⚠️ Esto va a borrar TODAS las bases guardadas.\n\n¿Querés continuar?");
  if (!confirm1) return;

  const confirm2 = confirm("🚨 ÚLTIMA CONFIRMACIÓN\n\nSe pierden todas las bases locales.\n\n¿Seguro?");
  if (!confirm2) return;

  let borradasLS = 0;

  Object.keys(localStorage)
    .filter(k =>
      k.startsWith("senalco_base_") ||
      k === "senalco_bases_index" ||
      k === "senalco_base_autosave" ||
      k === "senalco_current_base_name"
    )
    .forEach(k => {
      localStorage.removeItem(k);
      borradasLS++;
    });

  const borradasIDB = await borrarIndexedDBSenalco();

  setCurrentBaseName("");

  if ($("entidad")) $("entidad").value = "";
  if ($("sucursal")) $("sucursal").value = "";
  if ($("abonado")) $("abonado").value = "";
  if ($("central")) $("central").value = "";
  if ($("provincia")) $("provincia").value = "";

  zonas123Editables = false;

  if (typeof resetPTState === "function") resetPTState();

  precargarZonas();
  aplicarBloqueoZonas123();
  renderBuscadorRapido();
  renderBasesMini();

  alert(
    "✅ Borrado total terminado\n\n" +
    "LocalStorage borrado: " + borradasLS + "\n" +
    "IndexedDB detectadas/borradas: " + borradasIDB
  );
}
/** ==========================================
 *  DOM Bindings
 *  ========================================== */
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

  $("btn-reset-total")?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await borrarTodoBases();
  });

/** ==========================================
 *  Tabla zonas 1..24
 *  ========================================== */
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
  resetPTState();
  autosaveBase();
}

/** ==========================================
 *  JSON Base
 *  ========================================== */
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
 *  Guardado
 *  ========================================== */
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

/** ==========================================
 *  Importar JSON
 *  ========================================== */
function importarJSONBase(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      cargarDataEnPantalla(data);
      setCurrentBaseName("");
      alert("✅ JSON importado");
    } catch {
      alert("❌ JSON inválido");
    }
  };
  reader.readAsText(file);
}

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
  alert(`✅ Importación lista\nOK: ${ok} • Fallidos: ${bad}`);
}

/** ==========================================
 *  Cargar data en pantalla
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

    const sa = celdas[2].querySelector("select");
    const ia = celdas[2].querySelector("input");
    if (areas.includes(zObj.area)) {
      sa.value = zObj.area;
      ia.value = "";
      ia.style.display = "none";
    } else if (zObj.area) {
      sa.value = "Otros";
      ia.value = zObj.area || "";
      ia.style.display = "inline-block";
    } else {
      sa.value = "-";
      ia.value = "";
      ia.style.display = "none";
    }

    const sd = celdas[3].querySelector("select");
    const id = celdas[3].querySelector("input");
    if (dispositivos.includes(zObj.dispositivo)) {
      sd.value = zObj.dispositivo;
      id.value = "";
      id.style.display = "none";
    } else if (zObj.dispositivo) {
      sd.value = "otros";
      id.value = zObj.dispositivo || "";
      id.style.display = "inline-block";
    } else {
      sd.value = "-";
      id.value = "";
      id.style.display = "none";
    }

    celdas[4].querySelector("input").value = zObj.descripcion || "";
  });

  if (data.pt4000) {
    setPTState({
      habilitado: !!data.pt4000.habilitado,
      equipos: Array.isArray(data.pt4000.equipos) ? data.pt4000.equipos : []
    });
  } else {
    resetPTState();
  }

  renderPTUI();
  aplicarDefaultsZonas123SiVacias();
  aplicarBloqueoZonas123();
  autosaveBase();
}

/** ==========================================
 *  Excel IMPORT Base común
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

      celdas[4].querySelector("input").value = E || "";
    }

    aplicarDefaultsZonas123SiVacias();
    aplicarBloqueoZonas123();
    autosaveBase();
    setCurrentBaseName("");
    alert("✅ Excel base importado");
  } catch (e) {
    console.error(e);
    alert("❌ Error leyendo Excel");
  }
}

/** ==========================================
 *  Importar padrón masivo
 *  Columnas esperadas tolerantes:
 *  id central / central, abo / abonado, entidad, sucursal, localidad, provincia, tecnico, pt / 485 / rs485
 *  ========================================== */
function detectHeaderMap(values) {
  const map = {};
  values.forEach((v, i) => {
    const key = normKey(v);
    if (!key) return;

    if (["id de central", "id central", "central", "id_central"].includes(key)) map.central = i + 1;
    if (["abo", "abonado", "abonado nro", "numero de abonado", "nro abonado"].includes(key)) map.abonado = i + 1;
    if (["entidad"].includes(key)) map.entidad = i + 1;
    if (["sucursal"].includes(key)) map.sucursal = i + 1;
    if (["localidad"].includes(key)) map.localidad = i + 1;
    if (["provincia"].includes(key)) map.provincia = i + 1;
    if (["tecnico", "tecnico asignado"].includes(key)) map.tecnico = i + 1;
    if (["pt", "485", "rs485", "tiene pt", "tiene 485"].includes(key)) map.pt = i + 1;
  });
  return map;
}

function boolFromCell(v) {
  const t = toLower(v);
  return ["si", "sí", "s", "1", "true", "x", "ok"].includes(t);
}

async function importarPadronMasivoExcel(file) {
  try {
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    if (!ws) return alert("❌ El Excel no tiene hojas.");

    const headerRow = ws.getRow(1);
    const map = detectHeaderMap(headerRow.values || []);

    if (!map.central && !map.abonado && !map.entidad && !map.sucursal) {
      return alert("❌ No pude detectar encabezados del padrón.");
    }

    let ok = 0;
    let dup = 0;
    let bad = 0;

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);

      const central = firstDefined(map.central ? row.getCell(map.central).value : "");
      const abonado = firstDefined(map.abonado ? row.getCell(map.abonado).value : "");
      const entidad = firstDefined(map.entidad ? row.getCell(map.entidad).value : "");
      const sucursal = firstDefined(map.sucursal ? row.getCell(map.sucursal).value : "");
      const localidad = firstDefined(map.localidad ? row.getCell(map.localidad).value : "");
      const provincia = firstDefined(map.provincia ? row.getCell(map.provincia).value : "");
      const tecnico = firstDefined(map.tecnico ? row.getCell(map.tecnico).value : "");
      const tienePT = map.pt ? boolFromCell(row.getCell(map.pt).value) : false;

      if (!entidad && !sucursal && !abonado && !central) {
        continue;
      }

      try {
        const data = {
          meta: {
            generado: fechaGeneradoLocal(),
            origen: "padron_masivo_excel",
            localidad,
            tecnico
          },
          entidad,
          sucursal,
          abonado,
          central,
          provincia,
          zonas: [],
          pt4000: {
            habilitado: !!tienePT,
            equipos: []
          }
        };

        for (let i = 1; i <= 24; i++) {
          const evDefault = i === 1 ? "Avería de linea" : i === 2 ? "Apertura de Equipo" : i === 3 ? "Falta de 220V" : "- Sin tipo definido -";
          data.zonas.push({
            zona: `Zona ${i}`,
            evento: evDefault,
            area: "-",
            dispositivo: "-",
            descripcion: ""
          });
        }

        const nombre = safeName([entidad || "Entidad", sucursal || "Suc", abonado || ""].filter(Boolean).join("_") || `Base_${r}`);
        if (localStorage.getItem(baseKey(nombre))) {
          dup++;
          continue;
        }

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
    alert(`✅ Padrón importado\nCreadas: ${ok}\nDuplicadas salteadas: ${dup}\nFallidas: ${bad}`);
  } catch (e) {
    console.error(e);
    alert("❌ Error importando padrón masivo");
  }
}

/** ==========================================
 *  Importar líneas - Excel básico
 *  Num -> zona
 *  Tipo Ev -> evento
 *  Area/Desc -> descripción
 *  ========================================== */
async function importarLineasExcelBasico(file) {
  try {
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    if (!ws) return alert("❌ El Excel no tiene hojas.");

    let headerRowNum = null;
    let map = {};

    for (let r = 1; r <= Math.min(ws.rowCount, 10); r++) {
      const vals = (ws.getRow(r).values || []).map(v => normKey(v));
      const candidate = {};
      vals.forEach((v, i) => {
        if (["num", "zona"].includes(v)) candidate.zona = i;
        if (["tipo ev", "tipo evento", "evento"].includes(v)) candidate.evento = i;
        if (["area / desc", "area/desc", "descripcion", "descripcion/area"].includes(v)) candidate.desc = i;
      });
      if (candidate.zona && candidate.evento && candidate.desc) {
        headerRowNum = r;
        map = candidate;
        break;
      }
    }

    if (!headerRowNum) return alert("❌ No encontré columnas Num / Tipo Ev / Area-Desc.");

    let ok = 0;
    for (let r = headerRowNum + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const zonaTxt = firstDefined(row.getCell(map.zona).value);
      const eventoTxt = firstDefined(row.getCell(map.evento).value);
      const descTxt = firstDefined(row.getCell(map.desc).value);

      const n = getZonaNumberFromText(zonaTxt);
      if (!n || n < 1 || n > 24) continue;
      if ([1, 2, 3].includes(n)) continue;

      const tr = document.querySelector(`#tabla-base tbody tr[data-zona="${n}"]`);
      if (!tr) continue;

      const celdas = tr.querySelectorAll("td");

      const se = celdas[1].querySelector("select");
      const ie = celdas[1].querySelector("input");
      if (eventoTxt && eventos.includes(eventoTxt)) {
        se.value = eventoTxt;
        ie.value = "";
        ie.style.display = "none";
      } else if (eventoTxt) {
        se.value = "Otros";
        ie.value = eventoTxt;
        ie.style.display = "inline-block";
      }

      if (descTxt && descTxt !== "-") {
        celdas[4].querySelector("input").value = descTxt;
      }

      ok++;
    }

    autosaveBase();
    alert(`✅ Líneas básicas cargadas\nZonas actualizadas: ${ok}`);
  } catch (e) {
    console.error(e);
    alert("❌ Error cargando Excel básico");
  }
}

/** ==========================================
 *  Importar líneas - Excel completo / AMBA
 *  Soporta nombres tolerantes
 *  zona / num, evento / tipo ev, area, dispositivo, descripcion
 *  ========================================== */
async function importarLineasExcelCompleto(file) {
  try {
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    if (!ws) return alert("❌ El Excel no tiene hojas.");

    let headerRowNum = null;
    let map = {};

    for (let r = 1; r <= Math.min(ws.rowCount, 15); r++) {
      const vals = (ws.getRow(r).values || []).map(v => normKey(v));
      const candidate = {};
      vals.forEach((v, i) => {
        if (["num", "zona"].includes(v)) candidate.zona = i;
        if (["tipo ev", "tipo evento", "evento"].includes(v)) candidate.evento = i;
        if (["area", "área"].includes(v)) candidate.area = i;
        if (["dispositivo"].includes(v)) candidate.dispositivo = i;
        if (["descripcion", "descripción", "area / desc", "area/desc"].includes(v)) candidate.descripcion = i;
      });
      if (candidate.zona && candidate.evento) {
        headerRowNum = r;
        map = candidate;
        break;
      }
    }

    if (!headerRowNum) return alert("❌ No encontré columnas del Excel completo.");

    let ok = 0;
    for (let r = headerRowNum + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);

      const zonaTxt = firstDefined(row.getCell(map.zona).value);
      const eventoTxt = map.evento ? firstDefined(row.getCell(map.evento).value) : "";
      const areaTxt = map.area ? firstDefined(row.getCell(map.area).value) : "";
      const dispTxt = map.dispositivo ? firstDefined(row.getCell(map.dispositivo).value) : "";
      const descTxt = map.descripcion ? firstDefined(row.getCell(map.descripcion).value) : "";

      const n = getZonaNumberFromText(zonaTxt);
      if (!n || n < 1 || n > 24) continue;
      if ([1, 2, 3].includes(n)) continue;

      const tr = document.querySelector(`#tabla-base tbody tr[data-zona="${n}"]`);
      if (!tr) continue;

      const celdas = tr.querySelectorAll("td");

      const se = celdas[1].querySelector("select");
      const ie = celdas[1].querySelector("input");
      if (eventoTxt) {
        if (eventos.includes(eventoTxt)) {
          se.value = eventoTxt;
          ie.value = "";
          ie.style.display = "none";
        } else {
          se.value = "Otros";
          ie.value = eventoTxt;
          ie.style.display = "inline-block";
        }
      }

      const sa = celdas[2].querySelector("select");
      const ia = celdas[2].querySelector("input");
      if (areaTxt) {
        if (areas.includes(areaTxt)) {
          sa.value = areaTxt;
          ia.value = "";
          ia.style.display = "none";
        } else {
          sa.value = "Otros";
          ia.value = areaTxt;
          ia.style.display = "inline-block";
        }
      }

      const sd = celdas[3].querySelector("select");
      const id = celdas[3].querySelector("input");
      if (dispTxt) {
        if (dispositivos.includes(dispTxt)) {
          sd.value = dispTxt;
          id.value = "";
          id.style.display = "none";
        } else {
          sd.value = "otros";
          id.value = dispTxt;
          id.style.display = "inline-block";
        }
      }

      if (descTxt && descTxt !== "-") {
        celdas[4].querySelector("input").value = descTxt;
      }

      ok++;
    }

    autosaveBase();
    alert(`✅ Líneas AMBA cargadas\nZonas actualizadas: ${ok}`);
  } catch (e) {
    console.error(e);
    alert("❌ Error cargando Excel completo / AMBA");
  }
}

/** ==========================================
 *  PDF
 *  ========================================== */
function dibujarBaseEnPDF(doc, incluirPT = false) {
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

  if (incluirPT) {
    const state = getPTState();
    if (state.habilitado && state.equipos.length) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Detalle PT4000 / RS485", 14, 16);

      let y = 24;

      state.equipos.forEach((pt, idx) => {
        doc.setFontSize(11);
        doc.text(`PT ${idx + 1}`, 14, y);
        y += 6;
        doc.text(`Nombre: ${pt.nombre || "-"}`, 14, y); y += 6;
        doc.text(`Área: ${pt.area || "-"}`, 14, y); y += 6;
        doc.text(`Número: ${pt.numero || "-"}`, 14, y); y += 6;
        doc.text(`IP: ${pt.ip || "-"}`, 14, y); y += 6;
        doc.text(`Clave: ${pt.clave || "-"}`, 14, y); y += 8;

        const ptRows = [
          ["Salida Clave", pt.salidas?.clave || "-"],
          ["Salida IP", pt.salidas?.ip || "-"],
          ["Salida Sísmico", pt.salidas?.sismico || "-"],
          ["Salida Robo", pt.salidas?.robo || "-"],
          ["Z1", pt.entradas?.z1 || "-"],
          ["Z2", pt.entradas?.z2 || "-"],
          ["Z3", pt.entradas?.z3 || "-"],
          ["Z4", pt.entradas?.z4 || "-"],
          ["Z5", pt.entradas?.z5 || "-"],
          ["Z6", pt.entradas?.z6 || "-"]
        ];

        doc.autoTable({
          head: [["Campo", "Valor"]],
          body: ptRows,
          startY: y,
          margin: { left: 14, right: 14 }
        });

        y = doc.lastAutoTable.finalY + 10;
        if (y > 250 && idx < state.equipos.length - 1) {
          doc.addPage();
          y = 20;
        }
      });
    }
  }
}

function generarPDF() {
  const ptState = getPTState();
  let incluirPT = false;

  if (ptState.habilitado && ptState.equipos.length) {
    const decision = prompt(
      "Exportación PDF:\n\nEscribí una opción:\n- BASE para solo base abonado\n- PT para base + PT4000",
      "BASE"
    );

    if (decision === null) return;
    incluirPT = String(decision).trim().toUpperCase() === "PT";
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  dibujarBaseEnPDF(doc, incluirPT);
  doc.save(`base_${safeName($("entidad").value || "base")}_${safeName($("sucursal").value || "")}_${safeName(fechaStamp())}.pdf`);
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
      : selectDisp.value;

    sheet.addRow([
      celdas[0].textContent,
      evento,
      area,
      disp,
      celdas[4].querySelector("input").value
    ]);
  });

  const ptState = getPTState();
  if (ptState.habilitado && ptState.equipos.length) {
    sheet.addRow([]);
    sheet.addRow(["PT4000 / RS485"]);
    ptState.equipos.forEach((pt, idx) => {
      sheet.addRow([`PT ${idx + 1}`]);
      sheet.addRow(["Nombre", pt.nombre || ""]);
      sheet.addRow(["Área", pt.area || ""]);
      sheet.addRow(["Número", pt.numero || ""]);
      sheet.addRow(["IP", pt.ip || ""]);
      sheet.addRow(["Clave", pt.clave || ""]);
      sheet.addRow(["Salida Clave", pt.salidas?.clave || ""]);
      sheet.addRow(["Salida IP", pt.salidas?.ip || ""]);
      sheet.addRow(["Salida Sísmico", pt.salidas?.sismico || ""]);
      sheet.addRow(["Salida Robo", pt.salidas?.robo || ""]);
      sheet.addRow(["Z1", pt.entradas?.z1 || ""]);
      sheet.addRow(["Z2", pt.entradas?.z2 || ""]);
      sheet.addRow(["Z3", pt.entradas?.z3 || ""]);
      sheet.addRow(["Z4", pt.entradas?.z4 || ""]);
      sheet.addRow(["Z5", pt.entradas?.z5 || ""]);
      sheet.addRow(["Z6", pt.entradas?.z6 || ""]);
      sheet.addRow([]);
    });
  }

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
        PT4000: ${data.pt4000?.habilitado ? "Sí" : "No"}<br>
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

      ${data.pt4000?.habilitado && data.pt4000?.equipos?.length ? `
      <div style="margin-top:16px;">
        <h3 style="margin:0 0 10px 0;">PT4000 / RS485</h3>
        ${data.pt4000.equipos.map((pt, i) => `
          <div style="border:1px solid #ddd; border-radius:10px; padding:10px; margin-bottom:10px;">
            <b>PT ${i + 1}</b><br>
            Nombre: ${escapeHtml(pt.nombre || "-")}<br>
            Área: ${escapeHtml(pt.area || "-")}<br>
            Número: ${escapeHtml(pt.numero || "-")}<br>
            IP: ${escapeHtml(pt.ip || "-")}<br>
            Clave: ${escapeHtml(pt.clave || "-")}<br>
            Salida Clave: ${escapeHtml(pt.salidas?.clave || "-")}<br>
            Salida IP: ${escapeHtml(pt.salidas?.ip || "-")}<br>
            Salida Sísmico: ${escapeHtml(pt.salidas?.sismico || "-")}<br>
            Salida Robo: ${escapeHtml(pt.salidas?.robo || "-")}<br>
            Z1: ${escapeHtml(pt.entradas?.z1 || "-")}<br>
            Z2: ${escapeHtml(pt.entradas?.z2 || "-")}<br>
            Z3: ${escapeHtml(pt.entradas?.z3 || "-")}<br>
            Z4: ${escapeHtml(pt.entradas?.z4 || "-")}<br>
            Z5: ${escapeHtml(pt.entradas?.z5 || "-")}<br>
            Z6: ${escapeHtml(pt.entradas?.z6 || "-")}<br>
          </div>
        `).join("")}
      </div>
      ` : ""}
    </div>
  `;

  modal.style.display = "flex";
}

function cerrarPrevisualizacion() {
  const modal = $("modal-prev");
  if (modal) modal.style.display = "none";
}

/** ==========================================
 *  Bases guardadas
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
  alert("✅ Base abierta:\n" + nombre);
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
 *  Buscador
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

  if (!q) {
    cont.innerHTML = "";
    return;
  }

  if (!idx.length) {
    cont.innerHTML = `<div class="card"><b>Sin bases todavía</b><div style="opacity:.8;">Guardá una base y te aparece acá.</div></div>`;
    return;
  }

  const campos = getCamposSeleccionados();
  const modoSuave = q.length > 0 && q.length < 3;

  let count = 0;

  idx.forEach(nombre => {
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

    const ok = campos.some(c => String(map[c] || "").toLowerCase().includes(q));
    if (!ok) return;
    if (modoSuave && count >= 12) return;

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
            • PT: ${data.pt4000?.habilitado ? "Sí" : "No"}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="mini-btn" data-act="abrir">Abrir</button>
          <button class="mini-btn" data-act="json">JSON</button>
          <button class="mini-btn" data-act="borrar" style="background:#b00020;">Borrar</button>
        </div>
      </div>
    `;

    card.addEventListener("click", () => abrirBaseGuardada(nombre));

    card.querySelector('[data-act="abrir"]').addEventListener("click", (e) => {
      e.stopPropagation();
      abrirBaseGuardada(nombre);
    });

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
    cont.innerHTML = `<div class="card"><b>Sin resultados</b><div style="opacity:.8;">Probá con otra palabra o más campos.</div></div>`;
  }
}

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
            ${escapeHtml(data.entidad || "-")} • Suc: ${escapeHtml(data.sucursal || "-")} • Ab: ${escapeHtml(data.abonado || "-")} • PT: ${data.pt4000?.habilitado ? "Sí" : "No"}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="mini-btn" data-act="abrir">Abrir</button>
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