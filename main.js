/* Content data + scroll choreography for HTML layer (works with or without WebGL) */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const D = "assets/docs/", S = "assets/students/";

  /* ---------- documents (sample placeholders — replace with the teacher's own scans) ---------- */
  const DOCS = {
    st1: { t: "Үлгі · Облыстық пән олимпиадасы, І дәрежелі диплом", p: [S + "diploma-sample.svg"] },
    st2: { t: "Үлгі · Олимпиаданың аудандық кезеңі, ІІІ орын", p: [S + "diploma-sample.svg"] },
    st3: { t: "Үлгі · Ғылыми жобалар байқауы, ІІ орын", p: [S + "diploma-sample.svg"] },
    g1: { t: "Үлгі · Құрмет грамотасы", p: [D + "letter-sample.svg"] },
    g2: { t: "Үлгі · Семинар сертификаты", p: [D + "cert-sample.svg"] },
    g3: { t: "Үлгі · Конференция: алғыс хат", p: [D + "letter-sample.svg"] },
    g4: { t: "Үлгі · Біліктілікті арттыру курсы", p: [D + "cert-sample.svg"] },
    g5: { t: "Үлгі · Әдістемелік жұмыс тобы", p: [D + "letter-sample.svg"] }
  };
  const TL = [
    ["2022", "Грамота", "Құрмет грамотасы", "Білім беру саласындағы жетістіктері үшін берілген марапат — осы жерге өз құжатыңызды қосыңыз.", "g1"],
    ["2023", "Сертификат", "Пән мұғалімдеріне арналған семинар", "Олимпиадалық есептерді шығару әдістемесі бойынша семинарға қатысу.", "g2"],
    ["2024", "Алғыс хат", "Ғылыми-тәжірибелік конференция", "Секция жұмысында іс-тәжірибемен бөлісу.", "g3"],
    ["2025", "Сертификат", "Біліктілікті арттыру курсы", "Заманауи оқыту технологиялары бойынша курс (академиялық сағат саны).", "g4"],
    ["2026", "Бұйрық", "Әдістемелік жұмыс тобы", "STEM бағытындағы ұсынымдарды әзірлеу жөніндегі жұмыс тобына енгізілу.", "g5"]
  ];
  $("#timeline").innerHTML = TL.map((x, i) => `<li id="tl-${i}" role="tabpanel" aria-labelledby="yr-${i}">
    <div class="tl-year" aria-hidden="true">${x[0]}</div><span class="tl-kind">${x[1]}</span><h3>${x[0]} · ${x[2]}</h3><p>${x[3]}</p>
    <button class="btn ghost" type="button" data-doc="${x[4]}">Құжатты ашу <b aria-hidden="true">↗</b></button></li>`).join("");
  $("#years").innerHTML = TL.map((x, i) => `<button type="button" role="tab" id="yr-${i}" aria-controls="tl-${i}" aria-selected="false" aria-label="${x[0]} · ${x[2]}">${x[0]}</button>`).join("");
  window.TL_YEARS = TL.map(x => x[0]);    // read by scene3d.js for the light-line nodes

  /* ---------- document viewer (native <dialog>: Esc closes, focus returns) ---------- */
  const dlg = $("#viewer"), img = $("#viewer-img");
  let opener = null;
  function openDoc(id, from) {
    const d = DOCS[id]; if (!d) return; opener = from || document.activeElement;
    $("#viewer-title").textContent = d.t; img.alt = d.t;
    const show = k => { img.src = d.p[k]; $$("#viewer-pages button").forEach((b, j) => b.setAttribute("aria-pressed", j === k)); };
    $("#viewer-pages").innerHTML = d.p.length > 1 ? d.p.map((_, k) => `<button type="button">${(d.n && d.n[k]) || "Бет " + (k + 1)}</button>`).join("") : "";
    $$("#viewer-pages button").forEach((b, k) => b.onclick = () => show(k));
    $("#viewer-note").textContent = "Түпнұсқа құжаттың көшірмесі";
    show(0);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    $(".v-close", dlg).focus();
  }
  dlg.addEventListener("close", () => { if (opener && opener.focus) opener.focus({ preventScroll: true }); });
  $(".v-close", dlg).onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  document.addEventListener("click", e => { const b = e.target.closest("[data-doc]"); if (b) openDoc(b.dataset.doc, b); });

  /* ---------- scroll model ---------- */
  const scenes = $$(".scene"), isStatic = () => root.classList.contains("static");
  let tops = [], spans = [], vh = innerHeight, lastW = innerWidth;
  function layout() {
    vh = innerHeight;
    scenes.forEach(s => s.style.height = isStatic() ? "" : Math.round(vh * (+s.dataset.h) / 100) + "px");
    tops = scenes.map(s => s.offsetTop); spans = scenes.map(s => Math.max(1, s.offsetHeight - vh));
  }
  function getG() {
    if (window.__forceG != null) return window.__forceG;   // test hook
    const y = scrollY; let i = 0;
    for (let k = 0; k < scenes.length; k++) if (y >= tops[k] - 1) i = k;
    return i + Math.min(1, Math.max(0, (y - tops[i]) / spans[i]));
  }
  window.portfolio = { getG, isStatic, layout: () => layout() };
  addEventListener("resize", () => { if (Math.abs(innerWidth - lastW) > 40 || Math.abs(innerHeight - vh) > 140) { lastW = innerWidth; layout(); } });
  layout();

  /* nav: jump to the reading point of each chapter */
  const READ = [0, .3, .3, .45, .1, .55];
  $$("[data-go]").forEach(a => a.addEventListener("click", e => {
    if (isStatic()) return; e.preventDefault();
    const i = +a.dataset.go; scrollTo({ top: tops[i] + spans[i] * READ[i], behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    if (i > 0) setTimeout(() => { const h = scenes[i].querySelector("h2"); h && h.setAttribute("tabindex", "-1"); h && h.focus({ preventScroll: true }); }, 900);
  }));
  /* years → timeline position */
  $$("#years button").forEach((b, i) => b.onclick = () => scrollTo({ top: tops[4] + spans[4] * (.1 + .8 * (i + .5) / TL.length), behavior: "smooth" }));
  /* keyboard focus on hidden timeline item → bring it into view */
  $("#timeline").addEventListener("focusin", e => { const li = e.target.closest("li"); if (!li || isStatic()) return; const i = +li.id.split("-")[1];
    scrollTo({ top: tops[4] + spans[4] * (.1 + .8 * (i + .5) / TL.length) }); });

  /* ---------- hero lab layer: zoom into the painted flask, teacher slides aside in depth ---------- */
  const lab = $("#lab"), bg = $("#lab .lab-bg"), teacher = $("#lab .lab-teacher"), glowL = $("#lab .lab-glow");
  const FLASK = [.543, .79];          // neck of the flask in the background image (normalised)
  let flaskPx = [0, 0];
  function layoutLab() {
    const W = innerWidth, H = innerHeight, iw = 1672, ih = 941, fx = W < 820 ? .6 : .5;
    const s = Math.max(W / iw, H / ih), w = iw * s, h = ih * s, left = Math.min(0, Math.max(W - w, W / 2 - fx * w)), top = (H - h) / 2;
    Object.assign(bg.style, { width: w + "px", height: h + "px", left: left + "px", top: top + "px", objectFit: "fill" });
    bg.style.transformOrigin = `${FLASK[0] * w}px ${FLASK[1] * h}px`;
  }
  addEventListener("resize", layoutLab); layoutLab();
  function labFrame(G) {
    const show = G < .93 || G > 5.0; lab.style.visibility = show ? "visible" : "hidden"; if (!show) return;
    const W = innerWidth, H = innerHeight;
    let z, tx, tp, to;                                   // zoom, pull-to-centre, teacher progress, teacher opacity
    if (G < 1) { z = sm(.04, .9, G); tp = sm(0, .62, G); to = 1 - sm(.3, .62, G); }
    else { const f = sm(5.02, 5.55, G); z = (1 - f) * .45; tp = (1 - f) * .6; to = f; }
    const s = 1 + Math.pow(z, 1.6) * 7, k = Math.min(1, z * 1.15);
    tx = (W / 2 - flaskPx[0]) * k; const ty = (H * .5 - flaskPx[1]) * k;
    bg.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
    teacher.style.transform = `translate3d(${(tp * W * .38).toFixed(1)}px,${(tp * H * .06).toFixed(1)}px,0) scale(${(1 + tp * .35).toFixed(3)})`;
    teacher.style.opacity = to.toFixed(3); glowL.style.opacity = (1 - z).toFixed(3);
  }

  const sm = (a, b, v) => { const x = Math.min(1, Math.max(0, (v - a) / (b - a))); return x * x * (3 - 2 * x); };
  const panels = scenes.map(s => s.querySelector(".panel"));
  const links = $$(".nav ul a"), steps = $$("[data-steps] li"), late = $("[data-late]"), cards = $$("#gallery .doc"), tls = $$("#timeline li"), yrs = $$("#years button");
  let lastK = -1, lastT = -1;

  function frame() {
    if (!isStatic()) {
      const G = (window.__G3 != null ? window.__G3 : getG()), k = Math.min(scenes.length - 1, Math.floor(G)), u = G - k;
      panels.forEach((p, i) => {
        let op = 0, y = 0;
        if (i === k) {
          if (i === 0) { op = 1 - sm(.05, .32, u); y = -u * 160; }
          else { const a = sm(.03, .13, u), b = i === scenes.length - 1 ? 1 : 1 - sm(.86, .97, u); op = a * b; y = (1 - a) * 34 - (1 - b) * 34; }
        }
        p.style.opacity = op.toFixed(3); p.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
        p.style.visibility = op < .01 ? "hidden" : "visible";
      });
      labFrame(G);
      const hint = $(".scroll-hint"); if (hint) hint.style.opacity = k === 0 ? (1 - sm(.0, .08, u)).toFixed(2) : 0;
      if (k === 2) { steps.forEach((s, j) => s.classList.toggle("on", u > .2 + j * .12)); late.style.opacity = sm(.62, .72, u); }
      if (k === 3 && innerWidth > 820) cards.forEach((c, j) => {
        const f = 1 - Math.min(1, Math.abs(u - (.3 + j * .2)) / .26), side = j - 1;
        c.style.transform = `rotateY(${((1 - f) * (side ? -side * 24 : 0)).toFixed(1)}deg) rotateX(${((1 - f) * 10).toFixed(1)}deg) translateZ(${(f * 40 - 30).toFixed(0)}px)`;
      });
      if (k === 4) { const t = Math.min(TL.length - 1, Math.max(0, Math.floor(sm(.08, .92, u) * TL.length - 1e-6)));
        if (t !== lastT) { tls.forEach((l, j) => { l.classList.toggle("on", j === t); l.setAttribute("aria-hidden", j !== t); }); yrs.forEach((b, j) => b.setAttribute("aria-selected", j === t)); lastT = t; } }
      if (k !== lastK) { links.forEach(a => a.setAttribute("aria-current", +a.dataset.go === k ? "true" : "false")); lastK = k; }
      $("#bar").style.width = (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) * 100).toFixed(2) + "%";
    }
    requestAnimationFrame(frame);
  }
  if (isStatic()) { tls.forEach(l => l.classList.add("on")); }
  requestAnimationFrame(frame);
  window.portfolio.toStatic = () => { root.classList.add("static"); layout(); tls.forEach(l => { l.classList.add("on"); l.removeAttribute("aria-hidden"); }); $$(".panel").forEach(p => { p.style.cssText = ""; }); };
})();
