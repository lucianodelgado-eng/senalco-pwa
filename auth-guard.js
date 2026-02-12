/* auth-guard.js
   Poner en TODAS las páginas protegidas (relevamiento1.html, index-base.html, index2.html, etc.)
   lo más arriba posible en <head>:

   <script src="auth-guard.js"></script>

   ✅ Si no hay sesión válida => redirige a login.html
*/

(function () {
  const SESSION_KEY = "senalco_session_v2";

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  const s = getSession();

  // Si no hay sesión => login
  if (!s || !s.user || !s.role) {
    // guarda a dónde quería ir para volver después (opcional)
    try { localStorage.setItem("senalco_redirect_after_login", location.pathname); } catch {}
    window.location.replace("login.html");
    return;
  }

  // Si querés, acá podés validar expiración futura (por ahora no expira)
})();