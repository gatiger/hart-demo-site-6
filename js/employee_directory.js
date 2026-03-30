document.addEventListener("DOMContentLoaded", () => {
  loadDirectory();
});

async function loadDirectory(){
  try{
    const res = await fetch("/content/employee_directory.json", { cache: "no-store" });
    if(!res.ok) throw new Error(`Failed to load directory (${res.status})`);

    const data = await res.json();
    renderDepartments(data.departments || []);
  }catch(err){
    console.error("Directory load error:", err);
  }
}

function renderDepartments(departments){
  const mount = document.getElementById("directoryDepartments");
  if(!mount) return;

  mount.innerHTML = (departments || []).map(dept => `
    <div class="directoryDeptBlock">
      <div class="directorySheetWrap">
        <table class="directorySheet">
          <thead>
            <tr class="sheetHeaderMain">
              <th colspan="3">${escapeHtml(dept.name || "Department")}</th>
            </tr>
            <tr>
              <th>Name</th>
              <th>Number</th>
              <th>Extension</th>
            </tr>
          </thead>
          <tbody>
            ${(dept.directory || []).map(person => `
              <tr>
                <td>
                  ${person.email
                    ? `<a href="mailto:${escapeHtml(person.email)}">${escapeHtml(person.name || "")}</a>`
                    : escapeHtml(person.name || "")
                  }
                </td>
                <td>${escapeHtml(person.phone || "")}</td>
                <td>${escapeHtml(person.extension || "")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `).join("");
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