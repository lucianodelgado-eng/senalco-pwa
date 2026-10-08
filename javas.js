/*************************
 *  Navegación por pasos *
 *************************/
let paso = 0;
let secciones, btnAtras, btnSig;
let siguienteAreaId = 0;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function irAlInicio() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
}
window.addEventListener('pageshow', irAlInicio);

function mostrarPaso(i) {
  secciones.forEach((sec, idx) => sec.style.display = (idx === i) ? "block" : "none");
  btnAtras.style.display = (i === 0) ? "none" : "inline-block";
  btnSig.style.display = (i === secciones.length - 1) ? "none" : "inline-block";
  cerrarVistaPrevia();
  irAlInicio();
}

/*************************
 *  Helpers UI / Sector  *
 *************************/
function actualizarContadorArea(sector) {
  const total = Array.from(sector.querySelectorAll('.lista-dispositivos tbody tr'))
    .reduce((sum, fila) => {
      const cantidad = Number(fila.querySelectorAll('input')[1]?.value || 0);
      return sum + (Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 0);
    }, 0);
  sector.querySelector('.conteo').textContent = String(total);
  sector.querySelector('.area-toggle').setAttribute('aria-label',
    `${sector.querySelector('h3').textContent.trim() || 'Área'}: ${total} dispositivos. ${sector.querySelector('.area-contenido').hidden ? 'Abrir' : 'Cerrar'} área`);
}

function cambiarEstadoArea(sector, abierto) {
  sector.querySelector('.area-contenido').hidden = !abierto;
  sector.querySelector('.area-toggle').setAttribute('aria-expanded', String(abierto));
  actualizarContadorArea(sector);
}

function alternarArea(btn) {
  const sector = btn.closest('.sector');
  const abierto = sector.querySelector('.area-contenido').hidden;
  cambiarEstadoArea(sector, abierto);
  guardarEstadoLocal();
  sector.querySelector('.area-cabecera').scrollIntoView({ block: 'start', behavior: 'instant' });
}

function mostrarOtro(select) {
  const inputOtro = select.parentElement.querySelector(".otro-dispositivo");
  if (!inputOtro) return;
  inputOtro.style.display = (select.value === "Otro") ? "block" : "none";
}

function guardarFilaEditable(btn) {
  const sector = btn.closest(".sector");
  const filaEdicion = sector.querySelector("tbody tr");
  if (!filaEdicion) return;

  const sel = filaEdicion.querySelector("select");
  const inpCant = filaEdicion.querySelector('td[data-label="Cantidad"] input');
  const inpModelo = filaEdicion.querySelector('td[data-label="Modelo"] input');
  const inpZona = filaEdicion.querySelector('td[data-label="Zona"] input');
  const inpObs = filaEdicion.querySelector('td[data-label="Observación"] input');
  const inpOtro = filaEdicion.querySelector(".otro-dispositivo");

  let dispositivo = sel?.value || "";
  if (dispositivo === "Otro" && inpOtro && inpOtro.value.trim() !== "") {
    dispositivo = inpOtro.value.trim();
  }

  if (!dispositivo) { alert("Seleccioná un dispositivo válido."); return; }
  if (!inpCant?.value || +inpCant.value <= 0) { alert("La cantidad debe ser mayor que 0."); return; }

  const datos = [
    dispositivo,
    inpCant.value.trim(),
    (inpModelo?.value || "").trim(),
    (inpZona?.value || "").trim(),
    (inpObs?.value || "").trim()
  ];

  const filaNueva = document.createElement("tr");
  datos.forEach(d => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.value = d;
    input.style.width = "100%";
    td.appendChild(input);
    filaNueva.appendChild(td);
  });

  sector.querySelector("details tbody").appendChild(filaNueva);

  actualizarContadorArea(sector);

  // Reset
  if (sel) sel.value = "";
  if (inpCant) inpCant.value = "";
  if (inpModelo) inpModelo.value = "";
  if (inpZona) inpZona.value = "";
  if (inpObs) inpObs.value = "";
  if (inpOtro) { inpOtro.value = ""; inpOtro.style.display = "none"; }

  guardarEstadoLocal();
  refrescarListaRelevamientos();
}

function limpiarSector(btn) {
  const sector = btn.closest(".sector");
  sector.querySelector("details tbody").innerHTML = "";
  actualizarContadorArea(sector);
  guardarEstadoLocal();
  refrescarListaRelevamientos();
}

function agregarSectorPorNombre(nombre) {
  const contenedor = document.getElementById("contenedor-sectores");
  const div = document.createElement("div");
  div.className = "sector area-plegable";
  const areaId = `area-contenido-${++siguienteAreaId}`;

  div.innerHTML = `
    <div class="area-cabecera">
      <h3 contenteditable="true" role="textbox" aria-label="Nombre del área" aria-multiline="false">${escapeHtml(nombre)}</h3>
      <button type="button" class="area-toggle" aria-expanded="false" aria-controls="${areaId}" onclick="alternarArea(this)">
        <span class="conteo" title="Cantidad de dispositivos cargados">0</span>
        <span class="area-flecha" aria-hidden="true">⌄</span>
      </button>
    </div>
    <div class="area-contenido" id="${areaId}" hidden>
    <table class="tabla-editable">
      <thead>
        <tr>
          <th>Dispositivo</th><th>Cantidad</th><th>Modelo</th><th>Zona(instantanea/24hs)</th><th>Observación de ubicacion</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="Dispositivo">
            <select onchange="mostrarOtro(this)">
              <option value="">-- Seleccionar --</option>
              <option>Equipo de abonado</option>
              <option>Gabinete de Baterias</option>
              <option>Central/Teclados volumetrico</option>
              <option>Teclados</option>
              <option>Pulsadores de asalto</option>
              <option>Pulsadores de Incendio</option>
              <option>Sensores Infrarrojos pasivos</option>
              <option>Sensor Infrarrojo Pasivo Antimasking</option>
              <option>Detectores de humo</option>
              <option>Sirena Interior</option>
              <option>Sirena Exterior</option>
              <option>Receptor Inalámbrico</option>
              <option>Pulsadores Inalámbricos</option>
              <option>Pulsador Remoto</option>
              <option>Protectores de tesoro</option>
              <option>Sensores Sísmicos</option>
              <option>Detectores térmicos</option>
              <option>Juegos de magnéticos</option>
              <option>Magenticos antisabotaje</option>
              <option>Receptor inalámbrico</option>
              <option>Cerradura electromagnética</option>
              <option>Baterías</option>
              <option>Otro</option>
            </select>
            <input type="text" class="otro-dispositivo" style="display:none; margin-top:4px;" placeholder="Especificar otro dispositivo" />
          </td>
          <td data-label="Cantidad"><input type="number" min="0"></td>
          <td data-label="Modelo"><input type="text"></td>
          <td data-label="Zona"><input type="text"></td>
          <td data-label="Observación"><input type="text"></td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:10px;">
      <button type="button" onclick="guardarFilaEditable(this)">Guardar</button>
      <button type="button" onclick="limpiarSector(this)">Limpiar sector</button>
      <button type="button" onclick="precargarDispositivos(this, 'atm')">Dispositivos ATM</button>
      <button type="button" onclick="precargarDispositivos(this, 'tesoro')">Dispositivos Tesoro</button>
      <button type="button" onclick="precargarDispositivos(this, 'CDS')">Dispositivos C. de Seguridad</button>
      <button type="button" onclick="precargarDispositivos(this, 'bunker')">Dispositivos Bunker</button>
    </div>

    <details class="lista-dispositivos">
      <summary>Dispositivos completados</summary>
      <table>
        <thead>
          <tr>
            <th>Dispositivo</th><th>Cantidad</th><th>Modelo</th><th>Zona(instantanea/24hs)</th><th>Observación de ubicacion</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </details>
    </div>
  `;

  contenedor.appendChild(div);
  div.querySelector('h3').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
  });
  div.querySelector('.lista-dispositivos').addEventListener('toggle', guardarEstadoLocal);
  actualizarContadorArea(div);
}

function agregarSector() {
  agregarSectorPorNombre("Nuevo sector");
  const nuevo = document.getElementById('contenedor-sectores').lastElementChild;
  cambiarEstadoArea(nuevo, true);
  guardarEstadoLocal();
  nuevo.querySelector('.area-cabecera').scrollIntoView({ block: 'start', behavior: 'instant' });
}

/*******************************
 * Precargas (ATM/Tesoro/...)  *
 *******************************/
function precargarDispositivos(btn, tipo) {
  const sector = btn.closest(".sector");
  const dispositivos = {
    atm: [
      ["ATM", "", "", "", ""],
      ["Detectores térmicos", "", "", "24HS", ""],
      ["Sensores Sísmicos", "", "SM50", "24HS", ""],
      ["Juegos de magnéticos", "", "C&K", "Demorado", ""],
      ["Magenticos antisabotaje", "", "K30", "24HS", ""]
    ],
    tesoro: [
      ["Modulo de caja de seguridad", "", "", "", "interior del recinto"],
      ["Juegos de magnéticos", "", "Barral", "Demorado", ""],
      ["Sensores Sísmicos", "", "SM50", "24HS", ""],
      ["Cerradura electromagnética", "", "Zudsec", "", ""]
    ],
    CDS: [
      ["Modulo de caja de seguridad", "", "", "", "interior del recinto"],
      ["Juegos de magnéticos", "", "Barral", "Demorado", ""],
      ["Sensores Sísmicos", "", "SM50", "24HS", ""],
      ["Cerradura electromagnética", "", "Zudsec", "", ""]
    ],
    bunker: [
      ["Equipo de abonado", "1", "Señalco", "", ""],
      ["Gabinete de Baterias", "1", "Señalco", "", ""],
      ["Baterías", "8", "", "", ""],
      ["Pulsadores de asalto", "", "K92", "", ""],
      ["Pulsadores de incendio", "", "K95", "", ""]
    ]
  };

  const lista = dispositivos[tipo];
  if (!lista) return;

  const tbody = sector.querySelector("details tbody");
  let cantidadGlobal = "1";
  if (["atm", "tesoro", "CDS"].includes(tipo)) {
    const cant = prompt(`¿Cantidad para cada dispositivo ${tipo.toUpperCase()}?`);
    if (cant === null || cant.trim() === "" || isNaN(cant) || +cant <= 0) return;
    cantidadGlobal = cant;
  }

  lista.forEach(item => {
    const datos = [
      item[0],
      ["atm", "tesoro", "CDS"].includes(tipo) ? cantidadGlobal : (item[1] || ""),
      item[2] || "",
      item[3] || "",
      item[4] || ""
    ];

    const tr = document.createElement("tr");
    datos.forEach(d => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.value = d;
      input.style.width = "100%";
      td.appendChild(input);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
  actualizarContadorArea(sector);

  guardarEstadoLocal();
  refrescarListaRelevamientos();
}

/*******************************
 *    Construir / Aplicar JSON *
 *******************************/
function buildRelevamientoData() {
  const data = {
    entidad: document.getElementById("entidad")?.value || "",
    sucursal: document.getElementById("sucursal")?.value || "",
    direccion: document.getElementById("direccion")?.value || "",
    fecha: document.getElementById("fecha")?.value || "",
    remito: document.getElementById("remito")?.value || "",
    relevado: document.getElementById("relevado")?.value || "",
    sectores: []
  };

  document.querySelectorAll(".sector").forEach(sector => {
    const nombre = sector.querySelector("h3")?.textContent?.trim() || "Sector";
    const filas = Array.from(sector.querySelectorAll("details tbody tr")).map(tr => {
      const inputs = tr.querySelectorAll("td input");
      const arr = Array.from(inputs).map(i => i.value || "");
      return (arr.length >= 5) ? arr.slice(0, 5) : arr;
    });

    data.sectores.push({ nombre, filas });
  });

  return data;
}

function applyRelevamientoData(data) {
  document.getElementById("entidad").value = data.entidad || "";
  document.getElementById("sucursal").value = data.sucursal || "";
  document.getElementById("direccion").value = data.direccion || "";
  document.getElementById("fecha").value = data.fecha || "";
  document.getElementById("remito").value = data.remito || "";
  document.getElementById("relevado").value = data.relevado || "";

  const contenedor = document.getElementById("contenedor-sectores");
  contenedor.innerHTML = "";

  (data.sectores || []).forEach(sec => {
    agregarSectorPorNombre(sec.nombre || "Sector");
    const last = contenedor.lastElementChild;
    const tbody = last.querySelector("details tbody");

    (sec.filas || []).forEach(fila => {
      const tr = document.createElement("tr");
      (fila || []).slice(0, 5).forEach(val => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "text";
        input.value = val ?? "";
        input.style.width = "100%";
        td.appendChild(input);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);

    });

    actualizarContadorArea(last);
  });

  if (data._borrador) {
    contenedor.querySelectorAll('.sector').forEach((sector, n) => {
      const pendiente = data._borrador.pendientes?.[n];
      sector.querySelectorAll('.tabla-editable tbody input, .tabla-editable tbody select').forEach((campo, i) => {
        if (pendiente?.[i] != null) campo.value = pendiente[i];
      });
      const select = sector.querySelector('.tabla-editable select');
      if (select) mostrarOtro(select);
      const detalle = sector.querySelector('.lista-dispositivos');
      if (detalle) detalle.open = !!data._borrador.abiertos?.[n];
      cambiarEstadoArea(sector, !!data._borrador.areasAbiertas?.[n]);
    });
    if (secciones?.length) {
      paso = Math.max(0, Math.min(secciones.length - 1, Number(data._borrador.paso) || 0));
      mostrarPaso(paso);
    }
  }
  guardarEstadoLocal();
  refrescarListaRelevamientos();
  cerrarVistaPrevia();
  irAlInicio();
}

/*******************************
 *   LocalStorage “DB”         *
 *******************************/
const KEY_AUTO = "formularioRelevamiento";
const KEY_PREFIX = "relevamiento_json_";
const BORRADOR_1 = "relevamientoBorrador1";
const BORRADOR_2 = "relevamientoBorrador2";

function guardarEstadoLocal() {
  document.querySelectorAll('.sector').forEach(actualizarContadorArea);
  const data = buildRelevamientoData();
  // El borrador incluye lo que todavía no se agregó a la tabla ni al PDF.
  data._borrador = {
    paso,
    pendientes: Array.from(document.querySelectorAll('.sector'), sector =>
      Array.from(sector.querySelectorAll('.tabla-editable tbody input, .tabla-editable tbody select'), i => i.value)),
    abiertos: Array.from(document.querySelectorAll('.sector .lista-dispositivos'), d => d.open),
    areasAbiertas: Array.from(document.querySelectorAll('.sector .area-contenido'), area => !area.hidden)
  };
  localStorage.setItem(KEY_AUTO, JSON.stringify(data));
}

function borrarFormulario() {
  if (!confirm("¿Limpiar el formulario para empezar otro? Los relevamientos guardados se conservan.")) return;
  ArchivosJSON.reset();
  localStorage.removeItem(KEY_AUTO);

  ["entidad","sucursal","direccion","fecha","remito","relevado"].forEach(id => {
    const campo = document.getElementById(id);
    if (campo) campo.value = "";
  });

  const contenedor = document.getElementById("contenedor-sectores");
  contenedor.innerHTML = "";
  sectoresPrecargados.forEach(n => agregarSectorPorNombre(n));

  paso = 0;
  mostrarPaso(paso);

  refrescarListaRelevamientos();
  cerrarVistaPrevia();
  ArchivosJSON.marcarSinCambios();
}

function guardarRelevamientoLocal(clave) {
  const data = buildRelevamientoData();
  localStorage.setItem(clave, JSON.stringify(data));
  guardarEstadoLocal();
  refrescarListaRelevamientos();
}

function eliminarRelevamiento(clave) {
  localStorage.removeItem(clave);
  refrescarListaRelevamientos();
}

function cargarRelevamientoLocal(clave) {
  const raw = localStorage.getItem(clave);
  if (!raw) return;
  const data = JSON.parse(raw);
  applyRelevamientoData(data);
  ArchivosJSON.recordar({ key: clave, name: clave.replace(KEY_PREFIX, "") + ".json" });
  cerrarVistaPrevia();
}

/*******************************
 *   JSON: Guardar / Descargar / Importar
 *******************************/
function generarNombreBase() {
  const e = (document.getElementById("entidad")?.value || "entidad").trim();
  const s = (document.getElementById("sucursal")?.value || "sucursal").trim();
  const f = (document.getElementById("fecha")?.value || "").trim();
  const safe = (x) => x.replace(/[^\w\d\-]+/g, "_");
  return `relev_${safe(e)}_${safe(s)}_${safe(f || "sin_fecha")}`.replace(/_+/g, "_");
}

async function guardarJSONNuevo() { return ArchivosJSON.exportar(); }

async function descargarJSONActual() { return ArchivosJSON.exportar(); }
function importarJSONDesdeArchivo(file) { return ArchivosJSON.importar(file); }

/*******************************
 * ✅ VISTA PREVIA
 *******************************/
function abrirVistaPrevia() {
  const data = buildRelevamientoData();

  const box = document.getElementById("preview-box");
  const head = document.getElementById("preview-head");
  const kpis = document.getElementById("preview-kpis");
  const tbody = document.querySelector("#preview-table tbody");

  if (!box || !head || !kpis || !tbody) return;

  // Encabezado (cards)
  head.innerHTML = `
    <div class="preview-kpi"><b>Entidad</b><br>${escapeHtml(data.entidad)}</div>
    <div class="preview-kpi"><b>Sucursal</b><br>${escapeHtml(data.sucursal)}</div>
    <div class="preview-kpi"><b>Fecha</b><br>${escapeHtml(data.fecha)}</div>
    <div class="preview-kpi"><b>Remito</b><br>${escapeHtml(data.remito)}</div>
    <div class="preview-kpi"><b>Dirección</b><br>${escapeHtml(data.direccion)}</div>
    <div class="preview-kpi"><b>Técnico</b><br>${escapeHtml(data.relevado)}</div>
  `;

  const totalSectores = (data.sectores || []).length;
  let totalItems = 0;
  let totalDispositivos = 0;

  // KPIs por sector
  kpis.innerHTML = "";
  (data.sectores || []).forEach(sec => {
    const cant = (sec.filas || []).length;
    totalItems += cant;
    const dispositivos = (sec.filas || []).reduce((total, fila) => total + Math.max(0, Number(fila[1]) || 0), 0);
    totalDispositivos += dispositivos;
    const div = document.createElement("div");
    div.className = "preview-kpi";
    div.innerHTML = `<b>${escapeHtml(sec.nombre)}</b><br>Dispositivos: ${dispositivos} • Renglones: ${cant}`;
    kpis.appendChild(div);
  });

  // KPIs generales arriba
  const divGen1 = document.createElement("div");
  divGen1.className = "preview-kpi";
  divGen1.innerHTML = `<b>Totales</b><br>Sectores: ${totalSectores} • Dispositivos: ${totalDispositivos} • Renglones: ${totalItems}`;
  kpis.prepend(divGen1);

  // Tabla detalle
  tbody.innerHTML = "";
  (data.sectores || []).forEach(sec => {
    (sec.filas || []).forEach(f => {
      const tr = document.createElement("tr");
      const row = [
        sec.nombre || "",
        f[0] || "",
        f[1] || "",
        f[2] || "",
        f[3] || "",
        f[4] || ""
      ];
      row.forEach(v => {
        const td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  });

  box.classList.add("active");
  // scrollea a preview
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarVistaPrevia() {
  const box = document.getElementById("preview-box");
  if (box) box.classList.remove("active");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/*******************************
 * Lista de relevamientos guardados
 *******************************/
function refrescarListaRelevamientos() {
  const ul = document.getElementById("lista-relevamientos");
  if (!ul) return;
  ul.innerHTML = "";

  // Borradores fijos
  [
    { key: BORRADOR_1, label: "📁 Borrador 1" },
    { key: BORRADOR_2, label: "📁 Borrador 2" }
  ].forEach(item => {
    const raw = localStorage.getItem(item.key);
    if (!raw) return;

    const data = JSON.parse(raw);
    const li = document.createElement("li");
    li.style.cursor = "pointer";
    li.textContent = `${item.label}: ${data.entidad || ""} - ${data.sucursal || ""}`;

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "🗑️";
    del.style.marginLeft = "10px";
    del.onclick = (e) => { e.stopPropagation(); eliminarRelevamiento(item.key); };

    li.onclick = () => cargarRelevamientoLocal(item.key);
    li.appendChild(del);
    ul.appendChild(li);
  });

  // JSON guardados “ilimitados”
  const keys = Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX)).sort().reverse();
  keys.forEach(k => {
    const raw = localStorage.getItem(k);
    if (!raw) return;

    let data;
    try { data = JSON.parse(raw); } catch { return; }

    const li = document.createElement("li");
    li.style.cursor = "pointer";
    li.textContent = `🧾 Relevamiento: ${data.entidad || ""} - ${data.sucursal || ""} (${(data.fecha || "").slice(0,10)})`;

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "🗑️";
    del.style.marginLeft = "10px";
    del.onclick = (e) => { e.stopPropagation(); eliminarRelevamiento(k); };

    li.onclick = () => cargarRelevamientoLocal(k);
    li.appendChild(del);
    ul.appendChild(li);
  });
}

/*******************************
 *        PDF (opcional)       *
 *******************************/
async function generarPDF() {
  if (!window.jspdf?.jsPDF) { alert("No se cargó la biblioteca PDF. Conectate a Internet y recargá la app."); return; }
  const respaldo = await ArchivosJSON.exportar();
  if (!respaldo) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });

  const entidad = document.getElementById("entidad").value;
  const sucursal = document.getElementById("sucursal").value;
  const direccion = document.getElementById("direccion").value;
  const fechaVal = document.getElementById("fecha").value;
  const fecha = fechaVal ? new Date(fechaVal).toLocaleDateString("es-AR") : "";
  const remito = document.getElementById("remito").value;
  const relevado = document.getElementById("relevado").value;

  doc.setFontSize(14);
  doc.text("Relevamiento", 10, 10);

  try {
    const logoImg = document.getElementById("logo");
    if (logoImg && logoImg.complete) {
      const canvas = document.createElement("canvas");
      canvas.width = logoImg.naturalWidth;
      canvas.height = logoImg.naturalHeight;
      canvas.getContext("2d").drawImage(logoImg, 0, 0);
      doc.addImage(canvas.toDataURL("image/jpeg"), "JPEG", 250, 5, 40, 20);
    }
  } catch {}

  doc.setFontSize(10);
  doc.text(`Entidad:   ${entidad}`, 10, 20);
  doc.text(`Sucursal:  ${sucursal}`, 10, 26);
  doc.text(`Dirección: ${direccion}`, 10, 32);
  doc.text(`Fecha:     ${fecha}`, 10, 38);
  doc.text(`Remito:    ${remito}`, 10, 44);

  let y = 54;

  document.querySelectorAll(".sector").forEach(sector => {
    const nombre = sector.querySelector("h3").textContent.trim();

    const filas = Array.from(sector.querySelectorAll("details tbody tr"))
      .map(tr => {
        const inputs = tr.querySelectorAll("td input");
        return Array.from(inputs).slice(0, 5).map(i => (i.value || "").trim());
      })
      .filter(f => parseInt(f[1]) > 0);

    if (filas.length === 0) return;

    const encabezado = ["Dispositivo", "Cantidad", "Modelo", "Zona(instantanea/24hs)", "Observación de ubicacion"];

    doc.autoTable({ startY: y, head: [[nombre]], theme: "plain", styles: { fontSize: 11, textColor: [35, 35, 35] }, margin: { left: 10, right: 10 } });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 2,
      head: [encabezado],
      body: filas,
      theme: "grid",
      styles: { fontSize: 8, textColor: [35, 35, 35] },
      headStyles: { fillColor: [197, 0, 0], textColor: 255 },
      margin: { left: 10, right: 10 }
    });

    y = doc.lastAutoTable.finalY + 14;
  });

  doc.save(respaldo.base + ".pdf");
}

/*******************************
 *  Bootstrap DOMContentLoaded *
 *******************************/
const sectoresPrecargados = [
  "Salón / Cajas",
  "Área Operativa",
  "Banca Automática / Lobby 24hs",
  "Recinto Tesoro",
  "Recinto Cajas de Seguridad",
  "Bóveda de cajas de seguridad",
  "Bóveda de tesoro",
  "Bunker / Sala Técnica"
];

document.addEventListener("DOMContentLoaded", () => {
  if (window.senalcoAuth?.allowed === false) return;
  // Paso / navegación
  secciones = document.querySelectorAll(".seccion");
  btnAtras = document.getElementById("atras");
  btnSig = document.getElementById("siguiente");

  btnSig.onclick = () => { if (paso < secciones.length - 1) { paso++; mostrarPaso(paso); guardarEstadoLocal(); } };
  btnAtras.onclick = () => { if (paso > 0) { paso--; mostrarPaso(paso); guardarEstadoLocal(); } };
  mostrarPaso(paso);

  // Cargar auto guardado o precarga
  const auto = localStorage.getItem(KEY_AUTO);
  if (auto) {
    try {
      const data = JSON.parse(auto);
      applyRelevamientoData(data);
    } catch {
      sectoresPrecargados.forEach(n => agregarSectorPorNombre(n));
    }
  } else {
    sectoresPrecargados.forEach(n => agregarSectorPorNombre(n));
  }

  // Botones del HTML
  document.getElementById("btn-agregar-sector")?.addEventListener("click", agregarSector);
  document.getElementById("btn-generar-pdf")?.addEventListener("click", generarPDF);
  document.getElementById("btn-borrar-form")?.addEventListener("click", borrarFormulario);

  // Borradores
  document.getElementById("btn-borrador-1")?.addEventListener("click", () => guardarRelevamientoLocal(BORRADOR_1));
  document.getElementById("btn-borrador-2")?.addEventListener("click", () => guardarRelevamientoLocal(BORRADOR_2));

  // JSON
  document.getElementById("btn-guardar-json")?.addEventListener("click", guardarJSONNuevo);
  document.getElementById("btn-descargar-json")?.addEventListener("click", descargarJSONActual);

  const fileInput = document.getElementById("file-json");
  document.getElementById("btn-importar-json")?.addEventListener("click", () => fileInput.click());
  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importarJSONDesdeArchivo(file);
    fileInput.value = "";
  });

  // ✅ Vista previa
  document.getElementById("btn-vista-previa")?.addEventListener("click", abrirVistaPrevia);
  document.getElementById("btn-preview-cerrar")?.addEventListener("click", cerrarVistaPrevia);
  document.getElementById("btn-preview-descargar")?.addEventListener("click", descargarJSONActual);

  // Auto-guardar
  document.addEventListener("input", guardarEstadoLocal);
  document.addEventListener("change", guardarEstadoLocal);

  // Lista
  refrescarListaRelevamientos();
  irAlInicio();
});