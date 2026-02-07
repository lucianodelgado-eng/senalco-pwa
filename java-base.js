/* =========================
   java-base.js COMPLETO
   Base de Datos - Señalco
   ========================= */

const $ = (id) => document.getElementById(id);

/* =========================
   Listas (como tu base original)
   ========================= */
const eventos = [
    "- Sin tipo definido -", "Alarma", "Robo", "Asalto",
    "clave", "Sabotaje", "Apertura de Equipo", "Puls. Remoto - Falla Red", "ALM + 4 HS", "Asalto Clave Falsa",
    "Falla activador portátil", "Falla cent. Policial. GPRS OK", "Falla Comunicación GPRS",
    "Falla de Conexión al Servidor GPRS", "Falla de PT", "Falla Enlace Red PT",
    "Falla enlace Supervisión de Radio", "Falta de 220V", "Incendio", "Otros",
    "Prevención con Policía", "Prevención de Red", "Prevención Placa Acicomp",
    "Puerta Abierta", "Sirena Disparada",
    // 👇 agrego las típicas que pediste por compatibilidad
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
   Construcción de fila (selects + Otros)
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

function crearFilaBase({ zona = "", evento = "", area = "", dispositivo = "", descripcion = "" }, idx = 999) {
    const tr = document.createElement("tr");

    // ZONA
    const tdZona = document.createElement("td");
    const inpZona = createInput("", zona);
    inpZona.className = "zonaInput";
    tdZona.appendChild(inpZona);

    // EVENTO (select + otro)
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

    // ÁREA (select + otro)
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

    // DISPOSITIVO (select + otro)
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

    // Marcar zonas 1-3
    if (idx <= 2) tr.dataset.zona123 = "1";

    // Guardar cambios
    [inpZona, selectEvento, selectArea, selectDisp, inpDesc].forEach(el => {
        el.addEventListener("input", guardarEstadoTemp);
        el.addEventListener("change", guardarEstadoTemp);
    });

    return tr;
}

/* =========================
   Precargar Zonas (con 1-2-3 fijas + 4..24)
   ========================= */
function precargarZonas() {
    const tbody = document.querySelector("#tabla-base tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    // 1-2-3 fijas
    ZONAS_FIJAS_123.forEach((z, i) => {
        const tr = crearFilaBase({ zona: z.zona, evento: z.evento }, i);
        tbody.appendChild(tr);
    });

    // 4..24 como antes
    for (let i = 4; i <= 24; i++) {
        const tr = crearFilaBase({ zona: `Zona ${i}`, evento: "- Sin tipo definido -", area: "-", dispositivo: "-", descripcion: "" }, i);
        tbody.appendChild(tr);
    }

    aplicarBloqueoZonas123();
    guardarEstadoTemp();
}

function aplicarBloqueoZonas123() {
    const tbody = document.querySelector("#tabla-base tbody");
    const trs = tbody.querySelectorAll("tr");
    trs.forEach((tr, idx) => {
        if (idx <= 2) {
            const inpZona = tr.querySelector("td:nth-child(1) input");
            if (inpZona) {
                inpZona.readOnly = !zonas123Editables;
                inpZona.value = String(idx + 1);
            }
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
   Obtener Data Actual (para JSON/Excel/PDF)
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
   Previsualización (clara + prolija)
   ========================= */
function escapeHtml(s) {
    return String(s ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function abrirModal(id) { const m = $(id); if (m) m.style.display = "flex"; }
function cerrarModal(id) { const m = $(id); if (m) m.style.display = "none"; }

function abrirPrevisualizacion() {
    const data = getCurrentBaseData();
    const body = $("prev-body");
    if (!body) return;

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
          ${data.filas
            .filter((f, idx) => idx <= 2 || (f.zona || f.evento || f.area || f.dispositivo || f.descripcion))
            .map(f => `
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
   PDF PRO (logo + autotable)
   ========================= */
function generarPDFBase() {
    const data = getCurrentBaseData();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Base de Datos - Señalco", 14, 14);

    // Logo como lo tenías (si existe)
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
        headStyles: { fillColor: [197, 0, 0], textColor: 255 } // rojo pro
    });

    const nombre = `base_${(data.meta.entidad || "entidad")}_${(data.meta.sucursal || "sucursal")}.pdf`.replace(/\s+/g, "_");
    doc.save(nombre);
}

/* =========================
   Excel Import / Export
   ========================= */
function normalizarHeaders(s) {
    return String(s || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u");
}

async function importarDesdeExcel(file) {
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    if (!ws) throw new Error("No sheet");

    // Buscar fila header
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
        // fallback A-E
        headerRow = 1;
        map = { zona: 1, evento: 2, area: 3, dispositivo: 4, descripcion: 5 };
    }

    const filas = [];
    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const zona = (row.getCell(map.zona).value ?? "").toString().trim();
        const evento = (row.getCell(map.evento).value ?? "").toString().trim();
        const area = (row.getCell(map.area).value ?? "").toString().trim();
        const dispositivo = (row.getCell(map.dispositivo).value ?? "").toString().trim();
        const descripcion = (row.getCell(map.descripcion).value ?? "").toString().trim();

        if (!zona && !evento && !area && !dispositivo && !descripcion) continue;
        filas.push({ zona, evento, area, dispositivo, descripcion });
    }

    // Forzar zonas 1-2-3 fijas SIEMPRE
    if (filas.length < 3) {
        while (filas.length < 3) filas.unshift({ zona: "", evento: "", area: "", dispositivo: "", descripcion: "" });
    }
    filas[0].zona = "1";
    filas[1].zona = "2";
    filas[2].zona = "3";

    // Cargar en tabla
    const tbody = document.querySelector("#tabla-base tbody");
    tbody.innerHTML = "";
    filas.forEach((f, idx) => tbody.appendChild(crearFilaBase(f, idx)));

    zonas123Editables = false;
    aplicarBloqueoZonas123();
    guardarEstadoTemp();
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
   JSON Save/Import/Share
   ========================= */
function descargarBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
}

function descargarJSONActual() {
    const data = getCurrentBaseData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const nombre = `base_${(data.meta.entidad || "entidad")}_${(data.meta.sucursal || "sucursal")}.json`.replace(/\s+/g, "_");
    descargarBlob(blob, nombre);
}

function importarJSONFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        cargarBaseDesdeJSON(data);
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

    // asegurar 1-2-3
    const trs = tbody.querySelectorAll("tr");
    if (trs[0]) trs[0].querySelector("td:nth-child(1) input").value = "1";
    if (trs[1]) trs[1].querySelector("td:nth-child(1) input").value = "2";
    if (trs[2]) trs[2].querySelector("td:nth-child(1) input").value = "3";

    zonas123Editables = false;
    aplicarBloqueoZonas123();
    guardarEstadoTemp();
}

async function construirArchivoJSON() {
    const data = getCurrentBaseData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const nombre = `base_${(data.meta.entidad || "entidad")}_${(data.meta.sucursal || "sucursal")}.json`.replace(/\s+/g, "_");
    return new File([blob], nombre, { type: "application/json" });
}

async function construirArchivoExcel() {
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
    return new File([buffer], nombre, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
}

/* COMPARTIR: intenta compartir; si falla, descarga */
async function compartirArchivo(file, titulo = "Compartir") {
    try {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: titulo, text: "Archivo generado desde Señalco", files: [file] });
            return;
        }
        // Fallback: descarga
        descargarBlob(file, file.name);
        alert("⚠️ Tu teléfono/navegador no permite compartir directo. Te lo descargué para enviarlo por WhatsApp/Mail.");
    } catch (e) {
        console.warn("Share error:", e);
        descargarBlob(file, file.name);
        alert("⚠️ No se pudo abrir 'Compartir'. Te lo descargué para enviarlo manualmente.");
    }
}

/* =========================
   Guardado temporal (para no perder)
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
   Eventos / Inicialización
   ========================= */
function asignarEventosBase() {
    $("btn-limpiar-base")?.addEventListener("click", () => {
        $("entidad").value = "";
        $("sucursal").value = "";
        $("abonado").value = "";
        $("central").value = "";
        $("provincia").value = "";
        precargarZonas();
    });

    $("btn-subir-excel")?.addEventListener("click", () => $("input-excel-base").click());

    $("input-excel-base")?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            await importarDesdeExcel(file);
            alert("✅ Excel cargado");
        } catch (err) {
            console.error(err);
            alert("❌ No se pudo leer el Excel");
        }
    });

    $("btn-previsualizar")?.addEventListener("click", abrirPrevisualizacion);
    $("btn-cerrar-prev")?.addEventListener("click", () => cerrarModal("modal-prev"));

    $("btn-descargar-pdf-prev")?.addEventListener("click", generarPDFBase);

    $("btn-generar-pdf-base")?.addEventListener("click", generarPDFBase);
    $("btn-excel-base")?.addEventListener("click", exportarExcel);

    $("btn-editar-zonas123")?.addEventListener("click", habilitarEdicionZonas123);
    $("btn-bloquear-zonas123")?.addEventListener("click", bloquearEdicionZonas123);

    // MODAL bases (tus botones)
    $("btn-descargar-json")?.addEventListener("click", descargarJSONActual);

    $("btn-importar-json")?.addEventListener("click", () => $("input-json-base").click());
    $("input-json-base")?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) importarJSONFile(file);
    });

    $("btn-compartir-json")?.addEventListener("click", async () => {
        const f = await construirArchivoJSON();
        await compartirArchivo(f, "Compartir JSON");
    });

    $("btn-compartir-excel")?.addEventListener("click", async () => {
        const f = await construirArchivoExcel();
        await compartirArchivo(f, "Compartir Excel");
    });

    // Auto guardar cambios cabecera
    ["entidad", "sucursal", "abonado", "central", "provincia"].forEach(id => {
        $(id)?.addEventListener("input", guardarEstadoTemp);
    });
}

/* =========================
   Exponer funciones si tu HTML usa onload
   ========================= */
window.asignarEventosBase = asignarEventosBase;
window.precargarZonas = precargarZonas;

/* =========================
   Arranque
   ========================= */
(function init() {
    const ok = cargarEstadoTemp();
    if (!ok) precargarZonas();
})();