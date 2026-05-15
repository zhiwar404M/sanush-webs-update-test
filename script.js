// ══════════════════════════════════════════
//  SANARIA — script.js  (تەواو و پاک)
// ══════════════════════════════════════════

// ── STATE ──────────────────────────────────
var _accounts    = [];
var _activeTab   = 'all';
var _user        = null;
var _unsub       = null;
var _pendingFn   = null;
var _searchQuery = '';
var _searchOpen  = false;

var CURRENCIES = [
  { val:'IQD', label:'دینار عێراقی' },
  { val:'USD', label:'دۆلاری ئەمریکی' },
  { val:'SAR', label:'ریال سعودی' },
  { val:'BHD', label:'دینار بەحرەینی' },
  { val:'YER', label:'ریال یەمەنی' },
  { val:'EUR', label:'یۆرۆ' },
];
var CUR_OPTS = CURRENCIES.map(function(c){
  return '<option value="'+c.val+'">'+c.label+'</option>';
}).join('');
function curLabel(v){ return (CURRENCIES.find(function(c){return c.val===v;})||{label:v}).label; }
function uid()  { return Date.now().toString(36)+Math.random().toString(36).slice(2); }
function today(){ return new Date().toISOString().split('T')[0]; }

// ── ARABIC NUMBERS ──────────────────────────
var AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toAr(n){ return String(n).split('').map(function(d){return AR[+d]||d;}).join(''); }

// ══════════════════════════════════════════
//  LOADING SCREEN
// ══════════════════════════════════════════
(function runLoader(){
  // Particles
  var pc = document.getElementById('ldr-particles');
  if (pc) {
    for (var i=0; i<22; i++) {
      var p = document.createElement('div');
      p.className = 'ldr-particle';
      var s = 3 + Math.random()*10;
      p.style.cssText = 'width:'+s+'px;height:'+s+'px;left:'+Math.random()*100+'%;animation-duration:'+(6+Math.random()*10)+'s;animation-delay:'+(Math.random()*6)+'s;';
      pc.appendChild(p);
    }
  }
  // Progress counter
  var pct = 0;
  var pctEl = document.getElementById('ldr-pct');
  var iv = setInterval(function(){
    pct = Math.min(pct + Math.random()*18, 100);
    if (pctEl) pctEl.textContent = toAr(Math.round(pct)) + '٪';
    if (pct >= 100) { clearInterval(iv); setTimeout(hideLoader, 200); }
  }, 100);
})();

function hideLoader(){
  var loader = document.getElementById('loader');
  var app    = document.getElementById('app');
  if (!loader || !app) return;
  loader.classList.add('hide');
  setTimeout(function(){
    loader.style.display = 'none';
    app.style.display    = 'block';
  }, 500);
}

// ══════════════════════════════════════════
//  INIT ON LOAD
// ══════════════════════════════════════════
window.addEventListener('load', function(){
  // Maintenance check
  if (typeof SANARIA !== 'undefined' && SANARIA.maintenance) {
    location.href = 'maintenance.html';
    return;
  }
  // Firebase auth
  initAuth();
  // Update dialog after 2s
  setTimeout(checkUpdate, 2000);
});

// ══════════════════════════════════════════
//  FIREBASE / AUTH
// ══════════════════════════════════════════
function initAuth(){
  window._auth.onAuthStateChanged(function(user){
    _user = user;
    updateTopbarUI(user);
    if (user){
      closeModal('modal-login');
      startListening(user.uid);
      if (_pendingFn){ var fn=_pendingFn; _pendingFn=null; fn(); }
    } else {
      stopListening();
      renderList();
    }
  });
}

function saveToCloud(){
  if (!_user) return;
  window._db.collection('users').doc(_user.uid)
    .set({ accounts: _accounts })
    .catch(function(e){ console.error('Save:', e); });
}

function startListening(uid){
  if (_unsub) _unsub();
  _unsub = window._db.collection('users').doc(uid).onSnapshot(function(snap){
    _accounts = snap.exists ? (snap.data().accounts || []) : [];
    if (!snap.exists) seedDemo();
    renderList();
  }, function(e){ console.error('Listener:', e); });
}

function stopListening(){
  if (_unsub){ _unsub(); _unsub = null; }
  _accounts = [];
}



window.requireAuth = function(fn){
  if (_user) fn();
  else { _pendingFn = fn; showLoginModal('login'); }
};

// ══════════════════════════════════════════
//  UPDATE DIALOG
// ══════════════════════════════════════════
function checkUpdate(){
  if (typeof SANARIA === 'undefined') return;
  var ver  = SANARIA.version;
  if (localStorage.getItem('seen_v') === ver) return;
  var el   = document.getElementById('modal-update');
  var verEl= document.getElementById('update-ver');
  var notesEl = document.getElementById('update-notes');
  if (!el) return;
  if (verEl) verEl.textContent = 'وەرژن ' + ver;
  if (notesEl && SANARIA.updateNotes) {
    notesEl.innerHTML = SANARIA.updateNotes.map(function(n){
      return '<div class="update-note">✦ '+n+'</div>';
    }).join('');
  }
  el.style.display = 'flex';
}
window.closeUpdate = function(){
  if (typeof SANARIA !== 'undefined') localStorage.setItem('seen_v', SANARIA.version);
  var el = document.getElementById('modal-update');
  if (el) el.style.display = 'none';
};

// ══════════════════════════════════════════
//  TOPBAR / USER MENU
// ══════════════════════════════════════════
function updateTopbarUI(user){
  var lb = document.getElementById('topbar-login-btn');
  var ub = document.getElementById('topbar-user-btn');
  var av = document.getElementById('topbar-avatar');
  var ma = document.getElementById('menu-avatar');
  var mn = document.getElementById('menu-name');
  var me = document.getElementById('menu-email');
  if (!lb) return;
  if (user){
    lb.style.display = 'none';
    ub.style.display = 'flex';
    var photo = user.photoURL ||
      'https://ui-avatars.com/api/?name='+encodeURIComponent(user.displayName||user.email)+'&background=00a8b5&color=fff&size=64';
    if (av) av.src = photo;
    if (ma) ma.src = photo;
    if (mn) mn.textContent = user.displayName || user.email.split('@')[0];
    if (me) me.textContent = user.email;
  } else {
    lb.style.display = 'flex';
    ub.style.display = 'none';
  }
}

window.toggleUserMenu = function(){
  var m = document.getElementById('user-menu');
  if (m) m.style.display = m.style.display==='none' ? 'block' : 'none';
};
document.addEventListener('click', function(e){
  var m  = document.getElementById('user-menu');
  var ub = document.getElementById('topbar-user-btn');
  if (m && ub && !m.contains(e.target) && !ub.contains(e.target))
    m.style.display = 'none';
});

// ══════════════════════════════════════════
//  AUTH MODAL
// ══════════════════════════════════════════
window.showLoginModal = function(tab){
  clearAuthError();
  document.getElementById('modal-login').classList.add('show');
  switchTab(tab || 'login');
};
window.switchTab = function(tab){
  document.getElementById('form-login').style.display    = tab==='login'    ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab==='register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active',    tab==='login');
  document.getElementById('tab-register').classList.toggle('active', tab==='register');
  clearAuthError();
};
function showAuthError(msg){ var el=document.getElementById('auth-error'); if(el){el.textContent=msg;el.style.display='block';} }
function clearAuthError()  { var el=document.getElementById('auth-error'); if(el){el.textContent='';el.style.display='none';} }

window.doEmailLogin = function(){
  clearAuthError();
  var email = (document.getElementById('li-email').value||'').trim();
  var pass  = document.getElementById('li-pass').value||'';
  if (!email||!pass){ showAuthError('تکایە هەموو خانەکان پڕ بکەرەوە'); return; }
  window._auth.signInWithEmailAndPassword(email, pass)
    .then(function(){ toast('✅ بەخێربێیت!'); })
    .catch(function(e){
      var m = {
        'auth/user-not-found':     'ئەم ئیمەیڵە تۆمار نەکراوە',
        'auth/wrong-password':     'پاسووەردەکە هەڵەیە',
        'auth/invalid-email':      'ئیمەیڵەکە هەڵەیە',
        'auth/invalid-credential': 'ئیمەیڵ یان پاسووەرد هەڵەیە',
        'auth/too-many-requests':  'زۆر هەوڵت دا، کەمێ چاوەڕوانبە',
      };
      showAuthError(m[e.code] || 'هەڵە: '+e.message);
    });
};

window.doRegister = function(){
  clearAuthError();
  var name  = (document.getElementById('reg-name').value||'').trim();
  var email = (document.getElementById('reg-email').value||'').trim();
  var pass  = document.getElementById('reg-pass').value||'';
  if (!name||!email||!pass){ showAuthError('تکایە هەموو خانەکان پڕ بکەرەوە'); return; }
  if (pass.length < 6)     { showAuthError('پاسووەرد دەبێت ٦ پیت زیاتر بێت'); return; }
  window._auth.createUserWithEmailAndPassword(email, pass)
    .then(function(c){
      return c.user.updateProfile({ displayName: name }).then(function(){
        // OTP بۆ Google Sheets
        if (typeof SANARIA !== 'undefined' && SANARIA.sheetsURL) {
          var otp = Math.floor(100000+Math.random()*900000).toString();
          fetch(SANARIA.sheetsURL, {
            method:'POST',
            body: new URLSearchParams({action:'register',email:email,name:name,otp:otp,time:new Date().toLocaleString()})
          }).catch(function(){});
        }
        toast('✅ تۆمارکردن سەرکەوت!');
      });
    })
    .catch(function(e){
      var m = {
        'auth/email-already-in-use': 'ئەم ئیمەیڵە پێشتر تۆمارکراوە',
        'auth/invalid-email':        'ئیمەیڵەکە هەڵەیە',
        'auth/weak-password':        'پاسووەرد زۆر سووک',
      };
      showAuthError(m[e.code] || 'هەڵە: '+e.message);
    });
};

window.handleSignIn = function(){
  clearAuthError();
  window._auth.signInWithPopup(window._provider)
    .then(function(){ toast('✅ بەخێربێیت!'); })
    .catch(function(e){ showAuthError('Google: '+e.message); });
};

window.handleSignOut = function(){
  var m = document.getElementById('user-menu');
  if (m) m.style.display = 'none';
  stopListening();
  window._auth.signOut().then(function(){
    renderList();
    toast('👋 بە سەرچەوتووی چونەیتە دەرەوە ');
  });
};

// ══════════════════════════════════════════
//  SEARCH — کوردی / عەرەبی / لاتینی
// ══════════════════════════════════════════
var KU_MAP = [
  ['ژ','zh'],['چ','ch'],['ش','sh'],['خ','kh'],['غ','gh'],
  ['ڵ','ll'],['ڕ','rr'],['ۆ','o'], ['ێ','e'], ['ی','y'],
  ['و','w'], ['ە','a'], ['ا','a'], ['ب','b'], ['پ','p'],
  ['ت','t'], ['ج','j'], ['د','d'], ['ر','r'], ['ز','z'],
  ['س','s'], ['ع','a'], ['ف','f'], ['ڤ','v'], ['ق','q'],
  ['ک','k'], ['گ','g'], ['ل','l'], ['م','m'], ['ن','n'],
  ['ه','h'], ['ح','h'], ['ط','t'], ['ص','s'], ['ض','d'],
  ['ظ','z'], ['ذ','z'], ['ث','s'], ['ئ',''],  ['ء',''],
  ['إ','a'], ['أ','a'], ['آ','a'], ['ة','h'], ['ى','y'],
];

function toLatin(str){
  if (!str) return '';
  var s = str.toLowerCase().replace(/[\u064B-\u065F\u0670]/g,'');
  KU_MAP.forEach(function(p){ s = s.split(p[0]).join(p[1]); });
  return s.replace(/\s+/g,' ').trim();
}
function normStr(str){
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g,'')
    .replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي')
    .replace(/\s+/g,' ').trim();
}
function matchSearch(name, q){
  if (!name||!q) return !q;
  var nq = normStr(q), nn = normStr(name);
  if (nn.indexOf(nq) > -1) return true;
  var lq = toLatin(q), ln = toLatin(name);
  if (ln.indexOf(lq) > -1) return true;
  if (ln.indexOf(q.toLowerCase().trim()) > -1) return true;
  return false;
}

window.toggleSearch = function(){
  _searchOpen = !_searchOpen;
  var bar   = document.getElementById('search-bar');
  var input = document.getElementById('search-input');
  var btn   = document.getElementById('btn-search');
  if (_searchOpen){
    bar.style.display = 'block';
    if (btn) btn.style.background = 'rgba(255,255,255,.22)';
    setTimeout(function(){ if (input) input.focus(); }, 80);
  } else {
    bar.style.display = 'none';
    if (btn) btn.style.background = '';
    clearSearch();
  }
};

window.clearSearch = function(){
  _searchQuery = '';
  var input = document.getElementById('search-input');
  var clear = document.getElementById('search-clear');
  var count = document.getElementById('search-count');
  if (input) input.value = '';
  if (clear) clear.style.display = 'none';
  if (count) count.style.display = 'none';
  renderList();
};

window.doSearch = function(val){
  _searchQuery = val || '';
  var clear = document.getElementById('search-clear');
  if (clear) clear.style.display = _searchQuery ? 'flex' : 'none';
  renderList();
};

// ══════════════════════════════════════════
//  PAGES / TABS
// ══════════════════════════════════════════
window.gotoPage = function(id){
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  if (id==='page-main') renderList();
};

window.filterTab = function(type, el){
  _activeTab = type;
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  el.classList.add('active');
  renderList();
};

// ══════════════════════════════════════════
//  RENDER LIST
// ══════════════════════════════════════════
function typeLabel(t){ return t==='customer'?'کڕیار':t==='supplier'?'دابینکەر':'گشتی'; }

function getBals(a){
  var b = {};
  (a.transactions||[]).forEach(function(t){
    if (!b[t.currency]) b[t.currency]={debit:0,credit:0};
    if (t.type==='debit') b[t.currency].debit  += Number(t.amount);
    else                  b[t.currency].credit += Number(t.amount);
  });
  return b;
}

function renderList(){
  var el = document.getElementById('user-list');
  if (!el) return;

  // Not logged in
  if (!_user){
    el.innerHTML =
      '<div class="login-prompt" onclick="showLoginModal(\'login\')">'
      +'<div class="lp-icon">🔐</div>'
      +'<div class="lp-title">داخیلبوون پێویستە</div>'
      +'<div class="lp-sub">بۆ بینین و بەڕێوەبردنی ئەکاونتەکانت</div>'
      +'<div class="lp-btns">'
      +'<button class="lp-btn-main" onclick="event.stopPropagation();showLoginModal(\'login\')">چوونەژوورەوە</button>'
      +'<button class="lp-btn-sec"  onclick="event.stopPropagation();showLoginModal(\'register\')">تۆمارکردن</button>'
      +'</div></div>';
    return;
  }

  // Tab filter
  var list = _activeTab==='all'
    ? _accounts
    : _accounts.filter(function(a){ return a.type===_activeTab; });

  // Search filter
  var q = (_searchQuery||'').trim();
  if (q) {
    list = list.filter(function(a){
      return matchSearch(a.name||'', q)
          || matchSearch(a.phone||'', q)
          || matchSearch(a.email||'', q);
    });
  }

  // Result count
  var countEl = document.getElementById('search-count');
  if (q && countEl){
    countEl.textContent  = list.length + ' ئەنجام دۆزرایەوە';
    countEl.style.display = 'block';
  } else if (countEl) {
    countEl.style.display = 'none';
  }

  if (!list.length){
    el.innerHTML = q
      ? '<div class="search-empty"><div class="se-icon">🔍</div><div class="se-title">هیچ ئەنجامێک نەدۆزرایەوە</div><div class="se-sub">«'+q+'» بۆ ناوێکی تر تاقی بکەرەوە</div></div>'
      : '<div class="empty-msg" style="padding:28px 0">هیچ ئەکاونتێک نییە.<br>دووگمەی + بکەرەوە.</div>';
    return;
  }

  el.innerHTML = list.map(function(a){ return buildCard(a, q); }).join('');
}

function highlightName(name, q){
  if (!q) return name;
  // Try Kurdish match
  var nn = normStr(name), nq = normStr(q);
  var idx = nn.indexOf(nq);
  if (idx > -1 && nq.length > 0){
    return name.slice(0,idx)+'<mark class="hl">'+name.slice(idx,idx+nq.length)+'</mark>'+name.slice(idx+nq.length);
  }
  // Latin match — highlight full name
  if (toLatin(name).indexOf(toLatin(q)) > -1 || toLatin(name).indexOf(q.toLowerCase().trim()) > -1){
    return '<mark class="hl">'+name+'</mark>';
  }
  return name;
}

function buildCard(a, q){
  var bals = getBals(a);
  var hasT = (a.transactions||[]).length > 0;

  var chips = Object.entries(bals).map(function(e){
    var cur=e[0], b=e[1], rem=b.debit-b.credit;
    return '<span class="bal-chip bc-d">▲ '+b.debit+' <small>'+curLabel(cur)+'</small></span>'
          +'<span class="bal-chip bc-c">▼ '+b.credit+' <small>'+curLabel(cur)+'</small></span>'
          +'<span class="bal-chip bc-r '+(rem>=0?'neg':'pos')+'">⚖ '+Math.abs(rem)+' <small>'+curLabel(cur)+'</small></span>';
  }).join('');

  var rows = (a.transactions||[]).map(function(t,i){
    return '<tr>'
      +'<td style="font-size:.72rem;color:var(--text-light)">'+t.date+'</td>'
      +'<td style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(t.desc||'—')+'</td>'
      +'<td>'+(t.type==='debit'  ?'<span class="amt-o">'+t.amount+'</span>':'—')+'</td>'
      +'<td>'+(t.type==='credit' ?'<span class="amt-g">'+t.amount+'</span>':'—')+'</td>'
      +'<td><span class="cur-tag ct-'+t.currency+'">'+curLabel(t.currency)+'</span></td>'
      +'<td><button class="btn-del-row" onclick="delTrans(\''+a.id+'\','+i+')">🗑</button></td>'
      +'</tr>';
  }).join('');

  var sumC = Object.entries(bals).map(function(e){
    var cur=e[0], b=e[1], rem=b.debit-b.credit;
    return '<div class="sum-chip"><div class="sl">'+curLabel(cur)+'</div>'
      +'<div class="sv" style="color:'+(rem>0?'var(--orange)':rem<0?'var(--green)':'var(--text-light)')+'">'+Math.abs(rem)+' '+(rem>0?'دانەوە':rem<0?'قەرز':'سفر')+'</div></div>';
  }).join('');

  return '<div class="user-card" id="card-'+a.id+'">'
    +'<div class="user-card-header" onclick="togglePanel(\''+a.id+'\')">'
    +'<div class="user-hdr-left">'
    +'<span class="link-detail" onclick="event.stopPropagation();showDetail(\''+a.id+'\')">وردەکاری</span>'
    +'<button class="btn-del-user" onclick="event.stopPropagation();askDeleteUser(\''+a.id+'\',\''+a.name+'\')">🗑</button>'
    +'<button class="btn-add-trans" onclick="event.stopPropagation();openForm(\''+a.id+'\')">+</button>'
    +'</div>'
    +'<div class="user-info"><div>'
    +'<div class="user-name">'+highlightName(a.name,q)+'</div>'
    +'<span class="user-type-tag">'+typeLabel(a.type)+'</span>'
    +'</div><div class="user-avatar" onclick="event.stopPropagation();showUserInfo(\''+a.id+'\')">👤</div></div></div>'
    +(Object.keys(bals).length?'<div class="user-balance-row">'+chips+'</div>':'')
    +'<div class="trans-panel" id="panel-'+a.id+'">'
    +'<div class="add-form">'
    +'<div class="frow"><div class="field"><label>بڕی پارە</label><input type="number" id="amt-'+a.id+'" placeholder="٠" min="0" step="any"></div>'
    +'<div class="field"><label>دراو</label><select id="cur-'+a.id+'">'+CUR_OPTS+'</select></div></div>'
    +'<div class="frow"><div class="field"><label>بەروار</label><input type="date" id="date-'+a.id+'" value="'+today()+'"></div>'
    +'<div class="field span2" style="grid-column:2/3"><label>تێبینی</label><input type="text" id="desc-'+a.id+'" placeholder="تێبینی..."></div></div>'
    +'<div class="form-btns">'
    +'<button class="btn-down" onclick="addTrans(\''+a.id+'\',\'debit\')">▼ دانەوە</button>'
    +'<button class="btn-up"   onclick="addTrans(\''+a.id+'\',\'credit\')">▲ قەرز</button>'
    +'</div></div>'
    +(hasT
      ?'<table class="trans-table"><thead><tr><th>بەروار</th><th>تێبینی</th><th>دانەوە▼</th><th>قەرز▲</th><th>دراو</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
        +(Object.keys(bals).length?'<div class="sum-row">'+sumC+'</div>':'')
      :'<div class="empty-msg">هیچ مامەڵەیەک نییە</div>')
    +'</div></div>';
}

// ══════════════════════════════════════════
//  PANEL
// ══════════════════════════════════════════
window.togglePanel = function(id){ document.getElementById('panel-'+id).classList.toggle('open'); };
window.openForm    = function(id){
  document.getElementById('panel-'+id).classList.add('open');
  setTimeout(function(){ var i=document.getElementById('amt-'+id); if(i)i.focus(); }, 80);
};

// ══════════════════════════════════════════
//  TRANSACTIONS
// ══════════════════════════════════════════
window.addTrans = function(id, type){
  if (!_user){ _pendingFn=function(){window.addTrans(id,type);}; showLoginModal('login'); return; }
  var a = _accounts.find(function(a){return a.id===id;}); if (!a) return;
  var amt  = parseFloat(document.getElementById('amt-'+id).value);
  if (!amt||amt<=0){ toast('تکایە بڕی پارەکە بنووسە'); return; }
  var cur  = document.getElementById('cur-'+id).value;
  var date = document.getElementById('date-'+id).value || today();
  var desc = (document.getElementById('desc-'+id).value||'').trim();
  if (!a.transactions) a.transactions=[];
  a.transactions.push({id:uid(),type:type,amount:amt,currency:cur,date:date,desc:desc});
  saveToCloud();
  toast(type==='credit'?'✅ قەرز زیاد کرا':'✅ دانەوە زیاد کرا');
};

window.delTrans = function(aid, idx){
  var a = _accounts.find(function(a){return a.id===aid;}); if (!a) return;
  a.transactions.splice(idx,1);
  saveToCloud();
  toast('🗑 مامەڵەکە سڕایەوە');
};

window.askDeleteUser = function(id, name){
  document.getElementById('confirm-msg').textContent = 'دەتەوێت ئەکاونتی "'+name+'" بسڕیتەوە؟';
  document.getElementById('cf-yes').onclick = function(){
    _accounts = _accounts.filter(function(a){return a.id!==id;});
    saveToCloud();
    closeModal('modal-confirm');
    toast('🗑 ئەکاونت سڕایەوە');
  };
  document.getElementById('modal-confirm').classList.add('show');
};

window.saveAccount = function(){
  if (!_user){ showLoginModal('login'); return; }
  var name = (document.getElementById('nf-name').value||'').trim();
  if (!name){ toast('تکایە ناوەکەت بنووسە'); return; }
  _accounts.push({
    id:uid(), name:name,
    phone:(document.getElementById('nf-phone').value||'').trim(),
    email:(document.getElementById('nf-email').value||'').trim(),
    type: document.getElementById('nf-type').value,
    transactions:[]
  });
  saveToCloud();
  ['nf-name','nf-phone','nf-email'].forEach(function(i){document.getElementById(i).value='';});
  toast('✅ ئەکاونت پاشەکەوت کرا');
  window.gotoPage('page-main');
};

// ══════════════════════════════════════════
//  SUMMARY / DETAIL
// ══════════════════════════════════════════
window.showSummaryModal = function(){
  var totals = {};
  _accounts.forEach(function(a){
    (a.transactions||[]).forEach(function(t){
      if (!totals[t.currency]) totals[t.currency]={debit:0,credit:0};
      if (t.type==='debit') totals[t.currency].debit  += Number(t.amount);
      else                  totals[t.currency].credit += Number(t.amount);
    });
  });
  var rows = Object.entries(totals).map(function(e){
    var cur=e[0], b=e[1], rem=b.debit-b.credit;
    return '<tr><td>'+curLabel(cur)+'</td><td class="cr">'+b.credit+'</td><td class="dr">'+b.debit+'</td><td class="bl '+(rem>=0?'neg':'pos')+'">'+Math.abs(rem)+'</td></tr>';
  }).join('');
  document.getElementById('summary-title').textContent = '📊 کۆی بڕەکان';
  document.getElementById('summary-tbody').innerHTML   = rows || '<tr><td colspan="4" style="text-align:center;color:#999;padding:14px">هیچ داتایەک نییە</td></tr>';
  document.getElementById('modal-summary').classList.add('show');
};

window.showDetail = function(aid){
  var a = _accounts.find(function(a){return a.id===aid;}); if (!a) return;
  var bals = getBals(a);
  var rows = Object.entries(bals).map(function(e){
    var cur=e[0], b=e[1], rem=b.debit-b.credit;
    return '<tr><td>'+curLabel(cur)+'</td><td class="cr">'+b.credit+'</td><td class="dr">'+b.debit+'</td><td class="bl '+(rem>=0?'neg':'pos')+'">'+Math.abs(rem)+'</td></tr>';
  }).join('');
  document.getElementById('summary-title').textContent = '📋 '+a.name;
  document.getElementById('summary-tbody').innerHTML   = rows || '<tr><td colspan="4" style="text-align:center;color:#999;padding:14px">هیچ مامەڵەیەک نییە</td></tr>';
  document.getElementById('modal-summary').classList.add('show');
};


// ══════════════════════════════════════════
//  USER INFO POPUP
// ══════════════════════════════════════════
window.showUserInfo = function(id) {
  var a = (_accounts || []).find(function(x){ return x.id === id; });
  if (!a) return;
  document.getElementById('uip-name').textContent  = a.name  || '—';
  document.getElementById('uip-phone').textContent = (a.phone && a.phone.trim()) ? a.phone : 'ژمارە تۆمارنەکراوە';
  document.getElementById('modal-user-info').classList.add('show');
};

// ══════════════════════════════════════════
//  MODAL / TOAST
// ══════════════════════════════════════════
window.closeModal = function(id){ document.getElementById(id).classList.remove('show'); };
document.querySelectorAll('.modal-bg').forEach(function(el){
  el.addEventListener('click', function(e){ if (e.target===el) el.classList.remove('show'); });
});

function toast(msg){
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2400);
}
