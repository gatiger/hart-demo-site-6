document.addEventListener("DOMContentLoaded", () => {
  loadJobDescriptions();
});

async function loadJobDescriptions(){
  try{
    const res = await fetch("../content/portal_jobs_descriptions.json", { cache: "no-store" });
    if(!res.ok) throw new Error(`Failed to load job descriptions (${res.status})`);

    const data = await res.json();
    renderJobList(data.jobs || []);
  }catch(err){
    console.error("Job descriptions load error:", err);
    showJobDescriptionsError();
  }
}

function renderJobList(jobs){
  const list = document.getElementById("jobDescList");
  const empty = document.getElementById("jobDescEmpty");
  const content = document.getElementById("jobDescContent");

  if(!list) return;

  if(!Array.isArray(jobs) || !jobs.length){
    list.innerHTML = `<p class="sub">No job descriptions are available right now.</p>`;
    if(empty) empty.hidden = false;
    if(content) content.hidden = true;
    return;
  }

  // Group jobs by department
  const grouped = {};

  jobs.forEach(job => {
    const dept = job.department || "Other";
    if(!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(job);
  });

  let html = "";

  Object.keys(grouped).forEach(dept => {
    html += `
      <div class="jobDescGroup">
        <div class="jobDescGroupTitle">${escapeHtml(dept)}</div>
        ${grouped[dept].map((job, index) => `
          <button
            type="button"
            class="jobDescItem"
            data-title="${escapeHtml(job.title || "")}"
            role="option"
            aria-selected="false">
            ${escapeHtml(job.title || "Untitled Position")}
          </button>
        `).join("")}
      </div>
    `;
  });

  list.innerHTML = html;

  list.querySelectorAll(".jobDescItem").forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedTitle = btn.getAttribute("data-title");
      const job = jobs.find(j => (j.title || "") === selectedTitle);
      if(!job) return;

      list.querySelectorAll(".jobDescItem").forEach(item => {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
      });

      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      renderJobDetail(job);

      if(empty) empty.hidden = true;
      if(content) content.hidden = false;
    });
  });

  if(empty) empty.hidden = false;
  if(content) content.hidden = true;
}

function renderJobDetail(job){
  const titleEl = document.getElementById("jobDescTitle");
  const metaEl = document.getElementById("jobDescMeta");
  const bodyEl = document.getElementById("jobDescBody");

  if(titleEl){
    titleEl.textContent = job.title || "";
  }

  if(metaEl){
    const metaLines = [
      labeledMeta("Grade", job.grade),
      labeledMeta("Division", job.division),
      labeledMeta("Date", job.date),
      labeledMeta("Department", job.department)
    ].filter(Boolean);

    metaEl.innerHTML = metaLines.join("<br>");
  }

  if(bodyEl){
    bodyEl.innerHTML = `
      ${renderParagraphSection("JOB SUMMARY", job.job_summary)}
      ${renderListSection("MAJOR DUTIES", job.major_duties)}
      ${renderListSection("KNOWLEDGE REQUIRED BY THE POSITION", job.knowledge_required)}
      ${renderParagraphSection("SUPERVISORY CONTROLS", job.supervisory_controls)}
      ${renderParagraphSection("GUIDELINES", job.guidelines)}
      ${renderParagraphSection("COMPLEXITY", job.complexity)}
      ${renderParagraphSection("SCOPE AND EFFECT", job.scope_and_effect)}
      ${renderParagraphSection("PERSONAL CONTACTS", job.personal_contacts)}
      ${renderParagraphSection("PURPOSE OF CONTACTS", job.purpose_of_contacts)}
      ${renderParagraphSection("PHYSICAL DEMANDS", job.physical_demands)}
      ${renderParagraphSection("WORK ENVIRONMENT", job.work_environment)}
      ${renderParagraphSection("WORK HOURS", job.work_hours)}
      ${renderParagraphSection("SUPERVISORY AND MANAGEMENT RESPONSIBILITY", job.supervisory_and_management_responsibility)}
      ${renderListSection("MINIMUM QUALIFICATIONS", job.minimum_qualifications)}
      ${renderListSection("DESIRABLE QUALIFICATIONS", job.desirable_qualifications)}
    `;
  }
}

function renderParagraphSection(label, value){
  if(!value) return "";

  return `
    <section class="jobDescSection">
      <h3>${escapeHtml(label)}</h3>
      <p>${formatText(escapeHtml(value))}</p>
    </section>
  `;
}

function renderListSection(label, items){
  if(!Array.isArray(items) || !items.length) return "";

  return `
    <section class="jobDescSection">
      <h3>${escapeHtml(label)}</h3>
      <ul>
        ${items.map(item => `<li>${formatText(escapeHtml(item))}</li>`).join("")}
      </ul>
    </section>
  `;
}

function labeledMeta(label, value){
  if(!value) return "";
  return `<strong>${escapeHtml(label)}:</strong> ${formatText(escapeHtml(value))}`;
}

function showJobDescriptionsError(){
  const list = document.getElementById("jobDescList");
  const empty = document.getElementById("jobDescEmpty");
  const content = document.getElementById("jobDescContent");

  if(list){
    list.innerHTML = `<p class="sub">Unable to load job descriptions.</p>`;
  }

  if(empty){
    empty.textContent = "Job descriptions are unavailable right now.";
    empty.hidden = false;
  }

  if(content){
    content.hidden = true;
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

function formatText(text){
  if(!text) return "";

  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

document.addEventListener("click", (e) => {
  if(e.target.id === "backToTopBtn"){
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
});