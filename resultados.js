(() => {
  "use strict";

  const SESSION_KEY = "mapa_sueno_admin_key";
  const API_URL = window.location.hostname.endsWith("github.io")
    ? "https://mapa-del-sueno.vercel.app/api/respuestas"
    : "/api/respuestas";

  const QUESTION_LABELS = {
    1: "Horas de sueño",
    2: "Tiempo para dormir",
    3: "Pantallas antes de dormir",
    4: "Desvelo por tarea",
    5: "Cafeína y azúcar",
    6: "Mente acelerada / estrés",
    7: "Cuarto oscuro y sin ruido",
    8: "Despertares nocturnos",
    9: "Horario regular",
    10: "Despertar descansado"
  };

  const TOOL_NAMES = {
    respiracion: "Respiración 4-7-8",
    journaling: "Journaling",
    meditacion: "Meditación para dormir"
  };

  const MOON_LABELS = {
    llena: "Luna llena (85–100)",
    creciente: "Luna creciente (60–80)",
    media: "Media luna (35–55)",
    menguante: "Luna menguante (0–30)"
  };

  let adminKey = sessionStorage.getItem(SESSION_KEY) || "";
  let allItems = [];
  let summaryData = null;

  function showToast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { el.hidden = true; }, 2600);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  async function fetchResponses(key) {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${key}` }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Error HTTP ${res.status}`);
    }
    return data;
  }

  async function loadDashboard() {
    const refreshLabel = document.getElementById("last-refresh-label");
    refreshLabel.textContent = "Actualizando...";
    try {
      const data = await fetchResponses(adminKey);
      allItems = data.items || [];
      summaryData = data.summary || null;

      document.getElementById("login-view").hidden = true;
      document.getElementById("dashboard-view").hidden = false;
      document.getElementById("logout-btn").hidden = false;

      refreshLabel.textContent = `Última actualización: ${formatDate(new Date().toISOString())}`;
      renderSummary();
      populateGroupFilter();
      renderList();
    } catch (err) {
      sessionStorage.removeItem(SESSION_KEY);
      adminKey = "";
      document.getElementById("login-view").hidden = false;
      document.getElementById("dashboard-view").hidden = true;
      document.getElementById("logout-btn").hidden = true;
      const errEl = document.getElementById("login-error");
      errEl.textContent = err.message || "No se pudo autenticar.";
      errEl.hidden = false;
    }
  }

  function renderSummary() {
    const s = summaryData || { total: 0, avgScore: 0, moonCounts: {}, topRiskFactors: [], groups: [] };
    document.getElementById("kpi-total").textContent = String(s.total);
    document.getElementById("kpi-groups").textContent =
      s.groups.length === 1 ? "1 grupo registrado" : `${s.groups.length} grupos registrados`;

    document.getElementById("kpi-avg").textContent = s.total ? `${s.avgScore} / 100` : "-- / 100";
    const avgMoon = !s.total
      ? "Aún sin respuestas"
      : s.avgScore >= 85 ? "Promedio: Luna llena"
      : s.avgScore >= 60 ? "Promedio: Luna creciente"
      : s.avgScore >= 35 ? "Promedio: Media luna"
      : "Promedio: Luna menguante";
    document.getElementById("kpi-avg-moon").textContent = avgMoon;

    if (s.topRiskFactors.length > 0) {
      const top = s.topRiskFactors[0];
      document.getElementById("kpi-top-risk").textContent = top.factor;
      document.getElementById("kpi-top-risk-sub").textContent = `Reportado por ${top.count} persona(s)`;
    } else {
      document.getElementById("kpi-top-risk").textContent = "—";
      document.getElementById("kpi-top-risk-sub").textContent = "Sin factores de riesgo aún";
    }

    // Moon bars
    const moonBars = document.getElementById("moon-bars");
    moonBars.innerHTML = Object.entries(MOON_LABELS)
      .map(([key, label]) => {
        const count = s.moonCounts?.[key] || 0;
        const pct = s.total ? Math.round((count / s.total) * 100) : 0;
        return `
          <div class="bar-row">
            <div class="bar-meta"><span>${label}</span><span>${count} (${pct}%)</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          </div>
        `;
      })
      .join("");

    // Top 5 risk factors bars
    const riskBars = document.getElementById("risk-bars");
    const top5 = (s.topRiskFactors || []).slice(0, 5);
    if (top5.length === 0) {
      riskBars.innerHTML = `<p style="margin:0;color:var(--ink-muted);font-size:0.86rem;">Aún no hay factores de riesgo registrados.</p>`;
    } else {
      riskBars.innerHTML = top5
        .map((item) => {
          const pct = s.total ? Math.round((item.count / s.total) * 100) : 0;
          return `
            <div class="bar-row">
              <div class="bar-meta"><span>${escapeHtml(item.factor)}</span><span>${item.count} (${pct}%)</span></div>
              <div class="bar-track"><div class="bar-fill risk-fill" style="width:${pct}%"></div></div>
            </div>
          `;
        })
        .join("");
    }
  }

  function populateGroupFilter() {
    const sel = document.getElementById("group-filter");
    const current = sel.value;
    const groups = summaryData?.groups || [];
    sel.innerHTML = `<option value="">Todos los grupos</option>` +
      groups.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
    sel.value = groups.includes(current) ? current : "";
  }

  function getFilteredItems() {
    const q = document.getElementById("search-input").value.trim().toLowerCase();
    const grp = document.getElementById("group-filter").value;
    const moon = document.getElementById("moon-filter").value;

    return allItems.filter((it) => {
      if (grp && (it.meta?.grupo || "") !== grp) return false;
      if (moon && it.moonLevel?.key !== moon) return false;
      if (q) {
        const hay = `${it.meta?.nombre || ""} ${it.meta?.grupo || ""} ${it.challenge?.factor || ""} ${it.challenge?.action || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderList() {
    const wrap = document.getElementById("responses-list");
    const items = getFilteredItems();

    if (items.length === 0) {
      wrap.innerHTML = `<div class="radar-card"><div class="radar-empty">No hay respuestas que coincidan con el filtro actual.</div></div>`;
      return;
    }

    wrap.innerHTML = items
      .map((it) => {
        const risks = Array.isArray(it.riskFactors) ? it.riskFactors : [];
        const tagsHtml = risks.length
          ? risks.slice(0, 3).map((r) => `<span class="mini-tag">⚠️ ${escapeHtml(r)}</span>`).join("") +
            (risks.length > 3 ? `<span class="mini-tag">+${risks.length - 3}</span>` : "")
          : `<span class="mini-tag ok">Sin alertas ⚠️</span>`;

        return `
          <article class="resp-card">
            <div>
              <p class="resp-name">${escapeHtml(it.meta?.nombre || "Anónimo")}</p>
              <p class="resp-meta">${it.meta?.grupo ? `Grupo: ${escapeHtml(it.meta.grupo)} · ` : ""}${formatDate(it.updatedAt || it.savedAt)}</p>
            </div>
            <div>
              <span class="resp-score-badge">${it.totalScore} / 100 · ${escapeHtml(it.moonLevel?.name || "")}</span>
            </div>
            <div class="resp-tags">${tagsHtml}</div>
            <div class="resp-actions">
              <button type="button" class="btn btn-secondary btn-sm" data-view-id="${escapeHtml(it.id)}">Ver detalle</button>
              <button type="button" class="btn btn-danger-ghost btn-sm" data-del-id="${escapeHtml(it.id)}">Eliminar</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function openDetail(id) {
    const it = allItems.find((x) => x.id === id);
    if (!it) return;
    document.getElementById("detail-title").textContent = `${it.meta?.nombre || "Anónimo"} · ${it.totalScore}/100`;

    const answersHtml = Object.entries(QUESTION_LABELS)
      .map(([num, label]) => {
        const pts = it.answers?.[num];
        const status = pts === 10 ? "Saludable (+10)" : pts === 5 ? "En observación (+5)" : "Factor de riesgo (+0)";
        return `<div><strong>${num}. ${label}:</strong> ${status}</div>`;
      })
      .join("");

    const toolsSummary = Object.entries(TOOL_NAMES)
      .map(([k, name]) => {
        const t = it.tools?.[k];
        if (!t) return null;
        const done = (t.nights || []).filter(Boolean).length;
        const stars = t.rating ? `${t.rating}/5 ★` : "sin calificar";
        return `${name}: ${done}/3 noches (${stars})`;
      })
      .filter(Boolean)
      .join(" · ");

    document.getElementById("detail-body").innerHTML = `
      <div class="detail-item">
        <strong>Datos generales</strong>
        Grupo: ${escapeHtml(it.meta?.grupo || "—")} · Fecha hoja: ${escapeHtml(it.meta?.fecha || "—")} · Guardado: ${formatDate(it.updatedAt || it.savedAt)}
      </div>
      <div class="detail-item">
        <strong>Nivel de luna</strong>
        ${it.totalScore} / 100 · ${escapeHtml(it.moonLevel?.name || "—")}
      </div>
      <div class="detail-item">
        <strong>Factores de riesgo (⚠️)</strong>
        ${it.riskFactors?.length ? escapeHtml(it.riskFactors.join(", ")) : "Ninguno"}
      </div>
      <div class="detail-item">
        <strong>En observación (○)</strong>
        ${it.watchFactors?.length ? escapeHtml(it.watchFactors.join(", ")) : "Ninguno"}
      </div>
      <div class="detail-item">
        <strong>Mi reto de la semana</strong>
        Factor: ${escapeHtml(it.challenge?.factor || "Sin definir")}<br />
        Acción: ${escapeHtml(it.challenge?.action || "Sin definir")}<br />
        Duración: ${it.challenge?.nights || 5} noches
      </div>
      <div class="detail-item">
        <strong>Etapa 3 · Herramientas</strong>
        Sugerida: ${escapeHtml(TOOL_NAMES[it.tree?.recommendedTool] || "Sin elegir")}<br />
        Seguimiento: ${escapeHtml(toolsSummary || "—")}
      </div>
      <div class="detail-item">
        <strong>Respuestas por pregunta (Etapa 1)</strong>
        <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;">${answersHtml}</div>
      </div>
    `;

    document.getElementById("detail-modal").hidden = false;
  }

  async function deleteItem(id) {
    if (!window.confirm("¿Eliminar esta respuesta de forma permanente?")) return;
    try {
      const res = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminKey}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar.");
      showToast("Respuesta eliminada");
      await loadDashboard();
    } catch (err) {
      showToast(err.message || "Error al eliminar");
    }
  }

  function exportCSV() {
    const items = getFilteredItems();
    if (!items.length) {
      showToast("No hay respuestas para exportar");
      return;
    }

    const headers = [
      "ID", "Guardado", "Nombre", "Grupo", "Fecha",
      "Calificacion", "NivelLuna",
      "FactoresRiesgo", "EnObservacion",
      "RetoFactor", "RetoAccion", "RetoNoches",
      "HerramientaSugerida",
      "RespiracionNoches", "RespiracionEstrellas",
      "JournalingNoches", "JournalingEstrellas",
      "MeditacionNoches", "MeditacionEstrellas",
      "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"
    ];

    const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const rows = items.map((it) => {
      const rN = (it.tools?.respiracion?.nights || []).filter(Boolean).length;
      const jN = (it.tools?.journaling?.nights || []).filter(Boolean).length;
      const mN = (it.tools?.meditacion?.nights || []).filter(Boolean).length;
      return [
        it.id,
        it.updatedAt || it.savedAt,
        it.meta?.nombre || "",
        it.meta?.grupo || "",
        it.meta?.fecha || "",
        it.totalScore,
        it.moonLevel?.name || "",
        (it.riskFactors || []).join("; "),
        (it.watchFactors || []).join("; "),
        it.challenge?.factor || "",
        it.challenge?.action || "",
        it.challenge?.nights || "",
        TOOL_NAMES[it.tree?.recommendedTool] || "",
        rN, it.tools?.respiracion?.rating || 0,
        jN, it.tools?.journaling?.rating || 0,
        mN, it.tools?.meditacion?.rating || 0,
        ...[1,2,3,4,5,6,7,8,9,10].map((n) => it.answers?.[n] ?? "")
      ].map(csvCell).join(",");
    });

    // UTF-8 BOM for clean accents in Excel
    const csv = "\uFEFF" + [headers.map(csvCell).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mapa-del-sueno-respuestas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Archivo CSV descargado");
  }

  // Theme
  const savedTheme = localStorage.getItem("mapa_sueno_admin_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("mapa_sueno_admin_theme", next);
  });

  // Events
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("admin-key-input");
    const errEl = document.getElementById("login-error");
    errEl.hidden = true;
    adminKey = input.value.trim();
    if (!adminKey) return;
    sessionStorage.setItem(SESSION_KEY, adminKey);
    await loadDashboard();
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    adminKey = "";
    allItems = [];
    document.getElementById("admin-key-input").value = "";
    document.getElementById("dashboard-view").hidden = true;
    document.getElementById("logout-btn").hidden = true;
    document.getElementById("login-view").hidden = false;
  });

  document.getElementById("refresh-btn").addEventListener("click", loadDashboard);
  document.getElementById("export-csv-btn").addEventListener("click", exportCSV);
  document.getElementById("search-input").addEventListener("input", renderList);
  document.getElementById("group-filter").addEventListener("change", renderList);
  document.getElementById("moon-filter").addEventListener("change", renderList);

  document.getElementById("responses-list").addEventListener("click", (e) => {
    const viewBtn = e.target.closest("[data-view-id]");
    if (viewBtn) return openDetail(viewBtn.dataset.viewId);
    const delBtn = e.target.closest("[data-del-id]");
    if (delBtn) return deleteItem(delBtn.dataset.delId);
  });

  document.getElementById("detail-close").addEventListener("click", () => {
    document.getElementById("detail-modal").hidden = true;
  });
  document.getElementById("detail-modal").addEventListener("click", (e) => {
    if (e.target.id === "detail-modal") e.target.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.getElementById("detail-modal").hidden = true;
  });

  if (adminKey) {
    loadDashboard();
  }
})();
