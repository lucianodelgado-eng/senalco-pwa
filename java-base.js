/***********************
 *  LISTAS / CATÁLOGOS
 ***********************/
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

/***********************
 *  UTILIDADES
 ***********************/
function $(id) { return document.getElementById(id); }

function base64EncodeUnicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}
function base64DecodeUnicode(str) {
    return decodeURIComponent(escape(atob(str)));
}

function normalizarTexto(x) {
    return (x ?? "").toString().trim();
}

function resolverSelectOtro(selectEl, inputEl, palabraOtro) {
    const sel = selectEl?.value ?? "";
    const inp = normalizarTexto(inputEl?.value ?? "");
    if (sel === palabraOtro) return inp || palabraOtro;
    return sel;
}

function setearSelectOtro(selectEl, inputEl, palabraOtro, opcionesValidas, valor) {
    const v = normalizarTexto(valor);
    if (!selectEl) return;

    if (opcionesValidas.includes(v)) {
        selectEl.value = v;
        if (inputEl) {
            inputEl.value = "";
            inputEl.style.display = "none";
        }
    } else if (v) {
        selectEl.value = palabraOtro;
        if (inputEl) {
            inputEl.value = v;
            inputEl.style.display = "inline-block";
        }
    } else {
        // vacío
        selectEl.value = opcionesValidas[0] ?? "";
        if (inputEl) {
            inputEl.value = "";
            inputEl.style.display = "none";
        }
    }
}

/***********************
 *  ARRANQUE / BINDINGS
 ***********************/
function asignarEventosBase() {
    $("btn-limpiar-base")?.addEventListener("click", limpiarBase);
    $("btn-generar-pdf-base")?.addEventListener("click", generarPDF);
    $("btn-excel-base")?.addEventListener("click", generarExcel);

    // NUEVO: Precarga desde Excel default
    $("btn-precarga-excel")?.addEventListener("click", precargarBaseDefaultDesdeExcel);

    // NUEVO: Subir PDF a modificar
    $("btn-subir-pdf")?.addEventListener("click", () => $("input-pdf-base")?.click());
    $("input-pdf-base")?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await importarBaseDesdePDF(file);
            if (!data) {
                alert("Ese PDF no tiene datos embebidos de base. Usá un PDF generado por ESTA app (versión nueva).");
                return;
            }
            cargarBaseEnFormulario(data);
            alert("✅ PDF cargado. Ya podés modificar la base.");
        } catch (err) {
            console.error(err);
            alert("❌ No pude leer ese PDF. Probá con un PDF generado desde la app.");
        } finally {
            e.target.value = "";
        }
    });

    // NUEVO: Previsualizar
    $("btn-previsualizar")?.addEventListener("click", abrirPreview);
    $("btn-cerrar-preview")?.addEventListener("click", cerrarPreview);
    $("btn-preview-descargar")?.addEventListener("click", () => {
        // si está ok, descarga
        generarPDF();
        cerrarPreview();
    });
}

/***********************
 *  UI: ZONAS
 *  (Unificamos: Evento/Área/Dispositivo con "Otros" + input)
 ***********************/
function precargarZonas() {
    const tbody = document.querySelector("#tabla-base tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    for (let i = 4; i <= 24; i++) {
        const fila = document.createElement("tr");

        // ZONA
        const celdaZona = document.createElement("td");
        celdaZona.textContent = "Zona " + i;

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
        });
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
        });
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
        });
        celdaDispositivo.appendChild(selectDispositivo);
        celdaDispositivo.appendChild(inputDispositivoOtro);

        // DESCRIPCIÓN
        const celdaDescripcion = document.createElement("td");
        const inputDescripcion = document.createElement("input");
        celdaDescripcion.appendChild(inputDescripcion);

        fila.appendChild(celdaZona);
        fila.appendChild(celdaEvento);
        fila.appendChild(celdaArea);
        fila.appendChild(celdaDispositivo);
        fila.appendChild(celdaDescripcion);

        tbody.appendChild(fila);
    }
}

function limpiarBase() {
    $("entidad").value = "";
    $("sucursal").value = "";
    $("abonado").value = "";
    $("central").value = "";
    $("provincia").value = "";
    precargarZonas();
}

/***********************
 *  CAPTURA / CARGA BASE
 ***********************/
function capturarBaseDesdeFormulario() {
    const datos = {
        entidad: normalizarTexto($("entidad")?.value),
        sucursal: normalizarTexto($("sucursal")?.value),
        abonado: normalizarTexto($("abonado")?.value),
        central: normalizarTexto($("central")?.value),
        provincia: normalizarTexto($("provincia")?.value),
        zonas: []
    };

    const filas = document.querySelectorAll("#tabla-base tbody tr");
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll("td");

        const selEvento = celdas[1].querySelector("select");
        const inpEvento = celdas[1].querySelector("input");
        const evento = resolverSelectOtro(selEvento, inpEvento, "Otros");

        const selArea = celdas[2].querySelector("select");
        const inpArea = celdas[2].querySelector("input");
        const area = resolverSelectOtro(selArea, inpArea, "Otros");

        const selDisp = celdas[3].querySelector("select");
        const inpDisp = celdas[3].querySelector("input");
        const dispositivo = resolverSelectOtro(selDisp, inpDisp, "otros");

        const descripcion = normalizarTexto(celdas[4].querySelector("input")?.value);

        datos.zonas.push({
            zona: normalizarTexto(celdas[0].textContent),
            evento,
            area,
            dispositivo,
            descripcion
        });
    });

    return datos;
}

function cargarBaseEnFormulario(data) {
    if (!data) return;

    $("entidad").value = data.entidad || "";
    $("sucursal").value = data.sucursal || "";
    $("abonado").value = data.abonado || "";
    $("central").value = data.central || "";
    $("provincia").value = data.provincia || "";

    precargarZonas();

    const filas = document.querySelectorAll("#tabla-base tbody tr");
    (data.zonas || []).forEach((z, i) => {
        if (!filas[i]) return;

        const celdas = filas[i].querySelectorAll("td");

        // Evento
        const selEv = celdas[1].querySelector("select");
        const inpEv = celdas[1].querySelector("input");
        setearSelectOtro(selEv, inpEv, "Otros", eventos, z.evento);

        // Área
        const selAr = celdas[2].querySelector("select");
        const inpAr = celdas[2].querySelector("input");
        setearSelectOtro(selAr, inpAr, "Otros", areas, z.area);

        // Dispositivo
        const selDp = celdas[3].querySelector("select");
        const inpDp = celdas[3].querySelector("input");
        setearSelectOtro(selDp, inpDp, "otros", dispositivos, z.dispositivo);

        // Descripción
        celdas[4].querySelector("input").value = z.descripcion || "";
    });
}

/***********************
 *  PREVISUALIZACIÓN (MODAL)
 ***********************/
function abrirPreview() {
    const data = capturarBaseDesdeFormulario();

    // Meta
    const metaHtml = `
    <div><b>Entidad:</b> ${data.entidad || "-"}</div>
    <div><b>Sucursal:</b> ${data.sucursal || "-"}</div>
    <div><b>Abonado:</b> ${data.abonado || "-"}</div>
    <div><b>Central:</b> ${data.central || "-"}</div>
    <div><b>Provincia:</b> ${data.provincia || "-"}</div>
  `;
    $("preview-meta").innerHTML = metaHtml;

    // Resumen de completitud
    const total = data.zonas.length;
    const completas = data.zonas.filter(z => {
        const eventoOk = z.evento && z.evento !== "- Sin tipo definido -";
        const areaOk = z.area && z.area !== "-";
        const dispOk = z.dispositivo && z.dispositivo !== "-";
        const descOk = (z.descripcion || "").trim().length > 0;
        return eventoOk || areaOk || dispOk || descOk;
    }).length;

    $("preview-resumen").textContent = `${completas} de ${total} zonas con datos cargados`;

    // Tabla (primeras 10 zonas)
    const tbody = $("preview-tbody");
    tbody.innerHTML = "";

    const max = 10;
    data.zonas.slice(0, max).forEach(z => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${z.zona || "-"}</td>
      <td>${z.evento || "-"}</td>
      <td>${z.area || "-"}</td>
      <td>${z.dispositivo || "-"}</td>
      <td>${(z.descripcion || "").replace(/</g, "&lt;")}</td>
    `;
        tbody.appendChild(tr);
    });

    $("modal-preview").style.display = "block";
}

function cerrarPreview() {
    $("modal-preview").style.display = "none";
}

/***********************
 *  PDF (descarga) + DATA EMBEBIDA
 ***********************/
function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Base de Datos - Señalco", 14, 14);

    // Logo (si está)
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
    } catch (e) {
        console.warn("⚠️ No se pudo cargar el logo en el PDF:", e);
    }

    const data = capturarBaseDesdeFormulario();

    doc.setFontSize(11);
    doc.text(`Entidad: ${data.entidad}`, 14, 24);
    doc.text(`Sucursal: ${data.sucursal}`, 14, 32);
    doc.text(`Abonado: ${data.abonado}`, 100, 24);
    doc.text(`Central: ${data.central}`, 100, 32);
    doc.text(`Provincia: ${data.provincia}`, 14, 40);

    const columnas = ["Zona", "Evento", "Área", "Dispositivo", "Descripción"];
    const filas = data.zonas.map(z => [
        z.zona,
        z.evento,
        z.area,
        z.dispositivo,
        z.descripcion
    ]);

    doc.autoTable({ head: [columnas], body: filas, startY: 50 });

    // ✅ Embebemos data para poder reimportar desde PDF
    // (quedará invisible casi)
    const payload = base64EncodeUnicode(JSON.stringify(data));
    doc.setFontSize(2);
    doc.text(`SENALCO_BASE_V1:${payload}`, 2, 290);

    const nombreArchivo = `base_${(data.entidad || "ENTIDAD")}_${(data.sucursal || "SUC")}.pdf`.replace(/\s+/g, "_");
    doc.save(nombreArchivo);
}

/***********************
 *  EXCEL EXPORT (descarga)
 ***********************/
function generarExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Base");

    sheet.addRow(["Zona", "Evento", "Área", "Dispositivo", "Descripción"]);

    const data = capturarBaseDesdeFormulario();
    data.zonas.forEach(z => {
        sheet.addRow([z.zona, z.evento, z.area, z.dispositivo, z.descripcion]);
    });

    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "base.xlsx";
        a.click();
        URL.revokeObjectURL(url);
    });
}

/***********************
 *  PRECARGA EXCEL DEFAULT: ./base_default.xlsx
 ***********************/
async function precargarBaseDefaultDesdeExcel() {
    try {
        const res = await fetch("./base_default.xlsx", { cache: "no-store" });
        if (!res.ok) throw new Error("No se encontró base_default.xlsx (ponelo en la carpeta de la app)");

        const buffer = await res.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheet = workbook.worksheets[0];
        if (!sheet) throw new Error("El Excel no tiene hojas");

        // Cargamos estructura base
        precargarZonas();

        // Vamos cargando desde fila 2: Zona | Evento | Área | Dispositivo | Descripción
        const filasUI = document.querySelectorAll("#tabla-base tbody tr");
        let uiIndex = 0;

        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // header
            if (uiIndex >= filasUI.length) return;

            const zona = normalizarTexto(row.getCell(1).text);
            const evento = normalizarTexto(row.getCell(2).text);
            const area = normalizarTexto(row.getCell(3).text);
            const dispositivo = normalizarTexto(row.getCell(4).text);
            const descripcion = normalizarTexto(row.getCell(5).text);

            // Saltar filas completamente vacías
            if (!zona && !evento && !area && !dispositivo && !descripcion) return;

            const tr = filasUI[uiIndex];
            const tds = tr.querySelectorAll("td");

            // Evento
            const selEv = tds[1].querySelector("select");
            const inpEv = tds[1].querySelector("input");
            setearSelectOtro(selEv, inpEv, "Otros", eventos, evento);

            // Área
            const selAr = tds[2].querySelector("select");
            const inpAr = tds[2].querySelector("input");
            setearSelectOtro(selAr, inpAr, "Otros", areas, area);

            // Dispositivo
            const selDp = tds[3].querySelector("select");
            const inpDp = tds[3].querySelector("input");
            setearSelectOtro(selDp, inpDp, "otros", dispositivos, dispositivo);

            // Descripción
            tds[4].querySelector("input").value = descripcion;

            uiIndex++;
        });

        alert("⚡ Base precargada desde Excel default (base_default.xlsx)");
    } catch (err) {
        console.error(err);
        alert("❌ No se pudo precargar el Excel default. Verificá que exista base_default.xlsx en la carpeta de la app.");
    }
}

/***********************
 *  IMPORTAR BASE DESDE PDF (Subir PDF a modificar)
 ***********************/
async function importarBaseDesdePDF(file) {
    const pdfjsLib = window["pdfjsLib"];
    if (!pdfjsLib) throw new Error("pdf.js no está cargado");

    // worker
    if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js";
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        fullText += "\n" + content.items.map(it => it.str).join(" ");
    }

    const marker = "SENALCO_BASE_V1:";
    const idx = fullText.indexOf(marker);
    if (idx === -1) return null;

    // limpiamos espacios porque pdf.js a veces mete saltos
    const slice = fullText.slice(idx).replace(/\s+/g, "");
    const payload = slice.substring(marker.length);

    try {
        const json = base64DecodeUnicode(payload);
        const data = JSON.parse(json);
        return data;
    } catch (err) {
        console.warn("No pude decodificar payload del PDF:", err);
        return null;
    }
}

/***********************
 *  BORRADORES 1 y 2 (se mantiene, sin cambios de concepto)
 ***********************/
function guardarBorradorBase(nombreClave) {
    const datos = capturarBaseDesdeFormulario();
    localStorage.setItem(nombreClave, JSON.stringify(datos));
    alert(`✅ Borrador guardado como ${nombreClave}`);
    obtenerBasesGuardadas();
}

function obtenerBasesGuardadas() {
    const ul = $("lista-bases");
    if (!ul) return;
    ul.innerHTML = "";

    const claves = ["borrador1", "borrador2"];
    claves.forEach(clave => {
        const base = localStorage.getItem(clave);
        if (!base) return;

        const li = document.createElement("li");
        li.textContent = `📄 ${clave}`;
        li.style.cursor = "pointer";

        const btnEliminar = document.createElement("span");
        btnEliminar.textContent = " 🗑️";
        btnEliminar.style.cursor = "pointer";
        btnEliminar.style.color = "red";
        btnEliminar.onclick = (e) => {
            e.stopPropagation();
            localStorage.removeItem(clave);
            obtenerBasesGuardadas();
        };

        li.onclick = () => precargarBorradorBase(clave);
        li.appendChild(btnEliminar);
        ul.appendChild(li);
    });
}

function precargarBorradorBase(clave) {
    const data = JSON.parse(localStorage.getItem(clave));
    if (!data) return;
    cargarBaseEnFormulario(data);  
}
