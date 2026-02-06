// javas.js actualizado completo con precarga, edición directa y guardado localStorage

/*************************
 *  Navegación por pasos  *
 *************************/
let paso = 0;
const secciones  = document.querySelectorAll('.seccion');
const btnAtras   = document.getElementById('atras');
const btnSig     = document.getElementById('siguiente');

function mostrarPaso(i) {
    secciones.forEach((sec, idx) => sec.style.display = (idx === i) ? 'block' : 'none');
    btnAtras.style.display = (i === 0) ? 'none' : 'inline-block';
    btnSig .style.display  = (i === secciones.length - 1) ? 'none' : 'inline-block';
}
btnSig .onclick = () => { if (paso < secciones.length - 1) { paso++; mostrarPaso(paso); } };
btnAtras.onclick = () => { if (paso > 0) { paso--; mostrarPaso(paso); } };
mostrarPaso(paso);

/*************************
 *  Helpers de formulario *
 *************************/
function mostrarOtro(select) {
    const inputOtro = select.parentElement.querySelector('.otro-dispositivo');
    inputOtro.style.display = (select.value === 'Otro') ? 'block' : 'none';
}

/*****************************************
 *  Guardar fila en la lista definitiva  *
 *****************************************/
function guardarFilaEditable(btn) {
    const sector      = btn.closest('.sector');
    const filaEdicion = sector.querySelector('tbody tr');

    const sel        = filaEdicion.querySelector('select');
    const inpCant    = filaEdicion.querySelector('td[data-label="Cantidad"] input');
    const inpModelo  = filaEdicion.querySelector('td[data-label="Modelo"] input');
    const inpZona    = filaEdicion.querySelector('td[data-label="Zona"] input');
    const inpObs     = filaEdicion.querySelector('td[data-label="Observación"] input');
    const inpOtro    = filaEdicion.querySelector('.otro-dispositivo');

    let dispositivo = sel.value;
    if (dispositivo === 'Otro' && inpOtro.value.trim() !== '') {
        dispositivo = inpOtro.value.trim();
    }

    if (!dispositivo)                 { alert('Seleccioná un dispositivo válido.'); return; }
    if (!inpCant.value || +inpCant.value <= 0) { alert('La cantidad debe ser mayor que 0.'); return; }

    const datos = [
        dispositivo,
        inpCant.value.trim(),
        inpModelo.value.trim(),
        inpZona.value.trim(),
        inpObs.value.trim()
    ];

    const filaNueva = document.createElement('tr');
    datos.forEach(d => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = d;
        input.style.width = '100%';
        td.appendChild(input);
        filaNueva.appendChild(td);
    });

    sector.querySelector('details tbody').appendChild(filaNueva);

    const contador = sector.querySelector('.conteo');
    contador.textContent = +contador.textContent + 1;

    sel.value = '';
    inpCant.value = '';
    [inpModelo, inpZona, inpObs, inpOtro].forEach(i => i.value = '');
    inpOtro.style.display = 'none';

    guardarEstadoLocal();
}

function limpiarSector(btn) {
    const sector = btn.closest('.sector');
    sector.querySelector('details tbody').innerHTML = '';
    sector.querySelector('.conteo').textContent = '0';
    guardarEstadoLocal();
}

function agregarSector() {
    agregarSectorPorNombre(`Nuevo sector`);
}

function agregarSectorPorNombre(nombre) {
    const contenedor = document.getElementById('contenedor-sectores');
    const div = document.createElement('div');
    div.className = 'sector';
    div.innerHTML = `
        <h3 contenteditable>${nombre}</h3>
        <table class="tabla-editable">
            <thead><tr><th>Dispositivo</th><th>Cantidad</th><th>Modelo</th><th>Zona(instantanea/24hs)</th><th>Observación de ubicacion</th></tr></thead>
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
        <div style="margin-top: 10px;">
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
            <table><thead><tr><th>Dispositivo</th><th>Cantidad</th><th>Modelo</th><th>Zona(instantanea/24hs)</th><th>Observación de ubicacion</th></tr></thead><tbody></tbody></table>
        </details>
    `;
    contenedor.appendChild(div);
}
function precargarDispositivos(btn, tipo) {
    const sector = btn.closest('.sector');
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
    const tbody = sector.querySelector('details tbody');
    const contador = sector.querySelector('.conteo');

    let cantidadGlobal = "1";

    // Solo preguntar una vez si es atm, tesoro o cds
    if (["atm", "tesoro", "CDS"].includes(tipo)) {
        const cant = prompt(`¿Cantidad para cada dispositivo ${tipo.toUpperCase()}?`);
        if (cant === null || cant.trim() === "" || isNaN(cant) || +cant <= 0) return;
        cantidadGlobal = cant;
    }

    lista.forEach(item => {
        const nombre = item[0];
        const datos = [
            nombre,
            ["atm", "tesoro", "CDS"].includes(tipo) ? cantidadGlobal : item[1] || "",
            item[2] || "",
            item[3] || "",
            item[4] || ""
        ];

        const filaNueva = document.createElement('tr');
        datos.forEach(d => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = d;
            input.style.width = '100%';
            td.appendChild(input);
            filaNueva.appendChild(td);
        });
        tbody.appendChild(filaNueva);
        contador.textContent = +contador.textContent + 1;
    });

    guardarEstadoLocal();
}


/*******************************
 *  Generación de PDF          *
 *******************************/
function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    const entidad   = document.getElementById('entidad').value;
    const sucursal  = document.getElementById('sucursal').value;
    const direccion = document.getElementById('direccion').value;
    const fechaVal  = document.getElementById('fecha').value;
    const fecha     = fechaVal ? new Date(fechaVal).toLocaleDateString('es-AR') : '';
    const remito    = document.getElementById('remito').value;
    const relevado  = document.getElementById('relevado').value;

    doc.setFontSize(14);
    doc.text('Relevamiento', 10, 10);

    try {
        const logoImg = document.getElementById('logo');
        if (logoImg.complete) {
            const canvas = document.createElement('canvas');
            canvas.width  = logoImg.naturalWidth;
            canvas.height = logoImg.naturalHeight;
            canvas.getContext('2d').drawImage(logoImg, 0, 0);
            doc.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 250, 5, 40, 20);
        }
    } catch (e) {}

    doc.setFontSize(10);
    doc.text(`Entidad:   ${entidad}`,   10, 20);
    doc.text(`Sucursal:  ${sucursal}`,  10, 26);
    doc.text(`Dirección: ${direccion}`, 10, 32);
    doc.text(`Fecha:     ${fecha}`,     10, 38);
    doc.text(`Remito:    ${remito}`,    10, 44);

    let y = 54;

    document.querySelectorAll('.sector').forEach(sector => {
        const nombre = sector.querySelector('h3').textContent.trim();
        const filas = Array.from(sector.querySelectorAll('details tbody tr'))
            .map(tr => {
                const celdas = Array.from(tr.children).slice(0, 5);
                return celdas.map(td => {
                    const input = td.querySelector('input');
                    return input ? input.value.trim() : td.textContent.trim();
                });
            })
            .filter(f => parseInt(f[1]) > 0);

        if (filas.length === 0) return;

        const encabezado = ["Dispositivo", "Cantidad", "Modelo", "Zona(instantanea/24hs)", "Observación de ubicacion"];

        doc.autoTable({ startY: y, head: [[nombre]], theme: 'plain', styles: { fontSize: 11 }, margin: { left: 10, right: 10 } });
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 2,
            head: [encabezado],
            body: filas,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [197, 0, 0], textColor: 255 },
            margin: { left: 10, right: 10 }
        });

        y = doc.lastAutoTable.finalY + 14;
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : y;
    if (finalY > 160) {
        doc.addPage('landscape');
        finalY = 20;
    }

    doc.setFontSize(12);
    doc.text("Formulario completado por:", 14, finalY + 10);
    doc.setFontSize(14);
    doc.text(`Técnico: ${relevado}`, 14, finalY + 20);
    doc.setFontSize(10);
    doc.text("Firma:", 14, finalY + 40);
    doc.line(30, finalY + 42, 100, finalY + 42);

    doc.save('relevamiento.pdf');
}

document.getElementById('btn-generar-pdf').onclick = generarPDF;

/*******************************
 * Guardar en localStorage     *
 *******************************/
function guardarEstadoLocal() {
    const data = {
        entidad: document.getElementById('entidad')?.value || '',
        sucursal: document.getElementById('sucursal')?.value || '',
        direccion: document.getElementById('direccion')?.value || '',
        fecha: document.getElementById('fecha')?.value || '',
        remito: document.getElementById('remito')?.value || '',
        relevado: document.getElementById('relevado')?.value || '',
        sectores: []
    };

    document.querySelectorAll('.sector').forEach(sector => {
        const nombre = sector.querySelector('h3')?.textContent || '';
        const filas = Array.from(sector.querySelectorAll('details tbody tr')).map(tr => {
            const inputs = tr.querySelectorAll('input');
            return Array.from(inputs).map(inp => inp.value);
        });
        data.sectores.push({ nombre, filas });
    });

    localStorage.setItem('formularioRelevamiento', JSON.stringify(data));
}

document.addEventListener('input', guardarEstadoLocal);
function borrarFormulario() {
    localStorage.removeItem('formularioRelevamiento');
    
    // Limpiar campos principales
    ['entidad', 'sucursal', 'direccion', 'fecha', 'remito', 'relevado'].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = '';
    });

    // Borrar sectores y volver a cargar los predefinidos
    const contenedor = document.getElementById('contenedor-sectores');
    contenedor.innerHTML = '';
    const sectores = [
        "Salón / Cajas",
        "Área Operativa",
        "Banca Automática / Lobby 24hs",
        "Recinto Tesoro",
        "Recinto Cajas de Seguridad",
        "Bóveda de cajas de seguridad",
        "Bóveda de tesoro",
        "Bunker / Sala Técnica"
    ];
    sectores.forEach(nombre => agregarSectorPorNombre(nombre));

    paso = 0;
    mostrarPaso(paso);
}

function guardarRelevamientoLocal(clave) {
    const entidad = document.getElementById("entidad").value;
    const sucursal = document.getElementById("sucursal").value;
    const direccion = document.getElementById("direccion").value;
    const fecha = document.getElementById("fecha").value;
    const relevado = document.getElementById("relevado").value;
    const remito = document.getElementById("remito").value;
    const sectoresHTML = document.getElementById("contenedor-sectores").innerHTML;

    const datos = {
        entidad,
        sucursal,
        direccion,
        fecha,
        relevado,
        remito,
        sectoresHTML
    };

    localStorage.setItem(clave, JSON.stringify(datos));
    mostrarRelevamientosGuardados();
}

function mostrarRelevamientosGuardados() {
    const lista = document.getElementById("lista-relevamientos");
    lista.innerHTML = "";

    ["relevamientoBorrador1", "relevamientoBorrador2"].forEach((clave, i) => {
        const datos = JSON.parse(localStorage.getItem(clave));
        if (datos) {
            const li = document.createElement("li");
            li.innerHTML = `📁 Borrador ${i + 1}: ${datos.entidad} - ${datos.sucursal}
                <button onclick="eliminarRelevamiento('${clave}')">❌</button>`;
            li.style.cursor = "pointer";
            li.onclick = () => cargarRelevamientoLocal(clave);
            lista.appendChild(li);
        }
    });
}
function cargarRelevamientoLocal(clave) {
    const datos = JSON.parse(localStorage.getItem(clave));
    if (!datos) return;

    document.getElementById("entidad").value = datos.entidad || "";
    document.getElementById("sucursal").value = datos.sucursal || "";
    document.getElementById("direccion").value = datos.direccion || "";
    document.getElementById("fecha").value = datos.fecha || "";
    document.getElementById("relevado").value = datos.relevado || "";
    document.getElementById("remito").value = datos.remito || "";
    document.getElementById("contenedor-sectores").innerHTML = datos.sectoresHTML || "";
}
function eliminarRelevamiento(clave) {
    localStorage.removeItem(clave);
    mostrarRelevamientosGuardados(); // Vuelve a cargar la lista sin el eliminado
}
