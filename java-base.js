/***********************
 *   Señalco - Base    *
 * java-base.js FULL   *
 ***********************/

/** =========================
 *  Listas (tu base original)
 *  ========================= */
const eventos = [
    "- Sin tipo definido -", "Alarma", "Robo", "Asalto",
    "clave", "Sabotaje", "Apertura de Equipo", "Puls. Remoto - Falla Red", "ALM + 4 HS", "Asalto Clave Falsa",
    "Falla activador portátil", "Falla cent. Policial. GPRS OK", "Falla Comunicación GPRS",
    "Falla de Conexión al Servidor GPRS", "Falla de PT", "Falla Enlace Red PT",
    "Falla enlace Supervisión de Radio", "Falta de 220V", "Incendio", "Otros",
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
let zonas123Editables = false; // por defecto BLOQUEADAS

/** ==========================================
 *  Utilidades
 *  ========================================== */
function $(id) { return document.getElementById(id); }

function pad2(n) { return String(n).padStart(2, "0"); }

function fechaGeneradoLocal() {
    const d = new Date();
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function safeName(s) {
    return (s || "base").toString().trim().replace(/\s+/g, "_").replace(/[^\w\-]/g, "_");
}

function getZonaNumberFromText(z) {
    const m = String(z || "").match(/(\d{1,2})/);
    return m ? parseInt(m[1], 10) : null;
}

/** ==========================================
 *  DOM Bindings (tu patrón)
 *  ========================================== */
function asignarEventosBase() {
    $("btn-limpiar-base")?.addEventListener("click", limpiarBase);
    $("btn-generar-pdf-base")?.addEventListener("click", generarPDF);
    $("btn-excel-base")?.addEventListener("click", generarExcel);

    // Cargar Excel
    $("btn-subir-excel")?.addEventListener("click", () => $("input-excel-base")?.click());
    $("input-excel-base")?.addEventListener("change", async (e) => {
        const f = e.target.files?.[0];
        if (f) await importarExcelBase(f);
        e.target.value = "";
    });

    // Previsualizar
    $("btn-previsualizar")?.addEventListener("click", abrirPrevisualizacion);
    $("btn-cerrar-prev")?.addEventListener("click", cerrarPrevisualizacion);
    $("btn-descargar-pdf-prev")?.addEventListener("click", generarPDF);

    // JSON
    $("btn-descargar-json")?.addEventListener("click", descargarJSONBase);
    $("btn-importar-json")?.addEventListener("click", () => $("input-json-base")?.click());
    $("input-json-base")?.addEventListener("change", (e) => {
        const f = e.target.files?.[0];
        if (f) importarJSONBase(f);
        e.target.value = "";
    });

    // Mis bases (modal)
    $("btn-mis-bases")?.addEventListener("click", abrirModalBases);
    $("btn-cerrar-bases")?.addEventListener("click", cerrarModalBases);
    $("btn-guardar-como")?.addEventListener("click", guardarBaseComo);

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

    // Cerrar modales tocando fuera
    $("modal-prev")?.addEventListener("click", (e) => {
        if (e.target.id === "modal-prev") cerrarPrevisualizacion();
    });

    $("modal-bases")?.addEventListener("click", (e) => {
        if (e.target.id === "modal-bases") cerrarModalBases();
    });

    // Autosave liviano
    ["entidad", "sucursal", "abonado", "central", "provincia"].forEach(id => {
        $(id)?.addEventListener("input", autosaveBase);
    });
}

/** ==========================================
 *  Construcción de tabla - ZONAS 1..24
 *  Zonas 1..3 fijas por default y bloqueadas
 *  ========================================== */
function precargarZonas() {
    const tbody = document.querySelector("#tabla-base tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    // ✅ Siempre 1..24, no se pierde nunca
    for (let i = 1; i <= 24; i++) {
        tbody.appendChild(crearFilaZona(i));
    }

    // ✅ Defaults de zonas 1..3 (si están vacías)
    aplicarDefaultsZonas123SiVacias();

    // ✅ Bloqueo según flag
    aplicarBloqueoZonas123();

    autosaveBase();
}

function crearFilaZona(numeroZona) {
    const fila = document.createElement("tr");
    fila.dataset.zona = String(numeroZona);

    // ZONA (solo etiqueta)
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

    // Append
    fila.appendChild(celdaZona);
    fila.appendChild(celdaEvento);
    fila.appendChild(celdaArea);
    fila.appendChild(celdaDispositivo);
    fila.appendChild(celdaDescripcion);

    return fila;
}

function aplicarDefaultsZonas123SiVacias() {
    // Esto evita que al importar/limpiar queden vacías sin intención.
    // Solo setea si están todas en blanco.
    const filas = document.querySelectorAll("#tabla-base tbody tr");
    [1, 2, 3].forEach(z => {
        const tr = Array.from(filas).find(r => r.dataset.zona === String(z));
        if (!tr) return;

        const selEvento = tr.querySelector("td:nth-child(2) select");
        const selArea = tr.querySelector("td:nth-child(3) select");
        const selDisp = tr.querySelector("td:nth-child(4) select");
        const desc = tr.querySelector("td:nth-child(5) input");

        const vacia =
            (selEvento?.value === "- Sin tipo definido -" || !selEvento?.value) &&
            (selArea?.value === "-" || !selArea?.value) &&
            (selDisp?.value === "-" || !selDisp?.value) &&
            !(desc?.value || "").trim();

        if (vacia) {
            if (z === 1) {
                selEvento.value = "Puerta Abierta";  // ajustable
                selArea.value = "-";
                selDisp.value = "-";
                desc.value = "";
            }
            if (z === 2) {
                selEvento.value = "Apertura de Equipo";
                selArea.value = "-";
                selDisp.value = "-";
                desc.value = "";
            }
            if (z === 3) {
                selEvento.value = "Falta de 220V";
                selArea.value = "-";
                selDisp.value = "-";
                desc.value = "";
            }
        }
    });
}

function aplicarBloqueoZonas123() {
    const filas = document.querySelectorAll("#tabla-base tbody tr");
    filas.forEach(tr => {
        const zona = parseInt(tr.dataset.zona, 10);
        if (![1, 2, 3].includes(zona)) return;

        // Bloquea select/input dentro de columnas 2..5 (no la etiqueta zona)
        tr.querySelectorAll("td:nth-child(n+2) select, td:nth-child(n+2) input").forEach(el => {
            el.disabled = !zonas123Editables;
            // si está disabled que se note
            if (!zonas123Editables) {
                el.style.opacity = "0.85";
            } else {
                el.style.opacity = "1";
            }
        });
    });

    // Alterna botones
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
    precargarZonas();
    autosaveBase();
}

/** ==========================================
 *  PDF (mantengo tu estilo original lo más)
 *  + agrega fecha generado
 *  ========================================== */
function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Base de Datos - Señalco", 14, 14);

    // Logo (si existe)
    try {
        const logoImg = document.getElementById('logo-pdf');
        if (logoImg && logoImg.complete) {
            const canvas = document.createElement('canvas');
            canvas.width = logoImg.naturalWidth;
            canvas.height = logoImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(logoImg, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg');
            doc.addImage(dataURL, 'JPEG', 160, 10, 40, 20);
        }
    } catch (e) {
        console.warn("⚠️ No se pudo cargar el logo en el PDF:", e);
    }

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

    const nombreArchivo = `base_${entidad}_${sucursal}_${safeName(generado)}.pdf`.replace(/\s+/g, "_");
    doc.save(nombreArchivo);
}

/** ==========================================
 *  Excel EXPORT (tu función, mejorada)
 *  + fecha generado
 *  ========================================== */
function generarExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Base");

    // Encabezado
    sheet.addRow(["Entidad", $("entidad").value || ""]);
    sheet.addRow(["Sucursal", $("sucursal").value || ""]);
    sheet.addRow(["Abonado", $("abonado").value || ""]);
    sheet.addRow(["Central", $("central").value || ""]);
    sheet.addRow(["Provincia", $("provincia").value || ""]);
    sheet.addRow(["Generado", fechaGeneradoLocal()]);
    sheet.addRow([]);

    // Tabla
    // Importante: respeta el orden Zona/Evento/Área/Dispositivo/Descripción
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

    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const entidad = $("entidad").value || "base";
        const suc = $("sucursal").value || "";
        a.href = url;
        a.download = `base_${safeName(entidad)}_${safeName(suc)}_${safeName(fechaGeneradoLocal())}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

/** ==========================================
 *  JSON - Descargar / Importar
 *  ========================================== */
function construirJSONBase() {
    const datos = {
        meta: {
            generado: fechaGeneradoLocal()
        },
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

function descargarJSONBase() {
    const data = construirJSONBase();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const entidad = $("entidad").value || "base";
    const suc = $("sucursal").value || "";
    a.href = url;
    a.download = `base_${safeName(entidad)}_${safeName(suc)}_${safeName(fechaGeneradoLocal())}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarJSONBase(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);

            $("entidad").value = data.entidad || "";
            $("sucursal").value = data.sucursal || "";
            $("abonado").value = data.abonado || "";
            $("central").value = data.central || "";
            $("provincia").value = data.provincia || "";

            // Asegurar tabla completa
            precargarZonas();

            // Volcar zonas (pero si zonas123Editables = false, quedan bloqueadas igual)
            const filas = document.querySelectorAll("#tabla-base tbody tr");
            (data.zonas || []).forEach((zObj) => {
                const n = getZonaNumberFromText(zObj.zona);
                if (!n || n < 1 || n > 24) return;

                const tr = Array.from(filas).find(r => parseInt(r.dataset.zona, 10) === n);
                if (!tr) return;

                // ✅ Permitimos cargar JSON en 1-3 (porque viene de tu sistema),
                // pero seguirán bloqueadas visualmente si no habilitaste edición.
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

            aplicarBloqueoZonas123();
            autosaveBase();
            alert("✅ JSON importado");
        } catch (e) {
            alert("❌ JSON inválido");
        }
    };
    reader.readAsText(file);
}

/** ==========================================
 *  Importar Excel (CLAVE)
 *  - NO pisa zonas 1-3
 *  - Lee columnas: Zona | Evento | Área | Dispositivo | Descripción
 *  ========================================== */
async function importarExcelBase(file) {
    try {
        const buf = await file.arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buf);

        const ws = wb.worksheets[0];
        if (!ws) return alert("❌ El Excel no tiene hojas.");

        // Asegurar tabla completa
        precargarZonas();

        // Buscar encabezado "Zona"
        let headerRow = null;
        ws.eachRow((row, rowNumber) => {
            const vals = (row.values || []).map(v => String(v || "").trim().toLowerCase());
            if (vals.includes("zona") && vals.includes("evento")) headerRow = rowNumber;
        });

        const start = headerRow ? headerRow + 1 : 1;

        for (let r = start; r <= ws.rowCount; r++) {
            const row = ws.getRow(r);
            const A = String(row.getCell(1).value ?? "").trim(); // Zona
            const B = String(row.getCell(2).value ?? "").trim(); // Evento
            const C = String(row.getCell(3).value ?? "").trim(); // Área
            const D = String(row.getCell(4).value ?? "").trim(); // Dispositivo
            const E = String(row.getCell(5).value ?? "").trim(); // Desc

            if (!A && !B && !C && !D && !E) continue;

            const n = getZonaNumberFromText(A);
            if (!n || n < 1 || n > 24) continue;

            // ✅ IGNORAR zonas 1-3 siempre
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

        aplicarDefaultsZonas123SiVacias(); // mantiene base
        aplicarBloqueoZonas123();
        autosaveBase();
        alert("✅ Excel importado (zonas 1-3 ignoradas)");
    } catch (e) {
        console.error(e);
        alert("❌ Error leyendo Excel");
    }
}

/** ==========================================
 *  Previsualización (BLANCA y clara)
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

function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/** ==========================================
 *  Mis Bases (guardar en teléfono) - simple
 *  ========================================== */
const INDEX_KEY = "senalco_bases_index";
const BASE_PREFIX = "senalco_base_";

function abrirModalBases() {
    $("modal-bases").style.display = "flex";
    renderBases();
}
function cerrarModalBases() {
    $("modal-bases").style.display = "none";
}

function getIndex() {
    try { return JSON.parse(localStorage.getItem(INDEX_KEY) || "[]"); }
    catch { return []; }
}
function setIndex(list) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(list));
}

function guardarBaseComo() {
    const nombre = safeName($("nombre-base")?.value || "");
    if (!nombre) return alert("Poné un nombre válido (ej: Galicia_1234)");

    const key = BASE_PREFIX + nombre;
    const data = construirJSONBase();
    localStorage.setItem(key, JSON.stringify(data));

    const idx = getIndex();
    if (!idx.includes(nombre)) idx.unshift(nombre);
    setIndex(idx);

    renderBases();
    alert("✅ Base guardada: " + nombre);
}

function renderBases() {
    const cont = $("lista-bases-json");
    if (!cont) return;
    cont.innerHTML = "";

    const idx = getIndex();
    if (!idx.length) {
        cont.innerHTML = `<p style="opacity:.75;">No hay bases guardadas todavía.</p>`;
        return;
    }

    idx.forEach(nombre => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
        <div style="font-weight:bold;">${escapeHtml(nombre)}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="mini-btn" data-act="abrir">Abrir</button>
          <button class="mini-btn" data-act="json">JSON</button>
          <button class="mini-btn" data-act="borrar" style="background:#b00020;">Borrar</button>
        </div>
      </div>
    `;

        card.querySelector('[data-act="abrir"]').onclick = () => abrirBaseGuardada(nombre);
        card.querySelector('[data-act="json"]').onclick = () => descargarBaseGuardadaComoJSON(nombre);
        card.querySelector('[data-act="borrar"]').onclick = () => borrarBaseGuardada(nombre);

        cont.appendChild(card);
    });
}

function abrirBaseGuardada(nombre) {
    const raw = localStorage.getItem(BASE_PREFIX + nombre);
    if (!raw) return alert("❌ No se encontró la base");
    try {
        const data = JSON.parse(raw);

        $("entidad").value = data.entidad || "";
        $("sucursal").value = data.sucursal || "";
        $("abonado").value = data.abonado || "";
        $("central").value = data.central || "";
        $("provincia").value = data.provincia || "";

        precargarZonas();

        // Volcar zonas
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
        cerrarModalBases();
        alert("✅ Base cargada: " + nombre);
    } catch (e) {
        alert("❌ La base guardada está dañada");
    }
}

function descargarBaseGuardadaComoJSON(nombre) {
    const raw = localStorage.getItem(BASE_PREFIX + nombre);
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `base_${safeName(nombre)}_${safeName(fechaGeneradoLocal())}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function borrarBaseGuardada(nombre) {
    localStorage.removeItem(BASE_PREFIX + nombre);
    setIndex(getIndex().filter(x => x !== nombre));
    renderBases();
}

/** ==========================================
 *  Autosave (suave)
 *  ========================================== */
function autosaveBase() {
    try {
        localStorage.setItem("senalco_base_autosave", JSON.stringify(construirJSONBase()));
    } catch { }
}

/** ==========================================
 *  Bootstrap
 *  ========================================== */
window.addEventListener("DOMContentLoaded", () => {
    // si la tabla no existe no hacemos nada
    if (!document.querySelector("#tabla-base")) return;

    // armar tabla completa
    precargarZonas();

    // recuperar autosave
    const raw = localStorage.getItem("senalco_base_autosave");
    if (raw) {
        try {
            const data = JSON.parse(raw);

            $("entidad").value = data.entidad || "";
            $("sucursal").value = data.sucursal || "";
            $("abonado").value = data.abonado || "";
            $("central").value = data.central || "";
            $("provincia").value = data.provincia || "";

            // Cargar zonas del autosave
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
        } catch { }
    }

    asignarEventosBase();
});