// table.js — Data table (histori bencana) + Korban Jiwa cards

let allEvents = [];

// RENDER DATA TABLE

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  const counter = document.getElementById('table-count');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">Tidak ada data yang sesuai filter.</td></tr>`;
    if (counter) counter.textContent = 'Menampilkan 0 data';
    return;
  }

  tbody.innerHTML = [...data]
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .map(ev => {
      const tgl = new Date(ev.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });

      return `<tr>
        <td>${window.escapeHTML(tgl)}</td>
        <td>${window.escapeHTML(ev.provinsi)}</td>
        <td>${window.escapeHTML(ev.kabupaten)}</td>
        <td>${window.escapeHTML(ev.jenis_banjir)}</td>
        <td class="num">${window.escapeHTML(ev.ketinggian_cm)}</td>
        <td class="num">${window.escapeHTML(ev.korban_jiwa)}</td>
        <td class="num hide-mobile">${window.escapeHTML(ev.pengungsi.toLocaleString('id-ID'))}</td>
        <td class="num hide-mobile">${window.escapeHTML(ev.kerugian_juta_rupiah.toLocaleString('id-ID'))}</td>
        <td class="hide-mobile">${window.escapeHTML(ev.sumber_data)}</td>
      </tr>`;
    }).join('');

  if (counter) counter.textContent = `Menampilkan ${data.length} data`;
}

// FILTER LOGIC

function applyFilters() {
  const searchVal = (document.getElementById('search-table')?.value || '').toLowerCase();
  const jenisVal  = document.getElementById('filter-jenis')?.value  || '';
  const tahunVal  = document.getElementById('filter-tahun')?.value  || '';

  const filtered = allEvents.filter(ev => {
    const matchSearch = !searchVal
      || ev.provinsi.toLowerCase().includes(searchVal)
      || ev.kabupaten.toLowerCase().includes(searchVal);
    const matchJenis  = !jenisVal || ev.jenis_banjir === jenisVal;
    const matchTahun  = !tahunVal || ev.tanggal.startsWith(tahunVal);
    return matchSearch && matchJenis && matchTahun;
  });

  renderTable(filtered);
}

function bindTableFilters() {
  document.getElementById('search-table')?.addEventListener('input', applyFilters);
  document.getElementById('filter-jenis')?.addEventListener('change', applyFilters);
  document.getElementById('filter-tahun')?.addEventListener('change', applyFilters);
  document.getElementById('reset-filter')?.addEventListener('click', () => {
    document.getElementById('search-table').value  = '';
    document.getElementById('filter-jenis').value  = '';
    document.getElementById('filter-tahun').value  = '';
    renderTable(allEvents);
  });
}

// KORBAN JIWA SECTION

function renderKorbanGrid(data) {
  const grid = document.getElementById('korban-grid');
  if (!grid) return;

  const withVictims = data
    .filter(ev => ev.korban_jiwa > 0 || ev.luka_luka > 0)
    .sort((a, b) => b.korban_jiwa - a.korban_jiwa);

  if (withVictims.length === 0) {
    grid.innerHTML = `<p>Tidak ada data korban untuk filter ini.</p>`;
    return;
  }

  grid.innerHTML = withVictims.map(ev => {
    const tgl  = new Date(ev.tanggal).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
    const sev  = ev.korban_jiwa >= 10 ? 'high' : ev.korban_jiwa > 0 ? 'med' : 'none';
    return `<article class="korban-card ${sev}">
      <div class="korban-card__head">
        <div>
          <strong>${window.escapeHTML(ev.kabupaten)}</strong>
          <p>${window.escapeHTML(ev.provinsi)} | ${window.escapeHTML(tgl)}</p>
        </div>
        <span>${window.escapeHTML(ev.jenis_banjir)}</span>
      </div>
      <div class="korban-card__counts">
        <div>
          <strong>${window.escapeHTML(ev.korban_jiwa)}</strong>
          <span>Meninggal</span>
        </div>
        <div>
          <strong>${window.escapeHTML(ev.luka_luka)}</strong>
          <span>Luka-luka</span>
        </div>
      </div>
      <p>${window.escapeHTML(ev.pengungsi.toLocaleString('id-ID'))} pengungsi</p>
      <p>Ketinggian ${window.escapeHTML(ev.ketinggian_cm)} cm | ${window.escapeHTML(ev.sumber_data)}</p>
    </article>`;
  }).join('');
}

function bindKorbanFilters() {
  document.getElementById('search-korban')?.addEventListener('input', filterKorban);
  document.getElementById('filter-korban-tahun')?.addEventListener('change', filterKorban);
}

function filterKorban() {
  const searchVal = (document.getElementById('search-korban')?.value || '').toLowerCase();
  const tahunVal  = document.getElementById('filter-korban-tahun')?.value || '';

  const filtered = allEvents.filter(ev => {
    const matchSearch = !searchVal
      || ev.provinsi.toLowerCase().includes(searchVal)
      || ev.kabupaten.toLowerCase().includes(searchVal);
    const matchTahun = !tahunVal || ev.tanggal.startsWith(tahunVal);
    return matchSearch && matchTahun;
  });

  renderKorbanGrid(filtered);
}

// HERO STATS

function animateCount(el, target) {
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString('id-ID');
    if (current >= target) clearInterval(timer);
  }, 30);
}

function updateHeroStats(events) {
  const totalKejadian  = events.length;
  const totalKorban    = events.reduce((s, e) => s + e.korban_jiwa, 0);
  const totalPengungsi = events.reduce((s, e) => s + e.pengungsi, 0);
  const provinsiSet    = new Set(events.map(e => e.provinsi));

  animateCount(document.getElementById('stat-kejadian'),  totalKejadian);
  animateCount(document.getElementById('stat-korban'),    totalKorban);
  animateCount(document.getElementById('stat-pengungsi'), totalPengungsi);
  animateCount(document.getElementById('stat-provinsi'),  provinsiSet.size);

  // Korban section summary
  animateCount(document.getElementById('total-jiwa'),             totalKorban);
  animateCount(document.getElementById('total-luka'),             events.reduce((s,e)=>s+e.luka_luka,0));
  animateCount(document.getElementById('total-pengungsi-korban'), totalPengungsi);
}

// INIT

async function initTable() {
  allEvents = await window.floodDB.getAll('flood_events');

  // Skeleton removed, render real data
  renderTable(allEvents);
  renderKorbanGrid(allEvents);
  updateHeroStats(allEvents);
  bindTableFilters();
  bindKorbanFilters();
}

window.floodTable = { initTable };
