// charts.js — Visualisasi data banjir tersimpan

// KONFIGURASI GRAFIK
const chartTokens = getComputedStyle(document.documentElement);
const CHART_COLORS = {
  primary: chartTokens.getPropertyValue('--chart-primary').trim(),
  accent: chartTokens.getPropertyValue('--chart-accent').trim(),
  muted: chartTokens.getPropertyValue('--chart-muted').trim(),
  cool: chartTokens.getPropertyValue('--chart-cool').trim(),
  quiet: chartTokens.getPropertyValue('--chart-quiet').trim(),
  grid: chartTokens.getPropertyValue('--chart-grid').trim(),
  surface: chartTokens.getPropertyValue('--chart-surface').trim(),
  text: chartTokens.getPropertyValue('--ink').trim(),
  secondaryText: chartTokens.getPropertyValue('--ink-2').trim(),
};

const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.cool,
  CHART_COLORS.muted,
  CHART_COLORS.quiet,
];

const numberFormat = new Intl.NumberFormat('id-ID');
const compactFormat = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });

Chart.defaults.color = CHART_COLORS.secondaryText;
Chart.defaults.font.family = chartTokens.getPropertyValue('--font-body').trim();
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;
Chart.defaults.plugins.legend.labels.padding = 18;

const provinceIsland = new Map([
  ...['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan', 'Bengkulu', 'Lampung', 'Kepulauan Bangka Belitung', 'Kepulauan Riau'].map(name => [name, 'Sumatera']),
  ...['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'DI Yogyakarta', 'Banten'].map(name => [name, 'Jawa']),
  ...['Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara'].map(name => [name, 'Kalimantan']),
  ...['Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat'].map(name => [name, 'Sulawesi']),
  ...['Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'].map(name => [name, 'Papua']),
  ...['Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'NTT', 'NTB'].map(name => [name, 'Nusa Tenggara']),
  ...['Maluku', 'Maluku Utara'].map(name => [name, 'Maluku']),
]);

// PEMROSESAN DATA
function getYears(events) {
  return [...new Set(events
    .map(event => String(event.tanggal || '').slice(0, 4))
    .filter(year => /^\d{4}$/.test(year)))]
    .sort((a, b) => Number(a) - Number(b));
}

function getAnnualTotals(events, field) {
  const totals = new Map(getYears(events).map(year => [year, 0]));
  events.forEach(event => {
    const year = String(event.tanggal || '').slice(0, 4);
    if (totals.has(year)) {
      const amount = field ? Number(event[field]) || 0 : 1;
      totals.set(year, totals.get(year) + amount);
    }
  });
  return { years: [...totals.keys()], values: [...totals.values()] };
}

// PEMBUATAN GRAFIK
function createChart(id, type, data, options = {}) {
  const canvas = document.getElementById(id);
  if (!canvas) return;

  Chart.getChart(canvas)?.destroy();

  return new Chart(canvas, {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: CHART_COLORS.text,
          titleColor: CHART_COLORS.surface,
          bodyColor: CHART_COLORS.surface,
          padding: 12,
          displayColors: true,
          usePointStyle: true,
        },
      },
      ...options,
    },
  });
}

// KONFIGURASI SUMBU
function countAxis(format = numberFormat) {
  return {
    beginAtZero: true,
    grid: { color: CHART_COLORS.grid, drawTicks: false },
    border: { display: false },
    ticks: {
      precision: 0,
      padding: 8,
      callback: value => format.format(value),
    },
  };
}

function yearAxis() {
  return {
    grid: { display: false },
    border: { display: false },
    ticks: { padding: 8 },
  };
}

// INISIALISASI GRAFIK
async function initCharts() {
  const events = await window.floodDB.getAll('flood_events');

  buildChartPerTahun(events);
  buildChartPulau(events);
  buildChartKorban(events);
  buildChartJenis(events);
  buildChartProvinsi(events);
  buildChartPengungsi(events);
}

// KEJADIAN PER TAHUN
function buildChartPerTahun(events) {
  const { years, values } = getAnnualTotals(events);
  createChart('chart-pertahun', 'bar', {
    labels: years,
    datasets: [{
      label: 'Kejadian',
      data: values,
      backgroundColor: CHART_COLORS.primary,
      hoverBackgroundColor: CHART_COLORS.accent,
      borderRadius: 2,
      maxBarThickness: 38,
    }],
  }, {
    scales: { x: yearAxis(), y: countAxis() },
  });
}

// SEBARAN PER PULAU
function buildChartPulau(events) {
  const totals = new Map();
  events.forEach(event => {
    const island = provinceIsland.get(event.provinsi) || 'Lainnya';
    totals.set(island, (totals.get(island) || 0) + 1);
  });

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  createChart('chart-pulau', 'bar', {
    labels: sorted.map(([island]) => island),
    datasets: [{
      label: 'Kejadian',
      data: sorted.map(([, count]) => count),
      backgroundColor: sorted.map((_, index) => CHART_PALETTE[index % CHART_PALETTE.length]),
      borderRadius: 2,
      maxBarThickness: 24,
    }],
  }, {
    indexAxis: 'y',
    scales: { x: countAxis(), y: { ...yearAxis(), grid: { display: false } } },
  });
}

// KORBAN TIAP TAHUN
function buildChartKorban(events) {
  const meninggal = getAnnualTotals(events, 'korban_jiwa');
  const luka = getAnnualTotals(events, 'luka_luka');
  createChart('chart-korban', 'line', {
    labels: meninggal.years,
    datasets: [
      {
        label: 'Meninggal',
        data: meninggal.values,
        borderColor: CHART_COLORS.accent,
        backgroundColor: CHART_COLORS.accent,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.25,
      },
      {
        label: 'Luka-luka',
        data: luka.values,
        borderColor: CHART_COLORS.cool,
        backgroundColor: CHART_COLORS.cool,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.25,
      },
    ],
  }, {
    plugins: {
      legend: { display: true, position: 'bottom', align: 'start' },
    },
    scales: { x: yearAxis(), y: countAxis() },
  });
}

// JENIS KEJADIAN
function buildChartJenis(events) {
  const totals = new Map();
  events.forEach(event => {
    const type = event.jenis_banjir || 'Tidak diketahui';
    totals.set(type, (totals.get(type) || 0) + 1);
  });

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  createChart('chart-jenis', 'doughnut', {
    labels: sorted.map(([type]) => type),
    datasets: [{
      data: sorted.map(([, count]) => count),
      backgroundColor: sorted.map((_, index) => CHART_PALETTE[index % CHART_PALETTE.length]),
      borderColor: CHART_COLORS.surface,
      borderWidth: 3,
      hoverOffset: 5,
    }],
  }, {
    cutout: '62%',
    plugins: {
      legend: { display: true, position: 'right', labels: { padding: 14 } },
    },
  });
}

// PROVINSI TERDAMPAK
function buildChartProvinsi(events) {
  const totals = new Map();
  events.forEach(event => {
    const province = event.provinsi || 'Tidak diketahui';
    const current = totals.get(province) || { events: 0, deaths: 0 };
    current.events += 1;
    current.deaths += Number(event.korban_jiwa) || 0;
    totals.set(province, current);
  });

  const topFive = [...totals.entries()]
    .sort((a, b) => b[1].deaths - a[1].deaths || a[0].localeCompare(b[0], 'id'))
    .slice(0, 5);

  createChart('chart-provinsi', 'bar', {
    labels: topFive.map(([province]) => province),
    datasets: [{
      label: 'Meninggal',
      data: topFive.map(([, total]) => total.deaths),
      backgroundColor: CHART_COLORS.accent,
      borderRadius: 2,
      maxBarThickness: 22,
    }],
  }, {
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: context => `${numberFormat.format(topFive[context.dataIndex][1].events)} kejadian`,
        },
      },
    },
    scales: { x: countAxis(), y: { ...yearAxis(), grid: { display: false } } },
  });
}

// PENGUNGSI PER TAHUN
function buildChartPengungsi(events) {
  const { years, values } = getAnnualTotals(events, 'pengungsi');
  createChart('chart-pengungsi', 'bar', {
    labels: years,
    datasets: [{
      label: 'Pengungsi',
      data: values,
      backgroundColor: CHART_COLORS.cool,
      hoverBackgroundColor: CHART_COLORS.primary,
      borderRadius: 2,
      maxBarThickness: 38,
    }],
  }, {
    scales: { x: yearAxis(), y: countAxis(compactFormat) },
  });
}

window.floodCharts = { initCharts };
