// Public meetings page and homepage mini calendar only

let MEETING_TYPE_META = {};

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safe(v){
  return (v === undefined || v === null) ? "" : String(v).trim();
}

function formatMeetingDate(v){
  const d = new Date(safe(v));
  if (Number.isNaN(d.getTime())) return safe(v);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatMeetingTime(v){
  const s = safe(v);
  if (!s) return "";

  const match = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return s;

  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${suffix}`;
}

function getMeetingDateTime(meeting){
  const dateStr = safe(meeting?.date);
  if (!dateStr) return null;

  const timeStr = safe(meeting?.time);
  const full = timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T23:59`;

  const d = new Date(full);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isUpcomingMeeting(meeting){
  const dt = getMeetingDateTime(meeting);
  if (!dt) return false;
  return dt.getTime() >= Date.now();
}

function getTypeMeta(typeKey){
  const key = safe(typeKey);
  const meta = MEETING_TYPE_META[key];

  if (meta) {
    return {
      label: safe(meta.label) || "Other",
      color: safe(meta.color) || "#8c98a4"
    };
  }

  return {
    label: "Other",
    color: "#8c98a4"
  };
}

function buildMeetingsLegendHtml() {
  const items = Object.entries(MEETING_TYPE_META || {})
    .filter(([key]) => key !== "default")
    .map(([key, meta]) => ({
      key,
      label: safe(meta.label) || key,
      color: safe(meta.color) || "#8c98a4"
    }));

  if (!items.length) return "";

  return `
    <div class="miniCalLegend" aria-label="Meeting type legend">
      ${items.map(item => `
        <span class="miniCalKey">
          <span class="miniCalDot" style="background:${escapeHtml(item.color)}" aria-hidden="true"></span>
          <span class="miniCalKeyLabel">${escapeHtml(item.label)}</span>
        </span>
      `).join("")}
    </div>
  `;
}

function buildDotsHtml(typesForDay) {
  const shown = (typesForDay || []).slice(0, 5);
  const hiddenCount = Math.max(0, (typesForDay || []).length - shown.length);

  return `
    <div class="miniCalDots" aria-hidden="true">
      ${shown.map(typeKey => {
        const meta = getTypeMeta(typeKey);
        return `<span class="miniCalDot" style="background:${escapeHtml(meta.color)}" title="${escapeHtml(meta.label)}"></span>`;
      }).join("")}
      ${hiddenCount ? `<span class="miniCalMore">+${hiddenCount}</span>` : ""}
    </div>
  `;
}

function renderMeetingsMiniCalendar(meetings, opts = {}) {
  const {
    mountId = "meetingsMiniCal",
    monthDate = new Date(),
    weekStartsOnMonday = true,
    showLegend = true,
    dayLink = "meetings.html"
  } = opts;

  const mount = document.getElementById(mountId);
  if (!mount) return;

  const initialMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  if (!mount._miniCalState) mount._miniCalState = { viewMonth: initialMonth };

  const byDay = new Map();
  (meetings || []).forEach(m => {
    const raw = m?.date;
    if (!raw) return;
    const key = String(raw).slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(m);
  });

  const dowSunFirst = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowMonFirst = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dow = weekStartsOnMonday ? dowMonFirst : dowSunFirst;

  const render = () => {
    const view = mount._miniCalState.viewMonth;
    const year = view.getFullYear();
    const month = view.getMonth();

    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();

    const monthLabel = first.toLocaleString("en-US", { month: "long", year: "numeric" });

    let offset = first.getDay();
    if (weekStartsOnMonday) offset = (offset + 6) % 7;

    const legendHtml = showLegend ? buildMeetingsLegendHtml() : "";

    let html = `
      <div class="miniCalHead">
        <div class="miniCalHeadLeft">
          <div class="miniCalTitle">${escapeHtml(monthLabel)}</div>
          <div class="miniCalNav" aria-label="Calendar navigation">
            <button type="button" class="miniCalNavBtn" data-cal-prev aria-label="Previous month">‹</button>
            <button type="button" class="miniCalNavBtn" data-cal-next aria-label="Next month">›</button>
          </div>
        </div>
        ${legendHtml}
      </div>

      <div class="miniCalGrid" role="grid" aria-label="${escapeHtml(monthLabel)} calendar">
        ${dow.map(d => `<div class="miniCalDow" role="columnheader">${escapeHtml(d)}</div>`).join("")}
    `;

    for (let i = 0; i < offset; i++) {
      html += `<div class="miniCalCell is-empty" role="gridcell" aria-disabled="true"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const key = d.toISOString().slice(0, 10);
      const dayMeetings = byDay.get(key) || [];
      const hasMeetings = dayMeetings.length > 0;

      const prettyDate = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

      if (hasMeetings) {
        const typesForDay = [...new Set(dayMeetings.map(m => safe(m?.type) || "default"))];
        const dotsHtml = buildDotsHtml(typesForDay);

        const titles = dayMeetings.map(m => m?.title).filter(Boolean);
        const ariaLabel = titles.length
          ? `${prettyDate}. ${dayMeetings.length} meeting${dayMeetings.length > 1 ? "s" : ""}: ${titles.join("; ")}.`
          : `${prettyDate}. ${dayMeetings.length} meeting${dayMeetings.length > 1 ? "s" : ""}.`;

        html += `
          <a class="miniCalCell is-event"
             role="gridcell"
             href="${escapeHtml(dayLink)}"
             aria-label="${escapeHtml(ariaLabel)}">
            <span class="miniCalDayNum">${day}</span>
            ${dotsHtml}
          </a>
        `;
      } else {
        html += `
          <div class="miniCalCell" role="gridcell" aria-label="${escapeHtml(prettyDate)}">
            <span class="miniCalDayNum">${day}</span>
          </div>
        `;
      }
    }

    html += `</div>`;
    mount.innerHTML = html;

    mount.querySelector("[data-cal-prev]")?.addEventListener("click", () => {
      mount._miniCalState.viewMonth = new Date(year, month - 1, 1);
      render();
    });

    mount.querySelector("[data-cal-next]")?.addEventListener("click", () => {
      mount._miniCalState.viewMonth = new Date(year, month + 1, 1);
      render();
    });
  };

  render();
}

function renderMeetingsMini(items){
  const mount = document.getElementById("meetingsMini");
  if(!mount) return;

  const upcoming = (items || [])
    .filter(m => m && (m.enabled !== false))
    .filter(isUpcomingMeeting)
    .slice()
    .sort((a,b) => (getMeetingDateTime(a)?.getTime()||0) - (getMeetingDateTime(b)?.getTime()||0))
    .slice(0,2);

  if(!upcoming.length){
    mount.innerHTML = `<p class="sub">See the full schedule on the Meetings page.</p>`;
    return;
  }

  mount.innerHTML = `
    <div class="list">
      ${upcoming.map(m => {
        const title = safe(m.title || "Meeting");
        const date  = formatMeetingDate(m.date);
        const time  = formatMeetingTime(m.time);
        const agenda = safe(m.agenda || m.agenda_url || "");
        const packet = safe(m.packet || m.packet_url || "");
        const watch  = safe(m.watch || m.stream || m.video_url || "");
        return `
          <article class="item">
            <div class="itemTop">
              <h3 class="itemTitle">${escapeHtml(title)}</h3>
            </div>
            <div class="meta">
              ${date ? `<span>${escapeHtml(date)}</span>` : ``}
              ${(date && time) ? `<span>•</span>` : ``}
              ${time ? `<span>${escapeHtml(time)}</span>` : ``}
            </div>
            <div class="meta" style="margin-top:8px">
              ${agenda ? `<a class="link" href="${agenda}">Agenda</a>` : ``}
              ${(agenda && packet) ? `<span>•</span>` : ``}
              ${packet ? `<a class="link" href="${packet}">Packet</a>` : ``}
              ${((agenda||packet) && watch) ? `<span>•</span>` : ``}
              ${watch ? `<a class="link" href="${watch}">Watch</a>` : ``}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderMeetingsPage(items){
  const upcomingEl = document.getElementById("upcomingMeetings");
  const pastEl = document.getElementById("pastMeetings");
  if(!upcomingEl && !pastEl) return;

  const all = (items || [])
    .filter(m => m && m.enabled !== false)
    .slice()
    .sort((a,b) => (getMeetingDateTime(a)?.getTime()||0) - (getMeetingDateTime(b)?.getTime()||0));

  const upcoming = all.filter(isUpcomingMeeting);
  const past = all.filter(m => !isUpcomingMeeting(m)).reverse();

  const linkAttrs = (href) => {
    const h = safe(href);
    if(!h) return "";
    const isExternal = /^https?:\/\//i.test(h);
    return isExternal ? `target="_blank" rel="noopener noreferrer"` : "";
  };

  const renderList = (list) => `
    <div class="list">
      ${list.map(m => {
        const title = safe(m.title || "Meeting");
        const date  = formatMeetingDate(m.date);
        const time  = formatMeetingTime(m.time);
        const loc   = safe(m.location || "");

        const agenda = safe(m.agenda_url || m.agenda || "");
        const packet = safe(m.packet_url || m.packet || "");
        const minutes = safe(m.minutes_url || m.minutes || "");
        const stream = safe(m.stream_url || m.watch || m.video_url || "");

        const typeMeta = getTypeMeta(m.type);

        return `
          <article class="item" aria-label="${escapeHtml(title)}">
            <div class="itemTop">
              <h3 class="itemTitle">${escapeHtml(title)}</h3>
              ${safe(m.type) ? `<span class="tag" style="background:${escapeHtml(typeMeta.color)}1A; color:${escapeHtml(typeMeta.color)};">${escapeHtml(typeMeta.label)}</span>` : ``}
            </div>

            ${(date || time || loc) ? `
              <div class="meta">
                ${date ? `<span>${escapeHtml(date)}</span>` : ``}
                ${(date && time) ? `<span>•</span>` : ``}
                ${time ? `<span>${escapeHtml(time)}</span>` : ``}
                ${((date || time) && loc) ? `<span>•</span>` : ``}
                ${loc ? `<span>${escapeHtml(loc)}</span>` : ``}
              </div>
            ` : ``}

            ${(agenda || packet || minutes || stream) ? `
              <div class="meta" style="margin-top:10px">
                ${agenda ? `<a class="link" href="${agenda}" ${linkAttrs(agenda)}>Agenda</a>` : ``}
                ${(agenda && packet) ? `<span>•</span>` : ``}
                ${packet ? `<a class="link" href="${packet}" ${linkAttrs(packet)}>Packet</a>` : ``}
                ${((agenda || packet) && minutes) ? `<span>•</span>` : ``}
                ${minutes ? `<a class="link" href="${minutes}" ${linkAttrs(minutes)}>Minutes</a>` : ``}
                ${((agenda || packet || minutes) && stream) ? `<span>•</span>` : ``}
                ${stream ? `<a class="link" href="${stream}" ${linkAttrs(stream)}>Watch</a>` : ``}
              </div>
            ` : ``}
          </article>
        `;
      }).join("")}
    </div>
  `;

  if(upcomingEl){
    upcomingEl.innerHTML = upcoming.length
      ? renderList(upcoming)
      : `<div class="meetingsListWrap"><p class="sub">No upcoming meetings are posted yet.</p></div>`;
  }

  if(pastEl){
    pastEl.innerHTML = past.length
      ? renderList(past)
      : `<div class="meetingsListWrap"><p class="sub">No past meetings are posted yet.</p></div>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const alerts = await loadJSON("./content/alerts.json");
  if (typeof window.renderAlert === "function") {
    window.renderAlert(alerts || {});
  }

  const meetings = await loadJSON("./content/meetings.json");
  MEETING_TYPE_META = meetings?.types || {};

  const items = meetings?.items || meetings || [];

  if (document.getElementById("meetingsMiniCal")) {
    const upcoming = items.filter(m =>
      m && m.enabled !== false && isUpcomingMeeting(m)
    );

    renderMeetingsMiniCalendar(upcoming, {
      monthDate: new Date(),
      showLegend: true,
      dayLink: "meetings.html"
    });
  }

  if (document.getElementById("meetingsMini")) {
    renderMeetingsMini(items);
  }

  if (document.getElementById("upcomingMeetings") || document.getElementById("pastMeetings")) {
    renderMeetingsPage(items);
  }
});