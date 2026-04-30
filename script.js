let allCountries = [];
let filteredCountries = [];
let currentPage = 1;
const perPage = 12;
let currentSearchTerm = '';
let currentRegion = 'All';
let leafletMap = null;

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied: ' + text, 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

function darkModeToggle() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  if (isDark) {
    html.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
  } else {
    html.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }
}

function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  const html = document.documentElement;
  if (saved === 'true') {
    html.classList.add('dark');
  } else if (saved === 'false') {
    html.classList.remove('dark');
  }
  const toggleBtn = document.getElementById('darkModeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', darkModeToggle);
  }
}

function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.classList.remove('opacity-0', 'invisible');
      btn.classList.add('opacity-100', 'visible');
    } else {
      btn.classList.add('opacity-0', 'invisible');
      btn.classList.remove('opacity-100', 'visible');
    }
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function renderCountryCards(countries, page) {
  const grid = document.getElementById('countriesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const pageCountries = countries.slice(start, end);
  if (pageCountries.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-400 py-16 text-xl">No countries found.</p>';
    return;
  }
  pageCountries.forEach(country => {
    const card = document.createElement('div');
    card.className = 'country-card bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden';
    const flagUrl = country.flags?.png || country.flags?.svg || '';
    const countryName = country.name?.common || 'Unknown';
    const capital = country.capital?.[0] || 'N/A';
    const population = CountriesData.formatPopulation(country.population);
    const languages = CountriesData.getLanguages(country);
    card.innerHTML = `
      <div class="flag-img">
        ${flagUrl ? `<img src="${flagUrl}" alt="Flag of ${countryName}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\\'flag-emoji\\'>🏳️</div>'">` : '<div class="flag-emoji">🏳️</div>'}
      </div>
      <div class="p-4">
        <h2 class="font-heading text-lg font-bold mb-2 text-gray-800 dark:text-white">${countryName}</h2>
        <p class="text-gray-600 dark:text-gray-300 text-sm mb-1"><i class="fas fa-city mr-2 text-blue-600 dark:text-blue-400"></i>🏙️ ${capital}</p>
        <p class="text-gray-600 dark:text-gray-300 text-sm mb-1"><i class="fas fa-users mr-2 text-green-600 dark:text-green-400"></i>👥 ${population}</p>
        <p class="text-gray-600 dark:text-gray-300 text-sm mb-3"><i class="fas fa-language mr-2 text-purple-600 dark:text-purple-400"></i>🌐 ${languages}</p>
        <button class="detail-btn w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" data-country='${JSON.stringify(country).replace(/'/g, "&#39;")}'>
          Detail
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
  document.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const countryData = JSON.parse(e.target.dataset.country);
      showModal(countryData);
    });
  });
}

function updatePagination(total) {
  const totalPages = Math.ceil(total / perPage);
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

function filterCountries(searchTerm, region) {
  currentSearchTerm = searchTerm;
  currentRegion = region;
  let result = CountriesData.searchCountries(allCountries, searchTerm);
  result = CountriesData.filterByRegion(result, region);
  filteredCountries = result;
  currentPage = 1;
  renderCountryCards(filteredCountries, currentPage);
  updatePagination(filteredCountries.length);
  const resultsInfo = document.getElementById('resultsInfo');
  if (resultsInfo) {
    resultsInfo.textContent = `Showing ${filteredCountries.length} countries`;
  }
  localStorage.setItem('searchTerm', searchTerm);
  localStorage.setItem('selectedRegion', region);
}

function showModal(country) {
  const modal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');
  if (!modal || !modalBody) return;
  const flagUrl = country.flags?.png || country.flags?.svg || '';
  const nameCommon = country.name?.common || 'Unknown';
  const nameOfficial = country.name?.official || 'N/A';
  const capital = country.capital?.[0] || 'N/A';
  const region = country.region || 'N/A';
  const subregion = country.subregion || 'N/A';
  const population = CountriesData.formatPopulation(country.population);
  const area = CountriesData.formatArea(country.area);
  const density = CountriesData.calcDensity(country.population, country.area);
  const currencies = CountriesData.getCurrencies(country);
  const timezones = CountriesData.getTimezones(country);
  const callingCode = CountriesData.getCallingCode(country);
  const coords = CountriesData.getCoords(country);
  const mapsUrl = coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : '#';
  modalBody.innerHTML = `
    <div class="mb-6">
      ${flagUrl ? `<img src="${flagUrl}" alt="Flag of ${nameCommon}" class="w-full h-48 object-cover rounded-lg" onerror="this.outerHTML='<div class=\\'text-6xl text-center py-8\\'>🏳️</div>'">` : '<div class="text-6xl text-center py-8">🏳️</div>'}
    </div>
    <h2 class="font-heading text-2xl font-bold mb-1">${nameCommon}</h2>
    <p class="text-gray-600 dark:text-gray-400 mb-4">${nameOfficial}</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><strong>🏙️ Ibukota:</strong> ${capital}</div>
      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><strong>Benua:</strong> ${region}</div>
      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><strong>Subregion:</strong> ${subregion}</div>
      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><strong>👥 Populasi:</strong> ${population}</div>
      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><strong>Luas:</strong> ${area}</div>
      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><strong>Kepadatan:</strong> ${density}</div>
      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><strong>💰 Mata Uang:</strong> ${currencies.name} ${currencies.symbol}</div>
      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><strong>🕐 Zona Waktu:</strong> ${timezones}</div>
      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><strong>📞 Kode Panggilan:</strong> ${callingCode}</div>
    </div>
    <div class="mb-4">
      <a href="${mapsUrl}" target="_blank" class="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
        <i class="fas fa-map-marker-alt mr-2"></i>Lihat di Maps
      </a>
      <button onclick="copyToClipboard('${nameCommon}')" class="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
        <i class="fas fa-share-alt mr-2"></i>Share
      </button>
    </div>
    <div id="map" class="w-full h-[200px] rounded-lg"></div>
  `;
  modal.classList.add('active');
  if (coords) {
    setTimeout(() => initLeafletMap(coords.lat, coords.lng, nameCommon), 100);
  } else {
    const mapDiv = document.getElementById('map');
    if (mapDiv) mapDiv.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-8">Map not available</p>';
  }
  document.addEventListener('keydown', handleEscKey);
}

function closeModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.classList.remove('active');
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }
  document.removeEventListener('keydown', handleEscKey);
}

function handleEscKey(e) {
  if (e.key === 'Escape') closeModal();
}

function initLeafletMap(lat, lng, name) {
  const mapDiv = document.getElementById('map');
  if (!mapDiv) return;
  if (leafletMap) leafletMap.remove();
  try {
    leafletMap = L.map('map').setView([lat, lng], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);
    L.marker([lat, lng]).addTo(leafletMap).bindPopup(name).openPopup();
  } catch (e) {
    mapDiv.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-8">Map failed to load</p>';
  }
}

async function fetchAllCountries() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const countriesGrid = document.getElementById('countriesGrid');
  if (loadingState) loadingState.classList.remove('hidden');
  if (errorState) errorState.classList.add('hidden');
  if (countriesGrid) countriesGrid.innerHTML = '';
  try {
    const data = await CountriesData.fetchAllCountries();
    allCountries = data;
    filteredCountries = data;
    if (loadingState) loadingState.classList.add('hidden');
    const savedSearch = localStorage.getItem('searchTerm') || '';
    const savedRegion = localStorage.getItem('selectedRegion') || 'All';
    const searchInput = document.getElementById('searchInput');
    const regionBtns = document.querySelectorAll('.region-btn');
    if (searchInput) searchInput.value = savedSearch;
    regionBtns.forEach(btn => {
      if (btn.dataset.region === savedRegion) {
        btn.classList.remove('bg-gray-200', 'dark:bg-gray-700');
        btn.classList.add('bg-blue-600', 'text-white');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'dark:bg-gray-700');
      }
    });
    filterCountries(savedSearch, savedRegion);
  } catch (err) {
    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) {
      errorState.classList.remove('hidden');
      const errorMessage = document.getElementById('errorMessage');
      if (errorMessage) errorMessage.textContent = err.message || 'Failed to load countries data.';
    }
  }
}

function updateStats() {
  const totalCountriesEl = document.getElementById('totalCountries');
  const totalPopulationEl = document.getElementById('totalPopulation');
  const avgAreaEl = document.getElementById('avgArea');
  if (!totalCountriesEl || !allCountries.length) return;
  const total = allCountries.length;
  const popSum = allCountries.reduce((sum, c) => sum + (c.population || 0), 0);
  const areaSum = allCountries.reduce((sum, c) => sum + (c.area || 0), 0);
  const avgArea = areaSum / total;
  totalCountriesEl.textContent = total;
  totalPopulationEl.textContent = CountriesData.formatPopulation(popSum);
  avgAreaEl.textContent = Math.round(avgArea).toLocaleString('en-US').replace(/,/g, '.') + ' km²';
}

function renderFeaturedCountries() {
  const container = document.getElementById('featuredCountries');
  if (!container) return;
  const featured = CountriesData.getRandomCountries(allCountries, 6);
  container.innerHTML = '';
  featured.forEach(country => {
    const flagUrl = country.flags?.png || country.flags?.svg || '';
    const countryName = country.name?.common || 'Unknown';
    const capital = country.capital?.[0] || 'N/A';
    const population = CountriesData.formatPopulation(country.population);
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden country-card';
    card.innerHTML = `
      <div class="h-32 overflow-hidden">
        ${flagUrl ? `<img src="${flagUrl}" alt="Flag of ${countryName}" class="w-full h-full object-cover" onerror="this.outerHTML='<div class=\\'text-4xl text-center py-8\\'>🏳️</div>'">` : '<div class="text-4xl text-center py-8">🏳️</div>'}
      </div>
      <div class="p-4">
        <h3 class="font-heading font-bold text-lg mb-1">${countryName}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300"><i class="fas fa-city mr-1"></i> ${capital}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300"><i class="fas fa-users mr-1"></i> ${population}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function exportToCSV() {
  if (!filteredCountries.length) {
    showToast('No data to export', 'error');
    return;
  }
  const headers = ['Name', 'Capital', 'Region', 'Population', 'Languages', 'Currencies'];
  const rows = filteredCountries.map(c => [
    c.name?.common || 'N/A',
    c.capital?.[0] || 'N/A',
    c.region || 'N/A',
    c.population || 0,
    CountriesData.getLanguages(c),
    CountriesData.getCurrencies(c).name
  ]);
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'countries.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported successfully', 'success');
}

function initHomePage() {
  const searchInput = document.getElementById('homeSearch');
  const autocompleteDiv = document.getElementById('homeSearchAutocomplete');
  if (searchInput && autocompleteDiv) {
    const handleSearch = debounce((term) => {
      if (!term) {
        autocompleteDiv.classList.add('hidden');
        return;
      }
      const results = CountriesData.searchCountries(allCountries, term).slice(0, 5);
      if (results.length === 0) {
        autocompleteDiv.classList.add('hidden');
        return;
      }
      autocompleteDiv.innerHTML = '';
      results.forEach(country => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item text-gray-800 dark:text-gray-200';
        item.textContent = country.name.common;
        item.addEventListener('click', () => {
          window.location.href = `countries.html?search=${encodeURIComponent(country.name.common)}`;
        });
        autocompleteDiv.appendChild(item);
      });
      autocompleteDiv.classList.remove('hidden');
    }, 300);
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
        autocompleteDiv.classList.add('hidden');
      }
    });
  }
  updateStats();
  renderFeaturedCountries();
}

function initCountriesPage() {
  const searchInput = document.getElementById('searchInput');
  const regionBtns = document.querySelectorAll('.region-btn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const retryBtn = document.getElementById('retryBtn');
  const exportBtn = document.getElementById('exportBtn');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      filterCountries(e.target.value, currentRegion);
    }, 300));
  }
  regionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      regionBtns.forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white');
        b.classList.add('bg-gray-200', 'dark:bg-gray-700');
      });
      btn.classList.remove('bg-gray-200', 'dark:bg-gray-700');
      btn.classList.add('bg-blue-600', 'text-white');
      filterCountries(searchInput?.value || '', btn.dataset.region);
    });
  });
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCountryCards(filteredCountries, currentPage);
        updatePagination(filteredCountries.length);
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredCountries.length / perPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderCountryCards(filteredCountries, currentPage);
        updatePagination(filteredCountries.length);
      }
    });
  }
  if (retryBtn) {
    retryBtn.addEventListener('click', () => fetchAllCountries());
  }
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
  }
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam && searchInput) {
    searchInput.value = searchParam;
  }
  fetchAllCountries();
}

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initBackToTop();
  const page = window.location.pathname.split('/').pop();
  if (page === 'index.html' || page === '') {
    CountriesData.fetchAllCountries().then(data => {
      allCountries = data;
      initHomePage();
    }).catch(err => {
      showToast(err.message || 'Failed to load data', 'error');
    });
  } else if (page === 'countries.html') {
    initCountriesPage();
  }
});
