
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
function flattenProject(p) {
  if (p.description_section || p.images_section || p.infos_section) {
    const d = p.description_section || {};
    const i = p.images_section || {};
    const info = p.infos_section || {};
    return {
      title: d.title || "Réalisation",
      category: d.category || "creations",
      icon: d.icon || "",
      description: d.description || "",
      long_description: d.long_description || "",
      image: i.image || "/assets/hero.png",
      photos: i.photos || [],
      details: info.details || "",
      dimensions: info.dimensions || "",
      duration: info.duration || "",
      featured: !!info.featured,
      date: info.date || ""
    };
  }
  return p;
}
let allProjects = [];
function projectCard(r, index) {
  const isNew = isRecent(r.date);
  return `<article class="gallery-item" data-index="${index}" data-cat="${r.category}" data-search="${(r.title+' '+r.description+' '+r.details).toLowerCase()}">
    <img src="${r.image}" alt="${r.title}">
    <div>
      ${r.featured ? '<span class="star">À la une</span>' : ''}
      ${isNew ? '<span class="star">Nouveau</span>' : ''}
      <strong>${r.icon||''} ${r.title}</strong>
      <small>${r.description||''}</small>
      ${r.details ? `<em>${r.details}</em>` : ''}
    </div>
  </article>`;
}
function isRecent(dateValue) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;
  return (Date.now() - d.getTime()) / 86400000 <= 30;
}
function setupFilters(){
  const apply = () => {
    const active = document.querySelector('.filter-btn.active');
    const f = active ? active.dataset.filter : 'all';
    const q = (document.getElementById('gallerySearch')?.value || '').toLowerCase().trim();
    document.querySelectorAll('.gallery-item').forEach(i => {
      const okCat = f === 'all' || i.dataset.cat === f;
      const okText = !q || i.dataset.search.includes(q);
      i.style.display = (okCat && okText) ? 'block' : 'none';
    });
  };
  document.querySelectorAll('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    apply();
  }));
  document.getElementById('gallerySearch')?.addEventListener('input', apply);
}
function setupModal(){
  const modal = document.getElementById('projectModal');
  if(!modal) return;
  document.querySelectorAll('.gallery-item').forEach(card => card.addEventListener('click', () => {
    const p = allProjects[Number(card.dataset.index)];
    openProjectModal(p);
  }));
  modal.addEventListener('click', e => {
    if(e.target.id === 'projectModal') closeProjectModal();
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeProjectModal();
  });
}
function openProjectModal(p) {
  const modal = document.getElementById('projectModal');
  const mainImg = document.getElementById('modalMainImage');
  document.getElementById('modalTitle').textContent = `${p.icon || ''} ${p.title}`;
  document.getElementById('modalDescription').textContent = p.long_description || p.description || '';
  document.getElementById('modalShort').textContent = p.description || '';
  mainImg.src = p.image;
  mainImg.alt = p.title;

  const meta = [];
  if(p.details) meta.push(`<span><strong>Matériau / appareil :</strong><br>${p.details}</span>`);
  if(p.dimensions) meta.push(`<span><strong>Dimensions :</strong><br>${p.dimensions}</span>`);
  if(p.duration) meta.push(`<span><strong>Temps :</strong><br>${p.duration}</span>`);
  document.getElementById('modalMeta').innerHTML = meta.join('');

  const strip = document.getElementById('modalPhotos');
  const photos = [{photo:p.image, caption:'Image principale'}].concat(p.photos || []);
  strip.innerHTML = photos.map(ph => `<img src="${ph.photo || ph}" alt="${ph.caption || p.title}" title="${ph.caption || ''}">`).join('');
  strip.querySelectorAll('img').forEach(img => img.addEventListener('click', () => mainImg.src = img.src));

  modal.classList.add('open');
}
function closeProjectModal(){
  document.getElementById('projectModal')?.classList.remove('open');
}
async function renderGallery(){
  const grid=document.getElementById('galleryGrid');
  if(!grid)return;
  allProjects = getItems(await fetchJson('/content/realisations.json')).map(flattenProject);
  allProjects.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
  grid.innerHTML=allProjects.map(projectCard).join('');
  setupFilters();
  setupModal();
}
async function renderFeatured(){
  const grid=document.getElementById('featuredGrid');
  if(!grid)return;
  const data=getItems(await fetchJson('/content/realisations.json')).map(flattenProject).filter(r=>r.featured).slice(0,3);
  grid.innerHTML=data.map((r,i)=>projectCard(r,i)).join('');
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
