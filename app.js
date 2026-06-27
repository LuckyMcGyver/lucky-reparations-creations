
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
  return {
    title: p.title || "Réalisation",
    category: p.category || "creations",
    icon: p.icon || "",
    description: p.description || "",
    long_description: p.long_description || "",
    image: p.image || "/assets/hero.png",
    photos: p.photos || [],
    details: p.details || "",
    dimensions: p.dimensions || "",
    duration: p.duration || "",
    featured: !!p.featured,
    date: p.date || ""
  };
}

let allProjects = [];
let currentProjectIndex = 0;
let currentPhotoIndex = 0;
let currentPhotos = [];
let lightboxZoom = 1;

function isRecent(dateValue) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;
  return (Date.now() - d.getTime()) / 86400000 <= 30;
}
function projectCard(r, index) {
  const isNew = isRecent(r.date);
  return `<article class="gallery-item" data-index="${index}" data-cat="${r.category}" data-search="${(r.title+' '+r.description+' '+r.details).toLowerCase()}" title="Cliquer pour ouvrir l'image">
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
function normalizePhotos(p) {
  return [{photo:p.image, caption:'Image principale'}].concat((p.photos || []).map(ph => {
    if (typeof ph === "string") return {photo: ph, caption: ""};
    return ph || {};
  })).filter(ph => ph.photo);
}
function prepareProject(index) {
  currentProjectIndex = index;
  const p = allProjects[index];
  currentPhotos = normalizePhotos(p);
  currentPhotoIndex = 0;
  return p;
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
function setupGalleryClicks(){
  const grid = document.getElementById('galleryGrid');
  if(!grid) return;
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.gallery-item');
    if(!card) return;
    prepareProject(Number(card.dataset.index));
    openLightbox();
  });
}
function openLightbox() {
  if (!currentPhotos.length) return;

  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.id = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" onclick="closeLightbox()" aria-label="Fermer">×</button>
      <button class="lightbox-prev" onclick="prevLightbox()" aria-label="Photo précédente">‹</button>
      <img id="lightboxImage" src="" alt="">
      <button class="lightbox-next" onclick="nextLightbox()" aria-label="Photo suivante">›</button>
      <button class="lightbox-zoom" onclick="toggleLightboxZoom()">Zoom</button>
      <div class="lightbox-caption" id="lightboxCaption"></div>`;
    document.body.appendChild(lb);
    setupLightboxEvents();
  }

  const img = document.getElementById('lightboxImage');
  const cap = document.getElementById('lightboxCaption');
  const ph = currentPhotos[currentPhotoIndex];
  img.src = ph.photo;
  img.alt = ph.caption || "";
  cap.textContent = ph.caption || allProjects[currentProjectIndex]?.title || "";
  lightboxZoom = 1;
  img.style.transform = "scale(1)";
  img.classList.remove("zoomed");
  lb.classList.add('open');
}
function closeLightbox(){
  document.getElementById('lightbox')?.classList.remove('open');
}
function setLightboxPhoto(index) {
  if (!currentPhotos.length) return;
  currentPhotoIndex = (index + currentPhotos.length) % currentPhotos.length;
  openLightbox();
}
function prevLightbox(){ setLightboxPhoto(currentPhotoIndex - 1); }
function nextLightbox(){ setLightboxPhoto(currentPhotoIndex + 1); }
function toggleLightboxZoom(){
  lightboxZoom = lightboxZoom === 1 ? 2 : 1;
  const img = document.getElementById('lightboxImage');
  if(!img) return;
  img.style.transform = `scale(${lightboxZoom})`;
  img.classList.toggle("zoomed", lightboxZoom > 1);
}
function setupLightboxEvents(){
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImage');
  lb?.addEventListener('click', e => {
    if(e.target.id === 'lightbox') closeLightbox();
  });
  img?.addEventListener('dblclick', toggleLightboxZoom);
  img?.addEventListener('wheel', e => {
    e.preventDefault();
    lightboxZoom += e.deltaY < 0 ? .15 : -.15;
    lightboxZoom = Math.max(1, Math.min(3, lightboxZoom));
    img.style.transform = `scale(${lightboxZoom})`;
    img.classList.toggle("zoomed", lightboxZoom > 1);
  }, {passive:false});
  let startX = null;
  lb?.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
  lb?.addEventListener('touchend', e => {
    if(startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if(Math.abs(dx) > 50) dx > 0 ? prevLightbox() : nextLightbox();
    startX = null;
  }, {passive:true});
}
function setupGlobalPhotoTools(){
  setupLightboxEvents();
  document.addEventListener('keydown', e => {
    const lightboxOpen = document.getElementById('lightbox')?.classList.contains('open');
    if(e.key === 'Escape' && lightboxOpen) closeLightbox();
    if(e.key === 'ArrowLeft' && lightboxOpen) prevLightbox();
    if(e.key === 'ArrowRight' && lightboxOpen) nextLightbox();
  });
}
async function renderGallery(){
  const grid=document.getElementById('galleryGrid');
  if(!grid)return;
  allProjects = getItems(await fetchJson('/content/realisations.json')).map(flattenProject);
  allProjects.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
  grid.innerHTML=allProjects.map(projectCard).join('');
  setupFilters();
  setupGalleryClicks();
  setupGlobalPhotoTools();
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
