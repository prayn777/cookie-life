// ===== Supabase =====
const SUPABASE_URL = 'https://psulyrwlvcqelmqagtfj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YNe5P4CbgbdQHjS4ptr7qw_CQN1UsSr';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== 計日器 =====
function initDaysCounter() {
  const start = new Date('2025-08-26');
  const today = new Date();
  today.setHours(0,0,0,0);
  const days = Math.floor((today - start) / (1000*60*60*24)) + 1;
  document.getElementById('days-count').textContent = days;
}

// ===== 頭像 =====
function initAvatar() {
  const saved = localStorage.getItem('cookie-avatar');
  document.getElementById('header-avatar').src = saved || 'https://api.dicebear.com/7.x/bottts/svg?seed=cookie';
}
function changeAvatar(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('header-avatar').src = e.target.result;
    localStorage.setItem('cookie-avatar', e.target.result);
    showToast('頭像已更新 ✓');
  };
  reader.readAsDataURL(file);
}

// ===== 基本資訊編輯 =====
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
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-edit').classList.remove('hidden');
  setTimeout(() => document.getElementById('edit-input').focus(), 100);
}
function saveEditField() {
  if (!editingFieldId) return;
  const val = document.getElementById('edit-input').value.trim();
  if (!val) return;
  document.getElementById(editingFieldId).textContent = val;
  localStorage.setItem('cookie-' + editingFieldId, val);
  showToast('已儲存 ✓');
  closeModal();
}

// ===== Tab =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
    loadTab(tab);
  });
});
function loadTab(tab) {
  const fn = { diary: loadDiary, weight: loadWeight, vet: loadVet, grooming: loadGrooming, medication: loadMedication, food: loadFood, clothes: loadClothes };
  if (fn[tab]) fn[tab]();
}

// ===== Modal =====
function openModal(type) {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-' + type).classList.remove('hidden');
  const today = new Date().toISOString().slice(0, 10);
  const dateField = document.getElementById(type + '-date') || document.getElementById(type + '-start');
  if (dateField) dateField.value = today;
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  editingFieldId = null;
}

// ===== Toast =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}

// ===== 照片上傳 =====
async function uploadPhoto(file, bucket) {
  if (!file) return null;
  const ext = file.name.split('.').pop();
  const filename = `${bucket}/${Date.now()}.${ext}`;
  const { error } = await db.storage.from('photos').upload(filename, file);
  if (error) { console.error(error); return null; }
  return db.storage.from('photos').getPublicUrl(filename).data.publicUrl;
}

// ===== 儲存 =====
async function saveRecord(type) {
  let record = {};
  if (type === 'diary') {
    const content = document.getElementById('diary-content').value.trim();
    if (!content) { showToast('請填寫內容'); return; }
    const photoUrl = await uploadPhoto(document.getElementById('diary-photo').files[0], 'diary');
    record = { date: document.getElementById('diary-date').value, milestone: document.getElementById('diary-milestone').value.trim() || null, content, note: document.getElementById('diary-note').value.trim() || null, photo_url: photoUrl };
  } else if (type === 'weight') {
    const kg = document.getElementById('weight-kg').value;
    if (!kg) { showToast('請填寫體重'); return; }
    record = { date: document.getElementById('weight-date').value, weight_kg: parseFloat(kg), note: document.getElementById('weight-note').value.trim() || null };
  } else if (type === 'vet') {
    const reason = document.getElementById('vet-reason').value.trim();
    if (!reason) { showToast('請填寫就診原因'); return; }
    record = { date: document.getElementById('vet-date').value, clinic: document.getElementById('vet-clinic').value.trim() || null, reason, diagnosis: document.getElementById('vet-diagnosis').value.trim() || null, cost: parseInt(document.getElementById('vet-cost').value) || null, note: document.getElementById('vet-note').value.trim() || null };
  } else if (type === 'grooming') {
    const service = document.getElementById('grooming-service').value.trim();
    if (!service) { showToast('請填寫服務項目'); return; }
    record = { date: document.getElementById('grooming-date').value, shop: document.getElementById('grooming-shop').value.trim() || null, service, cost: parseInt(document.getElementById('grooming-cost').value) || null, note: document.getElementById('grooming-note').value.trim() || null };
  } else if (type === 'food') {
    const name = document.getElementById('food-name').value.trim();
    if (!name) { showToast('請填寫品名'); return; }
    const rating = parseInt(document.getElementById('food-rating').value) || 0;
    if (!rating) { showToast('請給予評分'); return; }
    const photoUrl = await uploadPhoto(document.getElementById('food-photo').files[0], 'food');
    record = { name, brand: document.getElementById('food-brand').value.trim() || null, review: document.getElementById('food-review').value.trim() || null, rating, price: parseInt(document.getElementById('food-price').value) || null, photo_url: photoUrl };
  } else if (type === 'clothes') {
    const name = document.getElementById('clothes-name').value.trim();
    if (!name) { showToast('請填寫品名'); return; }
    record = { name, size: document.getElementById('clothes-size').value.trim() || null, color: document.getElementById('clothes-color').value.trim() || null, purchase_date: document.getElementById('clothes-date').value || null, price: parseInt(document.getElementById('clothes-price').value) || null, note: document.getElementById('clothes-note').value.trim() || null };
  }
  const { error } = await db.from(type === 'food' ? 'food' : type).insert(record);
  if (error) { showToast('儲存失敗：' + error.message); return; }
  showToast('已儲存 ✓');
  closeModal();
  loadTab(type);
}

// ===== 刪除 =====
async function deleteRecord(table, id, reloadFn) {
  if (!confirm('確定要刪除這筆紀錄嗎？')) return;
  await db.from(table).delete().eq('id', id);
  showToast('已刪除');
  reloadFn();
}

// ===== 成長日記 =====
async function loadDiary() {
  const list = document.getElementById('diary-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data, error } = await db.from('diary').select('*').order('date', { ascending: false });
  if (error || !data) { list.innerHTML = '<div class="empty">載入失敗</div>'; return; }
  if (!data.length) { list.innerHTML = '<div class="empty">還沒有日記，點右上角新增 🐾</div>'; return; }
  list.innerHTML = data.map(r => `
    <div class="tl-item">
      <div class="tl-dot ${r.milestone ? 'milestone' : ''}"></div>
      <div class="tl-actions">
        <button class="tl-btn" onclick="openEditDiary('${r.id}','${(r.date||'')}','${escHtml(r.milestone||'')}','${escHtml(r.content||'')}','${escHtml(r.note||'')}','${r.photo_url||''}')">✏️</button>
        <button class="tl-btn del" onclick="deleteRecord('diary','${r.id}',loadDiary)">✕</button>
      </div>
      <div class="tl-date">${r.date}</div>
      ${r.milestone ? `<span class="tl-badge">${r.milestone}</span>` : ''}
      <div class="tl-content">${r.content}</div>
      ${r.note ? `<div class="tl-note">${r.note}</div>` : ''}
      ${r.photo_url ? `<img class="tl-photo" src="${r.photo_url}" alt="照片" />` : ''}
    </div>
  `).join('');
}

function escHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

function openEditDiary(id, date, milestone, content, note, photoUrl) {
  document.getElementById('edit-diary-id').value = id;
  document.getElementById('edit-diary-date').value = date;
  document.getElementById('edit-diary-milestone').value = milestone;
  document.getElementById('edit-diary-content').value = content;
  document.getElementById('edit-diary-note').value = note;
  const preview = document.getElementById('edit-diary-photo-preview');
  preview.innerHTML = photoUrl ? `<img class="photo-thumb" src="${photoUrl}" alt="現有照片" /><p style="font-size:11px;color:var(--text-muted);margin-top:4px">上傳新照片將取代此圖</p>` : '';
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-diary-edit').classList.remove('hidden');
}

async function saveEditDiary() {
  const id = document.getElementById('edit-diary-id').value;
  const content = document.getElementById('edit-diary-content').value.trim();
  if (!content) { showToast('請填寫內容'); return; }
  const photoFile = document.getElementById('edit-diary-photo').files[0];
  let photoUrl = null;
  if (photoFile) photoUrl = await uploadPhoto(photoFile, 'diary');
  const update = {
    date: document.getElementById('edit-diary-date').value,
    milestone: document.getElementById('edit-diary-milestone').value.trim() || null,
    content,
    note: document.getElementById('edit-diary-note').value.trim() || null,
  };
  if (photoUrl) update.photo_url = photoUrl;
  const { error } = await db.from('diary').update(update).eq('id', id);
  if (error) { showToast('更新失敗：' + error.message); return; }
  showToast('已更新 ✓');
  closeModal();
  loadDiary();
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
    weightChartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels: data.map(r => r.date), datasets: [{ data: data.map(r => r.weight_kg), borderColor: '#c4956a', backgroundColor: 'rgba(196,149,106,0.12)', pointBackgroundColor: '#c4956a', tension: 0.3, fill: true }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f5ede0' }, ticks: { color: '#9e806a', font: { size: 11 } } }, x: { grid: { display: false }, ticks: { color: '#9e806a', font: { size: 11 } } } } }
    });
  }
  if (!data.length) { list.innerHTML = '<div class="empty">還沒有體重紀錄 🐾</div>'; return; }
  list.innerHTML = [...data].reverse().map(r => `
    <div class="record-card">
      <button class="card-delete" onclick="deleteRecord('weight','${r.id}',loadWeight)">✕</button>
      <div class="card-date">${r.date}</div>
      <div class="card-title">${r.weight_kg} kg</div>
      ${r.note ? `<div class="card-sub">${r.note}</div>` : ''}
    </div>
  `).join('');
}

// ===== 獸醫 =====
async function loadVet() {
  const list = document.getElementById('vet-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('vet').select('*').order('date', { ascending: false });
  if (!data || !data.length) { list.innerHTML = '<div class="empty">還沒有獸醫紀錄 🏥</div>'; return; }
  list.innerHTML = data.map(r => `
    <div class="record-card">
      <button class="card-delete" onclick="deleteRecord('vet','${r.id}',loadVet)">✕</button>
      <div class="card-date">${r.date}</div>
      <div class="card-title">${r.reason}</div>
      <div class="card-pills">${r.clinic?`<span class="pill blue">${r.clinic}</span>`:''}${r.cost?`<span class="pill amber">NT$${r.cost.toLocaleString()}</span>`:''}</div>
      ${r.diagnosis?`<div class="card-sub" style="margin-top:8px">${r.diagnosis}</div>`:''}
    </div>
  `).join('');
}

// ===== 洗澡 =====
async function loadGrooming() {
  const list = document.getElementById('grooming-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('grooming').select('*').order('date', { ascending: false });
  if (!data || !data.length) { list.innerHTML = '<div class="empty">還沒有洗澡紀錄 🛁</div>'; return; }
  list.innerHTML = data.map(r => `
    <div class="record-card">
      <button class="card-delete" onclick="deleteRecord('grooming','${r.id}',loadGrooming)">✕</button>
      <div class="card-date">${r.date}</div>
      <div class="card-title">${r.service}</div>
      <div class="card-pills">${r.shop?`<span class="pill blue">${r.shop}</span>`:''}${r.cost?`<span class="pill amber">NT$${r.cost.toLocaleString()}</span>`:''}</div>
    </div>
  `).join('');
}

// ===== 用藥（圓點表格）=====
async function loadMedication() {
  const wrap = document.getElementById('medication-table');
  wrap.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('medication').select('*').order('date', { ascending: true });
  if (!data || !data.length) { wrap.innerHTML = '<div class="empty">還沒有用藥紀錄 💊</div>'; return; }

  // 按藥名分組
  const groups = {};
  data.forEach(r => {
    if (!groups[r.med_name]) groups[r.med_name] = [];
    groups[r.med_name].push(r);
  });

  const today = new Date(); today.setHours(0,0,0,0);

  wrap.innerHTML = Object.entries(groups).map(([name, records]) => {
    const cycle = records.length > 1 ? Math.round((new Date(records[1].date) - new Date(records[0].date)) / (1000*60*60*24*28)) : 1;
    const cycleLabel = cycle >= 3 ? '每 3 個月' : '每個月';
    const dots = records.map(r => {
      const d = new Date(r.date); d.setHours(0,0,0,0);
      const isPast = d <= today;
      const cls = r.done ? 'done' : isPast ? 'overdue' : 'upcoming';
      const icon = r.done ? '✓' : isPast ? '!' : '';
      const month = `${d.getMonth()+1}/${d.getDate()}`;
      return `<div class="med-dot-wrap" onclick="toggleMed('${r.id}','${name}')">
        <div class="med-dot ${cls}" title="${r.date}">${icon}</div>
        <div class="med-dot-date">${month}</div>
      </div>`;
    }).join('');
    return `<div class="med-group">
      <div class="med-group-header">
        <span class="med-group-name">💊 ${name}</span>
        <span class="med-group-cycle">${cycleLabel}</span>
      </div>
      <div class="med-dots">${dots}</div>
    </div>`;
  }).join('');
}

async function toggleMed(id, name) {
  const { data } = await db.from('medication').select('done').eq('id', id).single();
  if (!data) return;
  await db.from('medication').update({ done: !data.done }).eq('id', id);
  loadMedication();
}

async function saveMedSchedule() {
  const name = document.getElementById('medication-name').value.trim();
  if (!name) { showToast('請填寫藥品名稱'); return; }
  const start = new Date(document.getElementById('medication-start').value);
  const cycle = parseInt(document.getElementById('medication-cycle').value);
  const count = parseInt(document.getElementById('medication-count').value) || 12;
  const records = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i * cycle);
    records.push({ med_name: name, date: d.toISOString().slice(0,10), done: false });
  }
  const { error } = await db.from('medication').insert(records);
  if (error) { showToast('儲存失敗：' + error.message); return; }
  showToast(`已新增 ${count} 筆排程 ✓`);
  closeModal();
  loadMedication();
}

// ===== 零食飼料 =====
async function loadFood() {
  const list = document.getElementById('food-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('food').select('*').order('created_at', { ascending: false });
  if (!data || !data.length) { list.innerHTML = '<div class="empty">還沒有紀錄 🍖</div>'; return; }
  list.innerHTML = data.map(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    return `<div class="food-card">
      <button class="card-delete" onclick="deleteRecord('food','${r.id}',loadFood)">✕</button>
      ${r.photo_url ? `<img class="food-photo" src="${r.photo_url}" alt="${r.name}" />` : ''}
      <div class="food-name">${r.name}</div>
      ${r.brand ? `<div class="food-brand">${r.brand}</div>` : ''}
      <div class="food-stars">${stars}</div>
      ${r.review ? `<div class="food-review">${r.review}</div>` : ''}
      ${r.price ? `<div class="food-price">NT$${r.price.toLocaleString()}</div>` : ''}
    </div>`;
  }).join('');
}

// ===== 裝備 =====
async function loadClothes() {
  const list = document.getElementById('clothes-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data } = await db.from('clothes').select('*').order('purchase_date', { ascending: false });
  if (!data || !data.length) { list.innerHTML = '<div class="empty">還沒有裝備紀錄 👕</div>'; return; }
  list.innerHTML = data.map(r => `
    <div class="clothes-card">
      <button class="card-delete" onclick="deleteRecord('clothes','${r.id}',loadClothes)">✕</button>
      <div class="clothes-name">${r.name}</div>
      ${r.price ? `<div class="clothes-price">NT$${r.price.toLocaleString()}</div>` : ''}
      <div class="card-pills">
        ${r.size?`<span class="pill">${r.size}</span>`:''}
        ${r.color?`<span class="pill">${r.color}</span>`:''}
        ${r.purchase_date?`<span class="pill">${r.purchase_date}</span>`:''}
        ${r.note?`<span class="pill pink">${r.note}</span>`:''}
      </div>
    </div>
  `).join('');
}

// ===== 星星評分 =====
document.querySelectorAll('.star').forEach(star => {
  star.addEventListener('click', () => {
    const val = parseInt(star.dataset.val);
    document.getElementById('food-rating').value = val;
    document.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.val) <= val);
    });
  });
});

// ===== 匯入歷史資料（只跑一次）=====
async function importSpreadsheetData() {
  const { count } = await db.from('diary').select('*', { count: 'exact', head: true });
  if (count > 0) return;
  showToast('正在匯入歷史資料…');
  await db.from('diary').insert([
    { date: '2025-08-26', milestone: '開始中途', content: '帶去加恩檢查＋血檢，結果正常，醫生目測約 5 歲', note: '量體重約 17kg' },
    { date: '2025-08-26', content: '忍了三天，發現會定點上廁所' },
    { date: '2025-08-26', content: '越來越親，居然會握手甚至換手' },
    { date: '2025-09-03', content: '已經會出來吃小零食了', note: '吃零食吃得很小心翼翼' },
    { date: '2025-09-08', content: '開始練習帶出辦公室（很害怕）' },
    { date: '2025-09-18', content: '開始習慣在戶外走走' },
    { date: '2025-09-25', content: '第一次在室外大便' },
    { date: '2025-09-27', milestone: '露營 No.1', content: '第一次去露營過夜、踩溪水 ＠麒麟山露營區', note: '表現非常好，我們很驚訝，甚至一臉老熟的樣子，晚上睡過夜也沒問題、踩水也不會表現害怕' },
    { date: '2025-10-08', content: '發現是不可多得的寶藏小狗' },
    { date: '2025-10-13', milestone: '確定領養！', content: '我們確定領養 COOKIE 了！' },
    { date: '2025-10-15', content: '第一次睡露營車過夜' },
    { date: '2025-10-24', content: '第一次下水游泳 ＠南投集集', note: '居然會游泳，真是太可愛了' },
    { date: '2025-11-07', content: '開始帶回家，暫時綁在沙發區' },
    { date: '2025-11-15', milestone: '露營 No.2', content: '一起去山川祭，當快樂的露營小狗' },
    { date: '2025-11-20', content: '去艾奇德幼兒園教狗狗互動', note: '原本不喜歡小孩的 Cookie，居然可以到幼稚園給小朋友摸摸，非常厲害' },
    { date: '2025-11-29', milestone: '露營 No.3', content: '一起去福爾摩沙越野跑，很多美女欣賞 Cookie' },
    { date: '2025-12-02', content: '收到乾媽的一整箱高級衣服' },
    { date: '2025-12-27', content: '第一次回高雄婆婆家', note: '發現很喜歡睡床，還去大帑殿 KTV' },
    { date: '2026-02-18', content: '回婆婆家住 14 天（出國）' },
    { date: '2026-03-07', milestone: '露營 No.4', content: '一起去天時農莊 Hi! HILLEBERG 團露' },
    { date: '2026-03-28', milestone: '露營 No.5', content: '第一次野營 ＠高島縱走', note: '居然走丟了一個半小時，真的嚇死我們了' },
    { date: '2026-05-01', content: '芳苑海邊睡露營車' },
  ]);
  await db.from('medication').insert([
    { date: '2025-12-26', med_name: '免操心', done: true },
    { date: '2025-12-26', med_name: '一錠除', done: true },
    { date: '2026-01-26', med_name: '免操心', done: true },
    { date: '2026-02-26', med_name: '免操心', done: true },
    { date: '2026-03-26', med_name: '免操心', done: true },
    { date: '2026-03-26', med_name: '一錠除', done: true },
    { date: '2026-04-26', med_name: '免操心', done: false },
    { date: '2026-05-05', med_name: '免操心', done: true },
    { date: '2026-06-05', med_name: '免操心', done: false },
    { date: '2026-06-26', med_name: '一錠除', done: false },
    { date: '2026-07-05', med_name: '免操心', done: false },
    { date: '2026-08-05', med_name: '免操心', done: false },
    { date: '2026-09-05', med_name: '免操心', done: false },
    { date: '2026-09-26', med_name: '一錠除', done: false },
    { date: '2026-10-05', med_name: '免操心', done: false },
    { date: '2026-11-05', med_name: '免操心', done: false },
    { date: '2026-12-05', med_name: '免操心', done: false },
    { date: '2026-12-26', med_name: '一錠除', done: false },
  ]);
  await db.from('vet').insert([{ date: '2025-08-26', clinic: '加恩動物醫院', reason: '初診檢查＋血檢', diagnosis: '結果正常，醫生目測約 5 歲' }]);
  await db.from('weight').insert([{ date: '2025-08-26', weight_kg: 17.0, note: '加恩動物醫院量' }]);
  await db.from('clothes').insert([
    { name: 'HURTTA 動能 Rover 胸背帶', size: '55-70', color: '檜木橘', purchase_date: '2025-10-20', price: 2350 },
    { name: 'HURTTA 熱能科技中層保暖背心', size: '50', color: '冰河灰', purchase_date: '2025-12-14', price: 2350, note: '土媽送' },
    { name: 'HURTTA 防潑水機能四腳保暖衣', size: '50', color: '冰河灰', purchase_date: '2025-12-14', price: 4050, note: '土媽送' },
    { name: 'HURTTA 極輕量 Mudventure 機能防水風雨衣 ECO', size: '50', color: '雪松', purchase_date: '2026-05-05', price: 3990 },
    { name: 'HURTTA 動能 Rover 胸背帶', size: '55-70', color: '玄武黑', purchase_date: '2026-05-05', price: 2350, note: '咬爆前一個，重買新的' },
  ]);
  showToast('歷史資料匯入完成 ✓');
  loadDiary();
}

// ===== 啟動 =====
initDaysCounter();
initAvatar();
initPetInfo();
loadDiary();
importSpreadsheetData();
