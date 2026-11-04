// ============================================================
// charts.js — Chart.js visualizations
// ============================================================

const CHART_COLORS = {
  blue:   '#3b82f6',
  orange: '#e85d04',
  red:    '#ef4444',
  yellow: '#f59e0b',
  green:  '#22c55e',
  purple: '#7c3aed',
  teal:   '#0d9488',
  pink:   '#ec4899',
};

const CHART_TEXT_COLOR = 'rgba(255,255,255,0.85)';
const CHART_GRID_COLOR = 'rgba(255,255,255,0.12)';

Chart.defaults.color = CHART_TEXT_COLOR;
Chart.defaults.font.family = "-apple-system, 'Segoe UI', sans-serif";

function pulau(provinsi) {
  const map = {
    'Jawa': ['DKI Jakarta','Jawa Barat','Jawa Tengah','Jawa Timur','DI Yogyakarta','Banten'],
    'Sumatera': ['Aceh','Sumatera Utara','Sumatera Barat','Riau','Jambi','Sumatera Selatan','Bengkulu','Lampung','Kepulauan Bangka Belitung','Kepulauan Riau'],
    'Kalimantan': ['Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara'],
    'Sulawesi': ['Sulawesi Utara','Sulawesi Tengah','Sulawesi Selatan','Sulawesi Tenggara','Gorontalo','Sulawesi Barat'],
    'Papua': ['Papua','Papua Barat','Papua Selatan','Papua Tengah','Papua Pegunungan','Papua Barat Daya'],
    'Nusa Tenggara': ['Bali','Nusa Tenggara Barat','NTT','NTB'],
    'Maluku': ['Maluku','Maluku Utara'],
  };
  for (const [island, provinces] of Object.entries(map)) {
    if (provinces.some(p => provinsi.includes(p) || p.includes(provinsi))) return island;
  }
  return 'Lainnya';
}

async function initCharts() {
  const events = await window.floodDB.getAll('flood_events');

  buildChartPerTahun(events);
  buildChartPulau(events);
  buildChartKorban(events);
  buildChartJenis(events);
  buildChartProvinsi(events);
  buildChartPengungsi(events);
}

// 1. Kejadian per Tahun (Bar)
function buildChartPerTahun(events) {
  const years = ['2020','2021','2022','2023','2024'];
  const counts = years.map(y => events.filter(e => e.tanggal.startsWith(y)).length);

  new Chart(document.getElementById('chart-pertahun'), {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: 'Jumlah Kejadian',
        data: counts,
        backgroundColor: years.map((_, i) => [
          CHART_COLORS.blue, CHART_COLORS.orange, CHART_COLORS.red,
          CHART_COLORS.yellow, CHART_COLORS.purple
        ][i]),
        borderRadius: 6,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: CHART_GRID_COLOR }, ticks: { stepSize: 1 } },
        x: { grid: { color: 'transparent' } },
      }
    }
  });
}