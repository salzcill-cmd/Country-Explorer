const CountriesData = (() => {
  const CACHE_KEY = 'countries_cache';
  const CACHE_DURATION = 60 * 60 * 1000;
  const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
  const BASE_URL = 'https://restcountries.com/v3.1';

  function getCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return data.payload;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  function setCache(payload) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        payload
      }));
    } catch (e) {
      console.warn('Cache write failed:', e);
    }
  }

  async function fetchAllCountries() {
    const cached = getCache();
    if (cached) return cached;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const regionPromises = REGIONS.map(region => {
        const url = `${BASE_URL}/region/${region}`;
        return fetch(url, { signal: controller.signal })
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch ${region}: HTTP ${res.status}`);
            return res.json();
          });
      });

      const results = await Promise.all(regionPromises);
      clearTimeout(timeout);
      
      const allData = results.flat();
      if (!allData.length) throw new Error('No country data received');
      
      setCache(allData);
      return allData;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('Request timeout. Please check your connection.');
      throw err;
    }
  }

  function searchCountries(countries, term) {
    if (!term) return countries;
    const q = term.toLowerCase();
    return countries.filter(c => {
      const name = (c.name?.common || '').toLowerCase();
      const official = (c.name?.official || '').toLowerCase();
      const capital = (c.capital?.[0] || '').toLowerCase();
      const region = (c.region || '').toLowerCase();
      const subregion = (c.subregion || '').toLowerCase();
      return name.includes(q) || official.includes(q) || capital.includes(q) || region.includes(q) || subregion.includes(q);
    });
  }

  function filterByRegion(countries, region) {
    if (!region || region === 'All') return countries;
    return countries.filter(c => c.region === region);
  }

  function getLanguages(country) {
    if (!country.languages) return 'N/A';
    const langs = Object.values(country.languages);
    return langs.slice(0, 2).join(', ');
  }

  function getCurrencies(country) {
    if (!country.currencies) return { name: 'N/A', symbol: '' };
    const entries = Object.entries(country.currencies);
    if (!entries.length) return { name: 'N/A', symbol: '' };
    const [code, val] = entries[0];
    return { name: val.name || code, symbol: val.symbol || '' };
  }

  function formatPopulation(num) {
    if (!num) return '0';
    return num.toLocaleString('en-US').replace(/,/g, '.');
  }

  function formatArea(area) {
    if (!area) return 'N/A';
    return area.toLocaleString('en-US').replace(/,/g, '.') + ' km²';
  }

  function calcDensity(population, area) {
    if (!population || !area) return 'N/A';
    return (population / area).toFixed(2) + ' /km²';
  }

  function getRandomCountries(countries, n = 6) {
    const shuffled = [...countries].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  function getTimezones(country) {
    if (!country.timezones) return 'N/A';
    return country.timezones.join(', ');
  }

  function getCallingCode(country) {
    if (!country.idd) return 'N/A';
    const root = country.idd.root || '';
    const suffix = country.idd.suffixes?.[0] || '';
    return root + suffix;
  }

  function getCoords(country) {
    if (!country.latlng || country.latlng.length < 2) return null;
    return { lat: country.latlng[0], lng: country.latlng[1] };
  }

  return {
    fetchAllCountries,
    searchCountries,
    filterByRegion,
    getLanguages,
    getCurrencies,
    formatPopulation,
    formatArea,
    calcDensity,
    getRandomCountries,
    getTimezones,
    getCallingCode,
    getCoords
  };
})();
