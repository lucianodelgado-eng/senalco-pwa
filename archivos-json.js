/* Respaldo de relevamientos. Acceso exclusivamente a archivos elegidos por el técnico. */
window.ArchivosJSON = (() => {
  'use strict';
  let actual = null, carpeta = null, entradas = [], ocupado = false, secuencia = 0;
  const tipo = document.getElementById('tabla-base') ? 'base' : document.getElementById('form-relevamiento-cctv') ? 'cctv' : 'alarmas';
  const $ = id => document.getElementById(id);
  const normal = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const seguro = s => String(s || '').trim().replace(/[^\w\-()]/g, '_').slice(0, 150) || 'relevamiento';
  const sello = () => new Date().toISOString().replace(/[:.]/g, '-') + '-' + (++secuencia);
  const texto = v => typeof v === 'string' || typeof v === 'number';
  function valido(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
    if (d._archivoJSON?.tipo && d._archivoJSON.tipo !== tipo) return false;
    if (!['entidad','sucursal','direccion','fecha','remito','relevado','abonado','central','provincia'].every(k => d[k] == null || texto(d[k]))) return false;
    if (tipo === 'base') return Array.isArray(d.zonas) && d.zonas.every(z => z && ['zona','evento','area','dispositivo','descripcion'].every(k => z[k] == null || texto(z[k]))) && (!d.pt4000 || (typeof d.pt4000 === 'object' && (!d.pt4000.equipos || Array.isArray(d.pt4000.equipos))));
    if (tipo === 'cctv') return d._archivoJSON?.tipo === 'cctv' && Array.isArray(d.sectores) && d.sectores.every(s => s && texto(s.nombre) && Array.isArray(s.filas) && s.filas.every(f => f && Array.isArray(f.valores) && f.valores.length === 5 && f.valores.every(texto) && (!f.imagen || /^data:image\/(jpeg|png|webp|gif);base64,/i.test(f.imagen))));
    return Array.isArray(d.sectores) && d.sectores.every(s => s && texto(s.nombre) && Array.isArray(s.filas) && s.filas.every(f => Array.isArray(f) && f.length === 5 && f.every(texto)));
  }
  async function construir() {
    let d;
    if (tipo === 'base') d = construirJSONBase();
    else if (tipo === 'alarmas') d = buildRelevamientoData();
    else {
      d = { sectores: [] };
      for (const k of ['entidad','sucursal','direccion','fecha','remito']) d[k] = $(k + '-cctv').value;
      for (const sec of document.querySelectorAll('.sector-cctv')) {
        const filas = [];
        for (const tr of sec.querySelectorAll('tbody tr')) {
          const file = tr.querySelector('input[type=file]')?.files?.[0];
          filas.push({ valores: Array.from(tr.querySelectorAll('input[type=text]'), i => i.value), imagen: file ? await fileToBase64(file) : tr.querySelector('td img')?.src || '' });
        }
        d.sectores.push({ nombre: sec.querySelector('.titulo-sector-cctv').value, filas });
      }
    }
    d._archivoJSON = { tipo, version: 1, actualizado: new Date().toISOString() };
    return d;
  }
  function aplicar(d) {
    if (tipo === 'base') cargarDataEnPantalla(d);
    else if (tipo === 'alarmas') applyRelevamientoData(d);
    else {
      for (const k of ['entidad','sucursal','direccion','fecha','remito']) $(k + '-cctv').value = d[k] || '';
      $('contenedor-sectores-cctv').replaceChildren();
      contadorSectores = 1;
      for (const s of d.sectores) {
        agregarSectorCCTV();
        const sec = $('contenedor-sectores-cctv').lastElementChild;
        sec.querySelector('.titulo-sector-cctv').value = s.nombre;
        const tbody = sec.querySelector('tbody'), modelo = tbody.firstElementChild.cloneNode(true);
        tbody.replaceChildren();
        for (const f of s.filas) {
          const tr = modelo.cloneNode(true);
          tr.querySelectorAll('input[type=text]').forEach((i, n) => i.value = f.valores[n]);
          if (f.imagen) { const img = document.createElement('img'); img.src = f.imagen; img.style.height = '40px'; tr.lastElementChild.append(img); }
          tbody.append(tr);
        }
      }
    }
  }
  function avisar(t) { $('json-estado').textContent = t; }
  function recordar(origen) { actual = origen; avisar('Archivo abierto: ' + origen.name); }
  function reset() { actual = null; avisar('Nuevo relevamiento.'); }
  function descargar(d, name) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], {type:'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function eleccion() {
    const modal = $('json-decision');
    $('json-decision-nombre').textContent = actual.name;
    $('json-decision-nota').textContent = actual.handle ? 'Modificar reemplaza el JSON seleccionado. Crear nuevo conserva el original.' : 'Modificar actualiza la copia de la app y descarga una versión actualizada. El original de Descargas se conserva si el navegador no permite reemplazarlo.';
    modal.returnValue = "cancelar";
    modal.showModal();
    return new Promise(resolve => modal.addEventListener('close', () => resolve(modal.returnValue), {once:true}));
  }
  async function exportar() {
    if (ocupado) return null;
    ocupado = true;
    try {
      // Recuperar la identidad de una base local restaurada por la app.
      if (!actual && tipo === 'base' && getCurrentBaseName() && localStorage.getItem(baseKey(getCurrentBaseName()))) recordar({key:baseKey(getCurrentBaseName()),name:getCurrentBaseName()+'.json'});
      const modo = actual ? await eleccion() : 'nuevo';
      if (!['nuevo','modificar'].includes(modo)) return null;
      // Pedir permiso inmediatamente después del clic de Modificar.
      if (modo === 'modificar' && actual.handle && typeof actual.handle.requestPermission === 'function') {
        if (await actual.handle.requestPermission({mode:'readwrite'}) !== 'granted') { alert('No se autorizó modificar el archivo. No se exportó.'); return null; }
      }
      const d = await construir();
      const name = modo === 'modificar' ? (actual.handle ? actual.name : seguro(actual.name.replace(/\.json$/i,'').split('_actualizado_')[0])+'_actualizado_'+sello()+'.json') : seguro([tipo,d.entidad,d.sucursal,d.abonado || d.fecha].filter(Boolean).join('_'))+'_'+sello()+'.json';
      if (modo === 'modificar' && actual.handle) {
        const antes = await (await actual.handle.getFile()).text();
        if (actual.raw != null && antes !== actual.raw) { alert('El archivo cambió desde que lo abriste. Volvé a cargarlo antes de modificarlo.'); return null; }
        const stream = await actual.handle.createWritable();
        try { await stream.write(JSON.stringify(d,null,2)); await stream.close(); }
        catch (e) { try { await stream.abort(); } catch {} throw e; }
      } else descargar(d,name);
      const key = modo === 'modificar' && actual.key ? actual.key : tipo === 'base' ? baseKey(name.replace(/\.json$/i,'')) : 'relevamiento_json_' + name;
      const origen = {name, key, raw:JSON.stringify(d,null,2), handle:modo === 'modificar' ? actual.handle : null};
      // El respaldo en disco sigue siendo válido si el almacenamiento local está lleno.
      try {
        localStorage.setItem(key, JSON.stringify(d));
        if (tipo === 'base') { addToIndex(key.slice(BASE_PREFIX.length)); setCurrentBaseName(key.slice(BASE_PREFIX.length)); if (typeof idbPutBase === 'function') idbPutBase(key,d).catch(console.warn); renderBuscadorRapido(); renderBasesMini(); }
        else if (tipo === 'alarmas') refrescarListaRelevamientos();
      } catch { alert('El JSON se exportó, pero no hay espacio para guardar otra copia dentro de la app.'); }
      recordar(origen);
      avisar((origen.handle ? 'JSON actualizado: ' : 'JSON descargado: ') + name);
      return {base:name.replace(/\.json$/i,''),data:d};
    } catch (e) {
      if (e.name !== 'AbortError') alert('No se pudo guardar el JSON. Tus datos siguen en el formulario. ' + e.message);
      return null;
    } finally { ocupado = false; }
  }
  async function importar(file, handle = null) {
    try {
      const raw = await file.text(), d = JSON.parse(raw);
      if (!valido(d)) throw new Error('No corresponde a este formulario o tiene datos incompletos.');
      if (!confirm('¿Cargar ' + file.name + '? Se reemplazan los datos visibles del formulario.')) return;
      aplicar(d); recordar({name:file.name,handle,raw});
      if (tipo === 'base') setCurrentBaseName('');
      $('json-buscador').close();
    } catch (e) { alert('No se pudo cargar el JSON: ' + e.message); }
  }
  function locales() {
    return Object.keys(localStorage).filter(k => tipo === 'base' ? k.startsWith(BASE_PREFIX) && ![AUTOSAVE_KEY,FILTER_PREF_KEY].includes(k) : k.startsWith('relevamiento_json_') || (tipo === 'alarmas' && ['relevamientoBorrador1','relevamientoBorrador2'].includes(k))).flatMap(key => {
      try { const d=JSON.parse(localStorage.getItem(key)); return valido(d) ? [{key,name:key.replace(tipo==='base'?BASE_PREFIX:'relevamiento_json_','').replace(/\.json$/i,'')+'.json',data:d,ubicacion:'Guardado en la app'}] : []; } catch { return []; }
    });
  }
  function render() {
    const q=normal($('json-buscar').value), lista=$('json-lista'); lista.replaceChildren();
    const items=[...entradas,...locales()].filter(i => normal([i.name,i.ubicacion,i.data.entidad,i.data.sucursal,i.data.abonado,i.data.fecha,i.data.direccion,i.data.remito,i.data.relevado].join(' ')).includes(q));
    $('json-conteo').textContent=items.length+' relevamiento(s) compatible(s)';
    if (!items.length) { const p=document.createElement('p');p.textContent='No hay coincidencias. Elegí Descargas o agregá archivos JSON.';lista.append(p); }
    for (const i of items) {
      const b=document.createElement('button');b.type='button';b.className='json-archivo';
      const titulo=document.createElement('strong');titulo.textContent=i.name;
      const desc=document.createElement('span');desc.textContent=[i.data.entidad,i.data.sucursal,i.data.abonado,i.data.fecha,i.ubicacion].filter(Boolean).join(' · ');
      b.append(titulo,desc);b.onclick=async()=> {
        if (i.key) { if (!confirm('¿Cargar este relevamiento? Se reemplazan los datos visibles.')) return; aplicar(i.data);recordar({key:i.key,name:i.name});if(tipo==='base')setCurrentBaseName(i.key.slice(BASE_PREFIX.length));$('json-buscador').close(); }
        else { try { const f=i.handle?await i.handle.getFile():i.file;await importar(f,i.handle); } catch { alert('No se pudo releer el archivo. Volvé a seleccionar la carpeta o el JSON.'); } }
      };lista.append(b);
    }
  }
  async function indexar(files) {
    let ignorados=0; const nuevos=[];
    for (const i of files) {
      if (!/\.json$/i.test(i.file.name)) continue;
      try { const d=JSON.parse(await i.file.text());if (!valido(d)) {ignorados++;continue;}nuevos.push({...i,name:i.file.name,data:d}); } catch {ignorados++;}
    }
    entradas=nuevos;render();$('json-conteo').textContent += ignorados?' · '+ignorados+' JSON incompatible(s) o inválido(s) omitidos':'';
  }
  async function recorrer(dir, path=dir.name+'/') {
    const files=[];
    for await (const [name,h] of dir.entries()) {
      if (h.kind==='directory') files.push(...await recorrer(h,path+name+'/'));
      else if (/\.json$/i.test(name)) files.push({file:await h.getFile(),handle:h,ubicacion:path+name});
    }
    return files;
  }
  async function elegirCarpeta() {
    if (!window.showDirectoryPicker || !window.isSecureContext) { $('json-input-carpeta').click();return; }
    try { carpeta=await window.showDirectoryPicker({id:'relevamientos',startIn:'downloads',mode:'readwrite'});await indexar(await recorrer(carpeta)); }
    catch(e) { if(e.name!=='AbortError') { alert('No se pudo abrir la carpeta. Podés elegir los archivos JSON.'); } }
  }
  async function elegirArchivos() {
    if (!window.showOpenFilePicker || !window.isSecureContext) { $('json-input-archivos').click();return; }
    try { const hs=await window.showOpenFilePicker({multiple:true,startIn:'downloads',types:[{description:'Relevamientos JSON',accept:{'application/json':['.json']}}]});await indexar(await Promise.all(hs.map(async handle=>({handle,file:await handle.getFile(),ubicacion:'Archivo seleccionado'})))); }
    catch(e) { if(e.name!=='AbortError') alert('No se pudieron leer los archivos.'); }
  }
  function abrir() { render();$('json-buscador').showModal(); }
  document.addEventListener('DOMContentLoaded', () => {
    const css=document.createElement('style');css.textContent=`
      .json-modal{width:min(720px,94vw);max-height:86vh;padding:20px;border:0;border-radius:16px;background:#fff;color:#222;box-sizing:border-box;overflow:auto}
      .json-modal::backdrop{background:rgba(0,0,0,.6)} .json-modal h2{margin:0 0 12px;color:#222;font-size:21px}
      .json-modal p{line-height:1.45;color:#444} .json-modal .json-acciones{display:flex;gap:10px;flex-wrap:wrap}
      .json-modal button{margin-top:8px} .json-modal .json-archivo{display:block;width:100%;text-align:left;background:#f3f6fa;color:#222;border:1px solid #d4dce6;box-shadow:none;overflow-wrap:anywhere}
      .json-archivo span{display:block;margin-top:5px;font-weight:normal;font-size:13px;color:#444}
      #json-lista{max-height:45vh;overflow:auto;margin-top:10px} #json-estado{font-size:13px;line-height:1.5;color:inherit;overflow-wrap:anywhere}
      @media(max-width:600px){.json-modal{padding:14px}.json-modal .json-acciones{flex-direction:column}}
    `;document.head.append(css);
    const html=document.createElement('div');html.innerHTML=`
      <dialog id="json-buscador" class="json-modal" aria-labelledby="json-titulo">
        <h2 id="json-titulo">Buscar relevamientos JSON</h2>
        <p>Elegí Descargas u otra carpeta para buscar sus JSON. También podés seleccionar archivos. Se muestran los compatibles con este formulario.</p>
        <div class="json-acciones"><button type="button" id="json-carpeta">Elegir carpeta / Descargas</button><button type="button" id="json-archivos">Elegir archivos JSON</button><button type="button" id="json-refrescar">Actualizar lista</button></div>
        <label for="json-buscar">Buscador</label><input type="text" id="json-buscar" placeholder="Nombre, entidad, sucursal, abonado, fecha…">
        <p id="json-conteo" role="status"></p><div id="json-lista"></div>
        <button type="button" id="json-cerrar">Cerrar</button>
      </dialog>
      <dialog id="json-decision" class="json-modal" aria-labelledby="json-decision-titulo">
        <h2 id="json-decision-titulo">Guardar relevamiento</h2><p id="json-decision-nombre"></p><p id="json-decision-nota"></p>
        <div class="json-acciones"><button type="button" data-json-decision="nuevo">Crear nuevo archivo</button><button type="button" data-json-decision="modificar">Modificar el existente</button><button type="button" data-json-decision="cancelar">Cancelar</button></div>
      </dialog>
      <input type="file" id="json-input-archivos" accept=".json,application/json" multiple hidden>
      <input type="file" id="json-input-carpeta" webkitdirectory multiple hidden>
    `;document.body.append(html);
    const b=document.createElement('button');b.type='button';b.textContent='🔎 Buscar JSON en el equipo';b.id='btn-buscar-json';b.onclick=abrir;
    const ancla=$('btn-importar-json')||$('btn-importar-json-top')||$('siguiente-cctv');ancla.parentNode.append(b);
    const estado=document.createElement('p');estado.id='json-estado';estado.setAttribute('role','status');ancla.parentNode.after(estado);
    $('json-carpeta').onclick=elegirCarpeta;$('json-archivos').onclick=elegirArchivos;$('json-cerrar').onclick=()=>$('json-buscador').close();$('json-buscar').oninput=render;
    $('json-refrescar').onclick=async()=>{try{if(carpeta)await indexar(await recorrer(carpeta));else render();}catch{alert('No se pudo releer la carpeta. Volvé a elegirla.');}};
    document.querySelectorAll('[data-json-decision]').forEach(b=>b.onclick=()=>$('json-decision').close(b.dataset.jsonDecision));
    $('json-input-archivos').onchange=async e=>{await indexar(Array.from(e.target.files,f=>({file:f,ubicacion:'Archivo seleccionado'})));e.target.value='';};
    $('json-input-carpeta').onchange=async e=>{carpeta=null;await indexar(Array.from(e.target.files,f=>({file:f,ubicacion:f.webkitRelativePath||f.name})));e.target.value='';};
    $('json-decision').addEventListener('cancel',()=>{$('json-decision').returnValue='cancelar';});
  });
  return {exportar,importar,recordar,reset};
})();
