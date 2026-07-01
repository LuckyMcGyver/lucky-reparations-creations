
let data={body:[]}, selected=-1, currentListFilter="active";
const CATEGORY_ICONS={reparations:"🔧",impression3d:"🖨️",laser:"🔥",decoupe:"✂️",creations:"🎨"};
const CATEGORY_LABELS={reparations:"Réparations",impression3d:"Impression 3D",laser:"Gravure laser",decoupe:"Découpe laser",creations:"Créations"};
const $=id=>document.getElementById(id);
const $$=sel=>[...document.querySelectorAll(sel)];
function esc(s){return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
function categoryIcon(c){return CATEGORY_ICONS[c]||"🎨"}
function categoryLabel(c){return CATEGORY_LABELS[c]||c||""}

window.showView=function(id){
  $$(".view").forEach(v=>v.classList.remove("active"));
  $$(".tab").forEach(t=>t.classList.remove("active"));
  if($(id)) $(id).classList.add("active");
  const tab=$("tab-"+id); if(tab) tab.classList.add("active");
};

function settings(){return{owner:localStorage.getItem("gh_owner")||"LuckyMcGyver",repo:localStorage.getItem("gh_repo")||"lucky-reparations-creations",branch:localStorage.getItem("gh_branch")||"main",token:localStorage.getItem("gh_token")||""}}
function updateStatus(){const st=$("status"); if(!st)return; if(settings().token){st.textContent="Connecté à GitHub";st.classList.add("ok")}else{st.textContent="Non connecté à GitHub";st.classList.remove("ok")}}
window.loadSettings=function(){const s=settings(); if($("repoOwner"))$("repoOwner").value=s.owner;if($("repoName"))$("repoName").value=s.repo;if($("repoBranch"))$("repoBranch").value=s.branch;if($("githubToken"))$("githubToken").value=s.token;updateStatus();}
window.saveSettings=function(){localStorage.setItem("gh_owner",$("repoOwner").value.trim());localStorage.setItem("gh_repo",$("repoName").value.trim());localStorage.setItem("gh_branch",$("repoBranch").value.trim());localStorage.setItem("gh_token",$("githubToken").value.trim());updateStatus();alert("Paramètres enregistrés.")}
window.clearToken=function(){localStorage.removeItem("gh_token");loadSettings();}

async function gh(path,options={}){const s=settings(); if(!s.token)throw new Error("Token GitHub manquant."); const res=await fetch(`https://api.github.com/repos/${s.owner}/${s.repo}/contents/${path}`,{...options,headers:{Authorization:`Bearer ${s.token}`,Accept:"application/vnd.github+json","Content-Type":"application/json",...(options.headers||{})}}); const txt=await res.text(); if(!res.ok)throw new Error(txt||res.statusText); return txt?JSON.parse(txt):{};}
window.testGithub=async function(){try{await gh("content/realisations.json");alert("Connexion GitHub OK.")}catch(e){alert("Connexion impossible : "+e.message)}}

function emptyItem(){return{image:"",photos:[],title:"",category:"creations",icon:"🎨",description:"",long_description:"",details:"",dimensions:"",duration:"",featured:false,draft:true,date:""}}
function normalizeItem(item){const d=item.description_section||{}, im=item.images_section||{}, inf=item.infos_section||{}; const cat=item.category||d.category||"creations"; return{image:item.image||im.image||"",photos:item.photos||im.photos||[],title:item.title||d.title||"",category:cat,icon:categoryIcon(cat),description:item.description||d.description||"",long_description:item.long_description||d.long_description||"",details:item.details||inf.details||"",dimensions:item.dimensions||inf.dimensions||"",duration:item.duration||inf.duration||"",featured:item.featured??inf.featured??false,draft:item.draft??false,date:item.date||inf.date||""}}
async function loadSiteData(){try{const live=await fetch("/content/realisations.json?ts="+Date.now()).then(r=>r.json());data.body=(live.body||[]).map(normalizeItem)}catch(e){data.body=[]}selected=data.body.length?0:-1;render()}

window.syncIcon=function(){const ic=categoryIcon($("category")?.value||"creations");if($("icon"))$("icon").value=ic;if($("autoIcon"))$("autoIcon").textContent=ic}
window.saveForm=function(){if(selected<0)return;const it=data.body[selected];["image","title","description","long_description","details","dimensions","duration"].forEach(id=>{if($(id))it[id]=$(id).value.trim()});it.category=$("category")?.value||"creations";it.icon=categoryIcon(it.category);it.featured=!!$("featured")?.checked;it.draft=!!$("draft")?.checked;it.date=$("date")?.value||"";it.photos=$$(".photo-row").map(row=>({photo:row.querySelector(".photo-path")?.value.trim()||"",caption:row.querySelector(".photo-caption")?.value.trim()||""})).filter(p=>p.photo)}
function loadForm(){if(selected<0){if($("formTitle"))$("formTitle").textContent="Aucune réalisation";return}const it=data.body[selected];$("formTitle").textContent=it.title||"Nouvelle réalisation";["image","title","description","long_description","details","dimensions","duration"].forEach(id=>{if($(id))$(id).value=it[id]||""});$("category").value=it.category||"creations";syncIcon();$("featured").checked=!!it.featured;$("draft").checked=!!it.draft;$("date").value=(it.date||"").slice(0,10);$("mainPreview").src=it.image||"/assets/logo.png";$("photos").innerHTML="";(it.photos||[]).forEach(addPhotoRow)}
window.addPhotoRow=function(photo={photo:"",caption:""}){const row=document.createElement("div");row.className="photo-row";row.innerHTML=`<img src="${esc(photo.photo||'/assets/logo.png')}"><input class="photo-path" placeholder="/assets/uploads/photo.jpg" value="${esc(photo.photo||"")}"><input class="photo-caption" placeholder="Légende" value="${esc(photo.caption||"")}"><button type="button">⭐</button><button type="button">↑</button><button type="button">↓</button><button type="button">×</button>`;const b=row.querySelectorAll("button");row.querySelector("img").ondblclick=()=>openImageModal(row.querySelector("img").src);b[0].onclick=()=>{saveForm();const path=row.querySelector(".photo-path").value;const cur=$("image").value;$("image").value=path;row.querySelector(".photo-path").value=cur;$("mainPreview").src=path||"/assets/logo.png";saveForm();render()};b[1].onclick=()=>{if(row.previousElementSibling)$("photos").insertBefore(row,row.previousElementSibling)};b[2].onclick=()=>{if(row.nextElementSibling)$("photos").insertBefore(row.nextElementSibling,row)};b[3].onclick=()=>row.remove();$("photos").appendChild(row)}

function visibleByFilter(it){if(currentListFilter==="all")return true;if(currentListFilter==="active")return !it.draft;if(currentListFilter==="draft")return !!it.draft;if(currentListFilter==="featured")return !!it.featured&&!it.draft;return true}
window.setFilter=function(f){currentListFilter=f;$$(".filterPill").forEach(b=>b.classList.toggle("active",b.dataset.filter===f));renderList()}
window.renderList=function(){const q=($("searchList")?.value||"").toLowerCase();const rows=data.body.map((it,i)=>({it,i})).filter(x=>visibleByFilter(x.it)).filter(x=>!q||(x.it.title+" "+x.it.description+" "+x.it.category).toLowerCase().includes(q));$("list").innerHTML=rows.length?rows.map(({it,i})=>`<div class="item ${i===selected?'active':''} ${it.draft?'draft':''}" onclick="selectItem(${i})"><img src="${it.image||'/assets/logo.png'}"><div><strong>${categoryIcon(it.category)} ${esc(it.title||'Nouvelle réalisation')}</strong><small><span class="catBadge">${categoryLabel(it.category)}</span> • ${(it.photos||[]).length+1} photo(s)${it.featured?' • À la une':''}${it.draft?' • Brouillon':''}</small></div></div>`).join(""):`<div class="emptyList">Aucune réalisation dans ce filtre.</div>`}
window.selectItem=function(i){saveForm();selected=i;render()}
function stats(){if($("countTotal"))$("countTotal").textContent=data.body.length;if($("countFeatured"))$("countFeatured").textContent=data.body.filter(x=>x.featured&&!x.draft).length;if($("countPhotos"))$("countPhotos").textContent=data.body.reduce((n,x)=>n+1+(x.photos||[]).length,0);if($("countDrafts"))$("countDrafts").textContent=data.body.filter(x=>x.draft).length}
window.render=function(){renderList();loadForm();stats()}

window.newItem=function(){saveForm();data.body.push(emptyItem());selected=data.body.length-1;setFilter("draft");render();showView("realisations")}
window.duplicateItem=function(){if(selected<0)return;saveForm();const copy=JSON.parse(JSON.stringify(data.body[selected]));copy.title=(copy.title||"Réalisation")+" - copie";copy.draft=true;data.body.splice(selected+1,0,copy);selected++;setFilter("draft");render()}
window.archiveSelected=function(){if(selected<0)return;data.body[selected].draft=true;setFilter("active");render();alert("Réalisation archivée.")}
window.restoreSelected=function(){if(selected<0)return;data.body[selected].draft=false;setFilter("active");render();alert("Réalisation réactivée.")}
window.deleteItem=function(){if(selected<0)return;if(!confirm("Supprimer définitivement cette réalisation ?"))return;data.body.splice(selected,1);selected=data.body.length?Math.max(0,selected-1):-1;render()}

function toBase64Utf8(str){return btoa(unescape(encodeURIComponent(str)))}
function cleanData(){return{body:data.body.filter(x=>!x.draft).map(normalizeItem)}}
window.publish=async function(){try{saveForm();for(const r of data.body){if(!r.draft&&(!r.title||!r.image))throw new Error("Une réalisation publiée doit avoir un titre et une image principale.")}const btn=$("publishBtn");btn.disabled=true;btn.textContent="Publication...";const current=await gh("content/realisations.json");const content=toBase64Utf8(JSON.stringify(cleanData(),null,2));await gh("content/realisations.json",{method:"PUT",body:JSON.stringify({message:"Publication depuis le back-office V11.1",content,sha:current.sha,branch:settings().branch})});await forcePublishActualitesV132();
alert("Publication envoyée sur GitHub. Cloudflare va redéployer le site automatiquement.")}catch(e){alert("Erreur publication : "+e.message)}finally{$("publishBtn").disabled=false;$("publishBtn").textContent="🚀 Publier"}}
function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=reject;r.readAsDataURL(file)})}
function safeName(name){return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g,"-").replace(/-+/g,"-")}
async function uploadFile(file){const filename=Date.now()+"-"+safeName(file.name);const path="assets/uploads/"+filename;const content=await fileToBase64(file);await gh(path,{method:"PUT",body:JSON.stringify({message:"Ajout image "+filename,content,branch:settings().branch})});return "/"+path}
window.uploadMain=async function(){try{const f=$("mainUpload").files[0];if(!f)return alert("Choisis une image.");const path=await uploadFile(f);$("image").value=path;$("mainPreview").src=path;saveForm();render();alert("Image envoyée.")}catch(e){alert("Erreur upload : "+e.message)}}
window.uploadExtra=async function(){try{const files=[...$("extraUpload").files];if(!files.length)return alert("Choisis une ou plusieurs images.");for(const f of files){const path=await uploadFile(f);addPhotoRow({photo:path,caption:""})}saveForm();render();alert("Photos envoyées.")}catch(e){alert("Erreur upload : "+e.message)}}
window.suggestText=function(){const t=$("title").value.trim()||"Cette réalisation";const cat=$("category").value;const map={impression3d:"Pièce réalisée en impression 3D, adaptée au besoin et préparée sur mesure.",reparations:"Diagnostic et remise en état selon la faisabilité de la réparation.",laser:"Personnalisation réalisée par gravure ou découpe laser.",decoupe:"Découpe laser réalisée sur mesure à partir du projet demandé.",creations:"Création personnalisée réalisée selon la demande."};if(!$("description").value)$("description").value=map[cat];if(!$("long_description").value)$("long_description").value=t+" : "+map[cat]}
window.openImageModal=function(src){$("modalImage").src=src;$("imageModal").classList.add("open")}
window.closeImageModal=function(){$("imageModal").classList.remove("open")}

document.addEventListener("DOMContentLoaded",()=>{loadSettings();loadSiteData()});


// V13 — Sauvegarde/restauration des données de créations
window.exportDataBackup = function(){
  try{
    if(typeof saveForm === "function") saveForm();
    const backup = {
      created_at: new Date().toISOString(),
      type: "lucky-reparations-creations-backup",
      body: Array.isArray(data?.body) ? data.body : []
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sauvegarde-realisations-lucky.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }catch(e){
    alert("Erreur sauvegarde : " + e.message);
  }
};

window.restoreDataBackup = function(event){
  const file = event.target.files && event.target.files[0];
  if(!file) return;
  if(!confirm("Restaurer cette sauvegarde dans le back-office ? Pense ensuite à cliquer sur Publier.")) return;
  const reader = new FileReader();
  reader.onload = function(){
    try{
      const restored = JSON.parse(reader.result);
      const body = restored.body || restored.realisations || restored;
      if(!Array.isArray(body)) throw new Error("Format de sauvegarde non reconnu.");
      data.body = body.map(typeof normalizeItem === "function" ? normalizeItem : x => x);
      selected = data.body.length ? 0 : -1;
      if(typeof render === "function") render();
      alert("Sauvegarde restaurée dans le back-office. Clique sur Publier pour l'envoyer sur GitHub.");
    }catch(e){
      alert("Erreur restauration : " + e.message);
    }
  };
  reader.readAsText(file);
};


/* V13.1 — Module Actualités */
let newsData = { body: [] };
let selectedNews = -1;

function emptyNews(){
  return {
    title: "",
    date: new Date().toISOString().slice(0,10),
    excerpt: "",
    image: "/assets/logo.png"
  };
}

function normalizeNews(item){
  return {
    title: item.title || "",
    date: (item.date || "").slice(0,10),
    excerpt: item.excerpt || item.text || item.description || "",
    image: item.image || "/assets/logo.png"
  };
}

async function loadNewsData(){
  try{
    const live = await fetch("/content/actualites.json?ts=" + Date.now()).then(r => r.json());
    newsData.body = (live.body || live.actualites || []).map(normalizeNews);
  }catch(e){
    newsData.body = [];
  }
  selectedNews = newsData.body.length ? 0 : -1;
  renderNews();
}

function saveNewsForm(){
  if(selectedNews < 0) return;
  const item = newsData.body[selectedNews];
  item.title = document.getElementById("newsTitle")?.value.trim() || "";
  item.date = document.getElementById("newsDate")?.value || "";
  item.excerpt = document.getElementById("newsExcerpt")?.value.trim() || "";
  item.image = document.getElementById("newsImage")?.value.trim() || "/assets/logo.png";
}

function loadNewsForm(){
  const title = document.getElementById("newsFormTitle");
  if(selectedNews < 0){
    if(title) title.textContent = "Aucune actualité";
    return;
  }
  const item = newsData.body[selectedNews];
  if(title) title.textContent = item.title || "Nouvelle actualité";
  if(document.getElementById("newsTitle")) document.getElementById("newsTitle").value = item.title || "";
  if(document.getElementById("newsDate")) document.getElementById("newsDate").value = (item.date || "").slice(0,10);
  if(document.getElementById("newsExcerpt")) document.getElementById("newsExcerpt").value = item.excerpt || "";
  if(document.getElementById("newsImage")) document.getElementById("newsImage").value = item.image || "/assets/logo.png";
  if(document.getElementById("newsPreview")) document.getElementById("newsPreview").src = item.image || "/assets/logo.png";
}

function renderNewsList(){
  const list = document.getElementById("newsList");
  if(!list) return;
  const q = (document.getElementById("searchNews")?.value || "").toLowerCase();
  const rows = newsData.body
    .map((item, i) => ({item, i}))
    .filter(x => !q || (x.item.title + " " + x.item.excerpt).toLowerCase().includes(q));

  list.innerHTML = rows.length ? rows.map(({item, i}) => `
    <div class="item ${i === selectedNews ? "active" : ""}" onclick="selectNews(${i})">
      <img src="${item.image || "/assets/logo.png"}">
      <div>
        <strong>📰 ${esc(item.title || "Nouvelle actualité")}</strong>
        <small>${item.date || "Sans date"}</small>
      </div>
    </div>
  `).join("") : `<div class="emptyList">Aucune actualité.</div>`;
}

function renderNews(){
  renderNewsList();
  loadNewsForm();
}

function selectNews(i){
  saveNewsForm();
  selectedNews = i;
  renderNews();
}

function newNews(){
  saveNewsForm();
  newsData.body.unshift(emptyNews());
  selectedNews = 0;
  if(typeof showView === "function") showView("actualites");
  renderNews();
}

function deleteNews(){
  if(selectedNews < 0) return;
  if(!confirm("Supprimer cette actualité ?")) return;
  newsData.body.splice(selectedNews, 1);
  selectedNews = newsData.body.length ? Math.max(0, selectedNews - 1) : -1;
  renderNews();
}

function cleanNewsData(){
  return {
    body: newsData.body
      .map(normalizeNews)
      .filter(n => n.title || n.excerpt)
      .sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0))
  };
}


document.addEventListener("DOMContentLoaded", function(){
  if(typeof loadNewsData === "function") loadNewsData();
  const newsImage = document.getElementById("newsImage");
  if(newsImage){
    newsImage.addEventListener("input", function(){
      const prev = document.getElementById("newsPreview");
      if(prev) prev.src = this.value || "/assets/logo.png";
    });
  }
});


/* V13.2 — Publication fiable des actualités */
async function forcePublishActualitesV132(){
  if(typeof saveNewsForm === "function") saveNewsForm();
  if(typeof cleanNewsData !== "function") return;
  const content = toBase64Utf8(JSON.stringify(cleanNewsData(), null, 2));
  const current = await gh("content/actualites.json").catch(() => null);
  const payload = {
    message: "Mise à jour des actualités depuis le back-office V13.2",
    content: content,
    branch: settings().branch
  };
  if(current && current.sha) payload.sha = current.sha;
  await gh("content/actualites.json", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
