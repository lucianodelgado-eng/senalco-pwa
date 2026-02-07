/***********************
 *  Listas desplegables
 ***********************/
const eventos = [
    "- Sin tipo definido -", "Alarma", "Robo", "Asalto",
    "clave", "Sabotaje", "Apertura de Equipo", "Puls. Remoto - Falla Red", "ALM + 4 HS", "Asalto Clave Falsa",
    "Falla activador portátil", "Falla cent. Policial. GPRS OK", "Falla Comunicación GPRS",
    "Falla de Conexión al Servidor GPRS", "Falla de PT", "Falla Enlace Red PT",
    "Falla enlace Supervisión de Radio", "Falta de 220V", "Incendio", "Otros",
    "Prevención con Policía", "Prevención de Red", "Prevención Placa Acicomp",
    "Puerta Abierta", "Sirena Disparada",
    "Averia de Linea"
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

/********************************
 *  Config Zonas fijas
 ********************************/
const ZONAS_FIJAS = [1, 2, 3];
let zonas123Editables = false; // por default BLOQUEADAS ✅

/***********************
 *  Init / bindings
 ***********************/
function asignarEventosBase() {
    document.getElementById("btn-limpiar-base")?.addEventListener("click", limpiarBase);
    document.getElementById("btn-generar-pdf-base")?.addEventListener("click", generarPDF);
    document.getElementById("btn-excel-base")?.addEventListener("click", generarExcel);

    // Toggle edición zonas 1-3
    const btnEditar = document.getElementById("btn-editar-zonas123");
    const btnBloquear = document.getElementById("btn-bloquear-zonas123");

    btnEditar?.addEventListener("click", () => {
        zonas123Editables = true;
        btnEditar.style.display = "none";
        if (btnBloquear) btnBloquear.style.display = "inline-block";
        aplicarBloqueoZonas123(); // re-aplica (ahora desbloquea)
    });

    btnBloquear?.addEventListener("click", () => {
        zonas123Editables = false;
        btnBloquear.style.display = "none";
        if (btnEditar) btnEditar.style.display = "inline-block";
        aplicarBloqueoZonas123(); // re-aplica (ahora bloquea)
    });
}

/***********************
 *  Construcción tabla
 ***********************/
function crearSelect(lista) {
    const sel = document.createElement("select");
    lista.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
    });
    return sel;
}

function precargarZonas(desde = 1, hasta = 24) {
    const tbody = document.querySelector("#tabla-base tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    for (let i = desde; i <= hasta; i++) {
        const fila = document.createElement("tr");
        fila.dataset.zona = String(i);

        // ZONA (fija, no editable)
        const tdZona = document.createElement("td");
        tdZona.textContent = String(i);

        // EVENTO
        const tdEvento = document.createElement("td");
        const selEvento = crearSelect(eventos);
        const inpEventoOtro = document.createElement("input");
        inpEventoOtro.placeholder = "Especificar evento";
        inpEventoOtro.style.display = "none";
        selEvento.addEventListener("change", () => {
            inpEventoOtro.style.display = selEvento.value === "Otros" ? "inline-block" : "none";
        });
        tdEvento.appendChild(selEvento);
        tdEvento.appendChild(inpEventoOtro);

        // ÁREA
        const tdArea = document.createElement("td");
        const selArea = crearSelect(areas);
        const inpAreaOtro = document.createElement("input");
        inpAreaOtro.placeholder = "Especificar área";
        inpAreaOtro.style.display = "none";
        selArea.addEventListener("change", () => {
            inpAreaOtro.style.display = selArea.value === "Otros" ? "inline-block" : "none";
        });
        tdArea.appendChild(selArea);
        tdArea.appendChild(inpAreaOtro);

        // DISPOSITIVO
        const tdDisp = document.createElement("td");
        const selDisp = crearSelect(dispositivos);
        const inpDispOtro = document.createElement("input");
        inpDispOtro.placeholder = "Especificar dispositivo";
        inpDispOtro.style.display = "none";
        selDisp.addEventListener("change", () => {
            inpDispOtro.style.display = selDisp.value === "otros" ? "inline-block" : "none";
        });
        tdDisp.appendChild(selDisp);
        tdDisp.appendChild(inpDispOtro);

        // DESCRIPCIÓN
        const tdDesc = document.createElement("td");
        const inpDesc = document.createElement("input");
        tdDesc.appendChild(inpDesc);

        fila.appendChild(tdZona);
        fila.appendChild(tdEvento);
        fila.appendChild(tdArea);
        fila.appendChild(tdDisp);
        fila.appendChild(tdDesc);

        tbody.appendChild(fila);
    }

    // ✅ Aplica regla: zonas 1-3 bloqueadas por default
    aplicarBloqueoZonas123();
}

/***********************
 *  Bloqueo Zonas 1-3
 ***********************/
function aplicarBloqueoZonas123() {
    const tbody = document.querySelector("#tabla-base tbody");
    if (!tbody) return;

    ZONAS_FIJAS.forEach(n => {
        const tr = tbody.querySelector(`tr[data-zona="${n}"]`);
        if (!tr) return;

        // En zonas 1-3: si NO está editable => disable todo menos el número de zona
        const controles = tr.querySelectorAll("select, input");

        controles.forEach(el => {
            // OJO: el número de zona está en <td>, no entra acá.
            el.disabled = !zonas123Editables;
        });

        // Visual: opacidad para que el técnico entienda que está “fijo”
        tr.style.opacity = zonas123Editables ? "1" : "0.70";
    });
}

/***********************
 *  Limpiar
 ***********************/
function limpiarBase() {
    document.getElementById("entidad").value = "";
    document.getElementById("sucursal").value = "";
    document.getElementById("abonado").value = "";
    document.getElementById("central").value = "";
    document.getElementById("provincia").value = "";

    // reconstruye tabla; deja 1-3 bloqueadas
    precargarZonas(1, 24);
}

/***********************
 *  PDF
 ***********************/
function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Base de Datos - Señalco", 14, 14);

    const entidad = document.getElementById("entidad").value;
    const sucursal = document.getElementById("sucursal").value;
    const abonado = document.getElementById("abonado").value;
    const central = document.getElementById("central").value;
    const provincia = document.getElementById("provincia")?.value || "";

    doc.setFontSize(11);
    doc.text(`Entidad: ${entidad}`, 14, 24);
    doc.text(`Sucursal: ${sucursal}`, 14, 32);
    doc.text(`Abonado: ${abonado}`, 100, 24);
    doc.text(`Central: ${central}`, 100, 32);
    doc.text(`Provincia: ${provincia}`, 14, 40);

    const columnas = ["Zona", "Evento", "Área", "Dispositivo", "Descripción"];
    const filas = [];

    document.querySelectorAll("#tabla-base tbody tr").forEach(tr => {
        const tds = tr.querySelectorAll("td");
        filas.push([
            tds[0].textContent.trim(), // zona 1,2,3...
            tds[1].querySelector("select").value,
            tds[2].querySelector("select").value,
            tds[3].querySelector("select").value,
            tds[4].querySelector("input").value
        ]);
    });

    doc.autoTable({ head: [columnas], body: filas, startY: 50 });

    const nombreArchivo = `base_${entidad}_${sucursal}.pdf`.replace(/\s+/g, "_");
    doc.save(nombreArchivo);
}

/***********************
 *  Excel (export)
 ***********************/
function generarExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Base");

    sheet.addRow(["Zona", "Evento", "Area", "Dispositivo", "Desc"]);

    document.querySelectorAll("#tabla-base tbody tr").forEach(tr => {
        const tds = tr.querySelectorAll("td");
        sheet.addRow([
            tds[0].textContent.trim(),
            tds[1].querySelector("select").value,
            tds[2].querySelector("select").value,
            tds[3].querySelector("select").value,
            tds[4].querySelector("input").value
        ]);
    });

    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "base.xlsx";
        a.click();
        URL.revokeObjectURL(url);
    });
}