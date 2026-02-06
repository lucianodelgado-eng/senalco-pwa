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
    "-","Acceso Exterior", "Archivo", "ATM", "AutoConsulta", "Baños", "Bunker", 
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

function asignarEventosBase() {
    document.getElementById("btn-limpiar-base")?.addEventListener("click", limpiarBase);
    document.getElementById("btn-generar-pdf-base")?.addEventListener("click", generarPDF);
    document.getElementById("btn-excel-base")?.addEventListener("click", generarExcel);
    document.getElementById("btn-volver")?.addEventListener("click", () => {
        window.location.href = "login.html";
    });
}

function precargarZonas() {
    const tbody = document.querySelector("#tabla-base tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    for (let i = 4; i <= 24; i++) {
        const fila = document.createElement("tr");

        const celdaZona = document.createElement("td");
        celdaZona.textContent = "Zona " + i;

        // EVENTO
        const celdaEvento = document.createElement("td");
        const selectEvento = document.createElement("select");
        eventos.forEach(e => {
            const option = document.createElement("option");
            option.textContent = e;
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

        // Agregar todas las celdas a la fila
        fila.appendChild(celdaZona);
        fila.appendChild(celdaEvento);
        fila.appendChild(celdaArea);
        fila.appendChild(celdaDispositivo);
        fila.appendChild(celdaDescripcion);

        tbody.appendChild(fila);
    }
}



function limpiarBase() {
    document.getElementById("entidad").value = "";
    document.getElementById("sucursal").value = "";
    document.getElementById("abonado").value = "";
    document.getElementById("central").value = "";
    document.getElementById("provincia").value = "";
    precargarZonas();
}


function precargarBasePorId(id) {
    fetch(`/base-base/${id}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("entidad").value = data.entidad;
            document.getElementById("sucursal").value = data.sucursal;
            document.getElementById("abonado").value = data.abonado;
            document.getElementById("central").value = data.central;
            document.getElementById("provincia").value = data.provincia || "";

            precargarZonas();

            const filas = document.querySelectorAll("#tabla-base tbody tr");
            data.zonas.forEach((zona, i) => {
                if (filas[i]) {
                    const celdas = filas[i].querySelectorAll("td");

                    // EVENTO
                    const selectEvento = celdas[1].querySelector("select");
                    const inputEvento = celdas[1].querySelector("input");
                    if (eventos.includes(zona.evento)) {
                        selectEvento.value = zona.evento;
                        inputEvento.style.display = "none";
                    } else {
                        selectEvento.value = "Otros";
                        inputEvento.value = zona.evento;
                        inputEvento.style.display = "inline-block";
                    }

                    // ÁREA
                    celdas[2].querySelector("input").value = zona.area;

                    // DISPOSITIVO
                    const selectDispositivo = celdas[3].querySelector("select");
                    const inputDispositivo = celdas[3].querySelector("input");
                    if (dispositivos.includes(zona.dispositivo)) {
                        selectDispositivo.value = zona.dispositivo;
                        inputDispositivo.style.display = "none";
                    } else {
                        selectDispositivo.value = "otros";
                        inputDispositivo.value = zona.dispositivo;
                        inputDispositivo.style.display = "inline-block";
                    }

                    // DESCRIPCIÓN
                    celdas[4].querySelector("input").value = zona.descripcion;
                }
            });
        });
}


function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Base de Datos - Señalco", 14, 14);

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
    const filasTabla = document.querySelectorAll("#tabla-base tbody tr");
    filasTabla.forEach(fila => {
        const celdas = fila.querySelectorAll("td");
        filas.push([
            celdas[0].textContent,
            celdas[1].querySelector("select").value,
            celdas[2].querySelector("input").value,
            celdas[3].querySelector("select").value,
            celdas[4].querySelector("input").value
        ]);
    });
    doc.autoTable({ head: [columnas], body: filas, startY: 50 });
    const nombreArchivo = `base_${entidad}_${sucursal}.pdf`.replace(/\s+/g, "_");
    doc.save(nombreArchivo);
}

function generarExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Base");
    sheet.addRow(["Zona", "Evento", "Área", "Dispositivo", "Descripción"]);
    const filas = document.querySelectorAll("#tabla-base tbody tr");
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll("td");
        sheet.addRow([
            celdas[0].textContent,
            celdas[1].querySelector("select").value,
            celdas[2].querySelector("input").value,
            celdas[3].querySelector("select").value,
            celdas[4].querySelector("input").value
        ]);
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



function guardarBase() {
    const datos = {
        entidad: document.getElementById("entidad").value,
        sucursal: document.getElementById("sucursal").value,
        abonado: document.getElementById("abonado").value,
        central: document.getElementById("central").value,
        provincia: document.getElementById("provincia")?.value || "",
        zonas: []
    };
    const filas = document.querySelectorAll("#tabla-base tbody tr");
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll("td");
        datos.zonas.push({
            zona: celdas[0].textContent,
            evento: celdas[1].querySelector("select").value,
            area: celdas[2].querySelector("input").value,
            dispositivo: celdas[3].querySelector("select").value,
            descripcion: celdas[4].querySelector("input").value
        });
    });

    localStorage.setItem("ultimaBase", JSON.stringify(datos));
    alert("✅ Base guardada localmente");
    obtenerBasesGuardadas();
}



function obtenerBasesGuardadas() {
    const ul = document.getElementById("lista-bases");
    ul.innerHTML = "";
    const base = localStorage.getItem("ultimaBase");
    if (base) {
        const li = document.createElement("li");
        li.textContent = "Última base guardada";
        li.style.cursor = "pointer";
        li.addEventListener("click", () => precargarUltimaBase());
        ul.appendChild(li);
    }
}

function precargarUltimaBase() {
    const data = JSON.parse(localStorage.getItem("ultimaBase"));
    if (!data) return;

    document.getElementById("entidad").value = data.entidad;
    document.getElementById("sucursal").value = data.sucursal;
    document.getElementById("abonado").value = data.abonado;
    document.getElementById("central").value = data.central;
    document.getElementById("provincia").value = data.provincia || "";
    precargarZonas();
    const filas = document.querySelectorAll("#tabla-base tbody tr");
    data.zonas.forEach((zona, i) => {
        if (filas[i]) {
            const celdas = filas[i].querySelectorAll("td");
            celdas[1].querySelector("select").value = zona.evento;
            celdas[2].querySelector("input").value = zona.area;
            celdas[3].querySelector("select").value = zona.dispositivo;
            celdas[4].querySelector("input").value = zona.descripcion;
        }
    });
}
function guardarBase() {
    const datos = {
        entidad: document.getElementById("entidad").value,
        sucursal: document.getElementById("sucursal").value,
        abonado: document.getElementById("abonado").value,
        central: document.getElementById("central").value,
        provincia: document.getElementById("provincia")?.value || "",
        zonas: []
    };
    const filas = document.querySelectorAll("#tabla-base tbody tr");
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll("td");
        datos.zonas.push({
            zona: celdas[0].textContent,
            evento: celdas[1].querySelector("select").value,
            area: celdas[2].querySelector("input").value,
            dispositivo: celdas[3].querySelector("select").value,
            descripcion: celdas[4].querySelector("input").value
        });
    });

    localStorage.setItem("ultimaBase", JSON.stringify(datos));
    alert("✅ Base guardada localmente");
    obtenerBasesGuardadas();
}



function obtenerBasesGuardadas() {
    const ul = document.getElementById("lista-bases");
    ul.innerHTML = "";
    const base = localStorage.getItem("ultimaBase");
    if (base) {
        const li = document.createElement("li");
        li.textContent = "Última base guardada";
        li.style.cursor = "pointer";
        li.addEventListener("click", () => precargarUltimaBase());
        ul.appendChild(li);
    }
}

function precargarUltimaBase() {
    const data = JSON.parse(localStorage.getItem("ultimaBase"));
    if (!data) return;

    document.getElementById("entidad").value = data.entidad;
    document.getElementById("sucursal").value = data.sucursal;
    document.getElementById("abonado").value = data.abonado;
    document.getElementById("central").value = data.central;
    document.getElementById("provincia").value = data.provincia || "";
    precargarZonas();
    const filas = document.querySelectorAll("#tabla-base tbody tr");
    data.zonas.forEach((zona, i) => {
        if (filas[i]) {
            const celdas = filas[i].querySelectorAll("td");
            celdas[1].querySelector("select").value = zona.evento;
            celdas[2].querySelector("input").value = zona.area;
            celdas[3].querySelector("select").value = zona.dispositivo;
            celdas[4].querySelector("input").value = zona.descripcion;
        }
    });
}
// GUARDAR UN BORRADOR NUEVO
function guardarBorradorBase(nombreClave) {
    const datos = {
        entidad: document.getElementById("entidad").value,
        sucursal: document.getElementById("sucursal").value,
        abonado: document.getElementById("abonado").value,
        central: document.getElementById("central").value,
        provincia: document.getElementById("provincia")?.value || "",
        zonas: []
    };
    const filas = document.querySelectorAll("#tabla-base tbody tr");
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll("td");
        datos.zonas.push({
            zona: celdas[0].textContent,
            evento: celdas[1].querySelector("select").value,
            area: celdas[2].querySelector("input").value,
            dispositivo: celdas[3].querySelector("select").value,
            descripcion: celdas[4].querySelector("input").value
        });
    });

    localStorage.setItem(nombreClave, JSON.stringify(datos));
    alert(`✅ Borrador guardado como ${nombreClave}`);
    obtenerBasesGuardadas();
}

// MOSTRAR LISTA DE BORRADORES GUARDADOS
function obtenerBasesGuardadas() {
    const ul = document.getElementById("lista-bases");
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

            li.onclick = () => precargarBorradorBase(clave);
            li.appendChild(btnEliminar);
            ul.appendChild(li);
        }
    });
}

// PRECARGAR UN BORRADOR GUARDADO
function precargarBorradorBase(clave) {
    const data = JSON.parse(localStorage.getItem(clave));
    if (!data) return;

    document.getElementById("entidad").value = data.entidad;
    document.getElementById("sucursal").value = data.sucursal;
    document.getElementById("abonado").value = data.abonado;
    document.getElementById("central").value = data.central;
    document.getElementById("provincia").value = data.provincia || "";

    precargarZonas();
    const filas = document.querySelectorAll("#tabla-base tbody tr");
    data.zonas.forEach((zona, i) => {
        if (filas[i]) {
            const celdas = filas[i].querySelectorAll("td");
            celdas[1].querySelector("select").value = zona.evento;
            celdas[2].querySelector("input").value = zona.area;
            celdas[3].querySelector("select").value = zona.dispositivo;
            celdas[4].querySelector("input").value = zona.descripcion;
        }
    });
}
