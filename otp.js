// ══════════════════════════════════════════
//  SANARIA — otp.js
//  دەروازەی OTP — پێش چوونەژوورەوە
//  ئەم فایلە لە index.html دا زیاد بکە:
//  <script src="otp.js"></script>
//  پێش <script src="script.js"></script>
// ══════════════════════════════════════════

var OTP_CONFIG = {
  enabled:    true,   // false بکە بۆ لابردنی OTP
  sheetsURL:  'Https://script.google.com/macros/s/AKfycbyhHNUak12cVwaA7T3aq7AAs4ekddg1hl_At9q7_mU7Bfx5REJ4jOGIzwfchncqOOxd/exec',     // URL ی Google Apps Script ی خۆت لێرە بدەرەوە
  expiryMin:  10,     // چەند خولەک کاردەکات
};

// ── STATE ──────────────────────────────────
var _otpVerified  = false;
var _otpEmail     = '';
var _otpResendTimer = null;

// ── INIT ───────────────────────────────────
// کاتێ پەڕەکە بار دەبێت، ئەگەر OTP چالاک بوو دەروازەکە دەردەخاتەوە
window.addEventListener('load', function () {
  // URL لە config.js وەربگرە ئەگەر بوو
  if (typeof SANARIA_CONFIG !== 'undefined' && SANARIA_CONFIG.sheetsURL) {
    OTP_CONFIG.sheetsURL = SANARIA_CONFIG.sheetsURL;
  }

  if (!OTP_CONFIG.enabled || !OTP_CONFIG.sheetsURL || OTP_CONFIG.sheetsURL.indexOf('YOUR_') > -1) return;

  // بپشکنە ئایا پێشتر تأیید کراوە
  var cached = sessionStorage.getItem('otp_verified');
  if (cached === '1') { _otpVerified = true; return; }

  // دەروازەکە دەردەخاتەوە
  setTimeout(showOTPGate, 600);
});

// ── SHOW OTP GATE ──────────────────────────
function showOTPGate() {
  var gate = document.getElementById('otp-gate');
  if (!gate) { buildOTPGate(); return; }
  gate.style.display = 'flex';
}

function buildOTPGate() {
  var gate = document.createElement('div');
  gate.id  = 'otp-gate';
  gate.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9998',
    'background:linear-gradient(135deg,#0d2137 0%,#005f6b 60%,#00a8b5 100%)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'direction:rtl', 'font-family:Noto Sans Arabic,sans-serif',
  ].join(';');

  gate.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:30px 24px;width:88vw;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center;position:relative;">

      <!-- لۆگۆ -->
      <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#e0f7fa,#b2ebf2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:2rem;">💰</div>

      <h2 style="color:#007a85;font-size:1.3rem;font-weight:800;margin-bottom:6px;">سەناریا</h2>
      <p style="color:#607d8b;font-size:.88rem;margin-bottom:24px;line-height:1.6;">بۆ چوونەژوورەوە پێویستە ئیمەیڵەکەت دابدەیت.<br>کۆدی تأیید دەنێرین.</p>

      <!-- ئیمەیڵ -->
      <div id="otp-step-1">
        <div style="display:flex;align-items:center;gap:8px;background:#f0f9fb;border:1.5px solid #e0e7ef;border-radius:12px;padding:10px 14px;margin-bottom:14px;">
          <span style="font-size:1.1rem;flex-shrink:0;">✉️</span>
          <input type="email" id="otp-email-input"
            placeholder="ئیمەیڵەکەت بنووسە"
            autocomplete="email"
            style="flex:1;background:none;border:none;outline:none;font-family:inherit;font-size:.93rem;color:#1a2332;text-align:right;direction:rtl;">
        </div>
        <button onclick="otpRequestCode()"
          style="width:100%;background:linear-gradient(135deg,#007a85,#00a8b5);color:#fff;border:none;border-radius:12px;padding:13px;font-family:inherit;font-size:.95rem;font-weight:700;cursor:pointer;">
          📨 کۆد بنێرە
        </button>
      </div>

      <!-- کۆد -->
      <div id="otp-step-2" style="display:none;">
        <p id="otp-sent-msg" style="color:#607d8b;font-size:.85rem;margin-bottom:14px;line-height:1.6;"></p>
        <div style="display:flex;align-items:center;gap:8px;background:#f0f9fb;border:1.5px solid #e0e7ef;border-radius:12px;padding:10px 14px;margin-bottom:14px;">
          <span style="font-size:1.1rem;flex-shrink:0;">#</span>
          <input type="text" id="otp-code-input"
            placeholder="کۆدی ٦ ژمارەیی"
            maxlength="6" inputmode="numeric" autocomplete="one-time-code"
            style="flex:1;background:none;border:none;outline:none;font-family:inherit;font-size:1.2rem;color:#1a2332;text-align:center;letter-spacing:6px;">
        </div>
        <button onclick="otpVerifyCode()"
          style="width:100%;background:linear-gradient(135deg,#007a85,#00a8b5);color:#fff;border:none;border-radius:12px;padding:13px;font-family:inherit;font-size:.95rem;font-weight:700;cursor:pointer;margin-bottom:10px;">
          ✅ پشتڕاستکردنەوە
        </button>
        <button onclick="otpGoBack()"
          style="width:100%;background:#f1f5f9;color:#607d8b;border:none;border-radius:12px;padding:10px;font-family:inherit;font-size:.88rem;cursor:pointer;margin-bottom:8px;">
          ← گەڕانەوە
        </button>
        <button id="otp-resend-btn" onclick="otpResend()" disabled
          style="background:none;border:none;color:#b0bec5;font-family:inherit;font-size:.82rem;cursor:pointer;">
          دووبارە بنێرە (<span id="otp-timer">60</span>s)
        </button>
      </div>

      <!-- هەڵە -->
      <div id="otp-error" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#ef4444;font-size:.82rem;padding:9px 12px;border-radius:10px;margin-top:10px;"></div>

      <!-- بارکردن -->
      <div id="otp-loading" style="display:none;color:#607d8b;font-size:.88rem;margin-top:10px;">⏳ چاوەڕوانبە...</div>
    </div>
  `;

  document.body.appendChild(gate);

  // Enter key بۆ کۆد
  document.getElementById('otp-code-input').addEventListener('keydown', function(e){
    if (e.key === 'Enter') otpVerifyCode();
  });
  document.getElementById('otp-email-input').addEventListener('keydown', function(e){
    if (e.key === 'Enter') otpRequestCode();
  });
}

// ── REQUEST CODE ───────────────────────────
window.otpRequestCode = function () {
  var email = (document.getElementById('otp-email-input').value || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    otpShowError('تکایە ئیمەیڵی دروست بنووسە');
    return;
  }
  _otpEmail = email;
  otpSetLoading(true);
  otpHideError();

  fetch(OTP_CONFIG.sheetsURL, {
    method: 'POST',
    body: new URLSearchParams({ action: 'request_otp', email: email }),
  })
  .then(function(r){ return r.json(); })
  .then(function(res){
    otpSetLoading(false);
    if (res.ok){
      document.getElementById('otp-step-1').style.display = 'none';
      document.getElementById('otp-step-2').style.display = 'block';
      document.getElementById('otp-sent-msg').textContent = '✅ کۆدەکە نێردرا بۆ ' + email;
      document.getElementById('otp-code-input').focus();
      otpStartTimer();
    } else {
      otpShowError(res.message || 'هەڵەی ناردن');
    }
  })
  .catch(function(){
    otpSetLoading(false);
    otpShowError('کێشەی تۆڕ — دووبارە هەوڵبدەرەوە');
  });
};

// ── VERIFY CODE ────────────────────────────
window.otpVerifyCode = function () {
  var code = (document.getElementById('otp-code-input').value || '').trim();
  if (code.length < 6) { otpShowError('کۆدەکە ٦ ژمارەیە'); return; }

  otpSetLoading(true);
  otpHideError();

  fetch(OTP_CONFIG.sheetsURL, {
    method: 'POST',
    body: new URLSearchParams({ action: 'verify_otp', email: _otpEmail, code: code }),
  })
  .then(function(r){ return r.json(); })
  .then(function(res){
    otpSetLoading(false);
    if (res.ok){
      sessionStorage.setItem('otp_verified', '1');
      _otpVerified = true;
      // دەروازەکە دادەخاتەوە بە ئانیمیشن
      var gate = document.getElementById('otp-gate');
      if (gate){
        gate.style.transition = 'opacity .4s, transform .4s';
        gate.style.opacity    = '0';
        gate.style.transform  = 'scale(1.05)';
        setTimeout(function(){ gate.style.display = 'none'; }, 400);
      }
    } else {
      otpShowError(res.message || 'کۆدەکە هەڵەیە');
      document.getElementById('otp-code-input').value = '';
      document.getElementById('otp-code-input').focus();
    }
  })
  .catch(function(){
    otpSetLoading(false);
    otpShowError('کێشەی تۆڕ — دووبارە هەوڵبدەرەوە');
  });
};

// ── RESEND ─────────────────────────────────
window.otpResend = function () {
  document.getElementById('otp-code-input').value = '';
  otpRequestCode();
};

window.otpGoBack = function () {
  document.getElementById('otp-step-1').style.display = 'block';
  document.getElementById('otp-step-2').style.display = 'none';
  if (_otpResendTimer) clearInterval(_otpResendTimer);
  otpHideError();
};

// ── TIMER ──────────────────────────────────
function otpStartTimer() {
  var secs = 60;
  var timerEl  = document.getElementById('otp-timer');
  var resendBtn= document.getElementById('otp-resend-btn');
  if (resendBtn) { resendBtn.disabled = true; resendBtn.style.color = '#b0bec5'; }
  if (_otpResendTimer) clearInterval(_otpResendTimer);
  _otpResendTimer = setInterval(function(){
    secs--;
    if (timerEl) timerEl.textContent = secs;
    if (secs <= 0){
      clearInterval(_otpResendTimer);
      if (resendBtn) {
        resendBtn.disabled   = false;
        resendBtn.style.color= '#00a8b5';
        resendBtn.textContent= 'دووبارە بنێرە';
      }
    }
  }, 1000);
}

// ── HELPERS ────────────────────────────────
function otpShowError(msg) {
  var el = document.getElementById('otp-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function otpHideError() {
  var el = document.getElementById('otp-error');
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}
function otpSetLoading(show) {
  var el = document.getElementById('otp-loading');
  if (el) el.style.display = show ? 'block' : 'none';
}
