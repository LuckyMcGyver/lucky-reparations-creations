
async function loadProjects(){
  try{
    const r = await fetch('/content/realisations.json', {cache:'no-store'});
    if(!r.ok) throw new Error('no content');
    const data = await r.json();
    return Array.isArray(data) ? data : (data.realisations || []);
  }catch(e){ return []; }
}
async function renderGallery(){
  const grid = document.getElementById("galleryGrid");
  if(!grid) return;
  const projects = await loadProjects();
  grid.innerHTML = projects.map((p,i)=>`
    <article class="gallery-item" data-cat="${p.category}">
      <img src="${p.image}" alt="${p.title}">
      <div>${p.icon || ""} ${p.title}<br><small>${p.description || ""}</small></div>
    </article>`).join("");
  setupFilters();
}
function setupFilters(){
  document.querySelectorAll('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f=btn.dataset.filter;
    document.querySelectorAll('.gallery-item').forEach(item=>{ item.style.display=(f==='all'||item.dataset.cat===f)?'block':'none'; });
  }));
}
document.addEventListener("DOMContentLoaded", renderGallery);
