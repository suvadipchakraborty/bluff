/* ThagaShield — Data layer
   Reads the two Google Sheets (Scam Leaves + Decision Tree), builds an in-memory
   database, audits it for researcher mistakes, and handles live / cached / built-in loading.
   Nothing here touches the DOM. */
(function (root) {
  "use strict";

  const cfg = () => root.THAGA_CONFIG || {};

  // ---------- CSV (RFC 4180: quotes, commas and newlines inside quotes, "" escapes) ----------
  function parseCSV(text) {
    text = String(text || "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [], field = "", inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { inQ = false; }
        } else { field += c; }
      } else if (c === '"') { inQ = true; }
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = ""; rows.push(row); row = [];
      } else { field += c; }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ""));
  }

  function toObjects(rows) {
    if (!rows.length) return [];
    const head = rows[0].map(h => h.trim().toLowerCase());
    return rows.slice(1).map((r, i) => {
      const o = { __row: i + 2 };
      head.forEach((h, idx) => { if (h) o[h] = (r[idx] || "").trim(); });
      return o;
    });
  }

  const list = (s) => String(s || "").split("|").map(x => x.trim()).filter(Boolean);
  const RISKS = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
  const normRisk = (s) => RISKS[String(s || "").trim().toLowerCase()] || "Medium";

  // ---------- Build ----------
  function build(raw, opts) {
    opts = opts || {};
    const dupPolicy = opts.duplicates || "last";
    const startKey = String(opts.startNode || "Q1_START").trim().toUpperCase();

    // Leaves (final scam typologies)
    const leaves = new Map();
    const dupLeaves = [];
    toObjects(parseCSV(raw.leaves)).forEach(o => {
      const id = (o.id || "").trim();
      if (!id) return;
      const key = id.toLowerCase();
      if (leaves.has(key)) dupLeaves.push(id);
      leaves.set(key, {
        id, key,
        family: (o.family || "").toLowerCase(),
        nameEn: o.name_en || id,
        nameHi: o.name_hi || "",
        emoji: o.emoji || "⚠️",
        channels: list(o.channels),
        actions: list(o.actions),
        keywords: list(o.keywords),
        story: o.story || "", storyHi: o.story_hi || "",
        signs: list(o.signs), signsHi: list(o.signs_hi),
        steps: list(o.steps), stepsHi: list(o.steps_hi),
        risk: normRisk(o.risk_level)
      });
    });

    // Nodes (questions)
    const nodes = new Map();
    const dupNodes = {};
    toObjects(parseCSV(raw.tree)).forEach(o => {
      const id = (o.node_id || "").trim();
      if (!id) return;
      const key = id.toUpperCase();
      const options = [];
      for (let n = 1; ("opt_" + n + "_text") in o; n++) {
        const text = o["opt_" + n + "_text"] || "";
        const next = o["opt_" + n + "_next"] || "";
        if (text && next) options.push({ text, next, textHi: o["opt_" + n + "_text_hi"] || "" });
      }
      const node = { id: key, question: o.question_text || "", questionHi: o.question_text_hi || "", options, row: o.__row };
      if (nodes.has(key)) {
        dupNodes[key] = (dupNodes[key] || 1) + 1;
        if (dupPolicy === "first") return;
        if (dupPolicy === "merge") {
          const prev = nodes.get(key);
          const seen = new Set(prev.options.map(x => x.text.toLowerCase() + "|" + x.next.toLowerCase()));
          options.forEach(op => {
            const k = op.text.toLowerCase() + "|" + op.next.toLowerCase();
            if (!seen.has(k)) { prev.options.push(op); seen.add(k); }
          });
          return;
        }
      }
      nodes.set(key, node);
    });

    // Resolve a routing key to a node or a leaf (nodes take priority)
    function resolve(k) {
      const s = String(k || "").trim();
      const n = nodes.get(s.toUpperCase());
      if (n) return { type: "node", node: n };
      const l = leaves.get(s.toLowerCase());
      if (l) return { type: "leaf", leaf: l };
      return null;
    }

    // Fewest questions still needed from a node (used for the progress bar)
    const memo = new Map();
    function minQ(id, stack) {
      if (memo.has(id)) return memo.get(id);
      stack = stack || new Set();
      if (stack.has(id)) return 99;
      const node = nodes.get(id);
      if (!node) return 1;
      stack.add(id);
      let best = 99;
      node.options.forEach(op => {
        const r = resolve(op.next);
        if (!r) return;
        best = Math.min(best, r.type === "leaf" ? 1 : 1 + minQ(r.node.id, stack));
      });
      stack.delete(id);
      if (best === 99) best = 1;
      memo.set(id, best);
      return best;
    }

    // ---------- Audit ----------
    const audit = {
      leafCount: leaves.size, nodeCount: nodes.size,
      startMissing: !nodes.has(startKey), startKey,
      dupNodes: Object.keys(dupNodes).map(k => ({ id: k, rows: dupNodes[k] })),
      dupLeaves, dupPolicy,
      dangling: [], orphanNodes: [], unreachableLeaves: [], thinLeaves: [],
      cycles: [], maxDepth: 0, reachableLeafCount: 0
    };
    const seenNodes = new Set(), reachLeaves = new Set();
    if (!audit.startMissing) {
      const queue = [startKey];
      while (queue.length) {
        const id = queue.shift();
        if (seenNodes.has(id)) continue;
        seenNodes.add(id);
        nodes.get(id).options.forEach(op => {
          const r = resolve(op.next);
          if (!r) audit.dangling.push({ node: id, option: op.text, next: op.next });
          else if (r.type === "node") queue.push(r.node.id);
          else reachLeaves.add(r.leaf.key);
        });
      }
      const depthMemo = new Map();
      const depth = (id, vis) => {
        if (depthMemo.has(id)) return depthMemo.get(id);
        if (vis.has(id)) { if (!audit.cycles.includes(id)) audit.cycles.push(id); return 0; }
        vis.add(id);
        let d = 1;
        nodes.get(id).options.forEach(op => {
          const r = resolve(op.next);
          if (r && r.type === "node") d = Math.max(d, 1 + depth(r.node.id, vis));
        });
        vis.delete(id);
        depthMemo.set(id, d);
        return d;
      };
      audit.maxDepth = depth(startKey, new Set());
    }
    nodes.forEach((n, id) => { if (!seenNodes.has(id)) audit.orphanNodes.push(id); });
    leaves.forEach((l, key) => {
      if (!reachLeaves.has(key)) audit.unreachableLeaves.push(l.id);
      if (l.signs.length < 2) audit.thinLeaves.push(l.id);
    });
    audit.reachableLeafCount = reachLeaves.size;

    return { leaves, nodes, startKey, resolve, minQ, audit };
  }

  // ---------- Loading: live sheets -> cached copy -> built-in snapshot ----------
  function validateRaw(raw) {
    const l = parseCSV(raw.leaves), t = parseCSV(raw.tree);
    const lh = (l[0] || []).map(h => h.trim().toLowerCase());
    const th = (t[0] || []).map(h => h.trim().toLowerCase());
    if (!lh.includes("id") || !lh.includes("name_en")) throw new Error("Leaf sheet: unexpected columns");
    if (!th.includes("node_id") || !th.includes("question_text")) throw new Error("Tree sheet: unexpected columns");
    if (l.length < 2 || t.length < 2) throw new Error("Sheet is empty");
    return raw;
  }

  async function fetchCSV(url, ms) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ms);
    try {
      const res = await fetch(url, { cache: "no-cache", signal: ctl.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.text();
    } finally { clearTimeout(timer); }
  }

  async function fetchLive() {
    const c = cfg();
    const [leaves, tree] = await Promise.all([
      fetchCSV(c.LEAF_CSV_URL, c.FETCH_TIMEOUT_MS || 8000),
      fetchCSV(c.TREE_CSV_URL, c.FETCH_TIMEOUT_MS || 8000)
    ]);
    return validateRaw({ leaves, tree });
  }

  function readCache() {
    try {
      const o = JSON.parse(localStorage.getItem(cfg().CACHE_KEY));
      if (o && o.raw) { validateRaw(o.raw); return o; }
    } catch (e) { /* ignore */ }
    return null;
  }
  function writeCache(raw) {
    try { localStorage.setItem(cfg().CACHE_KEY, JSON.stringify({ raw: { leaves: raw.leaves, tree: raw.tree }, at: Date.now() })); }
    catch (e) { /* ignore */ }
  }

  // Best data available *right now* (no network): cached live copy, else built-in snapshot
  function initialRaw() {
    const cached = readCache();
    if (cached) return { raw: cached.raw, source: "cache", at: cached.at };
    const s = root.THAGA_SNAPSHOT;
    if (s) return { raw: { leaves: s.leaves, tree: s.tree }, source: "snapshot", at: s.savedAt };
    return null;
  }

  const api = { parseCSV, toObjects, build, fetchLive, readCache, writeCache, initialRaw, validateRaw };
  root.ThagaData = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
