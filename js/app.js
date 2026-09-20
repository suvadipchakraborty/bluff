/* ThagaShield — App Logic */
(function () {
  "use strict";

  const STORAGE_KEY = "thagashield_state_v1";
  const state = loadState();

  const el = (sel, root = document) => root.querySelector(sel);
  const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const appRoot = el("#app");
  const tabButtons = els(".tabbar__btn");
  const views = els(".view");

  // ---------- Persistence ----------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { dodged: 0, lang: "en", history: [] };
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  // ---------- Navigation ----------
  function showView(name) {
    views.forEach(v => v.classList.toggle("view--active", v.dataset.view === name));
    tabButtons.forEach(b => b.classList.toggle("tabbar__btn--active", b.dataset.target === name));
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    if (name === "database") renderDatabase();
    if (name === "home") renderHome();
  }
  tabButtons.forEach(b => b.addEventListener("click", () => showView(b.dataset.target)));

  // ---------- Language ----------
  const STR = {
    en: {
      startBtn: "Start the 1-minute check",
      dodgedLabel: (n) => n === 1 ? "1 scam dodged" : `${n} scams dodged`,
      step1: "How did they contact you?",
      step2: "What did they ask you to do? (pick all that apply)",
      step3: "Did any of these come up? (optional)",
      next: "Next", back: "Back", seeResult: "See my diagnosis",
      skip: "Skip this step",
      resultConfirmed: "Confirmed Scam Pattern",
      resultCaution: "Some Red Flags",
      resultSafe: "Looks Low Risk",
      whyTitle: "How this scam works",
      signsTitle: "Signs you're seeing", 
      planTitle: "Your action plan",
      goldenHour: "The Golden Hour",
      goldenHourBody: "Lost money already? Every minute counts. Call the National Cybercrime Helpline 1930 and file a report at cybercrime.gov.in right now — banks can sometimes freeze a transfer within the first 'golden hour'.",
      copyBtn: "Copy block-and-report message",
      copiedBtn: "Copied ✓",
      shareBtn: "Share this diagnosis",
      restartBtn: "Check another message",
      blockMsg: "Nice try. I've reported this number to the 1930 Cybercrime portal. Good luck with the authorities.",
    },
    hi: {
      startBtn: "1-मिनट जांच शुरू करें",
      dodgedLabel: (n) => `${n} ठगी से बचे`,
      step1: "उन्होंने आपसे कैसे संपर्क किया?",
      step2: "उन्होंने आपसे क्या करने को कहा? (जो लागू हों चुनें)",
      step3: "क्या इनमें से कुछ ज़िक्र हुआ? (वैकल्पिक)",
      next: "आगे", back: "पीछे", seeResult: "मेरा परिणाम देखें",
      skip: "यह चरण छोड़ें",
      resultConfirmed: "पुष्टि की गई ठगी",
      resultCaution: "कुछ चेतावनी संकेत",
      resultSafe: "जोखिम कम लगता है",
      whyTitle: "यह ठगी कैसे काम करती है",
      signsTitle: "आपको दिख रहे संकेत",
      planTitle: "आपकी कार्य योजना",
      goldenHour: "स्वर्णिम घंटा",
      goldenHourBody: "पैसे खो दिए? हर मिनट मायने रखता है। तुरंत नेशनल साइबरक्राइम हेल्पलाइन 1930 पर कॉल करें और cybercrime.gov.in पर रिपोर्ट करें — पहले घंटे में बैंक ट्रांसफर रोक सकता है।",
      copyBtn: "ब्लॉक-रिपोर्ट संदेश कॉपी करें",
      copiedBtn: "कॉपी हो गया ✓",
      shareBtn: "यह परिणाम शेयर करें",
      restartBtn: "एक और संदेश जांचें",
      blockMsg: "अच्छी कोशिश। मैंने यह नंबर 1930 साइबरक्राइम पोर्टल पर रिपोर्ट कर दिया है। अधिकारियों से निपटना शुभ हो।",
    }
  };
  function t(key, ...args) {
    const dict = STR[state.lang] || STR.en;
    const v = dict[key];
    return typeof v === "function" ? v(...args) : v;
  }
  function applyLangToStaticText() {
    els("[data-i18n]").forEach(n => { n.textContent = t(n.dataset.i18n); });
    el("#langToggle").textContent = state.lang === "en" ? "हिं" : "EN";
    el("#startBtn").textContent = t("startBtn");
  }

  el("#langToggle").addEventListener("click", () => {
    state.lang = state.lang === "en" ? "hi" : "en";
    saveState();
    applyLangToStaticText();
    renderHome();
    if (!el("#triageBox").hidden) renderTriageStep();
  });

  // ---------- Home ----------
  function renderHome() {
    el("#dodgedCount").textContent = t("dodgedLabel", state.dodged);
  }

  // ---------- Database view ----------
  function renderDatabase(filter = "") {
    const wrap = el("#dbList");
    wrap.innerHTML = "";
    const q = filter.trim().toLowerCase();
    const list = SCAMS.filter(s =>
      !q || s.name.toLowerCase().includes(q) || s.story.toLowerCase().includes(q) ||
      s.keywords.some(k => k.includes(q))
    );
    if (!list.length) {
      wrap.innerHTML = `<p class="muted">No matching scams found — try a different word.</p>`;
      return;
    }
    list.forEach(s => {
      const card = document.createElement("details");
      card.className = "db-card";
      card.innerHTML = `
        <summary class="db-card__summary">
          <span class="db-card__emoji" aria-hidden="true">${s.emoji}</span>
          <span class="db-card__name">${state.lang === "hi" ? s.hi : s.name}</span>
        </summary>
        <div class="db-card__body">
          <p>${s.story}</p>
          <p class="db-card__label">${t("signsTitle")}</p>
          <ul>${s.signs.map(x => `<li>${x}</li>`).join("")}</ul>
          <p class="db-card__label">${t("planTitle")}</p>
          <ol>${s.steps.map(x => `<li>${x}</li>`).join("")}</ol>
        </div>`;
      wrap.appendChild(card);
    });
  }
  el("#dbSearch").addEventListener("input", (e) => renderDatabase(e.target.value));

  // ---------- Triage flow ----------
  const triage = { step: 0, channel: null, actions: new Set(), keywords: new Set() };

  function resetTriage() {
    triage.step = 0; triage.channel = null; triage.actions = new Set(); triage.keywords = new Set();
  }

  el("#startBtn").addEventListener("click", () => { resetTriage(); showView("diagnose"); renderTriageStep(); });

  function renderTriageStep() {
    const box = el("#triageBox");
    el("#resultBox").hidden = true;
    el(".triage__nav").hidden = false;
    box.hidden = false;
    const progress = el("#progressFill");
    progress.style.width = `${(triage.step / 3) * 100}%`;

    if (triage.step === 0) {
      box.innerHTML = stepShell(t("step1"), CHANNELS.map(c => pill(c.id, state.lang === "hi" ? c.hi : c.label, triage.channel === c.id, "radio")), false);
      els(".opt", box).forEach(btn => btn.addEventListener("click", () => {
        triage.channel = btn.dataset.id;
        els(".opt", box).forEach(b => b.classList.toggle("opt--sel", b === btn));
        el("#nextBtn").disabled = false;
      }));
      el("#nextBtn").disabled = !triage.channel;
    }
    if (triage.step === 1) {
      box.innerHTML = stepShell(t("step2"), ACTIONS.map(a => pill(a.id, a.label, triage.actions.has(a.id), "check")), false);
      els(".opt", box).forEach(btn => btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (triage.actions.has(id)) { triage.actions.delete(id); btn.classList.remove("opt--sel"); }
        else { triage.actions.add(id); btn.classList.add("opt--sel"); }
        el("#nextBtn").disabled = triage.actions.size === 0;
      }));
      el("#nextBtn").disabled = triage.actions.size === 0;
    }
    if (triage.step === 2) {
      box.innerHTML = stepShell(t("step3"), KEYWORDS.map(k => pill(k, KEYWORD_LABELS[k], triage.keywords.has(k), "check")), true);
      els(".opt", box).forEach(btn => btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (triage.keywords.has(id)) { triage.keywords.delete(id); btn.classList.remove("opt--sel"); }
        else { triage.keywords.add(id); btn.classList.add("opt--sel"); }
      }));
      el("#nextBtn").disabled = false;
    }

    el("#backBtn").hidden = triage.step === 0;
    el("#nextBtn").textContent = triage.step === 2 ? t("seeResult") : t("next");
  }

  function stepShell(title, pillsHtml, isOptional) {
    return `<h2 class="triage__title">${title}${isOptional ? ` <span class="muted small">(${t("skip")})</span>` : ""}</h2>
      <div class="pillgrid">${pillsHtml.join("")}</div>`;
  }
  function pill(id, label, selected, kind) {
    return `<button type="button" class="opt opt--${kind} ${selected ? "opt--sel" : ""}" data-id="${id}">${label}</button>`;
  }

  el("#backBtn").addEventListener("click", () => { triage.step = Math.max(0, triage.step - 1); renderTriageStep(); });
  el("#nextBtn").addEventListener("click", () => {
    if (triage.step < 2) { triage.step += 1; renderTriageStep(); }
    else { computeResult(); }
  });

  // ---------- Rule engine ----------
  function computeResult() {
    let best = null, bestScore = 0, maxPossible = 0;
    SCAMS.forEach(s => {
      let score = 0;
      let possible = 2 + s.actions.length * 4 + s.keywords.length * 3;
      if (triage.channel && s.channels.includes(triage.channel)) score += 2;
      s.actions.forEach(a => { if (triage.actions.has(a)) score += 4; });
      s.keywords.forEach(k => { if (triage.keywords.has(k)) score += 3; });
      // normalize against a realistic "hit" ceiling rather than the full profile
      const realisticCeiling = 2 + Math.min(s.actions.length, 4) * 4 + Math.min(s.keywords.length, 3) * 3;
      const pct = Math.round((score / realisticCeiling) * 100);
      if (score > bestScore) { bestScore = score; best = s; maxPossible = pct; }
    });

    const confidence = best ? Math.min(99, Math.max(35, maxPossible)) : 0;
    renderResult(best, confidence);
  }

  function renderResult(scam, confidence) {
    el("#triageBox").hidden = true;
    el(".triage__nav").hidden = true;
    const box = el("#resultBox");
    box.hidden = false;

    let tier, tierLabel, colorVar;
    if (!scam || confidence < 40) { tier = "safe"; tierLabel = t("resultSafe"); colorVar = "var(--safe)"; }
    else if (confidence < 70) { tier = "caution"; tierLabel = t("resultCaution"); colorVar = "var(--warn)"; }
    else { tier = "danger"; tierLabel = t("resultConfirmed"); colorVar = "var(--danger)"; }

    if (tier !== "safe") {
      state.dodged += 1;
      state.history.unshift({ id: scam.id, at: Date.now() });
      state.history = state.history.slice(0, 20);
      saveState();
    }

    const gaugeSvg = buildGauge(confidence, colorVar);
    const name = scam ? (state.lang === "hi" ? scam.hi : scam.name) : (state.lang === "hi" ? "कोई मेल नहीं मिला" : "No strong match found");

    box.innerHTML = `
      <div class="result">
        <div class="result__gauge">${gaugeSvg}
          <div class="result__pct">${confidence}%</div>
        </div>
        <p class="result__tier result__tier--${tier}">${tierLabel}</p>
        ${scam ? `<h2 class="result__name">${scam.emoji} ${name}</h2>` : `<h2 class="result__name">🤔 ${state.lang === "hi" ? "सावधान रहें" : "Stay cautious anyway"}</h2>`}
        ${scam ? `
          <section class="result__section">
            <h3>${t("whyTitle")}</h3>
            <p>${scam.story}</p>
          </section>
          <section class="result__section">
            <h3>${t("signsTitle")}</h3>
            <ul>${scam.signs.map(x => `<li>${x}</li>`).join("")}</ul>
          </section>
          <section class="result__section">
            <h3>${t("planTitle")}</h3>
            <ol>${scam.steps.map(x => `<li>${x}</li>`).join("")}</ol>
          </section>
        ` : `
          <section class="result__section">
            <p>${state.lang === "hi" ? "आपके जवाबों से कोई जाना-पहचाना पैटर्न नहीं मिला, फिर भी सावधानी बरतें — कभी भी OTP, UPI PIN साझा न करें या अनजान लिंक पर पैसे न भेजें।" : "Your answers didn't strongly match a known pattern — but stay alert. Never share an OTP or UPI PIN, and never send money to an unfamiliar link or QR code."}</p>
          </section>
        `}
        <section class="goldenhour">
          <p class="goldenhour__title">⏱️ ${t("goldenHour")}</p>
          <p>${t("goldenHourBody")}</p>
        </section>
        <div class="result__actions">
          <button id="copyMsgBtn" class="btn btn--ghost">${t("copyBtn")}</button>
          <button id="shareBtn" class="btn btn--ghost">${t("shareBtn")}</button>
        </div>
        <button id="restartBtn2" class="btn btn--primary btn--block">${t("restartBtn")}</button>
      </div>`;

    el("#copyMsgBtn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(t("blockMsg"));
        el("#copyMsgBtn").textContent = t("copiedBtn");
        setTimeout(() => { el("#copyMsgBtn").textContent = t("copyBtn"); }, 1800);
      } catch (e) {
        alert(t("blockMsg"));
      }
    });
    el("#shareBtn").addEventListener("click", async () => {
      const shareText = `ThagaShield diagnosis: ${confidence}% match for "${name}". Check your own suspicious message free at ${location.href}`;
      if (navigator.share) {
        try { await navigator.share({ title: "ThagaShield", text: shareText, url: location.href }); } catch (e) { /* cancelled */ }
      } else {
        try { await navigator.clipboard.writeText(shareText); el("#shareBtn").textContent = t("copiedBtn"); setTimeout(() => el("#shareBtn").textContent = t("shareBtn"), 1800); } catch (e) { /* ignore */ }
      }
    });
    el("#restartBtn2").addEventListener("click", () => { resetTriage(); renderTriageStep(); });
  }

  function buildGauge(pct, colorVar) {
    // semicircle gauge, 0-100 mapped to 180deg arc
    const r = 80, cx = 100, cy = 100;
    const startAngle = 180, endAngle = 180 - (pct / 100) * 180;
    const toXY = (ang) => {
      const rad = (Math.PI / 180) * ang;
      return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
    };
    const [sx, sy] = toXY(startAngle);
    const [ex, ey] = toXY(endAngle);
    const largeArc = pct > 50 ? 1 : 0;
    return `<svg viewBox="0 0 200 110" class="gauge" role="img" aria-label="Risk gauge showing ${pct} percent">
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--track)" stroke-width="16" stroke-linecap="round"/>
      <path d="M ${sx.toFixed(2)} ${sy.toFixed(2)} A 80 80 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}" fill="none" stroke="${colorVar}" stroke-width="16" stroke-linecap="round"/>
    </svg>`;
  }

  // ---------- Init ----------
  applyLangToStaticText();
  renderHome();
  showView("home");
})();
