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

/********************************
 *  Utilidades
 ********************************/
function $(id) { return document.getElementById(id); }

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

function normalizarZona(x) {
    // acepta "Zona 1", 1, "1"
    const s = String(x ?? "").trim();
    const m = s.match(/\d+/);
    return m ? m[0] : s;
}

/********************************
 *  Construcción tabla
 ********************************/
function precargarZonas(desde = 1, hasta = 24) {
    const tbody = document.querySelector("#tabla-base tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    for (let i = desde; i <= hasta; i++) {
        const tr = document.createElement("tr");
        tr.dataset.zona = String(i);

        // ZONA (NO editable)
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

        tr.appendChild(tdZona);
        tr.appendChild(tdEvento);
        tr.appendChild(tdArea);
        tr.appendChild(tdDisp);
        tr.appendChild(tdDesc);

        tbody.appendChild(tr);
    }

    aplicarBloqueoZonas123();
}

function aplicarBloqueoZonas123() {
    const tbody = document.querySelector("#tabla-base tbody");
    if (!tbody) return;

    ZONAS_FIJAS.forEach(n => {
        const tr = tbody.querySelector(`tr[data-zona="${n}"]`);
        if (!tr) return;

        const controles = tr.querySelectorAll("select, input");
        controles.forEach(el => {
            el.disabled = !zonas123Editables;
        });

        tr.style.opacity = zonas123Editables ? "1" : "0.70";
    });
}

/********************************
 *  Leer / Escribir tabla a objeto
 ********************************/
function leerTablaComoObjeto() {
    const data = {
        entidad: $("entidad")?.value || "",
        sucursal: $("sucursal")?.value || "",
        abonado: $("abonado")?.value || "",
        central: $("central")?.value || "",
        provincia: $("provincia")?.value || "",
        zonas: []
    };

    document.querySelectorAll("#tabla-base tbody tr").forEach(tr => {
        const tds = tr.querySelectorAll("td");
        const zona = tds[0].textContent.trim();

        const eventoSel = tds[1].querySelector("select");
        const eventoOtro = tds[1].querySelector("input");
        const areaSel = tds[2].querySelector("select");
        const areaOtro = tds[2].querySelector("input");
        const dispSel = tds[3].querySelector("select");
        const dispOtro = tds[3].querySelector("input");
        const desc = tds[4].querySelector("input")?.value || "";

        const evento = (eventoSel.value === "Otros" && eventoOtro.value.trim())
            ? eventoOtro.value.trim()
            : eventoSel.value;

        const area = (areaSel.value === "Otros" && areaOtro.value.trim())
            ? areaOtro.value.trim()
            : areaSel.value;

        const dispositivo = (dispSel.value === "otros" && dispOtro.value.trim())
            ? dispOtro.value.trim()
            : dispSel.value;

        data.zonas.push({
            zona: String(zona),
            evento,
            area,
            dispositivo,
            descripcion: desc
        });
    });

    return data;
}

function escribirObjetoEnTabla(data) {
    $("entidad").value = data.entidad || "";
    $("sucursal").value = data.sucursal || "";
    $("abonado").value = data.abonado || "";
    $("central").value = data.central || "";
    $("provincia").value = data.provincia || "";

    // reconstruyo 1..24
    precargarZonas(1, 24);

    const filas = document.querySelectorAll("#tabla-base tbody tr");
    (data.zonas || []).forEach((z, i) => {
        const tr = filas[i];
        if (!tr) return;

        const tds = tr.querySelectorAll("td");

        // zona: si el json trae zona, la respetamos solo si coincide con fila,
        // porque la zona en UI es fija por orden. (evita corridas)
        const zonaJson = normalizarZona(z.zona);
        const zonaFila = tds[0].textContent.trim();
        if (zonaJson && zonaJson !== zonaFila) {
            // Si vino desfasado, lo colocamos por índice igual para no correr todo.
            // (si querés, después metemos un modo "mapear por zona")
        }

        // EVENTO
        const selEvento = tds[1].querySelector("select");
        const inpEvento = tds[1].querySelector("input");
        if (eventos.includes(z.evento)) {
            selEvento.value = z.evento;
            inpEvento.style.display = "none";
            inpEvento.value = "";
        } else {
            selEvento.value = "Otros";
            inpEvento.value = z.evento || "";
            inpEvento.style.display = "inline-block";
        }

        // ÁREA
        const selArea = tds[2].querySelector("select");
        const inpArea = tds[2].querySelector("input");
        if (areas.includes(z.area)) {
            selArea.value = z.area;
            inpArea.style.display = "none";
            inpArea.value = "";
        } else {
            selArea.value = "Otros";
            inpArea.value = z.area || "";
            inpArea.style.display = "inline-block";
        }

        // DISPOSITIVO
        const selDisp = tds[3].querySelector("select");
        const inpDisp = tds[3].querySelector("input");
        if (dispositivos.includes(z.dispositivo)) {
            selDisp.value = z.dispositivo;
            inpDisp.style.display = "none";
            inpDisp.value = "";
        } else {
            selDisp.value = "otros";
            inpDisp.value = z.dispositivo || "";
            inpDisp.style.display = "inline-block";
        }

        // DESC
        tds[4].querySelector("input").value = z.descripcion || "";
    });

    aplicarBloqueoZonas123();
}

/********************************
 *  Acciones: Limpiar / PDF / Excel
 ********************************/
function limpiarBase() {
    $("entidad").value = "";
    $("sucursal").value = "";
    $("abonado").value = "";
    $("central").value = "";
    $("provincia").value = "";
    precargarZonas(1, 24);
}

function generarPDF(descargar = true) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Base de Datos - Señalco", 14, 14);

    // Logo si existe
    try {
        const logoImg = $("logo-pdf");
        if (logoImg && logoImg.complete) {
            const canvas = document.createElement("canvas");
            canvas.width = logoImg.naturalWidth;
            canvas.height = logoImg.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(logoImg, 0, 0);
            doc.addImage(canvas.toDataURL("image/jpeg"), "JPEG", 160, 10, 40, 20);
        }
    } catch (e) { }

    const entidad = $("entidad").value;
    const sucursal = $("sucursal").value;
    const abonado = $("abonado").value;
    const central = $("central").value;
    const provincia = $("provincia").value;

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
            tds[0].textContent.trim(),
            tds[1].querySelector("select").value,
            tds[2].querySelector("select").value,
            tds[3].querySelector("select").value,
            tds[4].querySelector("input").value
        ]);
    });

    doc.autoTable({ head: [columnas], body: filas, startY: 50 });

    const nombreArchivo = `base_${entidad}_${sucursal}.pdf`.replace(/\s+/g, "_");

    if (descargar) doc.save(nombreArchivo);
    return { doc, nombreArchivo };
}

async function generarExcelBlobYNombre() {
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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const entidad = $("entidad").value || "base";
    const sucursal = $("sucursal").value || "suc";
    const nombre = `base_${entidad}_${sucursal}.xlsx`.replace(/\s+/g, "_");

    return { blob, nombre };
}

function descargarExcel() {
    generarExcelBlobYNombre().then(({ blob, nombre }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nombre;
        a.click();
        URL.revokeObjectURL(url);
    });
}

/********************************
 *  Excel: Importar / Leer
 ********************************/
function leerExcelYAplicar(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const buffer = e.target.result;
            const wb = new ExcelJS.Workbook();
            await wb.xlsx.load(buffer);

            const sheet = wb.worksheets[0];
            if (!sheet) { alert("No pude leer la hoja del Excel."); return; }

            // Detectar encabezados
            const headerRow = sheet.getRow(1);
            const headers = headerRow.values.map(v => String(v || "").trim().toLowerCase());

            const idxZona = headers.findIndex(h => h === "zona");
            const idxEvento = headers.findIndex(h => h === "evento");
            const idxArea = headers.findIndex(h => h === "area" || h === "área");
            const idxDisp = headers.findIndex(h => h === "dispositivo");
            const idxDesc = headers.findIndex(h => h === "desc" || h === "descripción" || h === "descripcion");

            // Si no hay headers, igual intentamos por posiciones (como tu export)
            const usarPosiciones = (idxZona < 0 || idxEvento < 0 || idxArea < 0 || idxDisp < 0 || idxDesc < 0);

            const data = leerTablaComoObjeto();
            data.zonas = [];

            // Desde fila 2
            sheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;

                const vals = row.values; // 1-based
                const zona = usarPosiciones ? normalizarZona(vals[1]) : normalizarZona(vals[idxZona]);
                const evento = usarPosiciones ? String(vals[2] || "").trim() : String(vals[idxEvento] || "").trim();
                const area = usarPosiciones ? String(vals[3] || "").trim() : String(vals[idxArea] || "").trim();
                const dispositivo = usarPosiciones ? String(vals[4] || "").trim() : String(vals[idxDisp] || "").trim();
                const descripcion = usarPosiciones ? String(vals[5] || "").trim() : String(vals[idxDesc] || "").trim();

                // evitar filas vacías
                if (!zona && !evento && !area && !dispositivo && !descripcion) return;

                data.zonas.push({
                    zona: zona || "",
                    evento: evento || "- Sin tipo definido -",
                    area: area || "-",
                    dispositivo: dispositivo || "-",
                    descripcion: descripcion || ""
                });
            });

            // Si vino menos de 24 filas, rellenamos hasta 24 manteniendo el orden
            while (data.zonas.length < 24) {
                data.zonas.push({ zona: String(data.zonas.length + 1), evento: "- Sin tipo definido -", area: "-", dispositivo: "-", descripcion: "" });
            }
            // Si vino más, truncamos a 24 (según tu base 1..24)
            data.zonas = data.zonas.slice(0, 24);

            // entidad/sucursal: si el Excel trae (no suele), no lo tomamos
            escribirObjetoEnTabla(data);
            alert("✅ Excel cargado en la base.");
        } catch (err) {
            console.error(err);
            alert("❌ Error leyendo Excel. Probá con otro archivo o revisá el formato.");
        }
    };
    reader.readAsArrayBuffer(file);
}

/********************************
 *  JSON: Guardar / Descargar / Importar
 ********************************/
function keyMisBases() {
    return "misBases_señalco_v1";
}

function getMisBases() {
    try {
        return JSON.parse(localStorage.getItem(keyMisBases()) || "[]");
    } catch {
        return [];
    }
}

function setMisBases(list) {
    localStorage.setItem(keyMisBases(), JSON.stringify(list));
}

function guardarBaseLocal(nombre) {
    const data = leerTablaComoObjeto();
    const list = getMisBases();

    const item = {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        nombre: nombre || `Base_${Date.now()}`,
        ts: Date.now(),
        data
    };

    // si existe mismo nombre -> reemplazamos
    const idx = list.findIndex(x => x.nombre === item.nombre);
    if (idx >= 0) list[idx] = item; else list.unshift(item);

    setMisBases(list);
}

function renderMisBases() {
    const cont = $("lista-bases-json");
    if (!cont) return;

    const list = getMisBases();
    if (list.length === 0) {
        cont.innerHTML = `<p style="color:#555;">No hay bases guardadas todavía.</p>`;
        return;
    }

    cont.innerHTML = list.map(item => {
        const fecha = new Date(item.ts).toLocaleString("es-AR");
        return `
      <div class="card">
        <b>${item.nombre}</b><br>
        <small>${fecha}</small>
        <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="mini-btn" data-act="abrir" data-id="${item.id}">Abrir</button>
          <button class="mini-btn" data-act="descargar" data-id="${item.id}">Descargar JSON</button>
          <button class="mini-btn" data-act="eliminar" data-id="${item.id}" style="background:#b00020;">Eliminar</button>
        </div>
      </div>
    `;
    }).join("");

    cont.querySelectorAll("button[data-act]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const act = btn.dataset.act;
            const id = btn.dataset.id;
            const list2 = getMisBases();
            const item = list2.find(x => x.id === id);
            if (!item) return;

            if (act === "abrir") {
                escribirObjetoEnTabla(item.data);
                alert("✅ Base cargada.");
                return;
            }
            if (act === "eliminar") {
                const nueva = list2.filter(x => x.id !== id);
                setMisBases(nueva);
                renderMisBases();
                return;
            }
            if (act === "descargar") {
                descargarJSON(item.data, `${item.nombre}.json`);
                return;
            }
        });
    });
}

function descargarJSON(data, nombre = "base.json") {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
}

function importarJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);

            // Validación mínima
            if (!data || !Array.isArray(data.zonas)) {
                alert("❌ JSON inválido: falta 'zonas'.");
                return;
            }

            // Normalizamos a 24
            const fijo = {
                entidad: data.entidad || "",
                sucursal: data.sucursal || "",
                abonado: data.abonado || "",
                central: data.central || "",
                provincia: data.provincia || "",
                zonas: []
            };

            data.zonas.forEach((z, i) => {
                fijo.zonas.push({
                    zona: normalizarZona(z.zona ?? (i + 1)),
                    evento: z.evento || "- Sin tipo definido -",
                    area: z.area || "-",
                    dispositivo: z.dispositivo || "-",
                    descripcion: z.descripcion || ""
                });
            });

            while (fijo.zonas.length < 24) {
                fijo.zonas.push({ zona: String(fijo.zonas.length + 1), evento: "- Sin tipo definido -", area: "-", dispositivo: "-", descripcion: "" });
            }
            fijo.zonas = fijo.zonas.slice(0, 24);

            escribirObjetoEnTabla(fijo);
            alert("✅ JSON importado.");
        } catch (e) {
            console.error(e);
            alert("❌ No pude leer el JSON.");
        }
    };
    reader.readAsText(file, "utf-8");
}

/********************************
 *  Compartir (Web Share API)
 ********************************/
async function shareBlob({ blob, filename, title }) {
    try {
        const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });

        if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
            await navigator.share({ title: title || filename, files: [file] });
            return true;
        }
        return false;
    } catch (e) {
        console.warn("share error", e);
        return false;
    }
}

/********************************
 *  Modales
 ********************************/
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

/********************************
 *  Previsualización
 ********************************/
function construirPrevisualizacionHTML(data) {
    const head = `
    <div class="card">
      <b>Entidad:</b> ${data.entidad || "-"} &nbsp; | &nbsp;
      <b>Sucursal:</b> ${data.sucursal || "-"} &nbsp; | &nbsp;
      <b>Abonado:</b> ${data.abonado || "-"}<br>
      <b>Central:</b> ${data.central || "-"} &nbsp; | &nbsp;
      <b>Provincia:</b> ${data.provincia || "-"}
    </div>
  `;

    const rows = data.zonas.map(z => `
    <tr>
      <td>${z.zona}</td>
      <td>${z.evento}</td>
      <td>${z.area}</td>
      <td>${z.dispositivo}</td>
      <td>${z.descripcion || ""}</td>
    </tr>
  `).join("");

    return head + `
    <div class="card">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:6px;">Zona</th>
            <th style="border:1px solid #ddd; padding:6px;">Evento</th>
            <th style="border:1px solid #ddd; padding:6px;">Área</th>
            <th style="border:1px solid #ddd; padding:6px;">Dispositivo</th>
            <th style="border:1px solid #ddd; padding:6px;">Descripción</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/********************************
 *  Borradores "clásico" (tus 1 y 2)
 *  (los dejo tal cual: no los toco)
 ********************************/
function guardarBorradorBase(nombreClave) {
    const datos = leerTablaComoObjeto();
    localStorage.setItem(nombreClave, JSON.stringify(datos));
    alert(`✅ Guardado ${nombreClave}`);
    obtenerBasesGuardadas();
}

function obtenerBasesGuardadas() {
    const ul = $("lista-bases");
    if (!ul) return;
    ul.innerHTML = "";

    const claves = ["borrador1", "borrador2"];
    claves.forEach(clave => {
        const base = localStorage.getItem(clave);
        if (base) {
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

            li.onclick = () => {
                const data = JSON.parse(localStorage.getItem(clave));
                if (data) escribirObjetoEnTabla(data);
            };

            li.appendChild(btnEliminar);
            ul.appendChild(li);
        }
    });
}

/********************************
 *  Asignar eventos a botones (TU HTML)
 ********************************/
function asignarEventosBase() {
    // Botones base
    $("btn-limpiar-base")?.addEventListener("click", limpiarBase);
    $("btn-generar-pdf-base")?.addEventListener("click", () => generarPDF(true));
    $("btn-excel-base")?.addEventListener("click", descargarExcel);

    // Subir Excel -> abre file picker
    $("btn-subir-excel")?.addEventListener("click", () => $("input-excel-base")?.click());
    $("input-excel-base")?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        leerExcelYAplicar(file);
        e.target.value = ""; // reset
    });

    // Previsualizar
    $("btn-previsualizar")?.addEventListener("click", () => {
        const data = leerTablaComoObjeto();
        $("prev-body").innerHTML = construirPrevisualizacionHTML(data);
        abrirModal("modal-prev");
    });
    $("btn-cerrar-prev")?.addEventListener("click", () => cerrarModal("modal-prev"));
    $("btn-descargar-pdf-prev")?.addEventListener("click", () => generarPDF(true));

    // Guardar base local (rápido) -> abre Mis Bases y sugiere nombre
    $("btn-guardar-local")?.addEventListener("click", () => {
        abrirModal("modal-bases");
        const ent = ($("entidad").value || "Base").trim();
        const suc = ($("sucursal").value || "Suc").trim();
        $("nombre-base").value = `${ent}_${suc}`.replace(/\s+/g, "_");
        renderMisBases();
    });

    // Mis Bases
    $("btn-mis-bases")?.addEventListener("click", () => {
        abrirModal("modal-bases");
        renderMisBases();
    });
    $("btn-cerrar-bases")?.addEventListener("click", () => cerrarModal("modal-bases"));

    // Guardar como (en Mis Bases)
    $("btn-guardar-como")?.addEventListener("click", () => {
        const nombre = ($("nombre-base").value || "").trim();
        if (!nombre) { alert("Poné un nombre para guardar."); return; }
        guardarBaseLocal(nombre);
        renderMisBases();
        alert("✅ Guardado en el teléfono.");
    });

    // Descargar JSON (del estado actual)
    $("btn-descargar-json")?.addEventListener("click", () => {
        const data = leerTablaComoObjeto();
        const ent = ($("entidad").value || "base").trim();
        const suc = ($("sucursal").value || "suc").trim();
        descargarJSON(data, `base_${ent}_${suc}.json`.replace(/\s+/g, "_"));
    });

    // Importar JSON
    $("btn-importar-json")?.addEventListener("click", () => $("input-json-base")?.click());
    $("input-json-base")?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        importarJSON(file);
        e.target.value = "";
    });

    // Compartir JSON
    $("btn-compartir-json")?.addEventListener("click", async () => {
        const data = leerTablaComoObjeto();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const ent = ($("entidad").value || "base").trim();
        const suc = ($("sucursal").value || "suc").trim();
        const filename = `base_${ent}_${suc}.json`.replace(/\s+/g, "_");

        const ok = await shareBlob({ blob, filename, title: "Compartir JSON" });
        if (!ok) descargarJSON(data, filename);
    });

    // Compartir Excel
    $("btn-compartir-excel")?.addEventListener("click", async () => {
        const { blob, nombre } = await generarExcelBlobYNombre();
        const ok = await shareBlob({ blob, filename: nombre, title: "Compartir Excel" });
        if (!ok) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = nombre;
            a.click();
            URL.revokeObjectURL(url);
        }
    });

    // Toggle edición zonas 1-3
    $("btn-editar-zonas123")?.addEventListener("click", () => {
        zonas123Editables = true;
        $("btn-editar-zonas123").style.display = "none";
        $("btn-bloquear-zonas123").style.display = "inline-block";
        aplicarBloqueoZonas123();
    });

    $("btn-bloquear-zonas123")?.addEventListener("click", () => {
        zonas123Editables = false;
        $("btn-bloquear-zonas123").style.display = "none";
        $("btn-editar-zonas123").style.display = "inline-block";
        aplicarBloqueoZonas123();
    });
}

/********************************
 *  Fin
 ********************************/