
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
  return `<article class="gallery-item" data-index="${index}" data-cat="${r.category}" data-search="${(r.title+' '+r.description+' '+r.details).toLowerCase()}">
    <img src="${r.image}" alt="${r.title}" title="Cliquer pour agrandir">
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
    return ph;
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
    const index = Number(card.dataset.index);
    const p = prepareProject(index);

    // Direct click on image = full screen photo
    if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
      openLightbox();
      return;
    }

    // Click on text/card = detail sheet
    openProjectModal(p);
  });
}
function setModalPhoto(index) {
  if (!currentPhotos.length) return;
  currentPhotoIndex = (index + currentPhotos.length) % currentPhotos.length;
  const ph = currentPhotos[currentPhotoIndex];
  const mainImg = document.getElementById('modalMainImage');
  if (mainImg) {
    mainImg.src = ph.photo;
    mainImg.alt = ph.caption || "";
  }
  document.querySelectorAll('#modalPhotos img').forEach((img, i) => img.classList.toggle('active', i === currentPhotoIndex));
}
function openProjectModal(p) {
  const modal = document.getElementById('projectModal');
  if(!modal) return;

  document.getElementById('modalTitle').textContent = `${p.icon || ''} ${p.title}`;
  document.getElementById('modalDescription').textContent = p.long_description || p.description || '';
  document.getElementById('modalShort').textContent = p.description || '';

  const meta = [];
  if(p.details) meta.push(`<span><strong>Matériau / appareil :</strong><br>${p.details}</span>`);
  if(p.dimensions) meta.push(`<span><strong>Dimensions :</strong><br>${p.dimensions}</span>`);
  if(p.duration) meta.push(`<span><strong>Temps :</strong><br>${p.duration}</span>`);
  document.getElementById('modalMeta').innerHTML = meta.join('');

  const strip = document.getElementById('modalPhotos');
  strip.innerHTML = currentPhotos.map((ph, i) => `<img src="${ph.photo}" alt="${ph.caption || p.title}" title="${ph.caption || ''}" data-photo="${i}">`).join('');
  strip.querySelectorAll('img').forEach(img => img.addEventListener('click', () => setModalPhoto(Number(img.dataset.photo))));

  setModalPhoto(0);
  modal.classList.add('open');
}
function closeProjectModal(){
  document.getElementById('projectModal')?.classList.remove('open');
}
function prevModalPhoto(){ setModalPhoto(currentPhotoIndex - 1); }
function nextModalPhoto(){ setModalPhoto(currentPhotoIndex + 1); }

function openLightbox() {
  if (!currentPhotos.length) return;
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImage');
  const cap = document.getElementById('lightboxCaption');
  if(!lb || !img) return;
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
  setModalPhoto(currentPhotoIndex);
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
function setupGlobalPhotoTools(){
  document.getElementById('modalMainImage')?.addEventListener('click', openLightbox);

  const modal = document.getElementById('projectModal');
  modal?.addEventListener('click', e => {
    if(e.target.id === 'projectModal') closeProjectModal();
  });

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

  document.addEventListener('keydown', e => {
    const modalOpen = document.getElementById('projectModal')?.classList.contains('open');
    const lightboxOpen = document.getElementById('lightbox')?.classList.contains('open');
    if(e.key === 'Escape') lightboxOpen ? closeLightbox() : closeProjectModal();
    if(e.key === 'ArrowLeft') lightboxOpen ? prevLightbox() : (modalOpen && prevModalPhoto());
    if(e.key === 'ArrowRight') lightboxOpen ? nextLightbox() : (modalOpen && nextModalPhoto());
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
