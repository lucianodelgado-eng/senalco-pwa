/*************************
 *  Navegación por pasos *
 *************************/
let paso = 0;
let secciones, btnAtras, btnSig;

function mostrarPaso(i) {
    secciones.forEach((sec, idx) => sec.style.display = (idx === i) ? "block" : "none");
    btnAtras.style.display = (i === 0) ? "none" : "inline-block";
    btnSig.style.display = (i === secciones.length - 1) ? "none" : "inline-block";
}

/*************************
 *  Helpers UI / Sector  *
 *************************/
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

    const contador = sector.querySelector(".conteo");
    if (contador) contador.textContent = +contador.textContent + 1;

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
    sector.querySelector(".conteo").textContent = "0";
    guardarEstadoLocal();
    refrescarListaRelevamientos();
}

function agregarSectorPorNombre(nombre) {
    const contenedor = document.getElementById("contenedor-sectores");
    const div = document.createElement("div");
    div.className = "sector";

    div.innerHTML = `
    <h3 contenteditable>${nombre}</h3>
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

    <div class="contador">Dispositivos cargados: <span class="conteo">0</span></div>

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
  `;

    contenedor.appendChild(div);
}

function agregarSector() {
    agregarSectorPorNombre("Nuevo sector");
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
    const contador = sector.querySelector(".conteo");

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
        if (contador) contador.textContent = +contador.textContent + 1;
    });

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
            // [disp, cant, modelo, zona, obs]
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
        const contador = last.querySelector(".conteo");

        let count = 0;
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
            count++;
        });

        if (contador) contador.textContent = String(count);
    });

    guardarEstadoLocal();
    refrescarListaRelevamientos();
}

/*******************************
 *   LocalStorage “DB”         *
 *******************************/
const KEY_AUTO = "formularioRelevamiento";
const KEY_PREFIX = "relevamiento_json_";
const BORRADOR_1 = "relevamientoBorrador1";
const BORRADOR_2 = "relevamientoBorrador2";

function guardarEstadoLocal() {
    const data = buildRelevamientoData();
    localStorage.setItem(KEY_AUTO, JSON.stringify(data));
}

function borrarFormulario() {
    localStorage.removeItem(KEY_AUTO);

    ["entidad", "sucursal", "direccion", "fecha", "remito", "relevado"].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
    });

    // reset a sectores base
    const contenedor = document.getElementById("contenedor-sectores");
    contenedor.innerHTML = "";
    sectoresPrecargados.forEach(n => agregarSectorPorNombre(n));

    paso = 0;
    mostrarPaso(paso);

    refrescarListaRelevamientos();
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

function guardarJSONNuevo() {
    const data = buildRelevamientoData();
    const nombre = generarNombreBase();
    const key = KEY_PREFIX + nombre + "_" + Date.now();
    localStorage.setItem(key, JSON.stringify(data));
    alert("✅ JSON guardado en el teléfono");
    refrescarListaRelevamientos();
}

function descargarJSONActual() {
    const data = buildRelevamientoData();
    const nombre = generarNombreBase() + ".json";
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function importarJSONDesdeArchivo(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            // aplico y además lo guardo como un JSON “nuevo”
            applyRelevamientoData(data);
            alert("✅ JSON importado y cargado");
        } catch (e) {
            alert("❌ Ese archivo no es un JSON válido");
        }
    };
    reader.readAsText(file);
}

/*******************************
 * Lista de relevamientos guardados
 *******************************/
function refrescarListaRelevamientos() {
    const ul = document.getElementById("lista-relevamientos");
    if (!ul) return;
    ul.innerHTML = "";

    // 1) Borradores fijos
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

    // 2) JSON guardados “ilimitados”
    const keys = Object.keys(localStorage).filter(k => k.startsWith(KEY_PREFIX)).sort().reverse();
    keys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (!raw) return;

        let data;
        try { data = JSON.parse(raw); } catch { return; }

        const li = document.createElement("li");
        li.style.cursor = "pointer";
        li.textContent = `🧾 JSON: ${data.entidad || ""} - ${data.sucursal || ""} (${(data.fecha || "").slice(0, 10)})`;

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
 *        PDF (lo tuyo)        *
 *******************************/
function generarPDF() {
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
    } catch { }

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

        doc.autoTable({
            startY: y,
            head: [[nombre]],
            theme: "plain",
            styles: { fontSize: 11 },
            margin: { left: 10, right: 10 }
        });

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 2,
            head: [encabezado],
            body: filas,
            theme: "grid",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [197, 0, 0], textColor: 255 },
            margin: { left: 10, right: 10 }
        });

        y = doc.lastAutoTable.finalY + 14;
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : y;
    if (finalY > 160) {
        doc.addPage("landscape");
        finalY = 20;
    }

    doc.setFontSize(12);
    doc.text("Formulario completado por:", 14, finalY + 10);
    doc.setFontSize(14);
    doc.text(`Técnico: ${relevado}`, 14, finalY + 20);
    doc.setFontSize(10);
    doc.text("Firma:", 14, finalY + 40);
    doc.line(30, finalY + 42, 100, finalY + 42);

    doc.save("relevamiento.pdf");
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
    // Paso / navegación
    secciones = document.querySelectorAll(".seccion");
    btnAtras = document.getElementById("atras");
    btnSig = document.getElementById("siguiente");

    btnSig.onclick = () => { if (paso < secciones.length - 1) { paso++; mostrarPaso(paso); } };
    btnAtras.onclick = () => { if (paso > 0) { paso--; mostrarPaso(paso); } };
    mostrarPaso(paso);

    // Sectores iniciales + cargar auto guardado
    const contenedor = document.getElementById("contenedor-sectores");
    const auto = localStorage.getItem(KEY_AUTO);
    if (auto) {
        try {
            const data = JSON.parse(auto);
            const tieneAlgo = (data.sectores || []).some(s => (s.filas || []).length > 0);
            if (tieneAlgo) applyRelevamientoData(data);
            else sectoresPrecargados.forEach(n => agregarSectorPorNombre(n));
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

    // Auto-guardar cuando escribís
    document.addEventListener("input", guardarEstadoLocal);

    // Lista
    refrescarListaRelevamientos();
});