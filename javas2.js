// Variables globales
let pasoCCTV = 0;
let seccionesCCTV = [];
let btnAtrasCCTV, btnSiguienteCCTV, contenedorSectores;

document.addEventListener('DOMContentLoaded', () => {
    seccionesCCTV = Array.from(document.querySelectorAll('.seccion-cctv'));
    btnAtrasCCTV = document.getElementById('atras-cctv');
    btnSiguienteCCTV = document.getElementById('siguiente-cctv');
    contenedorSectores = document.getElementById('contenedor-sectores-cctv');

    function mostrarPasoCCTV(index) {
        seccionesCCTV.forEach((seccion, i) => {
            seccion.style.display = i === index ? 'block' : 'none';
        });

        btnAtrasCCTV.style.display = index === 0 ? 'none' : 'inline-block';
        btnSiguienteCCTV.style.display = index >= seccionesCCTV.length - 1 ? 'none' : 'inline-block';
    }

    btnSiguienteCCTV.addEventListener('click', () => {
        if (pasoCCTV < seccionesCCTV.length - 1) {
            pasoCCTV++;
            mostrarPasoCCTV(pasoCCTV);
        }
    });

    btnAtrasCCTV.addEventListener('click', () => {
        if (pasoCCTV > 0) {
            pasoCCTV--;
            mostrarPasoCCTV(pasoCCTV);
        }
    });

    mostrarPasoCCTV(pasoCCTV);
});

let contadorSectores = 1;

function agregarSectorCCTV() {
    const sector = document.createElement('div');
    sector.classList.add('sector-cctv');
    const idTabla = `tabla-cctv-${contadorSectores}`;

    const tabla = document.createElement('table');
    tabla.className = 'tabla-cctv';
    tabla.id = idTabla;

    const thead = document.createElement('thead');
    thead.style.backgroundColor = '#cc0000';
    thead.style.color = 'white';
    thead.innerHTML = `
        <tr>
            <th>Dispositivo</th>
            <th>Tipo</th>
            <th>Modelo</th>
            <th>Canal (NVR)</th>
            <th>Observación / Ubicación</th>
            <th>Imagen</th>
        </tr>
    `;

    const tbody = document.createElement('tbody');
    tbody.id = `tbody-${idTabla}`;

    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td><input type="text" /></td>
        <td><input type="text" /></td>
        <td><input type="text" /></td>
        <td><input type="text" /></td>
        <td><input type="text" /></td>
        <td><input type="file" accept="image/*" class="img-dispositivo" onchange="mostrarMiniatura(this)" /></td>
    `;

    tbody.appendChild(fila);
    tabla.appendChild(thead);
    tabla.appendChild(tbody);

    sector.innerHTML = `
        <hr>
        <input type="text" class="titulo-sector-cctv" value="Nuevo sector ${contadorSectores}" />
    `;
    sector.appendChild(tabla);

    const botonAgregar = document.createElement('button');
    botonAgregar.type = 'button';
    botonAgregar.className = 'btn-agregar-dispositivo';
    botonAgregar.dataset.tabla = idTabla;
    botonAgregar.textContent = 'Agregar dispositivo';

    sector.appendChild(botonAgregar);
    contenedorSectores.appendChild(sector);
    contadorSectores++;
}

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-agregar-dispositivo')) {
        const idTabla = e.target.getAttribute('data-tabla');
        const tbody = document.querySelector(`#${idTabla} tbody`);
        if (tbody) {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><input type="text" /></td>
                <td><input type="text" /></td>
                <td><input type="text" /></td>
                <td><input type="text" /></td>
                <td><input type="text" /></td>
                <td><input type="file" accept="image/*" class="img-dispositivo" onchange="mostrarMiniatura(this)" /></td>
            `;
            tbody.appendChild(fila);
        }
    }
});

function mostrarMiniatura(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            let img = input.nextElementSibling;
            if (!img || img.tagName !== 'IMG') {
                img = document.createElement('img');
                img.style.height = '40px';
                img.style.marginTop = '5px';
                input.parentNode.appendChild(img);
            }
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
    });
}

document.getElementById('btn-generar-pdf-cctv').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    const logo = document.getElementById("logo");
    if (logo && logo.complete) {
        const canvas = document.createElement("canvas");
        canvas.width = logo.naturalWidth;
        canvas.height = logo.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(logo, 0, 0);
        const imgData = canvas.toDataURL("image/jpeg");
        doc.addImage(imgData, "JPEG", 250, 10, 40, 20);
    }

    doc.setFontSize(16);
    doc.text("Relevamiento CCTV", 14, 20);

    const campos = {
        Entidad: document.getElementById("entidad-cctv").value,
        Sucursal: document.getElementById("sucursal-cctv").value,
        Dirección: document.getElementById("direccion-cctv").value,
        Fecha: document.getElementById("fecha-cctv").value.split("-").reverse().join("/"),
        Remito: document.getElementById("remito-cctv").value,
    };

    doc.setFontSize(10);
    let y = 30;
    for (let [k, v] of Object.entries(campos)) {
        doc.text(`${k}: ${v}`, 14, y);
        y += 6;
    }

    const sectores = document.querySelectorAll(".sector-cctv");
    for (let sector of sectores) {
        const titulo = sector.querySelector(".titulo-sector-cctv")?.value || "Sector sin nombre";
        const tabla = sector.querySelector("table");
        if (!tabla) continue;

        const filas = Array.from(tabla.querySelectorAll("tbody tr")).filter(tr =>
            Array.from(tr.querySelectorAll("input[type='text']")).some(input => input.value.trim() !== "")
        );

        if (filas.length > 0) {
            doc.addPage("landscape");
            doc.setFontSize(14);
            doc.text(titulo, 14, 20);

            const data = filas.map(tr =>
                Array.from(tr.querySelectorAll("input[type='text']")).map(input => input.value)
            );

            const encabezado = Array.from(tabla.querySelectorAll("thead th"))
                .slice(0, 5)
                .map(th => th.innerText);

            doc.autoTable({
                head: [encabezado],
                body: data,
                startY: 30,
                margin: { left: 14, right: 14 },
                styles: { fontSize: 9 }
            });

            let imgY = doc.lastAutoTable.finalY + 5;
            for (let tr of filas) {
                const fileInput = tr.querySelector("input[type='file']");
                if (fileInput?.files?.[0]) {
                    try {
                        const imgBase64 = await fileToBase64(fileInput.files[0]);
                        doc.setFontSize(10);
                        doc.text("Imagen:", 14, imgY);
                        doc.addImage(imgBase64, 'JPEG', 20, imgY + 2, 60, 40);
                        imgY += 48;
                    } catch (e) {
                        console.warn("Error al procesar imagen:", e.message);
                    }
                } else {
                    imgY += 10;
                }
            }
        }
    }

    doc.save("Relevamiento_CCTV.pdf");
});
