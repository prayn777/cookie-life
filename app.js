// ===== Supabase =====
const SUPABASE_URL = 'https://psulyrwlvcqelmqagtfj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YNe5P4CbgbdQHjS4ptr7qw_CQN1UsSr';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== 頭像 =====
function initAvatar() {
  const saved = localStorage.getItem('cookie-avatar');
  if (saved) {
    document.getElementById('header-avatar').src = saved;
  } else {
    document.getElementById('header-avatar').src = 'https://api.dicebear.com/7.x/bottts/svg?seed=cookie';
  }
}

function changeAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('header-avatar').src = e.target.result;
    localStorage.setItem('cookie-avatar', e.target.result);
    showToast('頭像已更新 ✓');
  };
  reader.readAsDataURL(file);
}

// ===== 可編輯基本資訊 =====
let editingFieldId = null;

function editField(fieldId) {
  editingFieldId = fieldId;
  const el = document.getElementById(fieldId);
  document.getElementById('edit-modal-title').textContent = fieldId === 'pet-name' ? '編輯名字' : '編輯基本資訊';
  document.getElementById('edit-label').textContent = fieldId === 'pet-name' ? '名字' : '資訊（品種・年齡・體重）';
  document.getElementById('edit-input').value = el.textContent.trim();
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-edit').classList.remove('hidden');
  setTimeout(() => document.getElementById('edit-input').focus(), 100);
}

function closeEditModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-edit').classList.add('hidden');
  editingFieldId = null;
}

function saveEditField() {
  if (!editingFieldId) return;
  const val = document.getElementById('edit-input').value.trim();
  if (!val) return;
  document.getElementById(editingFieldId).textContent = val;
  localStorage.setItem('cookie-' + editingFieldId, val);
  showToast('已儲存 ✓');
  closeEditModal();
}

function initPetInfo() {
  const name = localStorage.getItem('cookie-pet-name');
  const info = localStorage.getItem('cookie-pet-info');
  if (name) document.getElementById('pet-name').textContent = name;
  if (info) document.getElementById('pet-info').textContent = info;
}

// ===== Tab 切換 =====
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
  if (tab === 'diary') loadDiary();
  else if (tab === 'weight') loadWeight();
  else if (tab === 'vet') loadVet();
  else if (tab === 'grooming') loadGrooming();
  else if (tab === 'medication') loadMedication();
  else if (tab === 'clothes') loadClothes();
}

// ===== Modal =====
function openModal(type) {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-' + type).classList.remove('hidden');
  const today = new Date().toISOString().slice(0, 10);
  const dateField = document.getElementById(type + '-date');
  if (dateField) dateField.value = today;
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  ['diary','weight','vet','grooming','medication','clothes','edit'].forEach(t => {
    const el = document.getElementById('modal-' + t);
    if (el) el.classList.add('hidden');
  });
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
async function uploadPhoto(file) {
  if (!file) return null;
  const ext = file.name.split('.').pop();
  const filename = `diary/${Date.now()}.${ext}`;
  const { error } = await db.storage.from('photos').upload(filename, file);
  if (error) { console.error(error); return null; }
  const { data: urlData } = db.storage.from('photos').getPublicUrl(filename);
  return urlData.publicUrl;
}

// ===== 儲存紀錄 =====
async function saveRecord(type) {
  let record = {};
  if (type === 'diary') {
    const content = document.getElementById('diary-content').value.trim();
    if (!content) { showToast('請填寫內容'); return; }
    const photoFile = document.getElementById('diary-photo').files[0];
    const photoUrl = await uploadPhoto(photoFile);
    record = {
      date: document.getElementById('diary-date').value,
      milestone: document.getElementById('diary-milestone').value.trim() || null,
      content, note: document.getElementById('diary-note').value.trim() || null,
      photo_url: photoUrl,
    };
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
  } else if (type === 'medication') {
    const name = document.getElementById('medication-name').value.trim();
    if (!name) { showToast('請填寫藥品名稱'); return; }
    record = { date: document.getElementById('medication-date').value, med_name: name, done: document.getElementById('medication-done').value === 'true', note: document.getElementById('medication-note').value.trim() || null };
  } else if (type === 'clothes') {
    const name = document.getElementById('clothes-name').value.trim();
    if (!name) { showToast('請填寫品名'); return; }
    record = { name, size: document.getElementById('clothes-size').value.trim() || null, color: document.getElementById('clothes-color').value.trim() || null, purchase_date: document.getElementById('clothes-date').value || null, price: parseInt(document.getElementById('clothes-price').value) || null, note: document.getElementById('clothes-note').value.trim() || null };
  }
  const { error } = await db.from(type).insert(record);
  if (error) { showToast('儲存失敗：' + error.message); return; }
  showToast('已儲存 ✓');
  closeModal();
  loadTab(type);
}

// ===== 刪除 =====
async function deleteRecord(table, id, reloadFn) {
  if (!confirm('確定要刪除這筆紀錄嗎？')) return;
  const { error } = await db.from(table).delete().eq('id', id);
  if (error) { showToast('刪除失敗'); return; }
  showToast('已刪除');
  reloadFn();
}

// ===== 成長日記 =====
async function loadDiary() {
  const list = document.getElementById('diary-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data, error } = await db.from('diary').select('*').order('date', { ascending: false });
  if (error) { list.innerHTML = '<div class="empty">載入失敗</div>'; return; }
  if (!data.length) { list.innerHTML = '<div class="empty">還沒有日記，點右上角新增 🐾</div>'; return; }
  list.innerHTML = data.map(r => `
    <div class="tl-item">
      <div class="tl-dot ${r.milestone ? 'milestone' : ''}"></div>
      <button class="tl-delete" onclick="deleteRecord('diary','${r.id}',loadDiary)">✕</button>
      <div class="tl-date">${r.date}</div>
      ${r.milestone ? `<span class="tl-badge">${r.milestone}</span>` : ''}
      <div class="tl-content">${r.content}</div>
      ${r.note ? `<div class="tl-note">${r.note}</div>` : ''}
      ${r.photo_url ? `<img class="tl-photo" src="${r.photo_url}" alt="照片" />` : ''}
    </div>
  `).join('');
}

// ===== 體重 =====
let weightChartInstance = null;
async function loadWeight() {
  const list = document.getElementById('weight-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data, error } = await db.from('weight').select('*').order('date', { ascending: true });
  if (error) { list.innerHTML = '<div class="empty">載入失敗</div>'; return; }
  if (data.length) {
    const ctx = document.getElementById('weightChart').getContext('2d');
    if (weightChartInstance) weightChartInstance.destroy();
    weightChartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels: data.map(r => r.date), datasets: [{ label: '體重 (kg)', data: data.map(r => r.weight_kg), borderColor: '#c4956a', backgroundColor: 'rgba(196,149,106,0.12)', pointBackgroundColor: '#c4956a', tension: 0.3, fill: true }] },
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
  const { data, error } = await db.from('vet').select('*').order('date', { ascending: false });
  if (error) { list.innerHTML = '<div class="empty">載入失敗</div>'; return; }
  if (!data.length) { list.innerHTML = '<div class="empty">還沒有獸醫紀錄 🏥</div>'; return; }
  list.innerHTML = data.map(r => `
    <div class="record-card">
      <button class="card-delete" onclick="deleteRecord('vet','${r.id}',loadVet)">✕</button>
      <div class="card-date">${r.date}</div>
      <div class="card-title">${r.reason}</div>
      <div class="card-pills">${r.clinic ? `<span class="pill blue">${r.clinic}</span>` : ''}${r.cost ? `<span class="pill amber">NT$${r.cost.toLocaleString()}</span>` : ''}</div>
      ${r.diagnosis ? `<div class="card-sub" style="margin-top:8px">${r.diagnosis}</div>` : ''}
      ${r.note ? `<div class="card-sub">${r.note}</div>` : ''}
    </div>
  `).join('');
}

// ===== 洗澡 =====
async function loadGrooming() {
  const list = document.getElementById('grooming-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data, error } = await db.from('grooming').select('*').order('date', { ascending: false });
  if (error) { list.innerHTML = '<div class="empty">載入失敗</div>'; return; }
  if (!data.length) { list.innerHTML = '<div class="empty">還沒有洗澡紀錄 🛁</div>'; return; }
  list.innerHTML = data.map(r => `
    <div class="record-card">
      <button class="card-delete" onclick="deleteRecord('grooming','${r.id}',loadGrooming)">✕</button>
      <div class="card-date">${r.date}</div>
      <div class="card-title">${r.service}</div>
      <div class="card-pills">${r.shop ? `<span class="pill blue">${r.shop}</span>` : ''}${r.cost ? `<span class="pill amber">NT$${r.cost.toLocaleString()}</span>` : ''}</div>
      ${r.note ? `<div class="card-sub" style="margin-top:8px">${r.note}</div>` : ''}
    </div>
  `).join('');
}

// ===== 用藥 =====
async function loadMedication() {
  const list = document.getElementById('medication-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data, error } = await db.from('medication').select('*').order('date', { ascending: false });
  if (error) { list.innerHTML = '<div class="empty">載入失敗</div>'; return; }
  if (!data.length) { list.innerHTML = '<div class="empty">還沒有用藥紀錄 💊</div>'; return; }
  list.innerHTML = data.map(r => `
    <div class="record-card">
      <button class="card-delete" onclick="deleteRecord('medication','${r.id}',loadMedication)">✕</button>
      <div class="card-date">${r.date}</div>
      <div class="card-title">${r.med_name}</div>
      <div class="card-pills" style="margin-top:6px"><span class="done-badge ${r.done ? 'done' : 'pending'}">${r.done ? '✔ 已完成' : '待施打'}</span></div>
      ${r.note ? `<div class="card-sub" style="margin-top:8px">${r.note}</div>` : ''}
    </div>
  `).join('');
}

// ===== 衣物裝備 =====
async function loadClothes() {
  const list = document.getElementById('clothes-list');
  list.innerHTML = '<div class="loading">載入中…</div>';
  const { data, error } = await db.from('clothes').select('*').order('purchase_date', { ascending: false });
  if (error) { list.innerHTML = '<div class="empty">載入失敗</div>'; return; }
  if (!data.length) { list.innerHTML = '<div class="empty">還沒有裝備紀錄 👕</div>'; return; }
  list.innerHTML = data.map(r => `
    <div class="clothes-card">
      <button class="card-delete" onclick="deleteRecord('clothes','${r.id}',loadClothes)">✕</button>
      <div class="clothes-name">${r.name}</div>
      ${r.price ? `<div class="clothes-price">NT$${r.price.toLocaleString()}</div>` : ''}
      <div class="card-pills">
        ${r.size ? `<span class="pill">${r.size}</span>` : ''}
        ${r.color ? `<span class="pill">${r.color}</span>` : ''}
        ${r.purchase_date ? `<span class="pill">${r.purchase_date}</span>` : ''}
        ${r.note ? `<span class="pill pink">${r.note}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// ===== 匯入試算表歷史資料（只在資料庫空的時候執行一次）=====
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
    { date: '2026-01-26', med_name: '一錠除', done: false },
    { date: '2026-02-26', med_name: '免操心', done: true },
    { date: '2026-02-26', med_name: '一錠除', done: false },
    { date: '2026-03-26', med_name: '免操心', done: true },
    { date: '2026-03-26', med_name: '一錠除', done: true },
    { date: '2026-05-05', med_name: '免操心', done: true },
    { date: '2026-05-05', med_name: '一錠除', done: false },
    { date: '2026-06-05', med_name: '免操心', done: false },
    { date: '2026-07-05', med_name: '免操心', done: false },
    { date: '2026-08-05', med_name: '免操心', done: false },
    { date: '2026-09-05', med_name: '免操心', done: false },
    { date: '2026-09-05', med_name: '一錠除', done: false },
    { date: '2026-10-05', med_name: '免操心', done: false },
    { date: '2026-11-05', med_name: '免操心', done: false },
    { date: '2026-12-05', med_name: '免操心', done: false },
    { date: '2026-12-05', med_name: '一錠除', done: false },
  ]);
  await db.from('vet').insert([
    { date: '2025-08-26', clinic: '加恩動物醫院', reason: '初診檢查＋血檢', diagnosis: '結果正常，醫生目測約 5 歲' },
  ]);
  await db.from('weight').insert([
    { date: '2025-08-26', weight_kg: 17.0, note: '加恩動物醫院量' },
  ]);
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
initAvatar();
initPetInfo();
loadDiary();
importSpreadsheetData();
