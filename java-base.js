/* =========================
   java-base.js (COMPLETO)
   Base de Datos Señalco
   ========================= */

/* ---------- Config ---------- */
const LS_KEY_LIST = "senalco_bases_list"; // array con nombres
const LS_KEY_PREFIX = "senalco_base_";    // senalco_base_<nombre>

let zonas123Editables = false;

/* ---------- Helpers fecha ---------- */
function fechaGeneracionISO() {
    return new Date().toISOString();
}
function fechaGeneracionLegible() {
    return new Date().toLocaleString("es-AR");
}

/* ---------- DOM Helpers ---------- */
function $(id) { return document.getElementById(id); }

function toast(msg) {
    alert(msg);
}

/* ---------- Data Model ---------- */
function leerCabecera() {
    return {
        entidad: ($("entidad")?.value || "").trim(),
        sucursal: ($("sucursal")?.value || "").trim(),
        abonado: ($("abonado")?.value || "").trim(),
        central: ($("central")?.value || "").trim(),
        provincia: ($("provincia")?.value || "").trim(),
    };
}

function setCabecera(h) {
    $("entidad").value = h.entidad || "";
    $("sucursal").value = h.sucursal || "";
    $("abonado").value = h.abonado || "";
    $("central").value = h.central || "";
    $("provincia").value = h.provincia || "";
}

function leerFilasTabla() {
    const tbody = $("tabla-base").querySelector("tbody");
    const filas = [];
    tbody.querySelectorAll("tr").forEach(tr => {
        const tds = tr.querySelectorAll("td");
        if (tds.length < 5) return;
        const zona = (tds[0].querySelector("input")?.value || "").trim();
        const evento = (tds[1].querySelector("input,select,textarea")?.value || "").trim();
        const area = (tds[2].querySelector("input,select,textarea")?.value || "").trim();
        const dispositivo = (tds[3].querySelector("input,select,textarea")?.value || "").trim();
        const descripcion = (tds[4].querySelector("input,select,textarea")?.value || "").trim();

        // si toda la fila está vacía, igual la guardamos si hay zona (para mantener estructura)
        filas.push({ zona, evento, area, dispositivo, descripcion });
    });
    return filas;
}

function setFilasTabla(filas) {
    const tbody = $("tabla-base").querySelector("tbody");
    tbody.innerHTML = "";
    filas.forEach((f, idx) => {
        agregarFilaTabla({
            zona: f.zona ?? "",
            evento: f.evento ?? "",
            area: f.area ?? "",
            dispositivo: f.dispositivo ?? "",
            descripcion: f.descripcion ?? ""
        }, idx);
    });
    aplicarBloqueoZonas123();
}

function obtenerDataActual() {
    const cabecera = leerCabecera();
    const filas = leerFilasTabla();
    const generadoEn = {
        iso: fechaGeneracionISO(),
        legible: fechaGeneracionLegible()
    };
    return { cabecera, filas, generadoEn };
}

/* ---------- Tabla UI ---------- */
function inputCell(value, opts = {}) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "zonaInput";
    input.value = value ?? "";

    if (opts.readonly) input.readOnly = true;
    if (opts.disabled) input.disabled = true;
    if (opts.placeholder) input.placeholder = opts.placeholder;

    input.addEventListener("input", () => {
        // si se edita algo, guardamos estado “live” por si refresca
        guardarEstadoTemp();
    });

    return input;
}

function agregarFilaTabla(row = {}, idx = null) {
    const tbody = $("tabla-base").querySelector("tbody");
    const tr = document.createElement("tr");

    // Col 0: Zona
    const tdZona = document.createElement("td");
    const inpZona = inputCell(row.zona || "", { placeholder: "Zona" });
    inpZona.dataset.col = "zona";
    tdZona.appendChild(inpZona);

    // Col 1: Evento
    const tdEvento = document.createElement("td");
    const inpEvento = inputCell(row.evento || "", { placeholder: "Evento" });
    inpEvento.dataset.col = "evento";
    tdEvento.appendChild(inpEvento);

    // Col 2: Área
    const tdArea = document.createElement("td");
    const inpArea = inputCell(row.area || "", { placeholder: "Área" });
    inpArea.dataset.col = "area";
    tdArea.appendChild(inpArea);

    // Col 3: Dispositivo
    const tdDisp = document.createElement("td");
    const inpDisp = inputCell(row.dispositivo || "", { placeholder: "Dispositivo" });
    inpDisp.dataset.col = "dispositivo";
    tdDisp.appendChild(inpDisp);

    // Col 4: Descripción
    const tdDesc = document.createElement("td");
    const inpDesc = inputCell(row.descripcion || "", { placeholder: "Descripción" });
    inpDesc.dataset.col = "descripcion";
    tdDesc.appendChild(inpDesc);

    tr.appendChild(tdZona);
    tr.appendChild(tdEvento);
    tr.appendChild(tdArea);
    tr.appendChild(tdDisp);
    tr.appendChild(tdDesc);

    tbody.appendChild(tr);

    // marcar filas 1-3
    const rowIndex = (idx !== null) ? idx : (tbody.querySelectorAll("tr").length - 1);
    if (rowIndex <= 2) tr.dataset.zona123 = "1";

    return tr;
}

/* ---------- Zonas 1-2-3 default (fijas) ---------- */
function precargarZonas() {
    const tbody = $("tabla-base").querySelector("tbody");
    if (tbody.querySelectorAll("tr").length > 0) {
        aplicarBloqueoZonas123();
        return;
    }

    // Default: filas base con zonas 1,2,3 fijas + algunas filas vacías para continuar
    const base = [
        { zona: "1", evento: "Avería de Línea", area: "", dispositivo: "", descripcion: "" },
        { zona: "2", evento: "Apertura de Equipo", area: "", dispositivo: "", descripcion: "" },
        { zona: "3", evento: "Falta de 220V", area: "", dispositivo: "", descripcion: "" },
    ];

    base.forEach((r, i) => agregarFilaTabla(r, i));

    // filas adicionales vacías (para que no quede “corto”)
    for (let i = 0; i < 25; i++) {
        agregarFilaTabla({ zona: "", evento: "", area: "", dispositivo: "", descripcion: "" });
    }

    aplicarBloqueoZonas123();
    guardarEstadoTemp();
}

function aplicarBloqueoZonas123() {
    const tbody = $("tabla-base").querySelector("tbody");
    const trs = tbody.querySelectorAll("tr");

    trs.forEach((tr, idx) => {
        const isZona123 = idx <= 2 || tr.dataset.zona123 === "1";
        const zonaInput = tr.querySelector('input[data-col="zona"]');
        if (!zonaInput) return;

        if (isZona123) {
            zonaInput.readOnly = !zonas123Editables; // por default bloqueado
            zonaInput.style.opacity = zonas123Editables ? "1" : "0.85";
        }
    });

    // Botones toggle
    if ($("btn-editar-zonas123") && $("btn-bloquear-zonas123")) {
        $("btn-editar-zonas123").style.display = zonas123Editables ? "none" : "inline-block";
        $("btn-bloquear-zonas123").style.display = zonas123Editables ? "inline-block" : "none";
    }
}

function habilitarEdicionZonas123() {
    zonas123Editables = true;
    aplicarBloqueoZonas123();
    toast("🔓 Zonas 1-3 habilitadas para editar");
}

function bloquearEdicionZonas123() {
    zonas123Editables = false;
    // Reforzar valores por si los borraron:
    const tbody = $("tabla-base").querySelector("tbody");
    const trs = tbody.querySelectorAll("tr");
    if (trs[0]) trs[0].querySelector('input[data-col="zona"]').value = "1";
    if (trs[1]) trs[1].querySelector('input[data-col="zona"]').value = "2";
    if (trs[2]) trs[2].querySelector('input[data-col="zona"]').value = "3";
    aplicarBloqueoZonas123();
    guardarEstadoTemp();
    toast("🔒 Zonas 1-3 bloqueadas");
}

/* ---------- Estado temporal (para no perder) ---------- */
function guardarEstadoTemp() {
    const tmp = obtenerDataActual();
    localStorage.setItem("senalco_base_tmp", JSON.stringify(tmp));
}

function cargarEstadoTemp() {
    const raw = localStorage.getItem("senalco_base_tmp");
    if (!raw) return false;
    try {
        const data = JSON.parse(raw);
        if (!data || !data.cabecera || !Array.isArray(data.filas)) return false;
        setCabecera(data.cabecera);
        setFilasTabla(data.filas);
        return true;
    } catch {
        return false;
    }
}

/* ---------- Botones / Eventos ---------- */
function asignarEventosBase() {
    // Limpiar
    $("btn-limpiar-base")?.addEventListener("click", () => {
        if (!confirm("¿Limpiar todo?")) return;
        $("entidad").value = "";
        $("sucursal").value = "";
        $("abonado").value = "";
        $("central").value = "";
        $("provincia").value = "";

        $("tabla-base").querySelector("tbody").innerHTML = "";
        zonas123Editables = false;
        precargarZonas();
        guardarEstadoTemp();
    });

    // Subir Excel
    $("btn-subir-excel")?.addEventListener("click", () => {
        $("input-excel-base").click();
    });

    $("input-excel-base")?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            await importarDesdeExcel(file);
            toast("✅ Excel cargado");
        } catch (err) {
            console.error(err);
            toast("❌ No se pudo leer el Excel. Probá con otro archivo.");
        }
    });

    // Previsualizar
    $("btn-previsualizar")?.addEventListener("click", () => {
        abrirPrevisualizacion();
    });

    $("btn-cerrar-prev")?.addEventListener("click", () => cerrarModal("modal-prev"));

    $("btn-descargar-pdf-prev")?.addEventListener("click", () => {
        generarPDFBase();
    });

    // Generar PDF (opcional)
    $("btn-generar-pdf-base")?.addEventListener("click", () => generarPDFBase());

    // Exportar Excel
    $("btn-excel-base")?.addEventListener("click", () => exportarExcel());

    // Guardar Base (Local) -> abre modal “Mis bases”
    $("btn-guardar-local")?.addEventListener("click", () => {
        abrirModal("modal-bases");
        renderListaBasesJSON();
    });

    // Mis bases
    $("btn-mis-bases")?.addEventListener("click", () => {
        abrirModal("modal-bases");
        renderListaBasesJSON();
    });

    $("btn-cerrar-bases")?.addEventListener("click", () => cerrarModal("modal-bases"));

    // Guardar como (nombre)
    $("btn-guardar-como")?.addEventListener("click", () => {
        const nombre = ($("nombre-base").value || "").trim();
        if (!nombre) return toast("Poné un nombre para guardar (ej: Galicia_Suc123)");
        guardarBaseJSONConNombre(nombre);
        renderListaBasesJSON();
        toast("💾 Base guardada en el teléfono");
    });

    // Descargar JSON (base actual)
    $("btn-descargar-json")?.addEventListener("click", () => {
        descargarJSONActual();
    });

    // Importar JSON (carga en la tabla y además puede guardarse)
    $("btn-importar-json")?.addEventListener("click", () => {
        $("input-json-base").click();
    });

    $("input-json-base")?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data || !data.cabecera || !Array.isArray(data.filas)) {
                return toast("❌ JSON inválido");
            }
            setCabecera(data.cabecera);
            setFilasTabla(normalizarFilas(data.filas));
            zonas123Editables = false;
            aplicarBloqueoZonas123();
            guardarEstadoTemp();

            // opcional: guardar automáticamente en “Descargas” (lista)
            const autoName = `Importado_${new Date().toISOString().slice(0, 10)}_${Date.now()}`;
            guardarBaseJSONConNombre(autoName);
            renderListaBasesJSON();

            toast("✅ JSON importado y guardado");
        } catch (err) {
            console.error(err);
            toast("❌ No se pudo importar el JSON");
        }
    });

    // Compartir JSON / Excel
    $("btn-compartir-json")?.addEventListener("click", async () => {
        try {
            const file = await construirArchivoJSON();
            await compartirArchivo(file, "Compartir JSON");
        } catch (e) {
            console.error(e);
            toast("❌ No se pudo compartir JSON en este dispositivo/navegador");
        }
    });

    $("btn-compartir-excel")?.addEventListener("click", async () => {
        try {
            const file = await construirArchivoExcel();
            await compartirArchivo(file, "Compartir Excel");
        } catch (e) {
            console.error(e);
            toast("❌ No se pudo compartir Excel en este dispositivo/navegador");
        }
    });

    // Editar/Bloquear zonas 1-3
    $("btn-editar-zonas123")?.addEventListener("click", habilitarEdicionZonas123);
    $("btn-bloquear-zonas123")?.addEventListener("click", bloquearEdicionZonas123);

    // Auto-guardar temp en inputs cabecera
    ["entidad", "sucursal", "abonado", "central", "provincia"].forEach(id => {
        $(id)?.addEventListener("input", guardarEstadoTemp);
    });

    // Click fuera para cerrar modales
    ["modal-prev", "modal-bases"].forEach(mid => {
        const m = $(mid);
        if (!m) return;
        m.addEventListener("click", (ev) => {
            if (ev.target === m) cerrarModal(mid);
        });
    });
}

/* ---------- Normalización filas (anti “desfasaje”) ---------- */
function normalizarFilas(filas) {
    // Asegura exactamente 5 columnas y que zonas 1-3 existan
    const out = filas.map(f => ({
        zona: (f.zona ?? "").toString(),
        evento: (f.evento ?? "").toString(),
        area: (f.area ?? "").toString(),
        dispositivo: (f.dispositivo ?? "").toString(),
        descripcion: (f.descripcion ?? "").toString(),
    }));

    // Garantizar que primeras 3 filas sean zona 1,2,3
    if (out.length >= 3) {
        out[0].zona = "1";
        out[1].zona = "2";
        out[2].zona = "3";
    } else {
        // si vino corto, lo completamos
        const base = [
            { zona: "1", evento: "Avería de Línea", area: "", dispositivo: "", descripcion: "" },
            { zona: "2", evento: "Apertura de Equipo", area: "", dispositivo: "", descripcion: "" },
            { zona: "3", evento: "Falta de 220V", area: "", dispositivo: "", descripcion: "" },
        ];
        while (out.length < 3) out.push(base[out.length]);
    }

    return out;
}

/* ---------- Excel Import/Export (ExcelJS) ---------- */
async function importarDesdeExcel(file) {
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);

    const ws = wb.worksheets[0];
    if (!ws) throw new Error("No worksheet");

    // Buscar fila de headers que contenga "zona"
    let headerRowNumber = null;
    let headerMap = null;

    ws.eachRow((row, rowNumber) => {
        if (headerRowNumber) return;
        const vals = row.values.map(v => (v ?? "").toString().trim());
        const joined = vals.join(" ").toLowerCase();
        if (joined.includes("zona") && (joined.includes("evento") || joined.includes("área") || joined.includes("area"))) {
            headerRowNumber = rowNumber;
            headerMap = construirMapaHeaders(vals);
        }
    });

    // Si no encuentra header, asumimos columnas fijas A-E
    if (!headerRowNumber) {
        headerRowNumber = 1;
        headerMap = { zona: 1, evento: 2, area: 3, dispositivo: 4, descripcion: 5 };
    }

    // Leer cabecera si existe en celdas superiores (opcional). Si tu Excel trae eso, acá lo podés mapear.
    // Para compatibilidad, NO tocamos cabecera automática.

    // Leer filas desde headerRowNumber+1
    const filas = [];
    for (let r = headerRowNumber + 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const z = (row.getCell(headerMap.zona).value ?? "").toString().trim();
        const ev = (row.getCell(headerMap.evento).value ?? "").toString().trim();
        const ar = (row.getCell(headerMap.area).value ?? "").toString().trim();
        const di = (row.getCell(headerMap.dispositivo).value ?? "").toString().trim();
        const de = (row.getCell(headerMap.descripcion).value ?? "").toString().trim();

        // Si toda la fila vacía, la salteamos al final (pero ojo con estructura)
        if (!z && !ev && !ar && !di && !de) continue;

        filas.push({ zona: z, evento: ev, area: ar, dispositivo: di, descripcion: de });
    }

    // Si el Excel viene con “zonas 1,2,3” en filas sueltas, igual las fijamos
    const filasNorm = normalizarFilas(filas);

    // Si vino muy corto, agregamos filas vacías para que quede cómodo
    while (filasNorm.length < 28) filasNorm.push({ zona: "", evento: "", area: "", dispositivo: "", descripcion: "" });

    setFilasTabla(filasNorm);
    zonas123Editables = false;
    aplicarBloqueoZonas123();
    guardarEstadoTemp();
}

function construirMapaHeaders(vals) {
    // vals es array de texto (index = columna)
    const map = {};
    vals.forEach((t, idx) => {
        const v = (t || "").toString().trim().toLowerCase();
        if (!v) return;

        if (v.includes("zona")) map.zona = idx;
        else if (v.includes("evento")) map.evento = idx;
        else if (v.includes("área") || v === "area" || v.includes("area")) map.area = idx;
        else if (v.includes("dispositivo")) map.dispositivo = idx;
        else if (v.includes("descrip")) map.descripcion = idx;
    });

    // fallback si falta alguno
    return {
        zona: map.zona || 1,
        evento: map.evento || 2,
        area: map.area || 3,
        dispositivo: map.dispositivo || 4,
        descripcion: map.descripcion || 5
    };
}

async function construirArchivoExcel() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Base");

    const data = obtenerDataActual();

    // Cabecera
    ws.addRow(["Entidad", data.cabecera.entidad]);
    ws.addRow(["Sucursal", data.cabecera.sucursal]);
    ws.addRow(["Abonado", data.cabecera.abonado]);
    ws.addRow(["Central", data.cabecera.central]);
    ws.addRow(["Provincia", data.cabecera.provincia]);
    ws.addRow(["Generado", data.generadoEn.legible]);
    ws.addRow([]); // blanco

    // Headers tabla
    ws.addRow(["Zona", "Evento", "Área", "Dispositivo", "Descripción"]);

    data.filas.forEach(f => {
        ws.addRow([f.zona, f.evento, f.area, f.dispositivo, f.descripcion]);
    });

    const buf = await wb.xlsx.writeBuffer();
    const filename = `base_${Date.now()}.xlsx`;
    return new File([buf], filename, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
}

async function exportarExcel() {
    try {
        const file = await construirArchivoExcel();
        descargarBlob(file, file.name);
    } catch (e) {
        console.error(e);
        toast("❌ No se pudo exportar Excel");
    }
}

/* ---------- PDF (jsPDF) ---------- */
function generarPDFBase() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait" });

        const data = obtenerDataActual();

        doc.setFontSize(14);
        doc.text("Base de Datos - Señalco", 14, 14);

        doc.setFontSize(10);
        doc.text(`Entidad: ${data.cabecera.entidad}`, 14, 24);
        doc.text(`Sucursal: ${data.cabecera.sucursal}`, 14, 30);
        doc.text(`Abonado: ${data.cabecera.abonado}`, 14, 36);
        doc.text(`Central: ${data.cabecera.central}`, 14, 42);
        doc.text(`Provincia: ${data.cabecera.provincia}`, 14, 48);
        doc.text(`Generado: ${data.generadoEn.legible}`, 14, 54);

        const body = data.filas
            .filter(f => (f.zona || f.evento || f.area || f.dispositivo || f.descripcion))
            .map(f => [f.zona, f.evento, f.area, f.dispositivo, f.descripcion]);

        doc.autoTable({
            startY: 62,
            head: [["Zona", "Evento", "Área", "Dispositivo", "Descripción"]],
            body: body.length ? body : [["", "", "", "", ""]],
            theme: "grid",
            styles: { fontSize: 9 },
            headStyles: { fillColor: [25, 118, 210], textColor: 255 }
        });

        doc.save(`base_${Date.now()}.pdf`);
    } catch (e) {
        console.error(e);
        toast("❌ No se pudo generar PDF");
    }
}

/* ---------- Previsualización clara ---------- */
function abrirPrevisualizacion() {
    const data = obtenerDataActual();

    const body = $("prev-body");
    body.innerHTML = "";

    const card = document.createElement("div");
    card.className = "card";
    card.style.background = "#fff";
    card.style.color = "#000";

    card.innerHTML = `
    <div style="font-weight:bold; margin-bottom:6px;">Datos</div>
    <div>Entidad: <b>${esc(data.cabecera.entidad) || "-"}</b></div>
    <div>Sucursal: <b>${esc(data.cabecera.sucursal) || "-"}</b></div>
    <div>Abonado: <b>${esc(data.cabecera.abonado) || "-"}</b></div>
    <div>Central: <b>${esc(data.cabecera.central) || "-"}</b></div>
    <div>Provincia: <b>${esc(data.cabecera.provincia) || "-"}</b></div>
    <div>Generado: <b>${esc(data.generadoEn.legible)}</b></div>
    <div style="margin-top:8px;">Filas: <b>${data.filas.length}</b></div>
  `;
    body.appendChild(card);

    const tabla = document.createElement("table");
    tabla.style.width = "100%";
    tabla.style.borderCollapse = "collapse";
    tabla.style.background = "#fff";
    tabla.style.color = "#000";

    tabla.innerHTML = `
    <thead>
      <tr>
        <th style="border:1px solid #ddd; padding:6px; background:#f2f2f2;">Zona</th>
        <th style="border:1px solid #ddd; padding:6px; background:#f2f2f2;">Evento</th>
        <th style="border:1px solid #ddd; padding:6px; background:#f2f2f2;">Área</th>
        <th style="border:1px solid #ddd; padding:6px; background:#f2f2f2;">Dispositivo</th>
        <th style="border:1px solid #ddd; padding:6px; background:#f2f2f2;">Descripción</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

    const tb = tabla.querySelector("tbody");

    data.filas.forEach((f, idx) => {
        // Solo mostrar filas “con algo” o al menos zonas 1-3 para que se vea el formato
        const mustShow = idx <= 2 || (f.zona || f.evento || f.area || f.dispositivo || f.descripcion);
        if (!mustShow) return;

        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td style="border:1px solid #ddd; padding:6px;">${esc(f.zona)}</td>
      <td style="border:1px solid #ddd; padding:6px;">${esc(f.evento)}</td>
      <td style="border:1px solid #ddd; padding:6px;">${esc(f.area)}</td>
      <td style="border:1px solid #ddd; padding:6px;">${esc(f.dispositivo)}</td>
      <td style="border:1px solid #ddd; padding:6px;">${esc(f.descripcion)}</td>
    `;
        tb.appendChild(tr);
    });

    body.appendChild(tabla);

    abrirModal("modal-prev");
}

function esc(s) {
    return (s ?? "").toString()
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* ---------- Modal helpers ---------- */
function abrirModal(id) {
    const m = $(id);
    if (!m) return;
    m.style.display = "flex";
}
function cerrarModal(id) {
    const m = $(id);
    if (!m) return;
    m.style.display = "none";
}

/* ---------- JSON Guardado local (Mis bases) ---------- */
function obtenerListaBases() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY_LIST)) || [];
    } catch {
        return [];
    }
}
function setListaBases(list) {
    localStorage.setItem(LS_KEY_LIST, JSON.stringify(list));
}

function guardarBaseJSONConNombre(nombre) {
    const safe = nombre.replace(/[^\w\-\.áéíóúÁÉÍÓÚñÑ ]/g, "_").trim();
    const data = obtenerDataActual();

    // Si ya existe, sobreescribe (intencional)
    localStorage.setItem(LS_KEY_PREFIX + safe, JSON.stringify(data));

    const list = obtenerListaBases();
    if (!list.includes(safe)) {
        list.unshift(safe);
        setListaBases(list);
    }
}

function borrarBaseGuardada(nombre) {
    localStorage.removeItem(LS_KEY_PREFIX + nombre);
    const list = obtenerListaBases().filter(n => n !== nombre);
    setListaBases(list);
}

function cargarBaseGuardada(nombre) {
    const raw = localStorage.getItem(LS_KEY_PREFIX + nombre);
    if (!raw) return toast("❌ No existe esa base");
    try {
        const data = JSON.parse(raw);
        setCabecera(data.cabecera || {});
        setFilasTabla(normalizarFilas(data.filas || []));
        zonas123Editables = false;
        aplicarBloqueoZonas123();
        guardarEstadoTemp();
    } catch (e) {
        console.error(e);
        toast("❌ Base dañada");
    }
}

function renderListaBasesJSON() {
    const cont = $("lista-bases-json");
    if (!cont) return;
    const list = obtenerListaBases();

    if (!list.length) {
        cont.innerHTML = `<div style="opacity:.8;">No hay bases guardadas todavía.</div>`;
        return;
    }

    cont.innerHTML = "";
    list.forEach(nombre => {
        const div = document.createElement("div");
        div.className = "card";
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.style.gap = "10px";

        const left = document.createElement("div");
        left.innerHTML = `<b>${esc(nombre)}</b><div style="opacity:.7; font-size:12px;">Guardada en el teléfono</div>`;

        const right = document.createElement("div");
        right.style.display = "flex";
        right.style.gap = "8px";
        right.style.flexWrap = "wrap";

        const btnAbrir = document.createElement("button");
        btnAbrir.className = "mini-btn";
        btnAbrir.textContent = "Abrir";
        btnAbrir.onclick = () => {
            cargarBaseGuardada(nombre);
            cerrarModal("modal-bases");
            toast("✅ Base cargada");
        };

        const btnDel = document.createElement("button");
        btnDel.className = "mini-btn";
        btnDel.textContent = "Borrar";
        btnDel.onclick = () => {
            if (!confirm(`¿Borrar "${nombre}"?`)) return;
            borrarBaseGuardada(nombre);
            renderListaBasesJSON();
        };

        const btnDown = document.createElement("button");
        btnDown.className = "mini-btn";
        btnDown.textContent = "JSON";
        btnDown.onclick = () => descargarJSONDeNombre(nombre);

        right.appendChild(btnAbrir);
        right.appendChild(btnDown);
        right.appendChild(btnDel);

        div.appendChild(left);
        div.appendChild(right);
        cont.appendChild(div);
    });
}

/* ---------- Descarga/Share ---------- */
function descargarBlob(fileOrBlob, filename) {
    const blob = fileOrBlob instanceof Blob ? fileOrBlob : new Blob([fileOrBlob]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "archivo";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function construirArchivoJSON() {
    const data = obtenerDataActual();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const filename = `base_${Date.now()}.json`;
    return new File([blob], filename, { type: "application/json" });
}

function descargarJSONActual() {
    try {
        const data = obtenerDataActual();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        descargarBlob(blob, `base_${Date.now()}.json`);
    } catch (e) {
        console.error(e);
        toast("❌ No se pudo descargar JSON");
    }
}

function descargarJSONDeNombre(nombre) {
    const raw = localStorage.getItem(LS_KEY_PREFIX + nombre);
    if (!raw) return toast("❌ No existe esa base");
    const blob = new Blob([raw], { type: "application/json" });
    descargarBlob(blob, `${nombre}.json`);
}

async function compartirArchivo(file, title) {
    // Web Share API con archivos (Android Chrome suele andar perfecto)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            title: title || "Compartir",
            text: "Archivo generado desde Señalco",
            files: [file]
        });
        return;
    }

    // fallback: descargar
    descargarBlob(file, file.name);
    toast("⚠️ Tu navegador no soporta compartir directo. Te lo descargué para enviarlo manualmente.");
}

/* ---------- Arranque: cargar bases clásicas (borradores) ---------- */
function guardarBorradorBase(clave) {
    // Mantengo tu esquema “clásico” por compatibilidad
    const data = obtenerDataActual();
    localStorage.setItem(clave, JSON.stringify(data));
    obtenerBasesGuardadas();
    toast("💾 Borrador guardado");
}

function obtenerBasesGuardadas() {
    const ul = $("lista-bases");
    if (!ul) return;
    ul.innerHTML = "";

    ["borrador1", "borrador2"].forEach((k, i) => {
        const raw = localStorage.getItem(k);
        if (!raw) return;

        let nombre = `Borrador ${i + 1}`;
        try {
            const d = JSON.parse(raw);
            const e = d?.cabecera?.entidad || "-";
            const s = d?.cabecera?.sucursal || "-";
            nombre = `Borrador ${i + 1}: ${e} - ${s}`;
        } catch { }

        const li = document.createElement("li");
        li.style.margin = "8px 0";
        li.style.cursor = "pointer";
        li.textContent = "📁 " + nombre;

        li.onclick = () => {
            try {
                const d = JSON.parse(raw);
                setCabecera(d.cabecera || {});
                setFilasTabla(normalizarFilas(d.filas || []));
                zonas123Editables = false;
                aplicarBloqueoZonas123();
                guardarEstadoTemp();
                toast("✅ Borrador cargado");
            } catch (e) {
                console.error(e);
                toast("❌ Borrador dañado");
            }
        };

        ul.appendChild(li);
    });
}

/* ---------- Init ---------- */
(function initBase() {
    // Si hay estado temporal, lo levanta. Si no, precarga zonas.
    const cargoTemp = cargarEstadoTemp();
    if (!cargoTemp) precargarZonas();
    obtenerBasesGuardadas();
})();

/* Exponer funciones usadas desde HTML (si las llamás en onclick) */
window.asignarEventosBase = asignarEventosBase;
window.precargarZonas = precargarZonas;
window.obtenerBasesGuardadas = obtenerBasesGuardadas;
window.guardarBorradorBase = guardarBorradorBase;