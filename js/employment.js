document.addEventListener("DOMContentLoaded", () => {
  initPublicJobs();
});

async function initPublicJobs(){
  try{
    const res = await fetch("/content/jobs.json", { cache: "no-store" });
    if(!res.ok) throw new Error(`Failed to load /content/jobs.json (${res.status})`);

    const data = await res.json();
    const jobs = getPublicJobs(data.jobs || []);
    renderPublicJobs(jobs);
  }catch(err){
    console.error("Public jobs load error:", err);

    const mount = document.getElementById("publicJobsList");
    if(mount){
      mount.innerHTML = `<p class="noJobsMsg">Unable to load employment listings.</p>`;
    }
  }
}

function getPublicJobs(items){
  const now = new Date();

  return (items || [])
    .filter(job =>
      job.active === true &&
      isInWindow(now, job.publicStart, job.publicEnd)
    )
    .sort((a, b) => {
      const aDate = safeDate(a.postedDate);
      const bDate = safeDate(b.postedDate);
      if(aDate && bDate) return bDate - aDate;
      return 0;
    });
}

function renderPublicJobs(items){
  const mount = document.getElementById("publicJobsList");
  if(!mount) return;

  if(!items.length){
    mount.innerHTML = `<p class="noJobsMsg">There are no current openings at this time.</p>`;
    return;
  }

  mount.innerHTML = items.map((job, idx) => {
    const id = escapeAttr(job.id || `job-${idx}`);
    const detailsId = `jobDetails_${id}`;

    return `
      <article class="jobListing">
        <div class="jobListingHead">
          <div class="jobListingMain">
            <h3 class="jobListingTitle">${escapeHtml(job.title || "")}</h3>
            <div class="jobListingMeta">
              <span><strong>Posted:</strong> ${formatDisplayDate(job.postedDate)}</span>
              <span><strong>Ends:</strong> ${job.closingDate ? formatDisplayDate(job.closingDate) : "Open Until Filled"}</span>
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
          ${job.applicationHref ? `<a class="jobAppLink" href="${escapeHtml(job.applicationHref)}" target="_blank" rel="noopener">Employment Application</a>` : ""}
        </div>
      </article>
    `;
  }).join("");

  bindJobExpandButtons();
}

function bindJobExpandButtons(){
  document.querySelectorAll(".jobExpandBtn").forEach(btn => {
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

function safeDate(value){
  if(!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isInWindow(now, startStr, endStr){
  const start = safeDate(startStr);
  const end = safeDate(endStr);

  if(start && now < start) return false;
  if(end && now > end) return false;
  return true;
}

function formatDisplayDate(value){
  const d = safeDate(value);
  if(!d) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
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