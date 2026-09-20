/* ThagaShield — App logic (v2)
   Stage 1  ROUTING      walk the Decision Tree sheet (any depth) until a scam is reached
   Stage 2  CONFIRMATION ask the scam's own red flags ("signs") and trigger words ("keywords")
                         from the Leaf sheet, then score how well the answers fit
   Stage 3  RESULT       confidence %, evidence, story, action plan, alternatives            */
(function () {
  "use strict";

  const CFG = window.THAGA_CONFIG;
  const CF = CFG.CONFIRM;
  const STORAGE_KEY = "thagashield_state_v1";
  const CONFIRM_EST = 4; // rough count of confirmation questions, only used for the progress bar
  const state = loadState();

  const el = (sel, root = document) => root.querySelector(sel);
  const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const isHi = () => state.lang === "hi";
  const pick = (en, hi) => (isHi() && hi ? hi : en);

  // ---------- Persistence ----------
  function loadState() {
    const base = { dodged: 0, lang: "en", history: [] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign(base, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return base;
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  // ---------- Strings ----------
  const STR = {
    en: {
      startBtn: "Start the 1-minute check",
      dodgedLabel: (n) => n === 1 ? "1 scam dodged" : `${n} scams dodged`,
      heroEyebrow: "Free to use, and nothing you type ever leaves your phone.",
      heroTitle: "Is that message trying to rob you?",
      heroSub: "Answer a few quick questions about the call, text or chat you received. ThagaShield narrows it down, double-checks with a few red-flag questions, then names the scam and tells you exactly what to do — in about a minute.",
      homeCardTitle: "Know before you owe",
      homeCardBody: "Real police never arrest you over video call. Real jobs never ask you to pay first. A QR code only ever sends money — never receives it. Three rules that stop most scams cold.",
      dbTitle: "Scam database", dbSub: "Browse every scam pattern in ThagaShield's engine.",
      dbSearch: "Search by name or keyword…", dbAll: "All",
      dbCount: (n, total) => n === total ? `${total} scam patterns` : `${n} of ${total} scam patterns`,
      dbEmpty: "No matching scams found — try a different word.",
      healthTitle: "Data health (for researchers)",
      tabHome: "Home", tabDiagnose: "Diagnose", tabDatabase: "Database",
      footerTitle: "Help us catch more scams",
      footerBody: "Spotted a new scam script? Let us know so we can add it to the database.",
      footerBtn: "Submit a scam via email",
      trending: "Trending",
      srcLive: "Live data", srcCache: "Saved copy", srcSnapshot: "Built-in copy",
      scamsWord: "scams",
      next: "Continue", back: "Back",
      phaseRoute: "Narrowing it down", phaseConfirm: "Confirming",
      qOf: (n, total, approx) => `Question ${n} of ${approx ? "~" : ""}${total}`,
      noneFit: "None of these fit",
      confirmIntro: "Good — we have a likely match. A few quick checks to be sure.",
      signQ: "Did you notice this?",
      yes: "Yes", no: "No", unsure: "Not sure",
      kwQ: "Did any of these words or names come up?", kwHint: "Pick all that you saw or heard.",
      kwNone: "None of these",
      tierConfirmed: "Strong match", tierPossible: "Possible match", tierWeak: "Weak match — stay cautious", tierNone: "No confident match",
      risk: { Critical: "Critical risk", High: "High risk", Medium: "Medium risk", Low: "Low risk" },
      evidenceTitle: "Why we think so",
      flagsSummary: (y, n) => `${y} of ${n} red flags confirmed`,
      kwSummary: (list) => `Words you recognised: ${list}`,
      whyTitle: "How this scam works",
      signsTitle: "Signs to look for", planTitle: "Your action plan",
      altTitle: "Not quite right? Check a similar scam", altHint: "We'll ask the same kind of checks for the one you pick.",
      weakNote: "Only a few red flags matched, so this may not be the right scam. Try a similar one below, or start again from a different starting point.",
      noneTitle: "We couldn't pin it down",
      noneBody: "Your answers didn't lead to a known pattern — but stay alert. Never share an OTP or UPI PIN, never install an app from a link, and never send money to someone who contacted you first.",
      browseBtn: "Browse the scam database",
      goldenHour: "The Golden Hour",
      goldenHourBody: "Lost money already? Every minute counts. Call the National Cybercrime Helpline 1930 and file a report at cybercrime.gov.in right now — banks can sometimes freeze a transfer within the first 'golden hour'.",
      call1930: "Call 1930",
      copyBtn: "Copy block-and-report message", copiedBtn: "Copied ✓",
      shareBtn: "Share this diagnosis",
      restartBtn: "Check another message",
      blockMsg: "Nice try. I've reported this number to the 1930 Cybercrime portal. Good luck with the authorities.",
      loadErr: "The question data could not be loaded. Please check your connection and try again.",
      hThe: "Source", hLeaves: "Scams (leaves)", hNodes: "Questions (nodes)", hDepth: "Longest question path",
      hReach: "Scams reachable from the first question", hDup: "Duplicate question IDs", hDupLeaf: "Duplicate scam IDs",
      hDangling: "Answers pointing to nothing", hOrphan: "Questions never reached", hUnreach: "Scams no path leads to",
      hThin: "Scams with fewer than 2 signs (weak confirmation)", hCycle: "Question loops", hStart: "Start question is missing",
      hOk: "None", hPolicy: "Duplicates resolved by"
    },
    hi: {
      startBtn: "1-मिनट जांच शुरू करें",
      dodgedLabel: (n) => `${n} ठगी से बचे`,
      heroEyebrow: "मुफ़्त है, और आप जो भी लिखते हैं वह आपके फ़ोन से बाहर नहीं जाता।",
      heroTitle: "क्या यह संदेश आपको लूटने की कोशिश है?",
      heroSub: "जो कॉल, टेक्स्ट या चैट आपको मिली, उसके बारे में कुछ आसान सवालों के जवाब दें। ThagaShield पहले दायरा छोटा करता है, फिर कुछ खतरे के संकेतों से पुष्टि करता है, और ठगी का नाम बताकर आगे क्या करना है यह समझाता है — लगभग एक मिनट में।",
      homeCardTitle: "पैसे गंवाने से पहले जानें",
      homeCardBody: "असली पुलिस वीडियो कॉल पर गिरफ्तार नहीं करती। असली नौकरी पहले पैसे नहीं मांगती। QR कोड से सिर्फ़ पैसे जाते हैं — आते नहीं। ये तीन नियम ज़्यादातर ठगी रोक देते हैं।",
      dbTitle: "ठगी डेटाबेस", dbSub: "ThagaShield में मौजूद हर ठगी का पैटर्न देखें।",
      dbSearch: "नाम या शब्द से खोजें…", dbAll: "सभी",
      dbCount: (n, total) => n === total ? `${total} ठगी पैटर्न` : `${total} में से ${n} ठगी पैटर्न`,
      dbEmpty: "कोई मेल नहीं मिला — कोई दूसरा शब्द आज़माएँ।",
      healthTitle: "डेटा की सेहत (शोधकर्ताओं के लिए)",
      tabHome: "होम", tabDiagnose: "जांच", tabDatabase: "डेटाबेस",
      footerTitle: "और ठगियां पकड़ने में मदद करें",
      footerBody: "कोई नई ठगी देखी? हमें बताएं ताकि हम उसे डेटाबेस में जोड़ सकें।",
      footerBtn: "ईमेल से ठगी भेजें",
      trending: "चर्चा में",
      srcLive: "लाइव डेटा", srcCache: "सहेजी हुई कॉपी", srcSnapshot: "इन-बिल्ट कॉपी",
      scamsWord: "ठगियां",
      next: "आगे", back: "पीछे",
      phaseRoute: "दायरा छोटा कर रहे हैं", phaseConfirm: "पुष्टि",
      qOf: (n, total, approx) => `प्रश्न ${n} / ${approx ? "~" : ""}${total}`,
      noneFit: "इनमें से कोई नहीं",
      confirmIntro: "बढ़िया — एक संभावित मेल मिला है। पक्का करने के लिए कुछ छोटे सवाल।",
      signQ: "क्या आपने यह देखा?",
      yes: "हाँ", no: "नहीं", unsure: "पक्का नहीं",
      kwQ: "क्या इनमें से कोई शब्द या नाम सुनाई/दिखाई दिया?", kwHint: "जो भी दिखा या सुना, सब चुनें।",
      kwNone: "इनमें से कोई नहीं",
      tierConfirmed: "मज़बूत मेल", tierPossible: "संभावित मेल", tierWeak: "कमज़ोर मेल — सावधान रहें", tierNone: "कोई पक्का मेल नहीं",
      risk: { Critical: "बेहद गंभीर जोखिम", High: "उच्च जोखिम", Medium: "मध्यम जोखिम", Low: "कम जोखिम" },
      evidenceTitle: "हमें ऐसा क्यों लगता है",
      flagsSummary: (y, n) => `${n} में से ${y} खतरे के संकेत पुष्ट`,
      kwSummary: (list) => `आपने ये शब्द पहचाने: ${list}`,
      whyTitle: "यह ठगी कैसे काम करती है",
      signsTitle: "पहचानने के संकेत", planTitle: "आपकी कार्य योजना",
      altTitle: "सही नहीं लगा? मिलती-जुलती ठगी जांचें", altHint: "जो आप चुनेंगे उसके लिए भी ऐसी ही जांच पूछेंगे।",
      weakNote: "बहुत कम संकेत मेल खाए, इसलिए यह सही ठगी न हो। नीचे कोई मिलती-जुलती चुनें, या किसी और शुरुआत से दोबारा जांचें।",
      noneTitle: "हम पक्का पता नहीं लगा पाए",
      noneBody: "आपके जवाब किसी जाने-पहचाने पैटर्न तक नहीं पहुंचे — फिर भी सतर्क रहें। कभी OTP या UPI PIN साझा न करें, लिंक से कोई ऐप इंस्टॉल न करें, और जिसने पहले आपसे संपर्क किया उसे पैसे न भेजें।",
      browseBtn: "ठगी डेटाबेस देखें",
      goldenHour: "स्वर्णिम घंटा",
      goldenHourBody: "पैसे खो दिए? हर मिनट मायने रखता है। तुरंत नेशनल साइबरक्राइम हेल्पलाइन 1930 पर कॉल करें और cybercrime.gov.in पर रिपोर्ट करें — पहले घंटे में बैंक ट्रांसफर रोक सकता है।",
      call1930: "1930 पर कॉल करें",
      copyBtn: "ब्लॉक-रिपोर्ट संदेश कॉपी करें", copiedBtn: "कॉपी हो गया ✓",
      shareBtn: "यह परिणाम शेयर करें",
      restartBtn: "एक और संदेश जांचें",
      blockMsg: "अच्छी कोशिश। मैंने यह नंबर 1930 साइबरक्राइम पोर्टल पर रिपोर्ट कर दिया है। अधिकारियों से निपटना शुभ हो।",
      loadErr: "सवालों का डेटा लोड नहीं हो सका। कृपया कनेक्शन जांचकर दोबारा कोशिश करें।",
      hThe: "स्रोत", hLeaves: "ठगियां (leaves)", hNodes: "सवाल (nodes)", hDepth: "सबसे लंबा सवाल-रास्ता",
      hReach: "पहले सवाल से पहुंचने योग्य ठगियां", hDup: "दोहराए गए सवाल ID", hDupLeaf: "दोहराए गए ठगी ID",
      hDangling: "कहीं न जाने वाले जवाब", hOrphan: "जो सवाल कभी नहीं पूछे जाते", hUnreach: "जिन ठगियों तक कोई रास्ता नहीं",
      hThin: "2 से कम संकेत वाली ठगियां (कमज़ोर पुष्टि)", hCycle: "सवालों में लूप", hStart: "शुरुआती सवाल गायब है",
      hOk: "कोई नहीं", hPolicy: "दोहराव का समाधान"
    }
  };
  function t(key, ...args) {
    const dict = STR[state.lang] || STR.en;
    const v = dict[key] !== undefined ? dict[key] : STR.en[key];
    return typeof v === "function" ? v(...args) : v;
  }

  const FAMILY_HI = {
    authority: "अधिकारी बनकर", employment: "नौकरी", investment: "निवेश", impersonation: "छद्म रूप",
    ecommerce: "ई-कॉमर्स", utility: "बिल / सेवाएं", financial: "बैंकिंग / वित्त", telecom: "टेलीकॉम", extortion: "धमकी / वसूली"
  };
  const familyLabel = (f) => (isHi() && FAMILY_HI[f]) || (f ? f.charAt(0).toUpperCase() + f.slice(1) : "Other");

  // Trigger-word display: "kyc-suspend" -> "KYC suspend"
  const ACRONYMS = new Set(["cbi", "trai", "dot", "kyc", "upi", "otp", "apk", "ipo", "qr", "nri", "kbc", "nhai", "sbi", "hdfc", "amc", "sebi", "ceo", "usb", "dns", "ssl", "olx", "atm", "fd", "rtgs", "irctc", "cibil", "vpn", "sim", "asba", "hna", "ivr", "aeps", "aeab", "uidai", "pnr", "rbi", "gst", "icu", "fedex", "dns"]);
  function prettyTag(k) {
    if (k === "e-sim") return "e-SIM";
    const words = k.replace(/-/g, " ").split(" ").map(w => ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w);
    const s = words.join(" ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ---------- Data ----------
  let DB = null, currentRaw = null, pendingRaw = null;
  let dataMeta = { source: "snapshot", at: null, liveFailed: false };

  function applyRaw(raw, source, at) {
    DB = ThagaData.build(raw, { duplicates: CFG.DUPLICATE_NODES, startNode: CFG.START_NODE });
    currentRaw = raw;
    dataMeta = { source, at: at || Date.now(), liveFailed: false };
    if (DB.audit.dupNodes.length || DB.audit.dangling.length || DB.audit.unreachableLeaves.length) {
      console.warn("[ThagaShield] Data issues found — see Database > Data health.", DB.audit);
    }
  }

  function refreshLive() {
    ThagaData.fetchLive().then(raw => {
      ThagaData.writeCache(raw);
      const same = currentRaw && raw.leaves === currentRaw.leaves && raw.tree === currentRaw.tree;
      if (same) { dataMeta = { source: "live", at: Date.now(), liveFailed: false }; }
      else if (flowInProgress()) { pendingRaw = raw; return; }
      else { applyRaw(raw, "live"); }
      onDataChanged();
    }).catch(err => {
      console.warn("[ThagaShield] Live sheets unavailable, using", dataMeta.source, "copy:", err.message);
      dataMeta.liveFailed = true;
      renderDataStatus();
    });
  }
  function flowInProgress() { return flow.phase === "tree" || flow.phase === "confirm"; }
  function onDataChanged() {
    renderHome();
    if (activeView() === "database") renderDatabase();
    if (activeView() === "diagnose" && flow.phase === "idle") { /* nothing to redraw */ }
  }

  // ---------- Navigation ----------
  const tabButtons = els(".tabbar__btn");
  const views = els(".view");
  const activeView = () => (views.find(v => v.classList.contains("view--active")) || {}).dataset.view;

  function showView(name) {
    views.forEach(v => v.classList.toggle("view--active", v.dataset.view === name));
    tabButtons.forEach(b => b.classList.toggle("tabbar__btn--active", b.dataset.target === name));
    window.scrollTo({ top: 0, behavior: "auto" });
    if (name === "database") renderDatabase();
    if (name === "home") renderHome();
  }
  tabButtons.forEach(b => b.addEventListener("click", () => {
    const target = b.dataset.target;
    if (target === "diagnose" && flow.phase === "idle") startFlow();
    else { showView(target); if (target === "diagnose") render(); }
  }));

  // ---------- Language ----------
  function applyLangToStaticText() {
    document.documentElement.lang = isHi() ? "hi" : "en";
    els("[data-i18n]").forEach(n => { n.textContent = t(n.dataset.i18n); });
    els("[data-i18n-ph]").forEach(n => { n.placeholder = t(n.dataset.i18nPh); });
    el("#langToggle").textContent = isHi() ? "EN" : "हिं";
    el("#startBtn").textContent = t("startBtn");
  }
  el("#langToggle").addEventListener("click", () => {
    state.lang = isHi() ? "en" : "hi";
    saveState();
    applyLangToStaticText();
    renderHome();
    if (activeView() === "database") renderDatabase();
    if (activeView() === "diagnose") render();
  });

  // ---------- Home ----------
  function renderHome() {
    el("#dodgedCount").textContent = state.dodged > 0 ? t("dodgedLabel", state.dodged) : "";
    renderDataStatus();
    // Ticker: highest-risk scams straight from the sheet
    const hot = Array.from(DB.leaves.values()).filter(l => l.risk === "Critical").slice(0, 6);
    const items = (hot.length ? hot : Array.from(DB.leaves.values()).slice(0, 6))
      .map(l => `<span>⚠️ ${esc(t("trending"))}: ${esc(pick(l.nameEn, l.nameHi))}</span>`);
    el("#tickerTrack").innerHTML = items.concat(items).join("");
  }
  function renderDataStatus() {
    const src = dataMeta.source === "live" ? t("srcLive") : dataMeta.source === "cache" ? t("srcCache") : t("srcSnapshot");
    const dot = dataMeta.source === "live" ? "🟢" : "🟡";
    el("#dataStatus").textContent = `${dot} ${src} · ${DB.leaves.size} ${t("scamsWord")}`;
  }

  // ---------- Database view ----------
  const dbFilter = { q: "", family: "" };

  function renderDatabase() {
    // family chips
    const families = Array.from(new Set(Array.from(DB.leaves.values()).map(l => l.family).filter(Boolean))).sort();
    if (dbFilter.family && !families.includes(dbFilter.family)) dbFilter.family = "";
    el("#dbFilters").innerHTML = [`<button type="button" class="fchip ${dbFilter.family ? "" : "fchip--on"}" data-f="">${esc(t("dbAll"))}</button>`]
      .concat(families.map(f => `<button type="button" class="fchip ${dbFilter.family === f ? "fchip--on" : ""}" data-f="${esc(f)}">${esc(familyLabel(f))}</button>`)).join("");
    els(".fchip", el("#dbFilters")).forEach(b => b.addEventListener("click", () => { dbFilter.family = b.dataset.f; renderDatabase(); }));

    const q = dbFilter.q.trim().toLowerCase();
    const all = Array.from(DB.leaves.values());
    const listing = all.filter(s =>
      (!dbFilter.family || s.family === dbFilter.family) &&
      (!q || [s.nameEn, s.nameHi, s.family, s.story, s.keywords.join(" "), s.signs.join(" ")].join(" ").toLowerCase().includes(q)));

    el("#dbCount").textContent = t("dbCount", listing.length, all.length);
    const wrap = el("#dbList");
    if (!listing.length) { wrap.innerHTML = `<p class="muted">${esc(t("dbEmpty"))}</p>`; }
    else {
      wrap.innerHTML = listing.map(s => `
        <details class="db-card">
          <summary class="db-card__summary">
            <span class="db-card__emoji" aria-hidden="true">${esc(s.emoji)}</span>
            <span class="db-card__name">${esc(pick(s.nameEn, s.nameHi))}</span>
            <span class="risk risk--${s.risk.toLowerCase()} risk--sm">${esc(s.risk)}</span>
          </summary>
          <div class="db-card__body">
            <p>${esc(pick(s.story, s.storyHi))}</p>
            <p class="db-card__label">${esc(t("signsTitle"))}</p>
            <ul>${localList(s.signs, s.signsHi).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
            <p class="db-card__label">${esc(t("planTitle"))}</p>
            <ol>${localList(s.steps, s.stepsHi).map(x => `<li>${esc(x)}</li>`).join("")}</ol>
          </div>
        </details>`).join("");
    }
    renderHealth();
  }
  el("#dbSearch").addEventListener("input", (e) => { dbFilter.q = e.target.value; renderDatabase(); });
  const localList = (en, hi) => en.map((x, i) => (isHi() && hi[i]) ? hi[i] : x);

  function renderHealth() {
    const a = DB.audit;
    const codes = (arr) => arr.length ? arr.map(x => `<code>${esc(x)}</code>`).join(" ") : `<span class="muted">${esc(t("hOk"))}</span>`;
    const row = (label, html, bad) => `<div class="health__row ${bad ? "health__row--bad" : ""}"><span class="health__label">${esc(label)}</span><span class="health__val">${html}</span></div>`;
    const srcName = dataMeta.source === "live" ? t("srcLive") : dataMeta.source === "cache" ? t("srcCache") : t("srcSnapshot");
    el("#healthBody").innerHTML = [
      row(t("hThe"), esc(srcName) + (dataMeta.liveFailed ? " ⚠️" : ""), dataMeta.liveFailed),
      row(t("hLeaves"), a.leafCount),
      row(t("hNodes"), a.nodeCount),
      row(t("hDepth"), a.maxDepth),
      row(t("hReach"), `${a.reachableLeafCount} / ${a.leafCount}`, a.reachableLeafCount < a.leafCount),
      a.startMissing ? row(t("hStart"), `<code>${esc(a.startKey)}</code>`, true) : "",
      row(t("hDup"), codes(a.dupNodes.map(d => `${d.id} ×${d.rows}`)), a.dupNodes.length > 0),
      row(t("hPolicy"), `<code>${esc(a.dupPolicy)}</code>`),
      row(t("hDupLeaf"), codes(a.dupLeaves), a.dupLeaves.length > 0),
      row(t("hDangling"), codes(a.dangling.map(d => `${d.node} → ${d.next}`)), a.dangling.length > 0),
      row(t("hOrphan"), codes(a.orphanNodes), a.orphanNodes.length > 0),
      row(t("hUnreach"), codes(a.unreachableLeaves), a.unreachableLeaves.length > 0),
      row(t("hThin"), codes(a.thinLeaves)),
      row(t("hCycle"), codes(a.cycles), a.cycles.length > 0)
    ].join("");
  }

  // ==========================================================================
  //  DIAGNOSTIC FLOW
  // ==========================================================================
  function newFlow() {
    return { phase: "idle", nodeId: null, path: [], leafId: null, qs: [], ans: [], idx: 0, kwSel: new Set(), tried: new Set(), result: null, counted: false };
  }
  let flow = newFlow();
  let locked = false;

  const box = () => el("#triageBox");
  const rbox = () => el("#resultBox");

  el("#startBtn").addEventListener("click", startFlow);
  function startFlow() {
    if (pendingRaw) { applyRaw(pendingRaw, "live"); pendingRaw = null; onDataChanged(); }
    flow = newFlow();
    if (!DB.nodes.has(DB.startKey)) flow.phase = "error";
    else { flow.phase = "tree"; flow.nodeId = DB.startKey; }
    showView("diagnose");
    render();
  }

  el("#backBtn").addEventListener("click", goBack);
  el("#nextBtn").addEventListener("click", onNext);

  function render() {
    const isResult = flow.phase === "result";
    box().hidden = isResult;
    rbox().hidden = !isResult;
    el("#triageMeta").hidden = isResult || flow.phase === "error" || flow.phase === "idle";
    el("#nextBtn").hidden = true;
    el("#backBtn").hidden = !canGoBack();
    updateProgress();

    if (flow.phase === "error") { box().innerHTML = `<p class="muted">${esc(t("loadErr"))}</p>`; return; }
    if (flow.phase === "tree") renderTree();
    else if (flow.phase === "confirm") renderConfirm();
    else if (flow.phase === "result") renderResult();
    if (!isResult) { const h = el(".triage__title", box()); if (h) h.focus({ preventScroll: true }); }
  }

  function canGoBack() {
    if (flow.phase === "tree") return flow.path.length > 0;
    return flow.phase === "confirm" || flow.phase === "result";
  }

  // ----- progress -----
  function stepInfo() {
    if (flow.phase === "tree") {
      const answered = flow.path.length;
      return { n: answered + 1, total: answered + DB.minQ(flow.nodeId) + CONFIRM_EST, approx: true };
    }
    if (flow.phase === "confirm") {
      const answered = flow.path.length;
      return { n: answered + flow.idx + 1, total: answered + flow.qs.length, approx: false };
    }
    return null;
  }
  function updateProgress() {
    const fill = el("#progressFill");
    if (flow.phase === "result") { fill.style.width = "100%"; return; }
    const s = stepInfo();
    if (!s) { fill.style.width = "0%"; return; }
    fill.style.width = `${clamp(((s.n - 1) / s.total) * 100, 0, 96)}%`;
    el("#phaseChip").textContent = flow.phase === "tree" ? t("phaseRoute") : t("phaseConfirm");
    el("#stepCount").textContent = t("qOf", s.n, Math.max(s.total, s.n), s.approx);
  }

  // ----- Stage 1: routing through the Decision Tree -----
  function renderTree() {
    const node = DB.nodes.get(flow.nodeId);
    box().innerHTML = `
      <h2 class="triage__title" tabindex="-1">${esc(pick(node.question, node.questionHi))}</h2>
      <div class="choices">
        ${node.options.map((o, i) => `<button type="button" class="choice" data-i="${i}">${esc(pick(o.text, o.textHi))}</button>`).join("")}
      </div>
      <button type="button" class="btn btn--text nonefit" data-none>${esc(t("noneFit"))}</button>`;
    els(".choice", box()).forEach(b => b.addEventListener("click", () => tap(b, () => chooseOption(+b.dataset.i))));
    el("[data-none]", box()).addEventListener("click", () => showNoMatch("user"));
  }

  function tap(btn, fn) {
    if (locked) return;
    locked = true;
    btn.classList.add("choice--sel");
    setTimeout(() => { locked = false; fn(); }, 140);
  }

  function chooseOption(i) {
    const node = DB.nodes.get(flow.nodeId);
    const opt = node.options[i];
    flow.path.push({ nodeId: node.id, optIdx: i, q: node.question, qHi: node.questionHi, a: opt.text, aHi: opt.textHi });
    const r = DB.resolve(opt.next);
    if (!r || flow.path.length > CFG.MAX_DEPTH) {
      console.warn(`[ThagaShield] Dead end at ${node.id} -> "${opt.next}" (no such question or scam id)`);
      return showNoMatch("deadend");
    }
    if (r.type === "node") { flow.nodeId = r.node.id; render(); }
    else { beginConfirm(r.leaf); render(); }
  }

  function showNoMatch(reason) {
    flow.phase = "result";
    flow.result = { none: true, reason };
    render();
  }

  // ----- Stage 2: confirmation questions built from the scam's own data -----
  function beginConfirm(leaf) {
    flow.leafId = leaf.key;
    flow.phase = "confirm";
    flow.idx = 0; flow.ans = []; flow.kwSel = new Set(); flow.result = null;
    flow.qs = leaf.signs.map((s, i) => ({ type: "sign", i }));
    if (leaf.keywords.length) flow.qs.push({ type: "kw" });
    if (!flow.qs.length) finishConfirm();
  }
  const curLeaf = () => DB.leaves.get(flow.leafId);

  function renderConfirm() {
    const leaf = curLeaf();
    const q = flow.qs[flow.idx];
    const intro = flow.idx === 0 ? `<p class="banner">${esc(t("confirmIntro"))}</p>` : "";
    if (q.type === "sign") {
      const text = (isHi() && leaf.signsHi[q.i]) ? leaf.signsHi[q.i] : leaf.signs[q.i];
      box().innerHTML = `${intro}
        <h2 class="triage__title" tabindex="-1">${esc(t("signQ"))}</h2>
        <blockquote class="signcard">${esc(text)}</blockquote>
        <div class="trio">
          <button type="button" class="choice" data-a="yes">${esc(t("yes"))}</button>
          <button type="button" class="choice" data-a="no">${esc(t("no"))}</button>
          <button type="button" class="choice" data-a="unsure">${esc(t("unsure"))}</button>
        </div>`;
      els(".choice", box()).forEach(b => b.addEventListener("click", () => tap(b, () => answerConfirm(b.dataset.a))));
    } else {
      const sel = flow.kwSel;
      box().innerHTML = `${intro}
        <h2 class="triage__title" tabindex="-1">${esc(t("kwQ"))}</h2>
        <p class="muted small kwhint">${esc(t("kwHint"))}</p>
        <div class="pillgrid">
          ${leaf.keywords.map(k => `<button type="button" class="opt opt--check ${sel.has(k) ? "opt--sel" : ""}" data-k="${esc(k)}">${esc(prettyTag(k))}</button>`).join("")}
        </div>
        <button type="button" class="btn btn--text nonefit" data-kwnone>${esc(t("kwNone"))}</button>`;
      const next = el("#nextBtn");
      next.hidden = false; next.textContent = t("next"); next.disabled = sel.size === 0;
      els(".opt", box()).forEach(b => b.addEventListener("click", () => {
        const k = b.dataset.k;
        if (sel.has(k)) { sel.delete(k); b.classList.remove("opt--sel"); } else { sel.add(k); b.classList.add("opt--sel"); }
        next.disabled = sel.size === 0;
      }));
      el("[data-kwnone]", box()).addEventListener("click", () => { flow.kwSel = new Set(); answerConfirm([]); });
    }
  }

  function answerConfirm(val) {
    flow.ans[flow.idx] = val;
    flow.idx += 1;
    if (flow.idx >= flow.qs.length) finishConfirm(); else render();
  }
  function onNext() {
    if (flow.phase === "confirm" && flow.qs[flow.idx] && flow.qs[flow.idx].type === "kw") {
      const picked = Array.from(flow.kwSel);
      flow.kwSel = new Set();
      answerConfirm(picked);
    }
  }

  // ----- Scoring -----
  function computeResult() {
    const leaf = curLeaf();
    const n = leaf.signs.length;
    const yesIdx = [], unsureIdx = [], noIdx = [];
    flow.qs.forEach((q, qi) => {
      if (q.type !== "sign") return;
      const a = flow.ans[qi];
      if (a === "yes") yesIdx.push(q.i); else if (a === "unsure") unsureIdx.push(q.i); else noIdx.push(q.i);
    });
    const kwQi = flow.qs.findIndex(q => q.type === "kw");
    const kwHits = kwQi >= 0 && Array.isArray(flow.ans[kwQi]) ? flow.ans[kwQi] : [];

    let total = CF.WEIGHT_PATH, got = CF.WEIGHT_PATH;
    if (n) {
      total += CF.WEIGHT_SIGNS;
      const ratio = clamp((yesIdx.length + 0.5 * unsureIdx.length - 0.5 * noIdx.length) / n, 0, 1);
      got += CF.WEIGHT_SIGNS * ratio;
    }
    if (leaf.keywords.length) {
      total += CF.WEIGHT_KEYWORDS;
      const need = Math.min(CF.KEYWORD_HITS_FULL, leaf.keywords.length);
      got += CF.WEIGHT_KEYWORDS * Math.min(1, kwHits.length / need);
    }
    let pct = Math.round((got / total) * 100);
    if (n && yesIdx.length === 0) pct = Math.min(pct, CF.POSSIBLE - 5);              // no red flag confirmed -> can't be "possible"
    if (n && yesIdx.length < Math.min(2, n)) pct = Math.min(pct, CF.STRONG - 1);     // "strong" needs 2 confirmed flags
    pct = clamp(pct, 5, 98);
    const tier = pct >= CF.STRONG ? "confirmed" : pct >= CF.POSSIBLE ? "possible" : "weak";
    return { leaf, pct, tier, yesIdx, unsureIdx, noIdx, kwHits, total: n };
  }

  function finishConfirm() {
    flow.result = computeResult();
    flow.phase = "result";
    if (flow.result.tier !== "weak" && !flow.counted) {
      flow.counted = true;
      state.dodged += 1;
      state.history.unshift({ id: flow.result.leaf.id, at: Date.now() });
      state.history = state.history.slice(0, 20);
      saveState();
    }
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // ----- Back -----
  function popToTree() {
    const last = flow.path.pop();
    flow.phase = "tree";
    flow.nodeId = last ? last.nodeId : DB.startKey;
    flow.leafId = null; flow.qs = []; flow.ans = []; flow.idx = 0; flow.tried = new Set(); flow.result = null; flow.kwSel = new Set();
  }
  function stepBackTo(idx) {
    const prev = flow.ans[idx];
    flow.kwSel = new Set(Array.isArray(prev) ? prev : []);
    flow.idx = idx;
    flow.ans.length = idx;
  }
  function goBack() {
    if (flow.phase === "result") {
      if (flow.result && flow.result.none) {
        if (flow.result.reason === "user") { flow.phase = "tree"; flow.result = null; }
        else popToTree();
      } else { flow.phase = "confirm"; stepBackTo(Math.max(0, flow.qs.length - 1)); flow.result = null; }
    } else if (flow.phase === "confirm") {
      if (flow.idx > 0) stepBackTo(flow.idx - 1); else popToTree();
    } else if (flow.phase === "tree") {
      const last = flow.path.pop();
      if (last) flow.nodeId = last.nodeId;
    }
    render();
  }

  // ----- Stage 3: result -----
  function alternatives(leaf) {
    const last = flow.path[flow.path.length - 1];
    if (!last) return [];
    const node = DB.nodes.get(last.nodeId);
    const out = [];
    node.options.forEach((o, i) => {
      const r = DB.resolve(o.next);
      if (r && r.type === "leaf" && r.leaf.key !== leaf.key && !flow.tried.has(r.leaf.key)) out.push({ leaf: r.leaf, optIdx: i });
    });
    return out.slice(0, 4);
  }

  function switchTo(leafKey, optIdx) {
    const last = flow.path[flow.path.length - 1];
    const node = DB.nodes.get(last.nodeId);
    const opt = node.options[optIdx];
    flow.tried.add(flow.leafId);
    last.optIdx = optIdx; last.a = opt.text; last.aHi = opt.textHi;
    beginConfirm(DB.leaves.get(leafKey));
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goldenHourHtml() {
    return `<section class="goldenhour">
      <p class="goldenhour__title">⏱️ ${esc(t("goldenHour"))}</p>
      <p>${esc(t("goldenHourBody"))}</p>
      <a class="btn btn--primary btn--call" href="tel:1930">📞 ${esc(t("call1930"))}</a>
    </section>`;
  }

  function renderResult() {
    el("#nextBtn").hidden = true;
    const res = flow.result;
    const out = rbox();

    if (res.none) {
      out.innerHTML = `
        <div class="result">
          <div class="result__emoji" aria-hidden="true">🤔</div>
          <p class="result__tier result__tier--weak">${esc(t("tierNone"))}</p>
          <h2 class="result__name" tabindex="-1">${esc(t("noneTitle"))}</h2>
          <section class="result__section"><p>${esc(t("noneBody"))}</p></section>
          ${goldenHourHtml()}
          <button id="browseBtn" class="btn btn--ghost btn--block gap">${esc(t("browseBtn"))}</button>
          <button id="restartBtn2" class="btn btn--primary btn--block">${esc(t("restartBtn"))}</button>
        </div>`;
      el("#browseBtn").addEventListener("click", () => showView("database"));
      el("#restartBtn2").addEventListener("click", startFlow);
      return;
    }

    const { leaf, pct, tier, yesIdx, unsureIdx, kwHits } = res;
    const name = pick(leaf.nameEn, leaf.nameHi);
    const colorVar = tier === "confirmed" ? "var(--danger)" : tier === "possible" ? "var(--warn)" : "var(--muted)";
    const tierLabel = tier === "confirmed" ? t("tierConfirmed") : tier === "possible" ? t("tierPossible") : t("tierWeak");
    const signs = localList(leaf.signs, leaf.signsHi);
    const steps = localList(leaf.steps, leaf.stepsHi);
    const alts = tier === "confirmed" ? [] : alternatives(leaf);

    const pathItems = flow.path.map(p => `<li><span class="ev__q">${esc(pick(p.q, p.qHi))}</span><strong>${esc(pick(p.a, p.aHi))}</strong></li>`).join("");

    out.innerHTML = `
      <div class="result">
        <div class="result__gauge">${buildGauge(pct, colorVar)}<div class="result__pct">${pct}%</div></div>
        <p class="result__tier result__tier--${tier}">${esc(tierLabel)}</p>
        <h2 class="result__name" tabindex="-1">${esc(leaf.emoji)} ${esc(name)}</h2>
        <p class="result__badges">
          <span class="risk risk--${leaf.risk.toLowerCase()}">${esc(t("risk")[leaf.risk])}</span>
          ${leaf.family ? `<span class="fam">${esc(familyLabel(leaf.family))}</span>` : ""}
        </p>
        ${tier === "weak" ? `<p class="weaknote">${esc(t("weakNote"))}</p>` : ""}

        <section class="result__section">
          <h3>${esc(t("evidenceTitle"))}</h3>
          <ul class="evidence">${pathItems}</ul>
          <p class="evidence__sum">✅ ${esc(t("flagsSummary", yesIdx.length, res.total))}</p>
          ${kwHits.length ? `<p class="evidence__sum">🔑 ${esc(t("kwSummary", kwHits.map(prettyTag).join(", ")))}</p>` : ""}
        </section>

        ${alts.length ? `
        <section class="result__section alts">
          <h3>${esc(t("altTitle"))}</h3>
          <p class="muted small">${esc(t("altHint"))}</p>
          <div class="choices">${alts.map(a => `<button type="button" class="choice" data-alt="${esc(a.leaf.key)}" data-opt="${a.optIdx}">${esc(a.leaf.emoji)} ${esc(pick(a.leaf.nameEn, a.leaf.nameHi))}</button>`).join("")}</div>
        </section>` : ""}

        <section class="result__section">
          <h3>${esc(t("whyTitle"))}</h3>
          <p>${esc(pick(leaf.story, leaf.storyHi))}</p>
        </section>
        <section class="result__section">
          <h3>${esc(t("signsTitle"))}</h3>
          <ul class="signlist">${signs.map((s, i) => `<li class="${yesIdx.includes(i) ? "sign--yes" : unsureIdx.includes(i) ? "sign--maybe" : ""}">${esc(s)}</li>`).join("")}</ul>
        </section>
        <section class="result__section">
          <h3>${esc(t("planTitle"))}</h3>
          <ol class="steplist">${steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        </section>

        ${goldenHourHtml()}
        <div class="result__actions">
          <button id="copyMsgBtn" class="btn btn--ghost">${esc(t("copyBtn"))}</button>
          <button id="shareBtn" class="btn btn--ghost">${esc(t("shareBtn"))}</button>
        </div>
        <button id="restartBtn2" class="btn btn--primary btn--block">${esc(t("restartBtn"))}</button>
      </div>`;

    els("[data-alt]", out).forEach(b => b.addEventListener("click", () => tap(b, () => switchTo(b.dataset.alt, +b.dataset.opt))));
    el("#copyMsgBtn").addEventListener("click", async () => {
      const btn = el("#copyMsgBtn");
      try {
        await navigator.clipboard.writeText(t("blockMsg"));
        btn.textContent = t("copiedBtn");
        setTimeout(() => { btn.textContent = t("copyBtn"); }, 1800);
      } catch (e) { alert(t("blockMsg")); }
    });
    el("#shareBtn").addEventListener("click", async () => {
      const shareText = `ThagaShield diagnosis: ${pct}% match for "${name}". Check your own suspicious message free at ${location.href}`;
      if (navigator.share) {
        try { await navigator.share({ title: "ThagaShield", text: shareText, url: location.href }); } catch (e) { /* cancelled */ }
      } else {
        try { await navigator.clipboard.writeText(shareText); el("#shareBtn").textContent = t("copiedBtn"); setTimeout(() => el("#shareBtn").textContent = t("shareBtn"), 1800); } catch (e) { /* ignore */ }
      }
    });
    el("#restartBtn2").addEventListener("click", startFlow);
  }

  function buildGauge(pct, colorVar) {
    // semicircle gauge, 0-100 mapped to a 180° arc (sweep never exceeds 180°, so large-arc flag is always 0)
    const r = 80, cx = 100, cy = 100;
    const toXY = (ang) => { const rad = (Math.PI / 180) * ang; return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]; };
    const [sx, sy] = toXY(180);
    const [ex, ey] = toXY(180 - (pct / 100) * 180);
    return `<svg viewBox="0 0 200 110" class="gauge" role="img" aria-label="Match gauge showing ${pct} percent">
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--track)" stroke-width="16" stroke-linecap="round"/>
      <path d="M ${sx.toFixed(2)} ${sy.toFixed(2)} A 80 80 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}" fill="none" stroke="${colorVar}" stroke-width="16" stroke-linecap="round"/>
    </svg>`;
  }

  // ---------- Init ----------
  (function init() {
    const start = ThagaData.initialRaw();
    if (!start) { document.body.innerHTML = "<p style='padding:24px;color:#fff'>ThagaShield could not load its data.</p>"; return; }
    applyRaw(start.raw, start.source, start.at);
    applyLangToStaticText();
    renderHome();
    showView("home");
    refreshLive(); // instant start from cache/built-in copy, then quietly update from the live sheets
  })();
})();
