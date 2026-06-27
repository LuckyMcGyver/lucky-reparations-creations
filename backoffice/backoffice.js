
let data={body:[]}, selected=-1;
const $=id=>document.getElementById(id);

function emptyItem(){return{image:"",photos:[],title:"",category:"creations",icon:"🎨",description:"",long_description:"",details:"",dimensions:"",duration:"",featured:false,date:""}}
function normalizeItem(item){
  const d=item.description_section||{}, i=item.images_section||{}, info=item.infos_section||{};
  return {
    image:item.image||i.image||"",
    photos:item.photos||i.photos||[],
    title:item.title||d.title||"",
    category:item.category||d.category||"creations",
    icon:item.icon||d.icon||"",
    description:item.description||d.description||"",
    long_description:item.long_description||d.long_description||"",
    details:item.details||info.details||"",
    dimensions:item.dimensions||info.dimensions||"",
    duration:item.duration||info.duration||"",
    featured:item.featured ?? info.featured ?? false,
    date:item.date||info.date||""
  }
}
function settings(){return {
  owner:localStorage.getItem("gh_owner")||"LuckyMcGyver",
  repo:localStorage.getItem("gh_repo")||"lucky-reparations-creations",
  branch:localStorage.getItem("gh_branch")||"main",
  token:localStorage.getItem("gh_token")||""
}}
function saveSettings(){
  localStorage.setItem("gh_owner",$("repoOwner").value.trim());
  localStorage.setItem("gh_repo",$("repoName").value.trim());
  localStorage.setItem("gh_branch",$("repoBranch").value.trim());
  localStorage.setItem("gh_token",$("githubToken").value.trim());
  updateStatus();
  alert("Paramètres enregistrés dans ce navigateur.");
}
function loadSettings(){
  const s=settings();
  $("repoOwner").value=s.owner;$("repoName").value=s.repo;$("repoBranch").value=s.branch;$("githubToken").value=s.token;
  updateStatus();
}
function updateStatus(){
  const st=$("status");
  if(settings().token){st.textContent="Connecté à GitHub";st.classList.add("ok")}
  else{st.textContent="Non connecté à GitHub";st.classList.remove("ok")}
}
async function gh(path, options={}){
  const s=settings();
  if(!s.token) throw new Error("Token GitHub manquant.");
  const res=await fetch(`https://api.github.com/repos/${s.owner}/${s.repo}/contents/${path}`,{
    ...options,
    headers:{Authorization:`Bearer ${s.token}`,Accept:"application/vnd.github+json","Content-Type":"application/json",...(options.headers||{})}
  });
  const txt=await res.text();
  if(!res.ok) throw new Error(txt || res.statusText);
  return txt ? JSON.parse(txt) : {};
}
async function loadSiteData(){
  try{
    const live=await fetch("/content/realisations.json?ts="+Date.now()).then(r=>r.json());
    data.body=(live.body||[]).map(normalizeItem);
  }catch(e){data.body=[]}
  selected=data.body.length?0:-1;
  render();
}
function saveForm(){
  if(selected<0)return;
  const it=data.body[selected];
  ["image","title","icon","description","long_description","details","dimensions","duration"].forEach(id=>it[id]=$(id).value.trim());
  it.category=$("category").value;it.featured=$("featured").checked;it.date=$("date").value||"";
  it.photos=[...document.querySelectorAll(".photo-row")].map(row=>({photo:row.querySelector(".photo-path").value.trim(),caption:row.querySelector(".photo-caption").value.trim()})).filter(p=>p.photo);
}
function loadForm(){
  if(selected<0){$("formTitle").textContent="Aucune réalisation";return}
  const it=data.body[selected];
  $("formTitle").textContent=it.title||"Nouvelle réalisation";
  ["image","title","icon","description","long_description","details","dimensions","duration"].forEach(id=>$(id).value=it[id]||"");
  $("category").value=it.category||"creations";$("featured").checked=!!it.featured;$("date").value=(it.date||"").slice(0,10);
  $("mainPreview").src=it.image||"/assets/logo.png";
  $("photos").innerHTML="";(it.photos||[]).forEach(addPhotoRow);
}
function addPhotoRow(photo={photo:"",caption:""}){
  const row=document.createElement("div");row.className="photo-row";
  row.innerHTML=`<img src="${esc(photo.photo||'/assets/logo.png')}" onclick="openImageModal(this.src)"><input class="photo-path" placeholder="/assets/uploads/photo.jpg" value="${esc(photo.photo||"")}"><input class="photo-caption" placeholder="Légende" value="${esc(photo.caption||"")}"><button type="button">×</button>`;
  row.querySelector("button").onclick=()=>row.remove();$("photos").appendChild(row);
}
function renderList(){
  $("list").innerHTML=data.body.map((it,i)=>`<div class="item ${i===selected?'active':''}" data-i="${i}"><img src="${it.image||'/assets/logo.png'}"><div><strong>${esc(it.title||'Sans titre')}</strong><small>${esc(it.category||'')}${it.featured?' • À la une':''}</small></div></div>`).join("");
  document.querySelectorAll(".item").forEach(el=>el.onclick=()=>{saveForm();selected=Number(el.dataset.i);render()})
}
function renderPhotos(){
  const imgs=[];
  data.body.forEach(r=>{if(r.image)imgs.push(r.image);(r.photos||[]).forEach(p=>imgs.push(p.photo))});
  $("photoGrid").innerHTML=imgs.map(src=>`<img src="${esc(src)}" onclick="openImageModal(this.src)">`).join("");
}
function stats(){
  $("countTotal").textContent=data.body.length;$("countFeatured").textContent=data.body.filter(x=>x.featured).length;$("countPhotos").textContent=data.body.reduce((n,x)=>n+1+(x.photos||[]).length,0)
}
function render(){renderList();loadForm();renderPhotos();stats()}
function newItem(){saveForm();data.body.push(emptyItem());selected=data.body.length-1;render()}
function del(){if(selected<0)return;if(!confirm("Supprimer cette réalisation ?"))return;data.body.splice(selected,1);selected=data.body.length?Math.max(0,selected-1):-1;render()}
function cleanData(){return {body:data.body.map(normalizeItem)}}
function toBase64Utf8(str){return btoa(unescape(encodeURIComponent(str)))}
async function publish(){
  try{
    saveForm();
    $("publishBtn").disabled=true;$("publishBtn").textContent="Publication...";
    const path="content/realisations.json";
    const current=await gh(path);
    const content=toBase64Utf8(JSON.stringify(cleanData(),null,2));
    await gh(path,{method:"PUT",body:JSON.stringify({message:"Mise à jour des réalisations depuis le back-office V9",content,sha:current.sha,branch:settings().branch})});
    alert("Publication envoyée sur GitHub. Cloudflare va redéployer le site automatiquement.");
  }catch(e){alert("Erreur publication : "+e.message)}
  finally{$("publishBtn").disabled=false;$("publishBtn").textContent="🚀 Publier"}
}
function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=reject;r.readAsDataURL(file)})}
function safeName(name){return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g,"-").replace(/-+/g,"-")}
async function uploadFile(file){
  const filename=Date.now()+"-"+safeName(file.name);
  const path="assets/uploads/"+filename;
  const content=await fileToBase64(file);
  await gh(path,{method:"PUT",body:JSON.stringify({message:"Ajout image "+filename,content,branch:settings().branch})});
  return "/"+path;
}
async function uploadMain(){
  try{const f=$("mainUpload").files[0];if(!f)return alert("Choisis une image.");const path=await uploadFile(f);$("image").value=path;$("mainPreview").src=path;saveForm();render();alert("Image envoyée.");}
  catch(e){alert("Erreur upload : "+e.message)}
}
async function uploadExtra(){
  try{const f=$("extraUpload").files[0];if(!f)return alert("Choisis une image.");const path=await uploadFile(f);addPhotoRow({photo:path,caption:""});saveForm();render();alert("Photo envoyée.");}
  catch(e){alert("Erreur upload : "+e.message)}
}
async function testGithub(){
  try{await gh("content/realisations.json");alert("Connexion GitHub OK.");}
  catch(e){alert("Connexion impossible : "+e.message)}
}
function openImageModal(src){$("modalImage").src=src;$("imageModal").classList.add("open")}
function closeImageModal(){$("imageModal").classList.remove("open")}
function esc(s){return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.view).classList.add("active")});
$("settingsBtn").onclick=()=>document.querySelector('[data-view="settings"]').click();
$("saveSettingsBtn").onclick=saveSettings;$("testGithubBtn").onclick=testGithub;$("clearTokenBtn").onclick=()=>{localStorage.removeItem("gh_token");loadSettings()};
$("publishBtn").onclick=publish;$("newBtn").onclick=newItem;$("deleteBtn").onclick=del;$("addPhotoBtn").onclick=()=>addPhotoRow();
$("uploadMainBtn").onclick=uploadMain;$("uploadExtraBtn").onclick=uploadExtra;
$("form").onsubmit=e=>{e.preventDefault();saveForm();render();alert("Enregistré localement. Clique sur Publier pour envoyer sur GitHub.")};
$("image").addEventListener("input",()=>{$("mainPreview").src=$("image").value||"/assets/logo.png"});
loadSettings();loadSiteData();
