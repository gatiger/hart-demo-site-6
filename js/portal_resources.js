console.log("portal_resources.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  initLocalizedPage("employee_resources", {
    onData: (data) => {
      renderQuickLinks(data.quickLinks || []);
      renderDirectory(data.directory || []);
      renderForms(data.forms || []);
      renderContacts(data.contacts || []);
    }
  });

  initDirectorySearch();
  initInternalJobs();
});

function renderQuickLinks(items){
  const mount = document.getElementById("quickLinksGrid");
  if(!mount) return;

  mount.innerHTML = items.map(i => `
    <a class="quickLinkCard" href="${i.href}" target="_blank" rel="noopener">
      <div class="quickLinkTitle">${i.label}</div>
    </a>
  `).join("");
}

function renderDirectory(items){
  const mount = document.getElementById("directoryList");
  if(!mount) return;

  mount.dataset.items = JSON.stringify(items);
  drawDirectory(items);
}

function drawDirectory(items){
  const mount = document.getElementById("directoryList");

  mount.innerHTML = items.map(p => `
    <div class="dirItem">
      <div class="dirName">${p.name}</div>
      <div class="dirMeta">${p.title || ""} • ${p.department || ""}</div>
      ${p.phone ? `<a href="tel:${p.phone}">${p.phone}</a>` : ""}
      ${p.email ? `<a href="mailto:${p.email}">${p.email}</a>` : ""}
    </div>
  `).join("");
}

function initDirectorySearch(){
  const input = document.getElementById("directorySearch");
  if(!input) return;

  input.addEventListener("input", () => {
    const term = input.value.toLowerCase();
    const all = JSON.parse(document.getElementById("directoryList").dataset.items || "[]");

    const filtered = all.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.department?.toLowerCase().includes(term) ||
      p.title?.toLowerCase().includes(term)
    );

    drawDirectory(filtered);
  });
}

function renderForms(items){
  const mount = document.getElementById("formsList");
  if(!mount) return;

  mount.innerHTML = items.map(f => `
    <a class="formItem" href="${f.href}" target="_blank">
      ${f.label}
    </a>
  `).join("");
}

function renderContacts(items){
  const mount = document.getElementById("contactsList");
  if(!mount) return;

  mount.innerHTML = items.map(c => `
    <div class="contactItem">
      <strong>${c.name}</strong>
      <div>${c.role}</div>
      ${c.phone ? `<div>${c.phone}</div>` : ""}
      ${c.email ? `<div>${c.email}</div>` : ""}
    </div>
  `).join("");
}

async function initInternalJobs(){
  try{
    console.log("initInternalJobs running");

    const res = await fetch("/content/jobs.json", { cache: "no-store" });
    console.log("jobs fetch status:", res.status, res.statusText);

    if(!res.ok) throw new Error(`Failed to load /content/jobs.json (${res.status})`);

    const data = await res.json();
    console.log("jobs data:", data);

    const jobs = getEmployeePortalJobs(data.jobs || []);
    console.log("filtered employee jobs:", jobs);

    renderInternalJobsNotice(jobs);
    renderInternalJobs(jobs);
  }catch(err){
    console.error("Internal jobs load error:", err);

    const notice = document.getElementById("internalJobsNotice");
    const list = document.getElementById("internalJobsList");

    if(notice){
      notice.innerHTML = "";
      notice.style.display = "none";
    }

    if(list){
      list.innerHTML = `<p>Unable to load internal opportunities.</p>`;
    }
  }
}

function getEmployeePortalJobs(items){
  const now = new Date();

  return (items || []).filter(job =>
    job.active === true &&
    isInWindow(now, job.employeeStart, job.employeeEnd)
  );
}

function renderInternalJobsNotice(items){
  const mount = document.getElementById("internalJobsNotice");
  if(!mount) return;

  if(!items.length){
    mount.innerHTML = "";
    mount.style.display = "none";
    return;
  }

  const count = items.length;
  const firstTitle = items[0]?.title || "Internal Opportunity";

  const title = count === 1
    ? "New Internal Job Opportunity"
    : "New Internal Job Opportunities";

  const message = count === 1
    ? `${firstTitle} is now available for internal applicants.`
    : `${count} internal job postings are currently available.`;

  mount.style.display = "";
  mount.innerHTML = `
    <div class="hc-alert hc-alert--info hc-alert--banner">
      <div class="hc-alert__main">
        <div class="hc-alert__title">${escapeHtml(title)}</div>
        <div class="hc-alert__full">${escapeHtml(message)}</div>
      </div>
      <div class="hc-alert__actions">
        <a class="hc-alert__link" href="#internalJobs">View Openings</a>
      </div>
    </div>
  `;
}

function renderInternalJobs(items){
  const mount = document.getElementById("internalJobsList");
  if(!mount) return;

  if(!items.length){
    mount.innerHTML = `<p>No internal opportunities at this time.</p>`;
    return;
  }

  mount.innerHTML = items.map((job, idx) => {
    const id = escapeAttr(job.id || `internal-job-${idx}`);
    const detailsId = `internalJobDetails_${id}`;

    return `
      <article class="jobListing">
        <div class="jobListingHead">
          <div class="jobListingMain">
            <h3 class="jobListingTitle">${escapeHtml(job.title || "")}</h3>
            <div class="jobListingMeta">
              <span><strong>Posted:</strong> ${formatDisplayDate(job.postedDate)}</span>
              <span><strong>Ends:</strong> ${formatDisplayDate(job.closingDate)}</span>
            </div>
          </div>

          <div class="jobListingActions">
            <button
              type="button"
              class="jobExpandBtn"
              aria-expanded="false"
              aria-controls="${detailsId}">
              Expand
            </button>
          </div>
        </div>

        <div class="jobListingBody" id="${detailsId}" hidden>
          ${job.summary ? `<p class="jobListingSummary">${escapeHtml(job.summary)}</p>` : ""}
          ${job.details ? `<p class="jobListingDetails">${escapeHtml(job.details)}</p>` : ""}
          ${job.applicationHref ? `<a class="jobAppLink" href="${job.applicationHref}" target="_blank" rel="noopener">Employment Application</a>` : ""}
        </div>
      </article>
    `;
  }).join("");

  bindInternalJobExpandButtons();
}

function bindInternalJobExpandButtons(){
  document.querySelectorAll("#internalJobsList .jobExpandBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const next = !expanded;
      const detailsId = btn.getAttribute("aria-controls");
      const panel = detailsId ? document.getElementById(detailsId) : null;

      btn.setAttribute("aria-expanded", String(next));
      btn.textContent = next ? "Collapse" : "Expand";

      if(panel){
        panel.hidden = !next;
      }
    });
  });
}

let workCalendarEvents = [];
let workCalCurrent = new Date();

document.addEventListener("DOMContentLoaded", () => {
  initWorkCalendar();
});

async function initWorkCalendar(){
  try{
    const res = await fetch("/content/county_holidays.json", { cache: "no-store" });
    if(!res.ok) throw new Error(`Failed to load /content/county_holidays.json (${res.status})`);

    const data = await res.json();
    const holidayEvents = Array.isArray(data.events) ? data.events : [];

const today = new Date();

const paydayEvents = generatePaydays(
  data.paydays,
  today.getFullYear() - 1,
  today.getFullYear() + 2
);

workCalendarEvents = [...holidayEvents, ...paydayEvents];

    const prevBtn = document.getElementById("calPrevBtn");
    const nextBtn = document.getElementById("calNextBtn");

    if(prevBtn){
      prevBtn.addEventListener("click", () => {
        workCalCurrent = new Date(workCalCurrent.getFullYear(), workCalCurrent.getMonth() - 1, 1);
        renderWorkCalendar();
      });
    }

    if(nextBtn){
      nextBtn.addEventListener("click", () => {
        workCalCurrent = new Date(workCalCurrent.getFullYear(), workCalCurrent.getMonth() + 1, 1);
        renderWorkCalendar();
      });
    }

    renderWorkCalendar();
    renderUpcomingDates();
  } catch(err){
    console.error("Work calendar load error:", err);

    const grid = document.getElementById("workCalendarGrid");
    const upcoming = document.getElementById("upcomingDates");

    if(grid) grid.innerHTML = `<p>Unable to load calendar.</p>`;
    if(upcoming) upcoming.innerHTML = "";
  }
}

function renderWorkCalendar(){
  const label = document.getElementById("workCalMonthLabel");
  const grid = document.getElementById("workCalendarGrid");
  if(!label || !grid) return;

  const year = workCalCurrent.getFullYear();
  const month = workCalCurrent.getMonth();

  label.textContent = workCalCurrent.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  for(let i = 0; i < startWeekday; i++){
    const dayNum = prevMonthDays - startWeekday + i + 1;
    const date = new Date(year, month - 1, dayNum);
    cells.push(renderDayCell(date, true));
  }

  for(let day = 1; day <= daysInMonth; day++){
    const date = new Date(year, month, day);
    cells.push(renderDayCell(date, false));
  }

  while(cells.length % 7 !== 0){
    const nextDay = (cells.length - (startWeekday + daysInMonth)) + 1;
    const date = new Date(year, month + 1, nextDay);
    cells.push(renderDayCell(date, true));
  }

  grid.innerHTML = cells.join("");
}

function renderDayCell(date, isMuted){
  const iso = toISODate(date);
  const events = getEventsForDate(iso);
  const todayIso = toISODate(new Date());

  const markers = events.map(evt => {
    return `<span class="workCalMarker workCalMarker--${escapeAttr(evt.type)}" title="${escapeHtml(evt.label)}"></span>`;
  }).join("");

  const labels = events.slice(0, 2).map(evt => {
    return `<div class="workCalMiniLabel">${escapeHtml(evt.label)}</div>`;
  }).join("");

  return `
    <div class="workCalDay ${isMuted ? "isMuted" : ""} ${iso === todayIso ? "isToday" : ""}">
      <div class="workCalDayNum">${date.getDate()}</div>
      ${events.length ? `<div class="workCalMarkers">${markers}</div>` : ""}
      ${events.length ? `<div class="workCalLabels">${labels}</div>` : ""}
    </div>
  `;
}

function renderUpcomingDates(){
  const mount = document.getElementById("upcomingDates");
  if(!mount) return;

  const today = new Date();
  today.setHours(0,0,0,0);

  const upcoming = workCalendarEvents
    .map(evt => ({
      ...evt,
      dateObj: new Date(`${evt.date}T00:00:00`)
    }))
    .filter(evt => !Number.isNaN(evt.dateObj.getTime()))
    .filter(evt => evt.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj)
    .slice(0, 5);

  if(!upcoming.length){
    mount.innerHTML = `<div class="upcomingItem"><div class="upcomingTitle">No upcoming dates.</div></div>`;
    return;
  }

  mount.innerHTML = upcoming.map(evt => `
    <div class="upcomingItem">
      <div class="upcomingDate">${formatLongDate(evt.dateObj)}</div>
      <div class="upcomingTitle">${escapeHtml(evt.label)}</div>
      <div class="upcomingMeta">
        <span class="badgeType badgeType--${escapeAttr(evt.type)}">${formatType(evt.type)}</span>
      </div>
    </div>
  `).join("");
}

function getEventsForDate(isoDate){
  return workCalendarEvents.filter(evt => {
    if(evt.date){
      return evt.date === isoDate;
    }

    if(evt.start && evt.end){
      return isoDate >= evt.start && isoDate <= evt.end;
    }

    return false;
  });
}

function toISODate(date){
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLongDate(date){
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDisplayDate(value){
  const d = value ? new Date(value) : null;
  if(!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function escapeAttr(value){
  return String(value ?? "").replace(/[^a-zA-Z0-9_-]/g, "");
}

function formatType(type){
  switch(String(type || "").toLowerCase()){
    case "holiday": return "Holiday";
    case "payday": return "Payday";
    default: return "Event";
  }
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, ch => {
    switch(ch){
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "\"": return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}

function escapeAttr(value){
  return String(value ?? "").replace(/[^a-zA-Z0-9_-]/g, "");
}

/* =========================
   PAYDAY GENERATOR (ADD HERE)
========================= */

function generatePaydays(rule, startYear, endYear){
  const items = [];
  if(!rule?.start || !rule?.intervalDays) return items;

  let current = new Date(`${rule.start}T00:00:00`);
  const rangeStart = new Date(startYear, 0, 1);
  const rangeEnd = new Date(endYear, 11, 31);

  while(current < rangeStart){
    current.setDate(current.getDate() + rule.intervalDays);
  }

  while(current <= rangeEnd){
    items.push({
      date: toISODate(current),
      type: "payday",
      label: rule.label || "Payday"
    });

    current.setDate(current.getDate() + rule.intervalDays);
  }

  return items;
}

function isInWindow(now, startStr, endStr){
  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;

  if(start && Number.isNaN(start.getTime())) return false;
  if(end && Number.isNaN(end.getTime())) return false;

  if(start && now < start) return false;
  if(end && now > end) return false;

  return true;
}