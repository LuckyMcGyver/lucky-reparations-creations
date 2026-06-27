
async function fetchJson(path, fallback = {body: []}) {
  try {
    const response = await fetch(path, {cache: 'no-store'});
    if (!response.ok) throw new Error(path);
    return await response.json();
  } catch (error) {
    return fallback;
  }
}
function getItems(data) {
  return Array.isArray(data) ? data : (data.body || data.realisations || []);
}
function setupFilters(){
  document.querySelectorAll('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f=btn.dataset.filter;
    document.querySelectorAll('.gallery-item').forEach(i=>i.style.display=(f==='all'||i.dataset.cat===f)?'block':'none');
  }));
}
async function renderGallery(){
  const grid=document.getElementById('galleryGrid');
  if(!grid)return;
  const data=getItems(await fetchJson('/content/realisations.json'));
  grid.innerHTML=data.map(r=>`
    <article class="gallery-item" data-cat="${r.category}">
      <img src="${r.image}" alt="${r.title}">
      <div>
        ${r.featured ? '<span class="star">À la une</span>' : ''}
        <strong>${r.icon||''} ${r.title}</strong>
        <small>${r.description||''}</small>
        ${r.details ? `<em>${r.details}</em>` : ''}
      </div>
    </article>`).join('');
  setupFilters();
}
async function renderFeatured(){
  const grid=document.getElementById('featuredGrid');
  if(!grid)return;
  const data=getItems(await fetchJson('/content/realisations.json')).filter(r=>r.featured).slice(0,3);
  grid.innerHTML=data.map(r=>`
    <article class="gallery-item" data-cat="${r.category}">
      <img src="${r.image}" alt="${r.title}">
      <div><span class="star">À la une</span><strong>${r.icon||''} ${r.title}</strong><small>${r.description||''}</small></div>
    </article>`).join('');
}
async function renderAvis(){
  const grid=document.getElementById('avisGrid');
  if(!grid)return;
  const data=getItems(await fetchJson('/content/avis.json'));
  grid.innerHTML=data.map(a=>`<article class="card"><h3>${'⭐'.repeat(Number(a.rating)||5)}<br>${a.name}</h3><p>${a.text}</p></article>`).join('');
}
async function renderActualites(){
  const grid=document.getElementById('actualitesGrid');
  if(!grid)return;
  const data=getItems(await fetchJson('/content/actualites.json'));
  grid.innerHTML=data.map(p=>`<article class="card"><h3>${p.title}</h3><p><strong>${(p.date || '').slice(0,10)}</strong></p><p>${p.excerpt}</p></article>`).join('');
}
document.addEventListener('DOMContentLoaded',()=>{renderGallery();renderFeatured();renderAvis();renderActualites();});
