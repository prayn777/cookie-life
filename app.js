// ===== Supabase 設定 =====
const SUPABASE_URL = 'https://psulyrwlvcqelmqagtfj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YNe5P4CbgbdQHjS4ptr7qw_CQN1UsSr';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  ['diary','weight','vet','grooming','medication','clothes'].forEach(t => {
    document.getElementById('modal-' + t).classList.add('hidden');
  });
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
  const { data, error } = await db.storage.from('photos').upload(filename, file);
  if (error) { console.error(error); return null; }
  const { data: urlData } = db.storage.from('photos').getPublicUrl(filename);
  return urlData.publicUrl;
}

// ===== 儲存紀錄 =====
async function saveRecord(type) {
  let record = {};
  let table = type;

  if (type === 'diary') {
    const content = document.getElementById('diary-content').value.trim();
    if (!content) { showToast('請填寫內容'); return; }
    const photoFile = document.getElementById('diary-photo').files[0];
    const photoUrl = await uploadPhoto(photoFile);
    record = {
      date: document.getElementById('diary-date').value,
      milestone: document.getElementById('diary-milestone').value.trim() || null,
      content,
      note: document.getElementById('diary-note').value.trim() || null,
      photo_url: photoUrl,
    };
  } else if (type === 'weight') {
    const kg = document.getElementById('weight-kg').value;
    if (!kg) { showToast('請填寫體重'); return; }
    record = {
      date: document.getElementById('weight-date').value,
      weight_kg: parseFloat(kg),
      note: document.getElementById('weight-note').value.trim() || null,
    };
  } else if (type === 'vet') {
    const reason = document.getElementById('vet-reason').value.trim();
    if (!reason) { showToast('請填寫就診原因'); return; }
    record = {
      date: document.getElementById('vet-date').value,
      clinic: document.getElementById('vet-clinic').value.trim() || null,
      reason,
      diagnosis: document.getElementById('vet-diagnosis').value.trim() || null,
      cost: parseInt(document.getElementById('vet-cost').value) || null,
      note: document.getElementById('vet-note').value.trim() || null,
    };
  } else if (type === 'grooming') {
    const service = document.getElementById('grooming-service').value.trim();
    if (!service) { showToast('請填寫服務項目'); return; }
    record = {
      date: document.getElementById('grooming-date').value,
      shop: document.getElementById('grooming-shop').value.trim() || null,
      service,
      cost: parseInt(document.getElementById('grooming-cost').value) || null,
      note: document.getElementById('grooming-note').value.trim() || null,
    };
  } else if (type === 'medication') {
    const name = document.getElementById('medication-name').value.trim();
    if (!name) { showToast('請填寫藥品名稱'); return; }
    record = {
      date: document.getElementById('medication-date').value,
      med_name: name,
      done: document.getElementById('medication-done').value === 'true',
      note: document.getElementById('medication-note').value.trim() || null,
    };
  } else if (type === 'clothes') {
    const name = document.getElementById('clothes-name').value.trim();
    if (!name) { showToast('請填寫品名'); return; }
    record = {
      name,
      size: document.getElementById('clothes-size').value.trim() || null,
      color: document.getElementById('clothes-color').value.trim() || null,
      purchase_date: document.getElementById('clothes-date').value || null,
      price: parseInt(document.getElementById('clothes-price').value) || null,
      note: document.getElementById('clothes-note').value.trim() || null,
    };
  }

  const { error } = await db.from(table).insert(record);
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
      data: {
        labels: data.map(r => r.date),
        datasets: [{
          label: '體重 (kg)',
          data: data.map(r => r.weight_kg),
          borderColor: '#c4956a',
          backgroundColor: 'rgba(196,149,106,0.12)',
          pointBackgroundColor: '#c4956a',
          tension: 0.3,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#f5ede0' }, ticks: { color: '#9e806a', font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { color: '#9e806a', font: { size: 11 } } }
        }
      }
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
      <div class="card-pills">
        ${r.clinic ? `<span class="pill blue">${r.clinic}</span>` : ''}
        ${r.cost ? `<span class="pill amber">NT$${r.cost.toLocaleString()}</span>` : ''}
      </div>
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
      <div class="card-pills">
        ${r.shop ? `<span class="pill blue">${r.shop}</span>` : ''}
        ${r.cost ? `<span class="pill amber">NT$${r.cost.toLocaleString()}</span>` : ''}
      </div>
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
      <div class="card-pills" style="margin-top:6px">
        <span class="done-badge ${r.done ? 'done' : 'pending'}">${r.done ? '✔ 已完成' : '待施打'}</span>
      </div>
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

// ===== 初始化：先確認 diary 資料表有 photo_url 欄位 =====
async function ensurePhotoColumn() {
  await db.rpc('exec_sql', { sql: `ALTER TABLE diary ADD COLUMN IF NOT EXISTS photo_url text;` }).catch(() => {});
}

// ===== 啟動 =====
loadDiary();
