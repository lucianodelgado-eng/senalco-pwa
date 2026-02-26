// java-base.js — Señalco Base de Datos
// Objetivo: seleccionar sucursal desde sucursales.json, autocompletar datos,
// y al elegir una sucursal traer automáticamente el ÚLTIMO JSON guardado para esa sucursal.

(() => {
  "use strict";

  const SUCURSALES_JSON_URL = "sucursales.json"; // poner este archivo en la misma carpeta
  const KEY_SUC_CACHE = "senalco_sucursales_v1";
  const KEY_LATEST = "senalco_bases_latest_v1";
  const KEY_HISTORY = "senalco_bases_history_v1";

  let SUC_DATA = null;
  let zonasEditable123 = false;

  // ---------- helpers storage ----------
  function safeJSONParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
  }
  function loadLatestMap() {
    return safeJSONParse(localStorage.getItem(KEY_LATEST) || "{}", {});
  }
  function saveLatestMap(map) {
    localStorage.setItem(KEY_LATEST, JSON.stringify(map));
  }
  function loadHistoryArr() {
    return safeJSONParse(localStorage.getItem(KEY_HISTORY) || "[]", []);
  }
  function saveHistoryArr(arr) {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(arr));
  }

  // ---------- key ----------
  function makeKey(entidad, sucursal, abonado, central) {
    return [
      (entidad || "").trim().toLowerCase(),
      (sucursal || "").trim().toLowerCase(),
      (abonado || "").trim().toLowerCase(),
      (central || "").trim().toLowerCase(),
    ].join("|");
  }

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);

  function getUIHead() {
    return {
      entidad: ($("entidad")?.value || "").trim(),
      sucursal: ($("sucursal")?.value || "").trim(),
      abonado: ($("abonado")?.value || "").trim(),
      central: ($("central")?.value || "").trim(),
      provincia: ($("provincia")?.value || "").trim(),
    };
  }

  function setUIHead(head) {
    if ($("entidad")) $("entidad").value = head.entidad || "";
    if ($("sucursal")) $("sucursal").value = head.sucursal || "";
    if ($("abonado")) $("abonado").value = head.abonado || "";
    if ($("central")) $("central").value = head.central || "";
    if ($("provincia")) $("provincia").value = head.provincia || "";
  }

  // ---------- table ----------
  function ensureDefaultRows(count = 5) {
    const tbody = $("tabla-base")?.querySelector("tbody");
    if (!tbody) return;

    const existing = tbody.querySelectorAll("tr").length;
    if (existing >= count) return;

    for (let i = existing + 1; i <= count; i++) {
      const tr = document.createElement("tr");
      tr.dataset.zona = String(i);

      // Zona
      const tdZona = document.createElement("td");
      tdZona.textContent = `Zona ${i}`;
      tr.appendChild(tdZona);

      // Evento
      tr.appendChild(makeInputCell("evento", i));

      // Área
      tr.appendChild(makeInputCell("area", i));

      // Dispositivo
      tr.appendChild(makeInputCell("dispositivo", i));

      // Descripción
      tr.appendChild(makeInputCell("descripcion", i));

      tbody.appendChild(tr);
    }

    // Por defecto, bloqueamos edición Z1-3 (se habilita con botón)
    applyEditLockToZonas123();
  }

  function makeInputCell(field, zonaNum) {
    const td = document.createElement("td");
    const inp = document.createElement("input");
    inp.type = "text";
    inp.autocomplete = "off";
    inp.dataset.field = field;
    inp.dataset.zona = String(zonaNum);
    inp.placeholder = "-";
    td.appendChild(inp);
    return td;
  }

  function readTableRows() {
    const tbody = $("tabla-base")?.querySelector("tbody");
    if (!tbody) return [];
    const rows = [];
    tbody.querySelectorAll("tr").forEach(tr => {
      const zonaNum = tr.dataset.zona || "";
      const vals = {};
      tr.querySelectorAll("input").forEach(inp => {
        const f = inp.dataset.field;
        vals[f] = (inp.value || "").trim();
      });
      rows.push({
        zona: `Zona ${zonaNum}`,
        evento: vals.evento || "",
        area: vals.area || "",
        dispositivo: vals.dispositivo || "",
        descripcion: vals.descripcion || "",
      });
    });
    return rows;
  }

  function writeTableRows(rows) {
    const tbody = $("tabla-base")?.querySelector("tbody");
    if (!tbody) return;

    // reconstruimos
    tbody.innerHTML = "";
    const safeRows = Array.isArray(rows) ? rows : [];
    const count = Math.max(5, safeRows.length || 0);

    for (let i = 1; i <= count; i++) {
      const tr = document.createElement("tr");
      tr.dataset.zona = String(i);

      const tdZona = document.createElement("td");
      tdZona.textContent = `Zona ${i}`;
      tr.appendChild(tdZona);

      const r = safeRows[i - 1] || {};
      tr.appendChild(makeInputCellWithValue("evento", i, r.evento || ""));
      tr.appendChild(makeInputCellWithValue("area", i, r.area || ""));
      tr.appendChild(makeInputCellWithValue("dispositivo", i, r.dispositivo || ""));
      tr.appendChild(makeInputCellWithValue("descripcion", i, r.descripcion || ""));
      tbody.appendChild(tr);
    }

    applyEditLockToZonas123();
  }

  function makeInputCellWithValue(field, zonaNum, value) {
    const td = document.createElement("td");
    const inp = document.createElement("input");
    inp.type = "text";
    inp.autocomplete = "off";
    inp.dataset.field = field;
    inp.dataset.zona = String(zonaNum);
    inp.placeholder = "-";
    inp.value = value;
    td.appendChild(inp);
    return td;
  }

  function clearTableRows() {
    const tbody = $("tabla-base")?.querySelector("tbody");
    if (!tbody) return;
    tbody.querySelectorAll("input").forEach(inp => inp.value = "");
  }

  function applyEditLockToZonas123() {
    const tbody = $("tabla-base")?.querySelector("tbody");
    if (!tbody) return;
    tbody.querySelectorAll("tr").forEach(tr => {
      const zn = Number(tr.dataset.zona || "0");
      if (zn >= 1 && zn <= 3) {
        tr.querySelectorAll("input").forEach(inp => {
          inp.disabled = !zonasEditable123;
        });
      }
    });
  }

  // ---------- sucursales loading ----------
  async function loadSucursales() {
    // cache first
    const cached = localStorage.getItem(KEY_SUC_CACHE);
    if (cached) SUC_DATA = safeJSONParse(cached, null);

    if (!SUC_DATA) {
      const res = await fetch(SUCURSALES_JSON_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar sucursales.json");
      SUC_DATA = await res.json();
      localStorage.setItem(KEY_SUC_CACHE, JSON.stringify(SUC_DATA));
    }
  }

  function fillEntidadesDatalist() {
    const dl = $("lista-entidades");
    if (!dl || !SUC_DATA) return;
    dl.innerHTML = "";
    (SUC_DATA.entidades || []).forEach(ent => {
      const opt = document.createElement("option");
      opt.value = ent;
      dl.appendChild(opt);
    });
  }

  function fillSucursalesDatalistForEntidad(entidad) {
    const dl = $("lista-sucursales");
    if (!dl || !SUC_DATA) return;
    dl.innerHTML = "";

    const list = SUC_DATA?.sucursalesByEntidad?.[entidad] || [];
    list.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.Sucursal;
      dl.appendChild(opt);
    });

    // ✅ siempre "Otros"
    const optOtros = document.createElement("option");
    optOtros.value = "Otros";
    dl.appendChild(optOtros);
  }

  function findSucursal(entidad, sucursal) {
    const list = SUC_DATA?.sucursalesByEntidad?.[entidad] || [];
    return list.find(r => (r.Sucursal || "").trim().toLowerCase() === (sucursal || "").trim().toLowerCase()) || null;
  }

  // ---------- base latest ----------
  function buildBaseObjectFromUI() {
    const head = getUIHead();
    const key = makeKey(head.entidad, head.sucursal, head.abonado, head.central);
    return {
      version: 1,
      key,
      ...head,
      rows: readTableRows(),
      updatedAt: new Date().toISOString(),
    };
  }

  function saveBaseLatestAndBackup() {
    const base = buildBaseObjectFromUI();
    if (!base.entidad || !base.sucursal) {
      alert("Primero completá Entidad y Sucursal.");
      return null;
    }

    const latest = loadLatestMap();
    latest[base.key] = base;
    saveLatestMap(latest);

    const history = loadHistoryArr();
    history.push(base);
    saveHistoryArr(history);

    downloadJSON(base, fileSafeName(`${base.entidad}-${base.sucursal}-BASE.json`));
    refreshBasesListUI();
    return base;
  }

  function tryLoadLatestForCurrentSucursal() {
    const head = getUIHead();
    const key = makeKey(head.entidad, head.sucursal, head.abonado, head.central);
    const latest = loadLatestMap();
    const base = latest[key];

    if (base) {
      setUIHead(base);
      writeTableRows(base.rows || []);
      return true;
    } else {
      // no hay base: limpiamos SOLO la tabla (no tocamos cabecera)
      clearTableRows();
      return false;
    }
  }

  // ---------- UI bases list ----------
  function refreshBasesListUI() {
    const wrap = $("lista-bases-inline");
    if (!wrap) return;
    const latest = loadLatestMap();
    const items = Object.values(latest);

    // orden por updatedAt desc
    items.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

    wrap.innerHTML = "";
    if (!items.length) {
      wrap.innerHTML = `<div class="card"><b>Sin bases guardadas</b><div style="opacity:.8;margin-top:6px;">Guardá una base para que aparezca acá.</div></div>`;
      return;
    }

    items.forEach(base => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.cursor = "pointer";
      card.innerHTML = `
        <div style="font-weight:800">${escapeHTML(base.entidad || "")} — ${escapeHTML(base.sucursal || "")}</div>
        <div style="opacity:.85;font-size:13px;margin-top:6px">
          Abonado: <b>${escapeHTML(base.abonado || "-")}</b> · Central: <b>${escapeHTML(base.central || "-")}</b> · Prov: <b>${escapeHTML(base.provincia || "-")}</b>
        </div>
        <div style="opacity:.7;font-size:12px;margin-top:6px">Última: ${escapeHTML(formatDate(base.updatedAt))}</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="mini-btn" data-action="load">Cargar</button>
          <button class="mini-btn" data-action="download" style="background:#555">Backup JSON</button>
        </div>
      `;

      card.querySelector('[data-action="load"]').addEventListener("click", (e) => {
        e.stopPropagation();
        setUIHead(base);
        writeTableRows(base.rows || []);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      card.querySelector('[data-action="download"]').addEventListener("click", (e) => {
        e.stopPropagation();
        downloadJSON(base, fileSafeName(`${base.entidad}-${base.sucursal}-BASE.json`));
      });

      // click card carga
      card.addEventListener("click", () => {
        setUIHead(base);
        writeTableRows(base.rows || []);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      wrap.appendChild(card);
    });
  }

  // ---------- preview modal ----------
  function openPreviewModal() {
    const base = buildBaseObjectFromUI();
    const body = $("prev-body");
    const modal = $("modal-prev");
    if (!body || !modal) return;

    const rows = base.rows || [];
    const headHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="card"><b>Entidad</b><div>${escapeHTML(base.entidad || "-")}</div></div>
        <div class="card"><b>Sucursal</b><div>${escapeHTML(base.sucursal || "-")}</div></div>
        <div class="card"><b>Abonado</b><div>${escapeHTML(base.abonado || "-")}</div></div>
        <div class="card"><b>Central</b><div>${escapeHTML(base.central || "-")}</div></div>
        <div class="card"><b>Provincia</b><div>${escapeHTML(base.provincia || "-")}</div></div>
        <div class="card"><b>Filas</b><div>${rows.length}</div></div>
      </div>
    `;

    const tableHtml = `
      <div style="margin-top:12px;overflow:auto;">
        <table style="width:100%;border-collapse:collapse;background:#0d0d2a;color:#fff;border:1px solid rgba(255,255,255,.1)">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid rgba(255,255,255,.1)">Zona</th>
              <th style="padding:8px;border:1px solid rgba(255,255,255,.1)">Evento</th>
              <th style="padding:8px;border:1px solid rgba(255,255,255,.1)">Área</th>
              <th style="padding:8px;border:1px solid rgba(255,255,255,.1)">Dispositivo</th>
              <th style="padding:8px;border:1px solid rgba(255,255,255,.1)">Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td style="padding:8px;border:1px solid rgba(255,255,255,.1)">${escapeHTML(r.zona || "")}</td>
                <td style="padding:8px;border:1px solid rgba(255,255,255,.1)">${escapeHTML(r.evento || "")}</td>
                <td style="padding:8px;border:1px solid rgba(255,255,255,.1)">${escapeHTML(r.area || "")}</td>
                <td style="padding:8px;border:1px solid rgba(255,255,255,.1)">${escapeHTML(r.dispositivo || "")}</td>
                <td style="padding:8px;border:1px solid rgba(255,255,255,.1)">${escapeHTML(r.descripcion || "")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    body.innerHTML = headHtml + tableHtml;

    modal.style.display = "flex";

    const btnDown = $("btn-descargar-pdf-prev");
    if (btnDown) {
      btnDown.onclick = () => exportPDF(base);
    }
  }

  function closePreviewModal() {
    const modal = $("modal-prev");
    if (modal) modal.style.display = "none";
  }

  // ---------- export ----------
  function exportPDF(base) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { alert("jsPDF no está disponible."); return; }

    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const margin = 40;

    doc.setFontSize(14);
    doc.text("Base de Datos - Señalco", margin, 50);

    doc.setFontSize(10);
    const head = [
      ["Entidad", base.entidad || ""],
      ["Sucursal", base.sucursal || ""],
      ["Abonado", base.abonado || ""],
      ["Central", base.central || ""],
      ["Provincia", base.provincia || ""],
      ["Actualizado", formatDate(base.updatedAt)],
    ];

    let y = 70;
    head.forEach(([k, v]) => {
      doc.text(`${k}: ${v}`, margin, y);
      y += 14;
    });

    const rows = (base.rows || []).map(r => [
      r.zona || "",
      r.evento || "", 
      r.area || "",
      r.dispositivo || "",
      r.descripcion || ""
    ]);

    if (doc.autoTable) {
      doc.autoTable({
        startY: y + 10,
        head: [["Zona", "Evento", "Área", "Dispositivo", "Descripción"]],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [25, 118, 210] }
      });
    } else {
      doc.text("autoTable no está disponible.", margin, y + 20);
    }

    doc.save(fileSafeName(`${base.entidad}-${base.sucursal}-BASE.pdf`));
  }

  async function exportExcelSoloTabla() {
    if (!window.ExcelJS) { alert("ExcelJS no está disponible."); return; }

    const head = getUIHead();
    if (!head.entidad || !head.sucursal) {
      alert("Primero elegí Entidad y Sucursal.");
      return;
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Base");

    ws.addRow(["Zona", "Evento", "Área", "Dispositivo", "Descripción"]);

    const rows = readTableRows();
    rows.forEach(r => ws.addRow([r.zona, r.evento, r.area, r.dispositivo, r.descripcion]));

    // Nota: NO exportamos entidad/sucursal en la hoja principal (tu pedido).
    // Si querés, se puede agregar una hoja "Info" solo para referencia.

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileSafeName(`${head.entidad}-${head.sucursal}-BASE.xlsx`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }

  // Import Excel SOLO tabla (no toca entidad/sucursal/abonado/central/provincia)
  async function importExcelSoloTabla(file) {
    if (!window.ExcelJS) { alert("ExcelJS no está disponible."); return; }

    const head = getUIHead();
    if (!head.entidad || !head.sucursal) {
      alert("Primero elegí Entidad y Sucursal. Después importás el Excel.");
      return;
    }

    const data = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(data);

    const ws = wb.worksheets[0];
    if (!ws) { alert("El Excel no tiene hojas."); return; }

    // buscamos encabezado (zona + evento) en las primeras 10 filas
    let headerRowIdx = 1;
    for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
      const vals = (ws.getRow(r).values || []).map(v => String(v || "").trim().toLowerCase()).join("|");
      if (vals.includes("zona") && vals.includes("evento")) { headerRowIdx = r; break; }
    }

    const header = (ws.getRow(headerRowIdx).values || []).map(v => String(v || "").trim().toLowerCase());
    const colZona = header.findIndex(x => x === "zona");
    const colEvento = header.findIndex(x => x === "evento");
    const colArea = header.findIndex(x => x === "área" || x === "area");
    const colDisp = header.findIndex(x => x === "dispositivo");
    const colDesc = header.findIndex(x => x === "descripción" || x === "descripcion");

    if ([colZona, colEvento, colArea, colDisp, colDesc].some(i => i < 0)) {
      alert("El Excel no tiene las columnas esperadas: Zona, Evento, Área, Dispositivo, Descripción.");
      return;
    }

    const rows = [];
    for (let r = headerRowIdx + 1; r <= ws.rowCount; r++) {
      const rv = ws.getRow(r).values || [];
      const zona = String(rv[colZona] || "").trim();
      const evento = String(rv[colEvento] || "").trim();
      const area = String(rv[colArea] || "").trim();
      const disp = String(rv[colDisp] || "").trim();
      const desc = String(rv[colDesc] || "").trim();

      // si está toda vacía, salteamos
      if (!zona && !evento && !area && !disp && !desc) continue;

      rows.push({
        zona: zona || `Zona ${rows.length + 1}`,
        evento, area,
        dispositivo: disp,
        descripcion: desc
      });
    }

    writeTableRows(rows);
  }

  // ---------- util ----------
  function downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }

  function fileSafeName(name) {
    return String(name || "archivo")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatDate(iso) {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  }

  function escapeHTML(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- events ----------
  function bindUI() {
    // Botones
    $("btn-limpiar-base")?.addEventListener("click", () => {
      clearTableRows();
    });

    $("btn-guardar-rapido")?.addEventListener("click", () => {
      const saved = saveBaseLatestAndBackup();
      if (saved) alert("✅ Guardado OK (y backup descargado).");
    });

    $("btn-previsualizar")?.addEventListener("click", () => openPreviewModal());
    $("btn-cerrar-prev")?.addEventListener("click", () => closePreviewModal());

    $("btn-generar-pdf-base")?.addEventListener("click", () => {
      const base = buildBaseObjectFromUI();
      exportPDF(base);
    });

    $("btn-excel-base")?.addEventListener("click", () => exportExcelSoloTabla());

    // Editar/Bloquear Zonas 1-3
    $("btn-editar-zonas123")?.addEventListener("click", () => {
      zonasEditable123 = true;
      applyEditLockToZonas123();
      $("btn-editar-zonas123").style.display = "none";
      $("btn-bloquear-zonas123").style.display = "inline-block";
    });

    $("btn-bloquear-zonas123")?.addEventListener("click", () => {
      zonasEditable123 = false;
      applyEditLockToZonas123();
      $("btn-bloquear-zonas123").style.display = "none";
      $("btn-editar-zonas123").style.display = "inline-block";
    });

    // Import Excel
    $("btn-subir-excel")?.addEventListener("click", () => $("input-excel-base")?.click());
    $("input-excel-base")?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (file) await importExcelSoloTabla(file);
      e.target.value = "";
    });

    // Import 1 JSON (base)
    $("btn-importar-json-top")?.addEventListener("click", () => $("input-json-base-top")?.click());
    $("input-json-base-top")?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const txt = await file.text();
      const obj = safeJSONParse(txt, null);
      if (!obj) { alert("JSON inválido."); e.target.value = ""; return; }

      // si trae rows, lo cargamos
      if (obj.rows) {
        // no pisamos entidad/sucursal si ya están elegidas
        const head = getUIHead();
        if (!head.entidad && obj.entidad) setUIHead(obj);
        writeTableRows(obj.rows || []);
        alert("✅ JSON importado.");
      } else {
        alert("Ese JSON no parece una base válida (no trae 'rows').");
      }
      e.target.value = "";
    });

    // Import muchos JSON (carpeta/selección múltiple)
    $("btn-importar-muchos-json")?.addEventListener("click", () => $("input-json-muchos")?.click());
    $("input-json-muchos")?.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      let latestMap = loadLatestMap();
      let imported = 0;

      for (const f of files) {
        if (!f.name.toLowerCase().endsWith(".json")) continue;
        const obj = safeJSONParse(await f.text(), null);
        if (!obj || !obj.entidad || !obj.sucursal || !obj.rows) continue;

        const key = makeKey(obj.entidad, obj.sucursal, obj.abonado, obj.central);
        obj.key = key;
        obj.updatedAt = obj.updatedAt || new Date().toISOString();

        // comparo por updatedAt y me quedo con el más nuevo
        const prev = latestMap[key];
        if (!prev || String(obj.updatedAt) > String(prev.updatedAt || "")) {
          latestMap[key] = obj;
        }

        imported++;
      }

      saveLatestMap(latestMap);
      refreshBasesListUI();
      alert(`✅ Importados: ${imported} (se actualizó el "último" por sucursal).`);
      e.target.value = "";
    });

    // Buscador rápido (en latest)
    $("buscar-rapido")?.addEventListener("input", () => renderBuscador());
    $("btn-limpiar-buscador")?.addEventListener("click", () => {
      if ($("buscar-rapido")) $("buscar-rapido").value = "";
      // re-check filtros
      document.querySelectorAll(".filtro-check").forEach(ch => ch.checked = true);
      renderBuscador();
    });

    document.querySelectorAll(".filtro-check").forEach(ch => ch.addEventListener("change", renderBuscador));

    // Entidad/Sucursal autocompletar
    $("entidad")?.addEventListener("input", () => {
      const ent = ($("entidad").value || "").trim();
      fillSucursalesDatalistForEntidad(ent);
      // si cambia entidad, limpiamos sucursal y campos dependientes
      $("sucursal").value = "";
      $("abonado").value = "";
      $("central").value = "";
      $("provincia").value = "";
      clearTableRows();
    });

    $("sucursal")?.addEventListener("input", () => {
      const ent = ($("entidad").value || "").trim();
      const suc = ($("sucursal").value || "").trim();

      if (!ent) return;

      // Otros
      if (suc.toLowerCase() === "otros") {
        $("sucursal").value = "";
        $("sucursal").placeholder = "Escribí la sucursal nueva...";
        $("abonado").value = "";
        $("central").value = "";
        $("provincia").value = "";
        clearTableRows();
        return;
      }

      const found = findSucursal(ent, suc);
      if (found) {
        // autocompleta
        $("abonado").value = found.Abo || "";
        $("central").value = found["Id Central"] || "";
        $("provincia").value = found.Provincia || "";
        $("sucursal").placeholder = "Ej: Humberto Primo";

        // ✅ cargar último json si existe
        tryLoadLatestForCurrentSucursal();
      }
    });
  }

  function renderBuscador() {
    const wrap = $("buscador-resultados");
    if (!wrap) return;

    const q = ($("buscar-rapido")?.value || "").trim().toLowerCase();
    const latest = loadLatestMap();
    const items = Object.values(latest);

    const checks = Array.from(document.querySelectorAll(".filtro-check"));
    const activeFields = checks.filter(c => c.checked).map(c => c.value);

    // Si no hay checks activos, buscamos en todo
    const fields = activeFields.length ? activeFields : ["entidad","sucursal","abonado","central","provincia","nombre"];

    const filtered = !q ? [] : items.filter(b => {
      const hay = (f) => String(b[f] || "").toLowerCase().includes(q);
      // "nombre" lo tratamos como entidad+sucursal
      return fields.some(f => f === "nombre"
        ? `${b.entidad||""} ${b.sucursal||""}`.toLowerCase().includes(q)
        : hay(f)
      );
    }).slice(0, 30);

    wrap.innerHTML = "";
    if (!q) return;

    if (!filtered.length) {
      wrap.innerHTML = `<div class="card"><b>Sin resultados</b><div style="opacity:.8;margin-top:6px;">Probá con otra palabra.</div></div>`;
      return;
    }

    filtered.forEach(base => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.cursor = "pointer";
      card.innerHTML = `
        <div style="font-weight:800">${escapeHTML(base.entidad || "")} — ${escapeHTML(base.sucursal || "")}</div>
        <div style="opacity:.85;font-size:13px;margin-top:6px">
          Abonado: <b>${escapeHTML(base.abonado || "-")}</b> · Central: <b>${escapeHTML(base.central || "-")}</b> · Prov: <b>${escapeHTML(base.provincia || "-")}</b>
        </div>
        <div style="opacity:.7;font-size:12px;margin-top:6px">Última: ${escapeHTML(formatDate(base.updatedAt))}</div>
      `;
      card.addEventListener("click", () => {
        setUIHead(base);
        writeTableRows(base.rows || []);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      wrap.appendChild(card);
    });
  }

  // ---------- boot ----------
  async function boot() {
    ensureDefaultRows(5);

    try {
      await loadSucursales();
      fillEntidadesDatalist();

      // si ya hay entidad escrita al abrir, precargamos sucursales
      const ent = ($("entidad")?.value || "").trim();
      if (ent) fillSucursalesDatalistForEntidad(ent);
    } catch (e) {
      console.warn(e);
      // no cortamos la app si falta sucursales.json
    }

    bindUI();
    refreshBasesListUI();
  }

  window.addEventListener("load", boot);
})();