// ── SANARIA — Firebase Init ──
(function () {
  var cfg = SANARIA_CONFIG.firebase;
  if (!firebase.apps.length) firebase.initializeApp(cfg);
  window._auth     = firebase.auth();
  window._db       = firebase.firestore();
  window._provider = new firebase.auth.GoogleAuthProvider();
  console.log('✅ Firebase ready');
})();
