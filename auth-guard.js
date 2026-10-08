/* Control de navegación local; la autorización de datos compartidos debe validarse en servidor. */
(function () {
  'use strict';
  const KEY = 'senalco_session_v2';
  const INACTIVIDAD = 10 * 60 * 1000;
  const nombre = location.pathname.split('/').pop().toLowerCase();
  const permiso = { 'relevamiento1.html': 'relev', 'index-base.html': 'base', 'index2.html': 'cctv' }[nombre];
  const protegida = !!permiso;
  const guardadores = [];
  let timer, cerrando = false;
  function leer() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      const ultima = s?.lastActivity ?? s?.ts;
      if (!s || typeof s.user !== 'string' || !s.user.trim() || !['admin','user'].includes(s.role) ||
          !Number.isFinite(s.ts) || s.ts <= 0 || s.ts > Date.now() + 60000 ||
          !Number.isFinite(ultima) || ultima < s.ts || ultima > Date.now() + 60000 ||
          Date.now() - ultima >= INACTIVIDAD) return null;
      return s;
    } catch { return null; }
  }
  async function logout() {
    if (cerrando) return;
    cerrando = true;
    clearTimeout(timer);
    const estabaHabilitada = window.senalcoAuth.allowed;
    window.senalcoAuth.allowed = false;
    if (protegida) document.documentElement.style.visibility = 'hidden';
    // Sólo se elimina la sesión. Primero se conserva el formulario, incluso sin exportar.
    if (estabaHabilitada) {
      for (const guardar of guardadores) {
        try { await guardar(); } catch (e) { console.error('No se pudo guardar el borrador', e); }
      }
    }
    ['senalco_session_v2','senalco_session_v1','logueado','perfil','usuario','rol'].forEach(k => localStorage.removeItem(k));
    if (protegida) location.replace('index.html');
    else {
      cerrando = false;
      window.dispatchEvent(new Event('senalco-session-ended'));
    }
  }
  function comprobar() {
    if (cerrando) return false;
    clearTimeout(timer);
    const s = leer();
    if (!s) {
      if (protegida || localStorage.getItem(KEY) || window.senalcoAuth.allowed) logout();
      return false;
    }
    if (protegida && s.perms && s.perms[permiso] !== true) {
      window.senalcoAuth.allowed = false;
      document.documentElement.style.visibility = 'hidden';
      location.replace('index.html');
      return false;
    }
    window.senalcoAuth.allowed = true;
    if (protegida) document.documentElement.style.visibility = '';
    timer = setTimeout(comprobar, Math.max(1, INACTIVIDAD - (Date.now() - (s.lastActivity ?? s.ts))));
    return true;
  }
  function actividad(e) {
    if (!e.isTrusted || document.visibilityState === 'hidden' || !comprobar()) return;
    const s = leer();
    if (!s) return;
    // Limitar las escrituras durante el movimiento continuo del mouse.
    if (e.type === 'pointermove' && Date.now() - (s.lastActivity ?? s.ts) < 1000) return;
    s.lastActivity = Date.now();
    localStorage.setItem(KEY, JSON.stringify(s));
    comprobar();
  }
  window.senalcoAuth = {allowed:false, logout, readSession:leer, check:comprobar,
    registerDraftSaver(fn) { guardadores.push(fn); }};
  if (protegida) document.documentElement.style.visibility = 'hidden';
  comprobar();
  ['pointerdown','pointermove','keydown','input','change','wheel','touchstart','touchmove'].forEach(tipo => {
    document.addEventListener(tipo, actividad, {capture:true, passive:true});
  });
  window.addEventListener('pageshow', comprobar);
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) comprobar(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') comprobar(); });
})();
