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
  if (!s || !s.user || !s.role) {
    window.location.replace("index.html");
  }
})();