
let data={body:[]}, selected=-1, selectedLibraryImage="";
const $=id=>document.getElementById(id);
const CATEGORY_ICONS={reparations:"🔧",impression3d:"🖨️",laser:"🔥",decoupe:"✂️",creations:"🎨"};
const CATEGORY_LABELS={reparations:"Réparations",impression3d:"Impression 3D",laser:"Gravure laser",decoupe:"Découpe laser",creations:"Créations"};
function categoryIcon(c){return CATEGORY_ICONS[c]||"🎨"}
function categoryLabel(c){return CATEGORY_LABELS[c]||c||""}
function syncIcon(){const ic=categoryIcon($("category")?.value||"creations");if($("icon"))$("icon").value=ic;if($("autoIcon"))$("autoIcon").textContent=ic}
function emptyItem(){return{image:"",photos:[],title:"",category:"creations",icon:categoryIcon("creations"),description:"",long_description:"",details:"",dimensions:"",duration:"",featured:false,draft:false,date:""}}
function normalizeItem(item){
  const d=item.description_section||{}, i=item.images_section||{}, info=item.infos_section||{};
  const cat=item.category||d.category||"creations";
  return {image:item.image||i.image||"",photos:item.photos||i.photos||[],title:item.title||d.title||"",category:cat,icon:categoryIcon(cat),description:item.description||d.description||"",long_description:item.long_description||d.long_description||"",details:item.details||info.details||"",dimensions:item.dimensions||info.dimensions||"",duration:item.duration||info.duration||"",featured:item.featured??info.featured??false,draft:item.draft??false,date:item.date||info.date||""}
}
function settings(){return {owner:localStorage.getItem("gh_owner")||"LuckyMcGyver",repo:localStorage.getItem("gh_repo")||"lucky-reparations-creations",branch:localStorage.getItem("gh_branch")||"main",token:localStorage.getItem("gh_token")||""}}
function saveSettings(){localStorage.setItem("gh_owner",$("repoOwner").value.trim());localStorage.setItem("gh_repo",$("repoName").value.trim());localStorage.setItem("gh_branch",$("repoBranch").value.trim());localStorage.setItem("gh_token",$("githubToken").value.trim());updateStatus();alert("Paramètres enregistrés.")}
function loadSettings(){const s=settings();$("repoOwner").value=s.owner;$("repoName").value=s.repo;$("repoBranch").value=s.branch;$("githubToken").value=s.token;updateStatus()}
function updateStatus(){const st=$("status");if(settings().token){st.textContent="Connecté à GitHub";st.classList.add("ok")}else{st.textContent="Non connecté à GitHub";st.classList.remove("ok")}}
async function gh(path,options={}){const s=settings();if(!s.token)throw new Error("Token GitHub manquant.");const res=await fetch(`https://api.github.com/repos/${s.owner}/${s.repo}/contents/${path}`,{...options,headers:{Authorization:`Bearer ${s.token}`,Accept:"application/vnd.github+json","Content-Type":"application/json",...(options.headers||{})}});const txt=await res.text();if(!res.ok)throw new Error(txt||res.statusText);return txt?JSON.parse(txt):{}}
async function loadSiteData(){try{const live=await fetch("/content/realisations.json?ts="+Date.now()).then(r=>r.json());data.body=(live.body||[]).map(normalizeItem)}catch(e){data.body=[]}selected=data.body.length?0:-1;render()}
function saveForm(){
  if(selected<0)return;
  const it=data.body[selected];
  ["image","title","description","long_description","details","dimensions","duration"].forEach(id=>it[id]=$(id).value.trim());
  it.category=$("category").value;it.icon=categoryIcon(it.category);it.featured=$("featured").checked;it.draft=$("draft")?$("draft").checked:false;it.date=$("date").value||"";
  it.photos=[...document.querySelectorAll(".photo-row")].map(row=>({photo:row.querySelector(".photo-path").value.trim(),caption:row.querySelector(".photo-caption").value.trim()})).filter(p=>p.photo);
}
function loadForm(){
  if(selected<0){$("formTitle").textContent="Aucune réalisation";return}
  const it=data.body[selected];$("formTitle").textContent=it.title||"Nouvelle réalisation";
  ["image","title","description","long_description","details","dimensions","duration"].forEach(id=>$(id).value=it[id]||"");
  $("category").value=it.category||"creations";it.icon=categoryIcon(it.category);if($("icon"))$("icon").value=it.icon;syncIcon();
  $("featured").checked=!!it.featured;if($("draft"))$("draft").checked=!!it.draft;$("date").value=(it.date||"").slice(0,10);
  $("mainPreview").src=it.image||"/assets/logo.png";$("photos").innerHTML="";(it.photos||[]).forEach(addPhotoRow);
}
function addPhotoRow(photo={photo:"",caption:""}){
  const row=document.createElement("div");row.className="photo-row";
  row.innerHTML=`<img src="${esc(photo.photo||'/assets/logo.png')}" ondblclick="openImageModal(this.src)"><input class="photo-path" placeholder="/assets/uploads/photo.jpg" value="${esc(photo.photo||"")}"><input class="photo-caption" placeholder="Légende" value="${esc(photo.caption||"")}"><button type="button" title="Image principale">⭐</button><button type="button" title="Monter">↑</button><button type="button" title="Descendre">↓</button><button type="button" title="Supprimer">×</button>`;
  const b=row.querySelectorAll("button");
  b[0].onclick=()=>{saveForm();const path=row.querySelector(".photo-path").value;const cur=$("image").value;$("image").value=path;row.querySelector(".photo-path").value=cur;$("mainPreview").src=path||"/assets/logo.png";saveForm();render()};
  b[1].onclick=()=>{if(row.previousElementSibling)$("photos").insertBefore(row,row.previousElementSibling)};
  b[2].onclick=()=>{if(row.nextElementSibling)$("photos").insertBefore(row.nextElementSibling,row)};
  b[3].onclick=()=>row.remove();
  $("photos").appendChild(row);
}
function renderList(){
  const q=($("searchList")?.value||"").toLowerCase();
  $("list").innerHTML=data.body.map((it,i)=>({it,i})).filter(x=>!q||(x.it.title+" "+x.it.description).toLowerCase().includes(q)).map(({it,i})=>`<div class="item ${i===selected?'active':''} ${it.draft?'draft':''}" data-i="${i}"><img src="${it.image||'/assets/logo.png'}"><div><strong>${categoryIcon(it.category)} ${esc(it.title||'Sans titre')}</strong><small><span class="catBadge">${categoryLabel(it.category)}</span> • ${(it.photos||[]).length+1} photo(s)${it.featured?' • À la une':''}${it.draft?' • Brouillon':''}</small></div></div>`).join("");
  document.querySelectorAll(".item").forEach(el=>el.onclick=()=>{saveForm();selected=Number(el.dataset.i);render()})
}
function renderPhotos(){
  const imgs=[];data.body.forEach(r=>{if(r.image)imgs.push(r.image);(r.photos||[]).forEach(p=>imgs.push(p.photo))});
  const unique=[...new Set(imgs)].filter(Boolean);
  const q=($("librarySearch")?.value||"").toLowerCase();
  const grid=$("photoGrid");if(!grid)return;
  grid.innerHTML=unique.filter(src=>src.toLowerCase().includes(q)).map(src=>`<div class="libItem ${src===selectedLibraryImage?'selected':''}" data-src="${esc(src)}"><img src="${esc(src)}" ondblclick="openImageModal(this.src)" title="${esc(src)}"><small>${esc(src.split('/').pop())}</small></div>`).join("");
  document.querySelectorAll(".libItem").forEach(el=>el.onclick=()=>{selectedLibraryImage=el.dataset.src;renderPhotos()});
}
function stats(){$("countTotal").textContent=data.body.length;$("countFeatured").textContent=data.body.filter(x=>x.featured&&!x.draft).length;$("countPhotos").textContent=data.body.reduce((n,x)=>n+1+(x.photos||[]).length,0);if($("countDrafts"))$("countDrafts").textContent=data.body.filter(x=>x.draft).length}
function render(){renderList();loadForm();renderPhotos();stats()}
function newItem(){saveForm();data.body.push(emptyItem());selected=data.body.length-1;render()}
function duplicate(){if(selected<0)return;saveForm();const copy=JSON.parse(JSON.stringify(data.body[selected]));copy.title=(copy.title||"Réalisation")+" - copie";data.body.splice(selected+1,0,copy);selected++;render()}
function del(){if(selected<0)return;if(!confirm("Archiver cette réalisation en brouillon ? Elle ne sera plus affichée après publication."))return;data.body[selected].draft=true;render()}
function cleanData(){return {body:data.body.filter(x=>!x.draft).map(normalizeItem)}}
function toBase64Utf8(str){return btoa(unescape(encodeURIComponent(str)))}
async function publish(){try{saveForm();validateBeforePublish();$("publishBtn").disabled=true;$("publishBtn").textContent="Publication...";const path="content/realisations.json";const current=await gh(path);const content=toBase64Utf8(JSON.stringify(cleanData(),null,2));await gh(path,{method:"PUT",body:JSON.stringify({message:"Publication depuis le back-office V10.3",content,sha:current.sha,branch:settings().branch})});alert("Publication envoyée sur GitHub. Cloudflare va redéployer le site automatiquement.")}catch(e){alert("Erreur publication : "+e.message)}finally{$("publishBtn").disabled=false;$("publishBtn").textContent="🚀 Publier"}}
function validateBeforePublish(){for(const r of data.body){if(r.draft)continue;if(!r.title)throw new Error("Une réalisation publiée n'a pas de titre.");if(!r.image)throw new Error("La réalisation "+r.title+" n'a pas d'image principale.");}}
function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=reject;r.readAsDataURL(file)})}
function safeName(name){return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g,"-").replace(/-+/g,"-")}
async function uploadFile(file){const filename=Date.now()+"-"+safeName(file.name);const path="assets/uploads/"+filename;const content=await fileToBase64(file);await gh(path,{method:"PUT",body:JSON.stringify({message:"Ajout image "+filename,content,branch:settings().branch})});return "/"+path}
async function uploadMain(){try{const f=$("mainUpload").files[0];if(!f)return alert("Choisis une image.");const path=await uploadFile(f);$("image").value=path;$("mainPreview").src=path;saveForm();render();alert("Image envoyée.")}catch(e){alert("Erreur upload : "+e.message)}}
async function uploadExtra(){try{const files=[...$("extraUpload").files];if(!files.length)return alert("Choisis une ou plusieurs images.");for(const f of files){const path=await uploadFile(f);addPhotoRow({photo:path,caption:""})}saveForm();render();alert("Photos envoyées.")}catch(e){alert("Erreur upload : "+e.message)}}
function setupDrop(id,inputId,callback){const dz=$(id), input=$(inputId);if(!dz||!input)return;["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("drag")}));["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("drag")}));dz.addEventListener("drop",e=>{input.files=e.dataTransfer.files;callback()})}
async function testGithub(){try{await gh("content/realisations.json");alert("Connexion GitHub OK.")}catch(e){alert("Connexion impossible : "+e.message)}}
function suggestText(){const t=$("title").value.trim()||"Cette réalisation";const cat=$("category").value;const map={impression3d:"Pièce réalisée en impression 3D, adaptée au besoin et préparée sur mesure.",reparations:"Diagnostic et remise en état selon la faisabilité de la réparation.",laser:"Personnalisation réalisée par gravure ou découpe laser.",decoupe:"Découpe laser réalisée sur mesure à partir du projet demandé.",creations:"Création personnalisée réalisée selon la demande."};if(!$("description").value)$("description").value=map[cat]||"Réalisation personnalisée.";if(!$("long_description").value)$("long_description").value=t+" : "+(map[cat]||"Projet personnalisé réalisé avec soin.")}
function addSelectedToGallery(){if(!selectedLibraryImage)return alert("Sélectionne d'abord une image dans la bibliothèque.");addPhotoRow({photo:selectedLibraryImage,caption:""});saveForm();render()}
function useSelectedAsMain(){if(!selectedLibraryImage)return alert("Sélectionne d'abord une image dans la bibliothèque.");$("image").value=selectedLibraryImage;$("mainPreview").src=selectedLibraryImage;saveForm();render()}
function openImageModal(src){$("modalImage").src=src;$("imageModal").classList.add("open")}
function closeImageModal(){$("imageModal").classList.remove("open")}
function esc(s){return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.view).classList.add("active")});
$("settingsBtn").onclick=()=>document.querySelector('[data-view="settings"]').click();$("saveSettingsBtn").onclick=saveSettings;$("testGithubBtn").onclick=testGithub;$("clearTokenBtn").onclick=()=>{localStorage.removeItem("gh_token");loadSettings()};$("publishBtn").onclick=publish;$("newBtn").onclick=newItem;if($("duplicateBtn"))$("duplicateBtn").onclick=duplicate;$("deleteBtn").onclick=del;$("addPhotoBtn").onclick=()=>addPhotoRow();$("uploadMainBtn").onclick=uploadMain;$("uploadExtraBtn").onclick=uploadExtra;if($("refreshLibraryBtn"))$("refreshLibraryBtn").onclick=renderPhotos;if($("addSelectedToGalleryBtn"))$("addSelectedToGalleryBtn").onclick=addSelectedToGallery;if($("useAsMainBtn"))$("useAsMainBtn").onclick=useSelectedAsMain;if($("suggestBtn"))$("suggestBtn").onclick=suggestText;$("form").onsubmit=e=>{e.preventDefault();saveForm();render();alert("Enregistré localement. Clique sur Publier pour envoyer sur GitHub.")};$("image").addEventListener("input",()=>{$("mainPreview").src=$("image").value||"/assets/logo.png"});$("category").addEventListener("change",()=>{syncIcon();saveForm();renderList()});if($("searchList"))$("searchList").addEventListener("input",renderList);if($("librarySearch"))$("librarySearch").addEventListener("input",renderPhotos);
loadSettings();loadSiteData();setupDrop("mainDrop","mainUpload",uploadMain);setupDrop("extraDrop","extraUpload",uploadExtra);
