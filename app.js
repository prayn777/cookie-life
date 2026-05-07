// ===== Supabase =====
const SUPABASE_URL = 'https://psulyrwlvcqelmqagtfj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YNe5P4CbgbdQHjS4ptr7qw_CQN1UsSr';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== 計日器 =====
function initDaysCounter() {
  const days = Math.floor((new Date() - new Date('2025-08-26')) / 86400000) + 1;
  document.getElementById('days-count').textContent = days;
}

// ===== 頭像 =====
function initAvatar() {
  document.getElementById('header-avatar').src = localStorage.getItem('cookie-avatar') || 'https://api.dicebear.com/7.x/bottts/svg?seed=cookie';
}
function changeAvatar(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('header-avatar').src = e.target.result; localStorage.setItem('cookie-avatar', e.target.result); showToast('頭像已更新 ✓'); };
  reader.readAsDataURL(file);
}

// ===== 基本資訊 =====
let editingFieldId = null;
function initPetInfo() {
  const name = localStorage.getItem('cookie-pet-name');
  const info = localStorage.getItem('cookie-pet-info');
  if (name) document.getElementById('pet-name').textContent = name;
  if (info) document.getElementById('pet-info').textContent = info;
}
function editField(fieldId) {
  editingFieldId = fieldId;
  document.getElementById('edit-modal-title').textContent = fieldId === 'pet-name' ? '編輯名字' : '編輯基本資訊';
  document.getElementById('edit-label').textContent = fieldId === 'pet-name' ? '名字' : '資訊（品種・年齡・體重）';
  document.getElementById('edit-input').value = document.getElementById(fieldId).textContent.trim();
  showModalById('modal-edit');
}
function saveEditField() {
  if (!editingFieldId) return;
  const val = document.getElementById('edit-input').value.trim(); if (!val) return;
  document.getElementById(editingFieldId).textContent = val;
  localStorage.setItem('cookie-' + editingFieldId, val);
  showToast('已儲存 ✓'); closeModal();
}

// ===== Tab 順序（長按拖曳）=====
function initTabDrag() {
  const nav = document.getElementById('tab-nav');
  const btns = () => [...nav.querySelectorAll('.tab-btn')];
  let dragSrc = null, longPressTimer = null, isDragging = false;

  nav.addEventListener('touchstart', e => {
    const btn = e.target.closest('.tab-btn'); if (!btn) return;
    longPressTimer = setTimeout(() => {
      isDragging = true;
      dragSrc = btn;
      btn.classList.add('tab-dragging');
      navigator.vibrate && navigator.vibrate(30);
    }, 400);
  }, { passive: true });

  nav.addEventListener('touchmove', e => {
    clearTimeout(longPressTimer);
    if (!isDragging || !dragSrc) return;
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.tab-btn');
    btns().forEach(b => b.classList.remove('tab-drag-over'));
    if (target && target !== dragSrc) target.classList.add('tab-drag-over');
  }, { passive: false });

  nav.addEventListener('touchend', e => {
    clearTimeout(longPressTimer);
    if (!isDragging || !dragSrc) { isDragging = false; return; }
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.tab-btn');
    btns().forEach(b => { b.classList.remove('tab-dragging'); b.classList.remove('tab-drag-over'); });
    if (target && target !== dragSrc) {
      const all = btns();
      const si = all.indexOf(dragSrc), ti = all.indexOf(target);
      if (si < ti) nav.insertBefore(dragSrc, target.nextSibling);
      else nav.insertBefore(dragSrc, target);
    }
    dragSrc = null; isDragging = false;
  });

  // Desktop drag
  btns().forEach(btn => {
    btn.setAttribute('draggable', true);
    btn.addEventListener('dragstart', e => { dragSrc = btn; btn.classList.add('tab-dragging'); e.dataTransfer.effectAllowed = 'move'; });
    btn.addEventListener('dragend', () => { btn.classList.remove('tab-dragging'); btns().forEach(b => b.classList.remove('tab-drag-over')); dragSrc = null; });
    btn.addEventListener('dragover', e => { e.preventDefault(); if (btn !== dragSrc) btn.classList.add('tab-drag-over'); });
    btn.addEventListener('dragleave', () => btn.classList.remove('tab-drag-over'));
    btn.addEventListener('drop', e => {
      e.preventDefault(); btn.classList.remove('tab-drag-over');
      if (!dragSrc || dragSrc === btn) return;
      const all = btns(), si = all.indexOf(dragSrc), ti = all.indexOf(btn);
      if (si < ti) nav.insertBefore(dragSrc, btn.nextSibling);
      else nav.insertBefore(dragSrc, btn);
    });
  });
}

// ===== Tab 切換 =====
document.getElementById('tab-nav').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn'); if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  loadTab(btn.dataset.tab);
});
function loadTab(tab) {
  ({ diary: loadDiary, weight: loadWeight, vet: loadVet, grooming: loadGrooming, medication: loadMedication, food: loadFood, clothes: loadClothes })[tab]?.();
}

// ===== Modal =====
function showModalById(id) {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById(id).classList.remove('hidden');
}
function openModal(type) {
  const today = new Date().toISOString().slice(0,10);
  const d = document.getElementById(type+'-date') || document.getElementById(type+'-start');
  if (d) d.value = today;
  if (type === 'food') { document.getElementById('food-rating').value = 0; document.querySelectorAll('#star-input .star').forEach(s => s.classList.remove('active')); }
  showModalById('modal-' + type);
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  editingFieldId = null;
}

// ===== Toast =====
function showToast(msg) {
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}

// ===== 照片上傳 =====
async function uploadPhotos(files, folder) {
  const urls = [];
  for (const file of Array.from(files)) {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await db.storage.from('photos').upload(path, file, { contentType: file.type });
    if (error) { console.error('Upload error:', error.message); continue; }
    const { data } = db.storage.from('photos').getPublicUrl(path);
    if (data?.publicUrl) urls.push(data.publicUrl);
  }
  return urls;
}

// 即時預覽
function setupPhotoPreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;
  input.addEventListener('change', () => {
    preview.innerHTML = '';
    Array.from(input.files).forEach(file => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      preview.appendChild(img);
    });
  });
}

// ===== 儲存 =====
async function saveRecord(type) {
  let record = {};
  if (type === 'diary') {
    const content = document.getElementById('diary-content').value.trim();
    if (!content) { showToast('請填寫內容'); return; }
    showToast('上傳中…');
    const files = document.getElementById('diary-photos').files;
    const urls = files.length ? await uploadPhotos(files, 'diary') : [];
    record = { date: document.getElementById('diary-date').value, milestone: document.getElementById('diary-milestone').value.trim()||null, content, note: document.getElementById('diary-note').value.trim()||null, photo_urls: urls, sort_order: Date.now() };
  } else if (type === 'weight') {
    const kg = document.getElementById('weight-kg').value; if (!kg) { showToast('請填寫體重'); return; }
    record = { date: document.getElementById('weight-date').value, weight_kg: parseFloat(kg), note: document.getElementById('weight-note').value.trim()||null };
  } else if (type === 'vet') {
    const reason = document.getElementById('vet-reason').value.trim(); if (!reason) { showToast('請填寫就診原因'); return; }
    record = { date: document.getElementById('vet-date').value, clinic: document.getElementById('vet-clinic').value.trim()||null, reason, diagnosis: document.getElementById('vet-diagnosis').value.trim()||null, cost: parseInt(document.getElementById('vet-cost').value)||null, note: document.getElementById('vet-note').value.trim()||null };
  } else if (type === 'grooming') {
    const service = document.getElementById('grooming-service').value.trim(); if (!service) { showToast('請填寫服務項目'); return; }
    record = { date: document.getElementById('grooming-date').value, shop: document.getElementById('grooming-shop').value.trim()||null, service, cost: parseInt(document.getElementById('grooming-cost').value)||null, note: document.getElementById('grooming-note').value.trim()||null };
  } else if (type === 'food') {
    const name = document.getElementById('food-name').value.trim(); if (!name) { showToast('請填寫品名'); return; }
    const rating = parseInt(document.getElementById('food-rating').value)||0; if (!rating) { showToast('請給予評分'); return; }
    showToast('上傳中…');
    const files = document.getElementById('food-photos').files;
    const urls = files.length ? await uploadPhotos(files, 'food') : [];
    record = { name, brand: document.getElementById('food-brand').value.trim()||null, review: document.getElementById('food-review').value.trim()||null, rating, price: parseInt(document.getElementById('food-price').value)||null, photo_urls: urls };
  } else if (type === 'clothes') {
    const name = document.getElementById('clothes-name').value.trim(); if (!name) { showToast('請填寫品名'); return; }
    showToast('上傳中…');
    const files = document.getElementById('clothes-photos').files;
    const urls = files.length ? await uploadPhotos(files, 'clothes') : [];
    record = { name, size: document.getElementById('clothes-size').value.trim()||null, color: document.getElementById('clothes-color').value.trim()||null, purchase_date: document.getElementById('clothes-date').value||null, price: parseInt(document.getElementById('clothes-price').value)||null, note: document.getElementById('clothes-note').value.trim()||null, photo_urls: urls };
  }
  const { error } = await db.from(type).insert(record);
  if (error) { showToast('儲存失敗：' + error.message); return; }
  showToast('已儲存 ✓'); closeModal(); loadTab(type);
}

// ===== 刪除通用 =====
async function deleteAndClose(table, id, reload) {
  if (!confirm('確定要刪除？')) return;
  await db.from(table).delete().eq('id', id);
  showToast('已刪除'); closeDetail(); reload();
}

// ===== 詳細頁 =====
let detailEditFn = null, detailDeleteFn = null;
function openDetail(html, editFn, deleteFn) {
  detailEditFn = editFn; detailDeleteFn = deleteFn;
  document.getElementById('detail-content').innerHTML = html;
  document.getElementById('detail-view').classList.remove('hidden');
  document.getElementById('detail-edit-btn').classList.toggle('hidden', !editFn);
  document.getElementById('detail-delete-btn').classList.toggle('hidden', !deleteFn);
  document.getElementById('detail-view').scrollTop = 0;
}
function closeDetail() { document.getElementById('detail-view').classList.add('hidden'); }
function triggerDetailEdit() { detailEditFn?.(); }
function triggerDetailDelete() { detailDeleteFn?.(); }

// ===== Lightbox =====
function openLightbox(src) {
  const lb = document.createElement('div'); lb.className = 'lightbox';
  lb.innerHTML = `<button class="lightbox-close" onclick="this.parentNode.remove()">✕</button><img src="${src}" />`;
  lb.onclick = e => { if (e.target === lb) lb.remove(); };
  document.body.appendChild(lb);
}

// ===== 照片 HTML helper =====
function buildPhotoGrid(urls) {
  if (!urls || !urls.length) return '';
  const items = urls.map(u => `<img class="detail-photo${urls.length===1?' single':''}" src="${u}" onclick="openLightbox('${u}')" />`).join('');
  return `<div class="detail-label">照片</div><div class="detail-photos">${items}</div>`;
}

// ===== 成長日記（日期新→舊）=====
let diaryData = [];
async function loadDiary() {
  const list = document.getElementById('diary-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  // 依日期降序（新→舊），sort_order 只作為次排序
  const { data } = await db.from('diary').select('*').order('date', { ascending: false }).order('sort_order', { ascending: false });
  diaryData = data || [];
  if (!diaryData.length) { list.innerHTML = '<div class="empty">還沒有日記，點右上角新增 🐾</div>'; return; }
  list.innerHTML = diaryData.map(r => {
    const photos = getPhotos(r);
    const thumbs = photos.slice(0,3).map(u => `<img class="tl-thumb" src="${u}" />`).join('');
    return `<div class="tl-item" onclick="openDiaryDetail('${r.id}')">
      <div class="tl-dot ${r.milestone?'milestone':''}"></div>
      <div class="tl-date">${r.date}</div>
      ${r.milestone?`<span class="tl-badge">${r.milestone}</span>`:''}
      <div class="tl-content">${r.content}</div>
      ${r.note?`<div class="tl-note">${r.note}</div>`:''}
      ${thumbs?`<div class="tl-thumb-row">${thumbs}</div>`:''}
    </div>`;
  }).join('');
}

function getPhotos(r) {
  if (Array.isArray(r.photo_urls) && r.photo_urls.length) return r.photo_urls;
  if (r.photo_url) return [r.photo_url];
  return [];
}

function openDiaryDetail(id) {
  const r = diaryData.find(d => d.id === id); if (!r) return;
  const photos = getPhotos(r);
  const html = `
    <div class="detail-date">${r.date}</div>
    ${r.milestone?`<div class="detail-badge">🏅 ${r.milestone}</div>`:''}
    <div class="detail-title">${r.content}</div>
    ${r.note?`<div class="detail-note">${r.note}</div>`:''}
    ${buildPhotoGrid(photos)}`;
  openDetail(html, () => openDiaryEditModal(r), () => deleteAndClose('diary', id, loadDiary));
}

function openDiaryEditModal(r) {
  document.getElementById('edit-diary-id').value = r.id;
  document.getElementById('edit-diary-date').value = r.date;
  document.getElementById('edit-diary-milestone').value = r.milestone||'';
  document.getElementById('edit-diary-content').value = r.content;
  document.getElementById('edit-diary-note').value = r.note||'';
  const photos = getPhotos(r);
  document.getElementById('edit-diary-existing-photos').innerHTML = photos.map(u =>
    `<div class="existing-photo-wrap" data-url="${u}"><img src="${u}" /><button class="remove-photo-btn" onclick="this.parentNode.remove()">✕</button></div>`
  ).join('');
  showModalById('modal-diary-edit');
}

async function saveEditDiary() {
  const id = document.getElementById('edit-diary-id').value;
  const content = document.getElementById('edit-diary-content').value.trim();
  if (!content) { showToast('請填寫內容'); return; }
  showToast('上傳中…');
  const existingUrls = [...document.querySelectorAll('#edit-diary-existing-photos .existing-photo-wrap')].map(el => el.dataset.url);
  const newFiles = document.getElementById('edit-diary-photos').files;
  const newUrls = newFiles.length ? await uploadPhotos(newFiles, 'diary') : [];
  const { error } = await db.from('diary').update({
    date: document.getElementById('edit-diary-date').value,
    milestone: document.getElementById('edit-diary-milestone').value.trim()||null,
    content, note: document.getElementById('edit-diary-note').value.trim()||null,
    photo_urls: [...existingUrls, ...newUrls]
  }).eq('id', id);
  if (error) { showToast('更新失敗'); return; }
  showToast('已更新 ✓'); closeModal(); closeDetail(); loadDiary();
}

// ===== 體重 =====
let weightChartInstance = null;
async function loadWeight() {
  const list = document.getElementById('weight-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('weight').select('*').order('date', { ascending: true });
  if (!data) return;
  if (data.length) {
    const ctx = document.getElementById('weightChart').getContext('2d');
    if (weightChartInstance) weightChartInstance.destroy();
    weightChartInstance = new Chart(ctx, { type: 'line', data: { labels: data.map(r=>r.date), datasets: [{ data: data.map(r=>r.weight_kg), borderColor:'#c4956a', backgroundColor:'rgba(196,149,106,0.12)', pointBackgroundColor:'#c4956a', tension:0.3, fill:true }] }, options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{grid:{color:'#f5ede0'},ticks:{color:'#9e806a',font:{size:11}}}, x:{grid:{display:false},ticks:{color:'#9e806a',font:{size:11}}} } } });
  }
  if (!data.length) { list.innerHTML = '<div class="empty">還沒有體重紀錄</div>'; return; }
  list.innerHTML = [...data].reverse().map(r => `<div class="record-card"><button class="card-delete" onclick="delSimple('weight','${r.id}',loadWeight)">✕</button><div class="card-date">${r.date}</div><div class="card-title">${r.weight_kg} kg</div>${r.note?`<div class="card-sub">${r.note}</div>`:''}</div>`).join('');
}

// ===== 獸醫 =====
async function loadVet() {
  const list = document.getElementById('vet-list'); list.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('vet').select('*').order('date', { ascending: false });
  if (!data||!data.length) { list.innerHTML = '<div class="empty">還沒有獸醫紀錄 🏥</div>'; return; }
  list.innerHTML = data.map(r => `<div class="record-card"><button class="card-delete" onclick="delSimple('vet','${r.id}',loadVet)">✕</button><div class="card-date">${r.date}</div><div class="card-title">${r.reason}</div><div class="card-pills">${r.clinic?`<span class="pill blue">${r.clinic}</span>`:''}${r.cost?`<span class="pill amber">NT$${r.cost.toLocaleString()}</span>`:''}</div>${r.diagnosis?`<div class="card-sub" style="margin-top:8px">${r.diagnosis}</div>`:''}</div>`).join('');
}

// ===== 洗澡 =====
async function loadGrooming() {
  const list = document.getElementById('grooming-list'); list.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('grooming').select('*').order('date', { ascending: false });
  if (!data||!data.length) { list.innerHTML = '<div class="empty">還沒有洗澡紀錄 🛁</div>'; return; }
  list.innerHTML = data.map(r => `<div class="record-card"><button class="card-delete" onclick="delSimple('grooming','${r.id}',loadGrooming)">✕</button><div class="card-date">${r.date}</div><div class="card-title">${r.service}</div><div class="card-pills">${r.shop?`<span class="pill blue">${r.shop}</span>`:''}${r.cost?`<span class="pill amber">NT$${r.cost.toLocaleString()}</span>`:''}</div></div>`).join('');
}

async function delSimple(table, id, reload) {
  if (!confirm('確定要刪除？')) return;
  await db.from(table).delete().eq('id', id);
  showToast('已刪除'); reload();
}

// ===== 用藥（每組一個編輯按鈕，點進去編輯詳細）=====
let medData = [];
async function loadMedication() {
  const wrap = document.getElementById('medication-table'); wrap.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('medication').select('*').order('date', { ascending: true });
  medData = data || [];
  if (!medData.length) { wrap.innerHTML = '<div class="empty">還沒有用藥紀錄 💊</div>'; return; }
  const today = new Date(); today.setHours(0,0,0,0);
  const groups = {};
  medData.forEach(r => { if (!groups[r.med_name]) groups[r.med_name] = []; groups[r.med_name].push(r); });

  wrap.innerHTML = Object.entries(groups).map(([name, records]) => {
    const diffs = records.slice(1).map((r,i) => Math.round((new Date(r.date)-new Date(records[i].date))/2592000000));
    const avg = diffs.length ? Math.round(diffs.reduce((a,b)=>a+b,0)/diffs.length) : 1;
    const cycleLabel = avg >= 2 ? `每 ${avg} 個月` : '每個月';
    const dots = records.map(r => {
      const d = new Date(r.date); d.setHours(0,0,0,0);
      const cls = r.done ? 'done' : d < today ? 'overdue' : '';
      const icon = r.done ? '✓' : d < today ? '!' : '';
      return `<div class="med-dot-wrap">
        <div class="med-dot ${cls}" onclick="toggleMed('${r.id}')" title="${r.date}">${icon}</div>
        <div class="med-dot-date">${(d.getMonth()+1)}/${d.getDate()}</div>
      </div>`;
    }).join('');
    return `<div class="med-group">
      <div class="med-group-header">
        <span class="med-group-name">💊 ${name}</span>
        <div class="med-group-right">
          <span class="med-group-cycle">${cycleLabel}</span>
          <button class="med-edit-group-btn" onclick="openMedGroupEdit('${name}')">編輯</button>
        </div>
      </div>
      <div class="med-dots">${dots}</div>
    </div>`;
  }).join('');
}

async function toggleMed(id) {
  const r = medData.find(m => m.id === id); if (!r) return;
  await db.from('medication').update({ done: !r.done }).eq('id', id);
  loadMedication();
}

function openMedGroupEdit(name) {
  const records = medData.filter(m => m.med_name === name);
  const today = new Date(); today.setHours(0,0,0,0);
  document.getElementById('med-edit-title').textContent = `💊 ${name} — 編輯排程`;
  document.getElementById('med-edit-content').innerHTML = `
    <div class="med-edit-list">
      ${records.map(r => {
        const d = new Date(r.date); d.setHours(0,0,0,0);
        const cls = r.done ? 'done' : d < today ? 'overdue' : '';
        const icon = r.done ? '✓' : d < today ? '!' : '';
        return `<div class="med-edit-row">
          <div class="med-dot-sm ${cls}" onclick="toggleMedFromEdit('${r.id}')">${icon}</div>
          <span class="med-edit-date">${r.date}</span>
          <div class="med-edit-actions">
            <button class="med-sm-btn" onclick="openMedSingleEdit('${r.id}','${r.date}')">✏️ 日期</button>
            <button class="med-sm-btn del" onclick="deleteMedFromEdit('${r.id}','${name}')">刪除</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  document.getElementById('med-edit-view').classList.remove('hidden');
}

function closeMedEdit() { document.getElementById('med-edit-view').classList.add('hidden'); }

async function toggleMedFromEdit(id) {
  const r = medData.find(m => m.id === id); if (!r) return;
  await db.from('medication').update({ done: !r.done }).eq('id', id);
  await loadMedication();
  openMedGroupEdit(r.med_name);
}

function openMedSingleEdit(id, date) {
  document.getElementById('edit-med-id').value = id;
  document.getElementById('edit-med-date').value = date;
  showModalById('modal-med-single');
}

async function saveMedSingle() {
  const id = document.getElementById('edit-med-id').value;
  const date = document.getElementById('edit-med-date').value;
  const r = medData.find(m => m.id === id);
  await db.from('medication').update({ date }).eq('id', id);
  showToast('已更新 ✓'); closeModal();
  await loadMedication();
  if (r) openMedGroupEdit(r.med_name);
}

async function deleteMedFromEdit(id, name) {
  if (!confirm('確定要刪除這筆排程？')) return;
  await db.from('medication').delete().eq('id', id);
  showToast('已刪除');
  await loadMedication();
  const remaining = medData.filter(m => m.med_name === name);
  if (remaining.length) openMedGroupEdit(name);
  else closeMedEdit();
}

async function saveMedSchedule() {
  const name = document.getElementById('medication-name').value.trim(); if (!name) { showToast('請填寫藥品名稱'); return; }
  const start = new Date(document.getElementById('medication-start').value);
  const cycle = parseInt(document.getElementById('medication-cycle').value);
  const count = parseInt(document.getElementById('medication-count').value)||12;
  const records = Array.from({length:count},(_,i)=>{ const d=new Date(start); d.setMonth(d.getMonth()+i*cycle); return {med_name:name,date:d.toISOString().slice(0,10),done:false}; });
  const { error } = await db.from('medication').insert(records);
  if (error) { showToast('儲存失敗：'+error.message); return; }
  showToast(`已新增 ${count} 筆排程 ✓`); closeModal(); loadMedication();
}

// ===== 零食飼料 =====
let foodData = [];
async function loadFood() {
  const list = document.getElementById('food-list'); list.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('food').select('*').order('created_at', { ascending: false });
  foodData = data || [];
  if (!foodData.length) { list.innerHTML = '<div class="empty">還沒有紀錄 🍖</div>'; return; }
  list.innerHTML = foodData.map(r => {
    const photos = getPhotos(r);
    const thumb = photos[0] ? `<img class="food-photo-thumb" src="${photos[0]}" />` : `<div class="food-no-photo">🍖</div>`;
    return `<div class="food-card" onclick="openFoodDetail('${r.id}')">${thumb}<div class="food-card-body"><div class="food-name">${r.name}</div>${r.brand?`<div class="food-brand">${r.brand}</div>`:''}<div class="food-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div></div></div>`;
  }).join('');
}

function openFoodDetail(id) {
  const r = foodData.find(f => f.id === id); if (!r) return;
  const photos = getPhotos(r);
  const html = `
    <div class="detail-title">${r.name}</div>
    ${r.brand?`<div class="detail-date">${r.brand}</div>`:''}
    <div class="detail-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
    ${r.review?`<div class="detail-body">${r.review}</div>`:''}
    ${r.price?`<span class="pill amber" style="display:inline-block;margin-bottom:12px">NT$${r.price.toLocaleString()}</span>`:''}
    ${buildPhotoGrid(photos)}`;
  openDetail(html, () => openFoodEditModal(r), () => deleteAndClose('food', id, loadFood));
}

function openFoodEditModal(r) {
  document.getElementById('edit-food-id').value = r.id;
  document.getElementById('edit-food-name').value = r.name;
  document.getElementById('edit-food-brand').value = r.brand||'';
  document.getElementById('edit-food-review').value = r.review||'';
  document.getElementById('edit-food-price').value = r.price||'';
  document.getElementById('edit-food-rating').value = r.rating||0;
  document.querySelectorAll('.edit-star').forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= r.rating));
  const photos = getPhotos(r);
  document.getElementById('edit-food-existing').innerHTML = photos.map(u => `<div class="existing-photo-wrap" data-url="${u}"><img src="${u}" /><button class="remove-photo-btn" onclick="this.parentNode.remove()">✕</button></div>`).join('');
  showModalById('modal-food-edit');
}

async function saveFoodEdit() {
  const id = document.getElementById('edit-food-id').value;
  const name = document.getElementById('edit-food-name').value.trim(); if (!name) { showToast('請填寫品名'); return; }
  showToast('上傳中…');
  const existingUrls = [...document.querySelectorAll('#edit-food-existing .existing-photo-wrap')].map(el => el.dataset.url);
  const newFiles = document.getElementById('edit-food-photos').files;
  const newUrls = newFiles.length ? await uploadPhotos(newFiles, 'food') : [];
  const { error } = await db.from('food').update({ name, brand: document.getElementById('edit-food-brand').value.trim()||null, review: document.getElementById('edit-food-review').value.trim()||null, rating: parseInt(document.getElementById('edit-food-rating').value)||0, price: parseInt(document.getElementById('edit-food-price').value)||null, photo_urls: [...existingUrls,...newUrls] }).eq('id', id);
  if (error) { showToast('更新失敗'); return; }
  showToast('已更新 ✓'); closeModal(); closeDetail(); loadFood();
}

// ===== 裝備 =====
let clothesData = [];
async function loadClothes() {
  const list = document.getElementById('clothes-list'); list.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('clothes').select('*').order('purchase_date', { ascending: false });
  clothesData = data || [];
  if (!clothesData.length) { list.innerHTML = '<div class="empty">還沒有裝備紀錄 👕</div>'; return; }
  list.innerHTML = clothesData.map(r => {
    const photos = getPhotos(r);
    const thumb = photos[0] ? `<img class="clothes-photo-thumb" src="${photos[0]}" />` : `<div class="clothes-no-photo">👕</div>`;
    return `<div class="clothes-card" onclick="openClothesDetail('${r.id}')">${thumb}<div class="clothes-card-body"><div class="clothes-name">${r.name}</div>${r.price?`<div class="clothes-price">NT$${r.price.toLocaleString()}</div>`:''}</div></div>`;
  }).join('');
}

function openClothesDetail(id) {
  const r = clothesData.find(c => c.id === id); if (!r) return;
  const photos = getPhotos(r);
  const html = `
    <div class="detail-title">${r.name}</div>
    <div class="detail-pills">
      ${r.size?`<span class="pill">尺寸 ${r.size}</span>`:''}
      ${r.color?`<span class="pill">${r.color}</span>`:''}
      ${r.purchase_date?`<span class="pill">${r.purchase_date}</span>`:''}
      ${r.price?`<span class="pill amber">NT$${r.price.toLocaleString()}</span>`:''}
      ${r.note?`<span class="pill pink">${r.note}</span>`:''}
    </div>
    ${buildPhotoGrid(photos)}`;
  openDetail(html, () => openClothesEditModal(r), () => deleteAndClose('clothes', id, loadClothes));
}

function openClothesEditModal(r) {
  document.getElementById('edit-clothes-id').value = r.id;
  document.getElementById('edit-clothes-name').value = r.name;
  document.getElementById('edit-clothes-size').value = r.size||'';
  document.getElementById('edit-clothes-color').value = r.color||'';
  document.getElementById('edit-clothes-date').value = r.purchase_date||'';
  document.getElementById('edit-clothes-price').value = r.price||'';
  document.getElementById('edit-clothes-note').value = r.note||'';
  const photos = getPhotos(r);
  document.getElementById('edit-clothes-existing').innerHTML = photos.map(u => `<div class="existing-photo-wrap" data-url="${u}"><img src="${u}" /><button class="remove-photo-btn" onclick="this.parentNode.remove()">✕</button></div>`).join('');
  showModalById('modal-clothes-edit');
}

async function saveClothesEdit() {
  const id = document.getElementById('edit-clothes-id').value;
  const name = document.getElementById('edit-clothes-name').value.trim(); if (!name) { showToast('請填寫品名'); return; }
  showToast('上傳中…');
  const existingUrls = [...document.querySelectorAll('#edit-clothes-existing .existing-photo-wrap')].map(el => el.dataset.url);
  const newFiles = document.getElementById('edit-clothes-photos').files;
  const newUrls = newFiles.length ? await uploadPhotos(newFiles, 'clothes') : [];
  const { error } = await db.from('clothes').update({ name, size: document.getElementById('edit-clothes-size').value.trim()||null, color: document.getElementById('edit-clothes-color').value.trim()||null, purchase_date: document.getElementById('edit-clothes-date').value||null, price: parseInt(document.getElementById('edit-clothes-price').value)||null, note: document.getElementById('edit-clothes-note').value.trim()||null, photo_urls: [...existingUrls,...newUrls] }).eq('id', id);
  if (error) { showToast('更新失敗'); return; }
  showToast('已更新 ✓'); closeModal(); closeDetail(); loadClothes();
}

// ===== 星星 =====
document.querySelectorAll('#star-input .star').forEach(star => {
  star.addEventListener('click', () => {
    const val = parseInt(star.dataset.val);
    document.getElementById('food-rating').value = val;
    document.querySelectorAll('#star-input .star').forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= val));
  });
});
document.querySelectorAll('.edit-star').forEach(star => {
  star.addEventListener('click', () => {
    const val = parseInt(star.dataset.val);
    document.getElementById('edit-food-rating').value = val;
    document.querySelectorAll('.edit-star').forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= val));
  });
});

// ===== 即時預覽 =====
['diary-photos:diary-photo-preview', 'food-photos:food-photo-preview', 'clothes-photos:clothes-photo-preview'].forEach(pair => {
  const [inputId, previewId] = pair.split(':');
  const input = document.getElementById(inputId);
  if (input) input.addEventListener('change', () => {
    const preview = document.getElementById(previewId);
    preview.innerHTML = '';
    Array.from(input.files).forEach(file => { const img = document.createElement('img'); img.src = URL.createObjectURL(file); preview.appendChild(img); });
  });
});

// ===== 匯入歷史資料 =====
async function importSpreadsheetData() {
  const { count } = await db.from('diary').select('*', { count: 'exact', head: true });
  if (count > 0) return;
  showToast('正在匯入歷史資料…');
  await db.from('diary').insert([
    {date:'2025-08-26',milestone:'開始中途',content:'帶去加恩檢查＋血檢，結果正常，醫生目測約 5 歲',note:'量體重約 17kg',sort_order:1,photo_urls:[]},
    {date:'2025-08-26',content:'忍了三天，發現會定點上廁所',sort_order:2,photo_urls:[]},
    {date:'2025-08-26',content:'越來越親，居然會握手甚至換手',sort_order:3,photo_urls:[]},
    {date:'2025-09-03',content:'已經會出來吃小零食了',note:'吃零食吃得很小心翼翼',sort_order:4,photo_urls:[]},
    {date:'2025-09-08',content:'開始練習帶出辦公室（很害怕）',sort_order:5,photo_urls:[]},
    {date:'2025-09-18',content:'開始習慣在戶外走走',sort_order:6,photo_urls:[]},
    {date:'2025-09-25',content:'第一次在室外大便',sort_order:7,photo_urls:[]},
    {date:'2025-09-27',milestone:'露營 No.1',content:'第一次去露營過夜、踩溪水 ＠麒麟山露營區',note:'表現非常好，我們很驚訝，甚至一臉老熟的樣子，晚上睡過夜也沒問題、踩水也不會表現害怕',sort_order:8,photo_urls:[]},
    {date:'2025-10-08',content:'發現是不可多得的寶藏小狗',sort_order:9,photo_urls:[]},
    {date:'2025-10-13',milestone:'確定領養！',content:'我們確定領養 COOKIE 了！',sort_order:10,photo_urls:[]},
    {date:'2025-10-15',content:'第一次睡露營車過夜',sort_order:11,photo_urls:[]},
    {date:'2025-10-24',content:'第一次下水游泳 ＠南投集集',note:'居然會游泳，真是太可愛了',sort_order:12,photo_urls:[]},
    {date:'2025-11-07',content:'開始帶回家，暫時綁在沙發區',sort_order:13,photo_urls:[]},
    {date:'2025-11-15',milestone:'露營 No.2',content:'一起去山川祭，當快樂的露營小狗',sort_order:14,photo_urls:[]},
    {date:'2025-11-20',content:'去艾奇德幼兒園教狗狗互動',note:'原本不喜歡小孩的 Cookie，居然可以到幼稚園給小朋友摸摸，非常厲害',sort_order:15,photo_urls:[]},
    {date:'2025-11-29',milestone:'露營 No.3',content:'一起去福爾摩沙越野跑，很多美女欣賞 Cookie',sort_order:16,photo_urls:[]},
    {date:'2025-12-02',content:'收到乾媽的一整箱高級衣服',sort_order:17,photo_urls:[]},
    {date:'2025-12-27',content:'第一次回高雄婆婆家',note:'發現很喜歡睡床，還去大帑殿 KTV',sort_order:18,photo_urls:[]},
    {date:'2026-02-18',content:'回婆婆家住 14 天（出國）',sort_order:19,photo_urls:[]},
    {date:'2026-03-07',milestone:'露營 No.4',content:'一起去天時農莊 Hi! HILLEBERG 團露',sort_order:20,photo_urls:[]},
    {date:'2026-03-28',milestone:'露營 No.5',content:'第一次野營 ＠高島縱走',note:'居然走丟了一個半小時，真的嚇死我們了',sort_order:21,photo_urls:[]},
    {date:'2026-05-01',content:'芳苑海邊睡露營車',sort_order:22,photo_urls:[]},
  ]);
  await db.from('medication').insert([
    {date:'2025-12-26',med_name:'免操心',done:true},{date:'2025-12-26',med_name:'一錠除',done:true},
    {date:'2026-01-26',med_name:'免操心',done:true},{date:'2026-02-26',med_name:'免操心',done:true},
    {date:'2026-03-26',med_name:'免操心',done:true},{date:'2026-03-26',med_name:'一錠除',done:true},
    {date:'2026-04-26',med_name:'免操心',done:false},{date:'2026-05-05',med_name:'免操心',done:true},
    {date:'2026-06-05',med_name:'免操心',done:false},{date:'2026-06-26',med_name:'一錠除',done:false},
    {date:'2026-07-05',med_name:'免操心',done:false},{date:'2026-08-05',med_name:'免操心',done:false},
    {date:'2026-09-05',med_name:'免操心',done:false},{date:'2026-09-26',med_name:'一錠除',done:false},
    {date:'2026-10-05',med_name:'免操心',done:false},{date:'2026-11-05',med_name:'免操心',done:false},
    {date:'2026-12-05',med_name:'免操心',done:false},{date:'2026-12-26',med_name:'一錠除',done:false},
  ]);
  await db.from('vet').insert([{date:'2025-08-26',clinic:'加恩動物醫院',reason:'初診檢查＋血檢',diagnosis:'結果正常，醫生目測約 5 歲'}]);
  await db.from('weight').insert([{date:'2025-08-26',weight_kg:17.0,note:'加恩動物醫院量'}]);
  await db.from('clothes').insert([
    {name:'HURTTA 動能 Rover 胸背帶',size:'55-70',color:'檜木橘',purchase_date:'2025-10-20',price:2350,photo_urls:[]},
    {name:'HURTTA 熱能科技中層保暖背心',size:'50',color:'冰河灰',purchase_date:'2025-12-14',price:2350,note:'土媽送',photo_urls:[]},
    {name:'HURTTA 防潑水機能四腳保暖衣',size:'50',color:'冰河灰',purchase_date:'2025-12-14',price:4050,note:'土媽送',photo_urls:[]},
    {name:'HURTTA 極輕量 Mudventure 機能防水風雨衣 ECO',size:'50',color:'雪松',purchase_date:'2026-05-05',price:3990,photo_urls:[]},
    {name:'HURTTA 動能 Rover 胸背帶',size:'55-70',color:'玄武黑',purchase_date:'2026-05-05',price:2350,note:'咬爆前一個，重買新的',photo_urls:[]},
  ]);
  showToast('歷史資料匯入完成 ✓'); loadDiary();
}

// ===== 啟動 =====
initDaysCounter();
initAvatar();
initPetInfo();
initTabDrag();
loadDiary();
importSpreadsheetData();
