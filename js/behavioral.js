document.addEventListener("DOMContentLoaded", initBehavioralPage);

async function initBehavioralPage(){
  try{
    const res = await fetch("/content/behavioral.json",{cache:"no-store"});
    if(!res.ok) throw new Error();

    const data = await res.json();

    setText("behavioralEyebrow", data.header?.eyebrow);
    setText("behavioralPageTitle", data.header?.title);

    setText("behavioralName", data.details?.name);
    setText("behavioralRole", data.details?.role);

    setRow("behavioralOfficeRow","Office",data.details?.office);
    setRow("behavioralAddressRow","Address",data.details?.address);
    setPhone("behavioralPhoneRow","Phone",data.details?.phone);
    setEmail("behavioralEmailRow","Email",data.details?.email);
    setRow("behavioralHoursRow","Hours",data.details?.hours);

    renderPhoto(data.photo);
    renderMessage(data.message);

  }catch{
    document.getElementById("behavioralMessageBody").innerHTML =
      "<p>Unable to load content at this time.</p>";
  }
}

function renderPhoto(photo){
  const img = document.getElementById("behavioralPhoto");
  if(!img) return;

  img.src = photo?.src || "/assets/placeholder.jpg";
  img.alt = photo?.alt || "Behavioral Health Center";

  const wrap = document.getElementById("behavioralPhotoText");
  wrap.innerHTML = "";

  (photo?.description || []).forEach(t=>{
    const p=document.createElement("p");
    p.textContent=t;
    wrap.appendChild(p);
  });
}

function renderMessage(msg){
  setText("behavioralMessageTitle", msg?.title);

  const body = document.getElementById("behavioralMessageBody");
  body.innerHTML="";

  (msg?.paragraphs || []).forEach(t=>{
    const p=document.createElement("p");
    p.textContent=t;
    body.appendChild(p);
  });
}

/* helpers */
function setText(id,val){
  const el=document.getElementById(id);
  if(el) el.textContent = val || "";
}

function setRow(id,label,val){
  const el=document.getElementById(id);
  if(!el || !val){ if(el) el.hidden=true; return; }
  el.hidden=false;
  el.innerHTML=`<strong>${label}:</strong> ${val}`;
}

function setPhone(id,label,val){
  const el=document.getElementById(id);
  if(!el || !val){ if(el) el.hidden=true; return; }
  const tel=val.replace(/[^\d+]/g,"");
  el.innerHTML=`<strong>${label}:</strong> <a href="tel:${tel}">${val}</a>`;
}

function setEmail(id,label,val){
  const el=document.getElementById(id);
  if(!el || !val){ if(el) el.hidden=true; return; }
  el.innerHTML=`<strong>${label}:</strong> <a href="mailto:${val}">${val}</a>`;
}