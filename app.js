/* ============================================================
   Mapa del Sueño · Lógica interactiva y persistencia local
   ============================================================ */

(() => {
  "use strict";

  const STORAGE_KEY = "mapa_del_sueno_v1";

  const QUESTIONS = [
    {
      id: 1,
      text: "¿Cuántas horas duermes normalmente?",
      options: [
        { label: "8 a 10 horas", pts: 10, risk: false },
        { label: "6 a 7 horas", pts: 5, risk: false },
        { label: "Menos de 6 horas", pts: 0, risk: true }
      ],
      factor: "Duermo pocas horas",
      suggestion: "¿A qué hora tendría que acostarme para dormir al menos 8 horas antes de despertar?"
    },
    {
      id: 2,
      text: "Cuando te acuestas, ¿cuánto tardas en quedarte dormido?",
      options: [
        { label: "Menos de 20 min", pts: 10, risk: false },
        { label: "20 a 30 min", pts: 5, risk: false },
        { label: "Más de 30 min", pts: 0, risk: true }
      ],
      factor: "Tardo en dormirme",
      suggestion: "Si en 20 minutos no me duermo, ¿puedo levantarme, hacer algo tranquilo con luz baja y regresar cuando tenga sueño?"
    },
    {
      id: 3,
      text: "En la hora antes de dormir, ¿usas celular, redes sociales, videojuegos o TV?",
      options: [
        { label: "Casi nunca", pts: 10, risk: false },
        { label: "Algunas noches", pts: 5, risk: false },
        { label: "Casi todas las noches", pts: 0, risk: true }
      ],
      factor: "Pantallas antes de dormir",
      suggestion: "¿Puedo dejar el celular fuera de la cama 30 a 60 minutos antes y activar el modo \"No molestar\"?"
    },
    {
      id: 4,
      text: "¿Cuántas noches por semana te desvelas haciendo tarea?",
      options: [
        { label: "Ninguna", pts: 10, risk: false },
        { label: "1 o 2 noches", pts: 5, risk: false },
        { label: "3 o más noches", pts: 0, risk: true }
      ],
      factor: "Desvelo por tarea",
      suggestion: "¿Puedo empezar la tarea en cuanto llego a casa, por partes, y ponerme una hora límite para terminar?"
    },
    {
      id: 5,
      text: "¿Tomas café, refresco, bebidas energéticas o dulces para mantenerte despierto?",
      options: [
        { label: "Nunca", pts: 10, risk: false },
        { label: "A veces", pts: 5, risk: false },
        { label: "Casi diario", pts: 0, risk: true }
      ],
      factor: "Cafeína y azúcar",
      suggestion: "¿Puedo cambiar el café, refresco o bebida energética de la tarde por agua y evitar dulces en la noche?"
    },
    {
      id: 6,
      text: "Al acostarte, ¿tu mente sigue con estrés, preocupaciones o pensando en el pasado o el futuro?",
      options: [
        { label: "Casi nunca", pts: 10, risk: false },
        { label: "A veces", pts: 5, risk: false },
        { label: "Casi siempre", pts: 0, risk: true }
      ],
      factor: "Mente acelerada",
      suggestion: "¿Puedo escribir mis pendientes y preocupaciones antes de acostarme para sacarlos de mi cabeza?"
    },
    {
      id: 7,
      text: "Mientras duermes, ¿tu cuarto está oscuro y sin ruido?",
      options: [
        { label: "Sí, totalmente", pts: 10, risk: false },
        { label: "Más o menos", pts: 5, risk: false },
        { label: "No, entra luz o hay ruido", pts: 0, risk: true }
      ],
      factor: "Cuarto con luz o ruido",
      suggestion: "¿Puedo usar cortinas gruesas, antifaz o tapones, y avisar a mi familia a qué hora duermo?"
    },
    {
      id: 8,
      text: "¿Te despiertas en la noche o muy temprano y te cuesta volver a dormir?",
      options: [
        { label: "Casi nunca", pts: 10, risk: false },
        { label: "1 o 2 veces por semana", pts: 5, risk: false },
        { label: "3 o más veces por semana", pts: 0, risk: true }
      ],
      factor: "Me despierto en la noche",
      suggestion: "Si me despierto, ¿puedo evitar ver el celular y mantener mi cuarto oscuro y fresco?"
    },
    {
      id: 9,
      text: "¿Te duermes y despiertas a la misma hora casi todos los días, incluso el fin de semana?",
      options: [
        { label: "Sí, cambia menos de 1 h", pts: 10, risk: false },
        { label: "Cambia de 1 a 2 h", pts: 5, risk: false },
        { label: "Cambia más de 2 h", pts: 0, risk: true }
      ],
      factor: "Horario irregular",
      suggestion: "¿Puedo despertar a la misma hora todos los días y abrir las cortinas para recibir luz del sol al despertar?"
    },
    {
      id: 10,
      text: "¿Cuántos días a la semana despiertas sintiéndote descansado?",
      options: [
        { label: "3 días o más", pts: 10, risk: false },
        { label: "1 o 2 días", pts: 5, risk: false },
        { label: "Ningún día", pts: 0, risk: true }
      ],
      factor: "No despierto descansado",
      suggestion: "¿Qué otros factores marqué? Si me siento así varias semanas, ¿con qué adulto o médico puedo platicarlo?"
    }
  ];

  const TOOL_NAMES = {
    respiracion: "Respiración 4-7-8",
    journaling: "Journaling",
    meditacion: "Meditación para dormir"
  };

  const MEDITATION_STEPS = [
    {
      title: "1. Prepárate para descansar",
      body: "Pon el celular en modo avión o silencio y baja el brillo. Acuéstate boca arriba, deja los brazos descansando a los lados y haz dos respiraciones lentas y profundas."
    },
    {
      title: "2. Pies y piernas",
      body: "Lleva tu atención a los dedos de los pies, tobillos, pantorrillas y rodillas. Siente cómo pesan sobre el colchón y suelta cualquier tensión que haya quedado del día."
    },
    {
      title: "3. Abdomen y pecho",
      body: "Observa cómo sube y baja tu abdomen con cada respiración, sin forzar el ritmo. Imagina que con cada exhalación tu cuerpo se hunde un poco más en la cama."
    },
    {
      title: "4. Hombros, brazos y manos",
      body: "Deja caer los hombros lejos de las orejas. Relaja los codos, las muñecas y abre ligeramente los dedos de tus manos hasta sentirlos tibios y suaves."
    },
    {
      title: "5. Cuello, mandíbula y frente",
      body: "Separa suavemente los dientes, suelta la lengua y relaja el entrecejo y los párpados. Nota lo ligero que se siente tu rostro sin esfuerzo."
    },
    {
      title: "6. Descansa sin presionarte",
      body: "No necesitas obligarte a dormir. Solo quédate observando tu respiración tranquila; el sueño llegará a su propio ritmo. Buenas noches."
    }
  ];

  function todayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function defaultState() {
    return {
      theme: "light",
      meta: { nombre: "", grupo: "", fecha: todayISO() },
      answers: {}, // { [qId]: 0 | 5 | 10 }
      radarOverrides: {}, // { [qId]: 'none' | 'watch' | 'risk' }
      radarFilter: "all",
      challenge: { factor: "", action: "", nights: 5 },
      tree: { branch: null, choice: null, recommendedTool: null },
      tools: {
        respiracion: { nights: [false, false, false], rating: 0 },
        journaling: { nights: [false, false, false], rating: 0 },
        meditacion: { nights: [false, false, false], rating: 0 }
      },
      journal: { todo1: "", todo2: "", todo3: "", worry: "", good: "" }
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      return {
        ...base,
        ...parsed,
        meta: { ...base.meta, ...(parsed.meta || {}) },
        challenge: { ...base.challenge, ...(parsed.challenge || {}) },
        tree: { ...base.tree, ...(parsed.tree || {}) },
        tools: {
          respiracion: { ...base.tools.respiracion, ...(parsed.tools?.respiracion || {}) },
          journaling: { ...base.tools.journaling, ...(parsed.tools?.journaling || {}) },
          meditacion: { ...base.tools.meditacion, ...(parsed.tools?.meditacion || {}) }
        },
        journal: { ...base.journal, ...(parsed.journal || {}) }
      };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota / privacy mode errors
    }
  }

  // ==================== HELPERS ====================
  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2600);
  }

  function getMoonLevel(score) {
    if (score >= 85) {
      return {
        key: "llena",
        name: "Luna llena",
        range: "85 – 100",
        desc: "¡Maestro del sueño! Tus hábitos te ayudan a descansar. Sigue así."
      };
    }
    if (score >= 60) {
      return {
        key: "creciente",
        name: "Luna creciente",
        range: "60 – 80",
        desc: "Vas bien. Ajusta los factores de tu Radar para subir de nivel."
      };
    }
    if (score >= 35) {
      return {
        key: "media",
        name: "Media luna",
        range: "35 – 55",
        desc: "Batería baja. Tu sueño necesita atención: elige 1 o 2 cambios."
      };
    }
    return {
      key: "menguante",
      name: "Luna menguante",
      range: "0 – 30",
      desc: "Alerta de sueño. Empieza hoy con tu Radar y platícalo con un adulto de confianza."
    };
  }

  function getRadarMark(qId) {
    if (state.radarOverrides[qId]) return state.radarOverrides[qId];
    const pts = state.answers[qId];
    if (pts === 0) return "risk";
    if (pts === 5) return "watch";
    return "none";
  }

  function getAnsweredStats() {
    const entries = Object.values(state.answers);
    const count = entries.length;
    const total = entries.reduce((acc, v) => acc + Number(v), 0);
    return { count, total };
  }

  // ==================== THEME ====================
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.title = state.theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo noche";
    }
  }

  // ==================== RENDER ETAPA 1 ====================
  function buildQuestions() {
    const container = document.getElementById("questions-container");
    const datalist = document.getElementById("factors-datalist");
    container.innerHTML = "";
    datalist.innerHTML = "";

    QUESTIONS.forEach((q, idx) => {
      const optEl = document.createElement("option");
      optEl.value = q.factor;
      datalist.appendChild(optEl);

      const card = document.createElement("article");
      card.className = "question-card";
      card.id = `question-${q.id}`;

      const optionsHTML = q.options
        .map((opt) => {
          const warnHTML = opt.risk ? `<span class="inline-warn" aria-label="Factor de riesgo">⚠️</span>` : "";
          return `
            <button
              type="button"
              class="option-btn pts-${opt.pts}"
              data-qid="${q.id}"
              data-pts="${opt.pts}"
              role="radio"
              aria-checked="false"
            >
              <span class="option-left">
                <span class="radio-dot" aria-hidden="true"></span>
                <span>${opt.label}</span>
              </span>
              <span class="option-right">
                ${warnHTML}
                <span class="pts-pill">+${opt.pts}</span>
              </span>
            </button>
          `;
        })
        .join("");

      card.innerHTML = `
        <div class="q-num" aria-hidden="true">${q.id}</div>
        <div class="q-body">
          <p class="q-text">${q.text}</p>
          <div class="q-options" role="radiogroup" aria-label="Pregunta ${q.id}: ${q.text}">
            ${optionsHTML}
          </div>
        </div>
        <div class="q-score-box" id="score-box-${q.id}" aria-label="Puntos de la pregunta ${q.id}">
          <span class="q-score-value" id="score-val-${q.id}">—</span>
          <span class="q-score-unit">pts</span>
        </div>
      `;

      container.appendChild(card);

      if (idx < QUESTIONS.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "flow-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.innerHTML = `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="4" x2="12" y2="19" />
            <polyline points="6 14 12 20 18 14" />
          </svg>
        `;
        container.appendChild(arrow);
      }
    });

    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".option-btn");
      if (!btn) return;
      const qId = Number(btn.dataset.qid);
      const pts = Number(btn.dataset.pts);
      state.answers[qId] = pts;
      // Clear manual override on this factor so radar stays synced when user updates their answer
      delete state.radarOverrides[qId];
      saveState();
      updateAllViews();
    });
  }

  function updateQuestionsUI() {
    QUESTIONS.forEach((q) => {
      const selectedPts = state.answers[q.id];
      const card = document.getElementById(`question-${q.id}`);
      const scoreBox = document.getElementById(`score-box-${q.id}`);
      const scoreVal = document.getElementById(`score-val-${q.id}`);
      const hasAnswer = selectedPts !== undefined;

      card.classList.toggle("answered", hasAnswer);
      scoreBox.classList.remove("is-0", "is-5", "is-10");

      if (hasAnswer) {
        scoreVal.textContent = `+${selectedPts}`;
        scoreBox.classList.add(`is-${selectedPts}`);
      } else {
        scoreVal.textContent = "—";
      }

      card.querySelectorAll(".option-btn").forEach((btn) => {
        const isSelected = hasAnswer && Number(btn.dataset.pts) === selectedPts;
        btn.classList.toggle("selected", isSelected);
        btn.setAttribute("aria-checked", String(isSelected));
      });
    });

    const { count, total } = getAnsweredStats();
    const badge = document.getElementById("q-progress-badge");
    badge.textContent = `${count} de 10 respondidas`;

    const totalEl = document.getElementById("total-score");
    const topScoreEl = document.getElementById("topbar-score");
    const statusText = document.getElementById("score-status-text");

    if (count === 0) {
      totalEl.textContent = "--";
      topScoreEl.textContent = "--";
      statusText.textContent = "Suma los puntos de tus 10 cuadros y busca tu nivel de luna.";
    } else if (count < 10) {
      totalEl.textContent = String(total);
      topScoreEl.textContent = String(total);
      statusText.textContent = `Llevas ${count} de 10 preguntas respondidas (parcial: ${total} pts). Responde las ${10 - count} restantes para obtener tu nivel final.`;
    } else {
      totalEl.textContent = String(total);
      topScoreEl.textContent = String(total);
      const level = getMoonLevel(total);
      statusText.textContent = `¡Autodiagnóstico completo! Tu nivel es ${level.name} (${level.range} pts).`;
    }

    const activeLevelKey = count === 10 ? getMoonLevel(total).key : null;
    document.querySelectorAll(".moon-card").forEach((card) => {
      const isMatch = activeLevelKey === card.dataset.level;
      card.classList.toggle("active", isMatch);
      card.classList.toggle("dimmed", Boolean(activeLevelKey) && !isMatch);
    });
  }

  // ==================== RENDER ETAPA 2: RADAR ====================
  function buildRadar() {
    const list = document.getElementById("radar-list");
    list.innerHTML = "";

    QUESTIONS.forEach((q) => {
      const row = document.createElement("div");
      row.className = "radar-item";
      row.id = `radar-row-${q.id}`;
      row.innerHTML = `
        <button
          type="button"
          class="radar-mark-btn"
          data-qid="${q.id}"
          aria-label="Cambiar estado de ${q.factor}"
          title="Toca para alternar: sin marca → en observación (○) → factor de riesgo (✓)"
        ></button>
        <div class="radar-factor-cell">
          <span class="radar-num">${q.id}</span>
          <span class="radar-name">${q.factor}</span>
          <span class="radar-status-tag" id="radar-tag-${q.id}" hidden></span>
        </div>
        <p class="radar-question">${q.suggestion}</p>
        <div class="radar-action-wrap">
          <button type="button" class="radar-pick-btn" data-factor="${q.factor}">
            Elegir para reto
          </button>
        </div>
      `;
      list.appendChild(row);
    });

    const emptyMsg = document.createElement("div");
    emptyMsg.className = "radar-empty";
    emptyMsg.id = "radar-empty";
    emptyMsg.hidden = true;
    emptyMsg.textContent = "No tienes factores marcados en riesgo ni en observación. ¡Excelentes hábitos!";
    list.appendChild(emptyMsg);

    list.addEventListener("click", (e) => {
      const markBtn = e.target.closest(".radar-mark-btn");
      if (markBtn) {
        const qId = Number(markBtn.dataset.qid);
        const current = getRadarMark(qId);
        const next = current === "none" ? "risk" : current === "risk" ? "watch" : "none";
        state.radarOverrides[qId] = next;
        saveState();
        updateRadarUI();
        updateSummaryUI();
        return;
      }

      const pickBtn = e.target.closest(".radar-pick-btn");
      if (pickBtn) {
        const factor = pickBtn.dataset.factor;
        state.challenge.factor = factor;
        const input = document.getElementById("challenge-factor");
        input.value = factor;
        saveState();
        updateChallengeUI();
        updateSummaryUI();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        input.focus();
        showToast(`Elegiste "${factor}" para tu reto de la semana`);
      }
    });
  }

  function updateRadarUI() {
    let riskCount = 0;
    let watchCount = 0;
    let okCount = 0;
    let visibleCount = 0;
    const flaggedFactors = [];

    QUESTIONS.forEach((q) => {
      const mark = getRadarMark(q.id);
      const row = document.getElementById(`radar-row-${q.id}`);
      const btn = row.querySelector(".radar-mark-btn");
      const tag = document.getElementById(`radar-tag-${q.id}`);

      row.classList.remove("state-risk", "state-watch");
      btn.classList.remove("state-risk", "state-watch");

      if (mark === "risk") {
        riskCount++;
        flaggedFactors.push({ factor: q.factor, type: "risk" });
        row.classList.add("state-risk");
        btn.classList.add("state-risk");
        btn.textContent = "✓";
        tag.textContent = "⚠️ Factor de riesgo";
        tag.className = "radar-status-tag risk";
        tag.hidden = false;
      } else if (mark === "watch") {
        watchCount++;
        flaggedFactors.push({ factor: q.factor, type: "watch" });
        row.classList.add("state-watch");
        btn.classList.add("state-watch");
        btn.textContent = "○";
        tag.textContent = "○ En observación";
        tag.className = "radar-status-tag watch";
        tag.hidden = false;
      } else {
        if (state.answers[q.id] === 10) okCount++;
        btn.textContent = "";
        tag.hidden = true;
      }

      const show = state.radarFilter === "all" || mark !== "none";
      row.hidden = !show;
      if (show) visibleCount++;
    });

    document.getElementById("count-risk").textContent = String(riskCount);
    document.getElementById("count-watch").textContent = String(watchCount);
    document.getElementById("count-ok").textContent = String(okCount);
    document.getElementById("radar-empty").hidden = visibleCount > 0;

    document.querySelectorAll(".filter-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.filter === state.radarFilter);
    });

    // Update quick-pick chips in Mi reto de la semana
    const sugBox = document.getElementById("challenge-suggestions");
    const chipsWrap = document.getElementById("challenge-chips");
    if (flaggedFactors.length > 0) {
      sugBox.hidden = false;
      chipsWrap.innerHTML = flaggedFactors
        .map((item) => {
          const icon = item.type === "risk" ? "⚠️" : "○";
          const sel = state.challenge.factor === item.factor ? "selected" : "";
          return `<button type="button" class="suggest-chip ${sel}" data-factor="${item.factor}">${icon} ${item.factor}</button>`;
        })
        .join("");
    } else {
      sugBox.hidden = true;
      chipsWrap.innerHTML = "";
    }
  }

  function updateChallengeUI() {
    document.getElementById("challenge-factor").value = state.challenge.factor || "";
    document.getElementById("challenge-action").value = state.challenge.action || "";
    document.getElementById("challenge-nights").value = state.challenge.nights || 5;

    document.querySelectorAll(".suggest-chip").forEach((chip) => {
      chip.classList.toggle("selected", chip.dataset.factor === state.challenge.factor);
    });
  }

  // ==================== ETAPA 3: DECISION TREE & TOOLS ====================
  function initTreeAndTools() {
    const tree = document.getElementById("decision-tree");
    tree.addEventListener("click", (e) => {
      const startBtn = e.target.closest(".branch-start-btn");
      if (startBtn) {
        const branch = startBtn.dataset.branch;
        if (state.tree.branch !== branch) {
          state.tree.branch = branch;
          state.tree.choice = null;
          state.tree.recommendedTool = null;
        }
        saveState();
        updateTreeAndToolsUI();
        updateSummaryUI();
        return;
      }

      const optBtn = e.target.closest(".followup-option");
      if (optBtn) {
        state.tree.branch = optBtn.dataset.branch;
        state.tree.choice = optBtn.dataset.choice;
        state.tree.recommendedTool = optBtn.dataset.tool;
        saveState();
        updateTreeAndToolsUI();
        updateSummaryUI();
      }
    });

    // Build 5-star buttons for each tool
    document.querySelectorAll(".stars").forEach((wrap) => {
      const toolKey = wrap.dataset.tool;
      wrap.innerHTML = "";
      for (let i = 1; i <= 5; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "star-btn";
        btn.dataset.tool = toolKey;
        btn.dataset.val = String(i);
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-label", `${i} de 5 estrellas`);
        btn.textContent = "★";
        wrap.appendChild(btn);
      }
    });

    document.querySelectorAll(".tool-tracker").forEach((tracker) => {
      tracker.addEventListener("change", (e) => {
        const cb = e.target.closest('input[type="checkbox"]');
        if (!cb) return;
        const toolKey = cb.dataset.tool;
        const idx = Number(cb.dataset.night) - 1;
        state.tools[toolKey].nights[idx] = cb.checked;
        saveState();
        updateSummaryUI();
        updateProgressBar();
      });

      tracker.addEventListener("click", (e) => {
        const star = e.target.closest(".star-btn");
        if (!star) return;
        const toolKey = star.dataset.tool;
        const val = Number(star.dataset.val);
        // Allow toggling off if clicking the same value
        state.tools[toolKey].rating = state.tools[toolKey].rating === val ? 0 : val;
        saveState();
        updateTreeAndToolsUI();
        updateSummaryUI();
      });
    });
  }

  function updateTreeAndToolsUI() {
    const activeBranch = state.tree.branch;
    const activeChoice = state.tree.choice;
    const recTool = state.tree.recommendedTool;

    document.querySelectorAll(".tree-branch").forEach((b) => {
      const isMatch = b.dataset.branch === activeBranch;
      b.classList.toggle("active", isMatch);
      b.classList.toggle("dimmed", Boolean(activeBranch) && !isMatch);
      const startBtn = b.querySelector(".branch-start-btn");
      startBtn.setAttribute("aria-pressed", String(isMatch));
    });

    document.querySelectorAll(".followup-option").forEach((opt) => {
      opt.classList.toggle("selected", opt.dataset.choice === activeChoice);
    });

    const banner = document.getElementById("recommendation-banner");
    const recText = document.getElementById("recommendation-text");
    const jumpBtn = document.getElementById("jump-to-tool-btn");
    if (recTool && TOOL_NAMES[recTool]) {
      banner.hidden = false;
      recText.textContent = `Según tu camino, te conviene empezar probando: ${TOOL_NAMES[recTool]}.`;
      jumpBtn.setAttribute("href", `#tool-${recTool}`);
    } else {
      banner.hidden = true;
    }

    document.querySelectorAll(".tool-card").forEach((card) => {
      const key = card.dataset.tool;
      const isRec = key === recTool;
      card.classList.toggle("recommended", isRec);
      const pill = card.querySelector(".tool-rec-pill");
      if (pill) pill.hidden = !isRec;

      const tData = state.tools[key];
      card.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        const idx = Number(cb.dataset.night) - 1;
        cb.checked = Boolean(tData.nights[idx]);
      });

      card.querySelectorAll(".star-btn").forEach((btn) => {
        const val = Number(btn.dataset.val);
        const filled = val <= tData.rating;
        btn.classList.toggle("filled", filled);
        btn.setAttribute("aria-checked", String(val === tData.rating));
      });
    });
  }

  // ==================== SUMMARY & GLOBAL PROGRESS ====================
  function updateProgressBar() {
    const { count } = getAnsweredStats();
    let score = (count / 10) * 65; // Etapa 1 = 65%
    if (state.challenge.factor.trim() || state.challenge.action.trim()) score += 15; // Etapa 2 = 15%
    if (state.tree.recommendedTool) score += 10; // Decision tree = 10%
    const anyNight = Object.values(state.tools).some((t) => t.nights.some(Boolean));
    if (anyNight) score += 10; // Tool trial = 10%
    document.getElementById("global-progress-fill").style.width = `${Math.min(100, Math.round(score))}%`;
  }

  function updateSummaryUI() {
    const { count, total } = getAnsweredStats();
    const sumScore = document.getElementById("sum-score");
    const sumMoon = document.getElementById("sum-moon");

    if (count === 10) {
      const lvl = getMoonLevel(total);
      sumScore.textContent = `${total} / 100 · ${lvl.name}`;
      sumMoon.textContent = lvl.desc;
    } else if (count > 0) {
      sumScore.textContent = `${total} pts (${count}/10 respondidas)`;
      sumMoon.textContent = `Te faltan ${10 - count} preguntas para ver tu nivel de luna final.`;
    } else {
      sumScore.textContent = "Aún faltan preguntas por responder";
      sumMoon.textContent = "Responde las 10 preguntas de la Etapa 1 para conocer tu luna.";
    }

    const risks = [];
    const watches = [];
    QUESTIONS.forEach((q) => {
      const m = getRadarMark(q.id);
      if (m === "risk") risks.push(q.factor);
      if (m === "watch") watches.push(q.factor);
    });

    const sumRisks = document.getElementById("sum-risks");
    const sumRisksList = document.getElementById("sum-risks-list");
    if (risks.length === 0 && watches.length === 0) {
      sumRisks.textContent = count === 10 ? "¡Sin factores de riesgo!" : "Sin factores marcados todavía";
      sumRisksList.textContent = count === 10
        ? "Tus hábitos actuales respaldan un buen descanso."
        : "Se llenará automáticamente con tus respuestas de la Etapa 1.";
    } else {
      sumRisks.textContent = `${risks.length} en riesgo · ${watches.length} en observación`;
      const parts = [];
      if (risks.length) parts.push(`Riesgo: ${risks.join(", ")}`);
      if (watches.length) parts.push(`Observación: ${watches.join(", ")}`);
      sumRisksList.textContent = parts.join(" | ");
    }

    const sumChallenge = document.getElementById("sum-challenge");
    const sumChallengeDetail = document.getElementById("sum-challenge-detail");
    if (state.challenge.factor.trim() || state.challenge.action.trim()) {
      sumChallenge.textContent = state.challenge.factor.trim() || "Reto personalizado";
      const act = state.challenge.action.trim() || "Define la acción que vas a aplicar.";
      sumChallengeDetail.textContent = `${act} (Meta: ${state.challenge.nights || 5} noches)`;
    } else {
      sumChallenge.textContent = "Pendiente de definir";
      sumChallengeDetail.textContent = "Elige un factor y escribe tu acción en la Etapa 2.";
    }

    const sumTool = document.getElementById("sum-tool");
    const sumToolDetail = document.getElementById("sum-tool-detail");
    const rec = state.tree.recommendedTool;
    sumTool.textContent = rec ? `Sugerida: ${TOOL_NAMES[rec]}` : "Sin ruta elegida aún";

    const progressLines = Object.entries(state.tools)
      .map(([k, v]) => {
        const done = v.nights.filter(Boolean).length;
        if (done === 0 && v.rating === 0) return null;
        const stars = v.rating ? ` · ${"★".repeat(v.rating)}` : "";
        return `${TOOL_NAMES[k]} (${done}/3 noches${stars})`;
      })
      .filter(Boolean);

    sumToolDetail.textContent = progressLines.length
      ? progressLines.join(" · ")
      : "Prueba tu herramienta durante 3 noches y califícala con estrellas.";

    updateProgressBar();
  }

  function updateAllViews() {
    updateQuestionsUI();
    updateRadarUI();
    updateChallengeUI();
    updateTreeAndToolsUI();
    updateSummaryUI();
  }

  // ==================== COPY SUMMARY ====================
  function buildPlainTextSummary() {
    const { count, total } = getAnsweredStats();
    const lvl = count === 10 ? getMoonLevel(total) : null;
    const risks = QUESTIONS.filter((q) => getRadarMark(q.id) === "risk").map((q) => q.factor);
    const watches = QUESTIONS.filter((q) => getRadarMark(q.id) === "watch").map((q) => q.factor);

    const lines = [
      "🌙 MAPA DEL SUEÑO · AUTODIAGNÓSTICO",
      state.meta.nombre ? `Nombre: ${state.meta.nombre}` : null,
      state.meta.grupo ? `Grupo: ${state.meta.grupo}` : null,
      state.meta.fecha ? `Fecha: ${state.meta.fecha}` : null,
      "",
      `ETAPA 1 · Calificación: ${count === 10 ? `${total}/100 (${lvl.name})` : `${total} pts (${count}/10 respondidas)`}`,
      lvl ? lvl.desc : null,
      "",
      `ETAPA 2 · Radar de riesgos`,
      `• Factores de riesgo (⚠️): ${risks.length ? risks.join(", ") : "Ninguno"}`,
      `• En observación (○): ${watches.length ? watches.join(", ") : "Ninguno"}`,
      `• Mi reto de la semana: ${state.challenge.factor || "Sin definir"}`,
      `• Lo que voy a hacer: ${state.challenge.action || "Sin definir"}`,
      `• Duración: ${state.challenge.nights || 5} noches`,
      "",
      `ETAPA 3 · Herramientas`,
      `• Herramienta sugerida: ${state.tree.recommendedTool ? TOOL_NAMES[state.tree.recommendedTool] : "Sin definir"}`
    ];

    Object.entries(state.tools).forEach(([k, v]) => {
      const done = v.nights.filter(Boolean).length;
      if (done > 0 || v.rating > 0) {
        lines.push(`• ${TOOL_NAMES[k]}: ${done}/3 noches | Calificación: ${v.rating}/5`);
      }
    });

    return lines.filter((l) => l !== null).join("\n");
  }

  // ==================== INTERACTIVE MODALS ====================
  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeAllModals() {
    stopBreathing();
    document.querySelectorAll(".modal-backdrop").forEach((m) => {
      m.hidden = true;
    });
    document.body.style.overflow = "";
  }

  // Breathing 4-7-8 timer
  let breathInterval = null;
  let breathRunning = false;

  function stopBreathing() {
    clearInterval(breathInterval);
    breathInterval = null;
    breathRunning = false;
    const orb = document.getElementById("breath-orb");
    const phaseEl = document.getElementById("breath-phase");
    const countEl = document.getElementById("breath-count");
    const instEl = document.getElementById("breath-instruction");
    const cycleEl = document.getElementById("breath-cycle");
    const startBtn = document.getElementById("breath-start-btn");
    if (!orb) return;
    orb.classList.remove("inhale", "hold", "exhale");
    phaseEl.textContent = "Listo";
    countEl.textContent = "4-7-8";
    instEl.textContent = "Ponte cómodo, relaja los hombros y presiona Iniciar para hacer 4 ciclos.";
    cycleEl.textContent = "Ciclo 0 de 4";
    startBtn.textContent = "Iniciar";
  }

  function startBreathing() {
    if (breathRunning) {
      stopBreathing();
      return;
    }
    breathRunning = true;
    const orb = document.getElementById("breath-orb");
    const phaseEl = document.getElementById("breath-phase");
    const countEl = document.getElementById("breath-count");
    const instEl = document.getElementById("breath-instruction");
    const cycleEl = document.getElementById("breath-cycle");
    const startBtn = document.getElementById("breath-start-btn");
    startBtn.textContent = "Detener";

    const stages = [
      { cls: "inhale", label: "Inhala", sec: 4, text: "Inhala suavemente por la nariz..." },
      { cls: "hold", label: "Sostén", sec: 7, text: "Mantén el aire con calma..." },
      { cls: "exhale", label: "Exhala", sec: 8, text: "Saca el aire despacio por la boca..." }
    ];

    let cycle = 1;
    let stageIdx = 0;
    let remaining = stages[0].sec;

    function applyStage() {
      const st = stages[stageIdx];
      orb.classList.remove("inhale", "hold", "exhale");
      // Force reflow so transition always triggers smoothly
      void orb.offsetWidth;
      orb.classList.add(st.cls);
      phaseEl.textContent = st.label;
      countEl.textContent = String(remaining);
      instEl.textContent = st.text;
      cycleEl.textContent = `Ciclo ${cycle} de 4`;
    }

    applyStage();

    breathInterval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        countEl.textContent = String(remaining);
        return;
      }
      stageIdx++;
      if (stageIdx >= stages.length) {
        stageIdx = 0;
        cycle++;
        if (cycle > 4) {
          clearInterval(breathInterval);
          breathInterval = null;
          breathRunning = false;
          orb.classList.remove("inhale", "hold", "exhale");
          phaseEl.textContent = "¡Listo!";
          countEl.textContent = "✓";
          instEl.textContent = "Completaste 4 ciclos de respiración 4-7-8. Siente cómo se relajó tu cuerpo.";
          cycleEl.textContent = "4 de 4 ciclos completados";
          startBtn.textContent = "Repetir";
          return;
        }
      }
      remaining = stages[stageIdx].sec;
      applyStage();
    }, 1000);
  }

  // Meditation stepper
  let medIndex = 0;
  function renderMeditationStep() {
    const step = MEDITATION_STEPS[medIndex];
    document.getElementById("med-step-badge").textContent = `Paso ${medIndex + 1} de ${MEDITATION_STEPS.length}`;
    document.getElementById("med-step-title").textContent = step.title;
    document.getElementById("med-step-body").textContent = step.body;
    document.getElementById("med-prev-btn").disabled = medIndex === 0;
    document.getElementById("med-next-btn").textContent =
      medIndex === MEDITATION_STEPS.length - 1 ? "Finalizar ✓" : "Siguiente →";

    const dots = document.getElementById("med-dots");
    dots.innerHTML = MEDITATION_STEPS.map(
      (_, i) => `<span class="med-dot ${i === medIndex ? "active" : ""}"></span>`
    ).join("");
  }

  // ==================== SCROLL SPY ====================
  function initScrollSpy() {
    const links = Array.from(document.querySelectorAll(".step-link"));
    const sections = links
      .map((l) => document.getElementById(l.dataset.section))
      .filter(Boolean);

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            links.forEach((l) => l.classList.toggle("active", l.dataset.section === id));
          }
        });
      },
      { rootMargin: "-25% 0px -60% 0px" }
    );

    sections.forEach((sec) => observer.observe(sec));
  }

  // ==================== WIRE EVENTS & INIT ====================
  function bindInputs() {
    // Metadata
    const nombreEl = document.getElementById("meta-nombre");
    const grupoEl = document.getElementById("meta-grupo");
    const fechaEl = document.getElementById("meta-fecha");

    nombreEl.value = state.meta.nombre || "";
    grupoEl.value = state.meta.grupo || "";
    fechaEl.value = state.meta.fecha || todayISO();

    nombreEl.addEventListener("input", () => {
      state.meta.nombre = nombreEl.value;
      saveState();
    });
    grupoEl.addEventListener("input", () => {
      state.meta.grupo = grupoEl.value;
      saveState();
    });
    fechaEl.addEventListener("change", () => {
      state.meta.fecha = fechaEl.value;
      saveState();
    });

    // Theme toggle
    document.getElementById("theme-toggle").addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      applyTheme();
      saveState();
    });

    // Radar filter & sync
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.radarFilter = btn.dataset.filter;
        saveState();
        updateRadarUI();
      });
    });

    document.getElementById("sync-radar-btn").addEventListener("click", () => {
      state.radarOverrides = {};
      saveState();
      updateRadarUI();
      updateSummaryUI();
      showToast("Radar sincronizado con tus respuestas de la Etapa 1");
    });

    // Challenge inputs
    const factorEl = document.getElementById("challenge-factor");
    const actionEl = document.getElementById("challenge-action");
    const nightsEl = document.getElementById("challenge-nights");

    factorEl.addEventListener("input", () => {
      state.challenge.factor = factorEl.value;
      saveState();
      updateChallengeUI();
      updateSummaryUI();
    });

    actionEl.addEventListener("input", () => {
      state.challenge.action = actionEl.value;
      saveState();
      updateSummaryUI();
    });

    const setNights = (val) => {
      const clamped = Math.max(1, Math.min(30, Number(val) || 1));
      state.challenge.nights = clamped;
      nightsEl.value = clamped;
      saveState();
      updateSummaryUI();
    };

    nightsEl.addEventListener("change", () => setNights(nightsEl.value));
    document.getElementById("nights-dec").addEventListener("click", () => setNights((state.challenge.nights || 5) - 1));
    document.getElementById("nights-inc").addEventListener("click", () => setNights((state.challenge.nights || 5) + 1));

    document.getElementById("challenge-chips").addEventListener("click", (e) => {
      const chip = e.target.closest(".suggest-chip");
      if (!chip) return;
      state.challenge.factor = chip.dataset.factor;
      saveState();
      updateChallengeUI();
      updateSummaryUI();
    });

    // Modals open / close
    document.querySelectorAll("[data-open-modal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const modalId = btn.dataset.openModal;
        if (modalId === "modal-meditation") {
          medIndex = 0;
          renderMeditationStep();
        }
        openModal(modalId);
      });
    });

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", closeAllModals);
    });

    document.querySelectorAll(".modal-backdrop").forEach((bg) => {
      bg.addEventListener("click", (e) => {
        if (e.target === bg) closeAllModals();
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAllModals();
    });

    // Breathing controls
    document.getElementById("breath-start-btn").addEventListener("click", startBreathing);
    document.getElementById("breath-reset-btn").addEventListener("click", stopBreathing);

    // Journal modal inputs
    const jFields = [
      ["j-todo-1", "todo1"],
      ["j-todo-2", "todo2"],
      ["j-todo-3", "todo3"],
      ["j-worry", "worry"],
      ["j-good", "good"]
    ];
    jFields.forEach(([id, key]) => {
      const el = document.getElementById(id);
      el.value = state.journal[key] || "";
      el.addEventListener("input", () => {
        state.journal[key] = el.value;
        saveState();
      });
    });

    document.getElementById("journal-save-close").addEventListener("click", () => {
      saveState();
      closeAllModals();
      showToast("Libreta guardada. ¡A descansar!");
    });

    document.getElementById("journal-clear").addEventListener("click", () => {
      state.journal = { todo1: "", todo2: "", todo3: "", worry: "", good: "" };
      jFields.forEach(([id]) => {
        document.getElementById(id).value = "";
      });
      saveState();
      showToast("Notas limpiadas");
    });

    // Meditation controls
    document.getElementById("med-prev-btn").addEventListener("click", () => {
      if (medIndex > 0) {
        medIndex--;
        renderMeditationStep();
      }
    });
    document.getElementById("med-next-btn").addEventListener("click", () => {
      if (medIndex < MEDITATION_STEPS.length - 1) {
        medIndex++;
        renderMeditationStep();
      } else {
        closeAllModals();
        showToast("Escaneo corporal completado 🌙");
      }
    });

    // Summary actions
    document.getElementById("print-btn").addEventListener("click", () => window.print());

    document.getElementById("copy-summary-btn").addEventListener("click", async () => {
      const text = buildPlainTextSummary();
      try {
        await navigator.clipboard.writeText(text);
        showToast("Resumen copiado al portapapeles");
      } catch {
        // Fallback for older browsers / non-HTTPS contexts
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("Resumen copiado al portapapeles");
      }
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
      const ok = window.confirm("¿Seguro que quieres borrar todas tus respuestas y empezar de nuevo?");
      if (!ok) return;
      const keepTheme = state.theme;
      state = defaultState();
      state.theme = keepTheme;
      saveState();
      nombreEl.value = "";
      grupoEl.value = "";
      fechaEl.value = state.meta.fecha;
      jFields.forEach(([id]) => {
        document.getElementById(id).value = "";
      });
      updateAllViews();
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Hoja reiniciada");
    });
  }

  // Bootstrap
  applyTheme();
  buildQuestions();
  buildRadar();
  initTreeAndTools();
  bindInputs();
  updateAllViews();
  initScrollSpy();
})();
