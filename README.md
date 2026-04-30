# Country Explorer

A modern web application for exploring country information worldwide.

## Features

- **Search & Filter**: Real-time search with region filtering
- **Detailed Country Information**: Flags, population, languages, currencies, and more
- **Interactive Maps**: Leaflet.js integration for geographic visualization
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Data Export**: Export filtered results to CSV
- **Statistics Dashboard**: Global country statistics on homepage
- **Featured Countries**: Random selection of 6 countries on homepage

## Technologies Used

- **HTML5** - Structure
- **CSS3** - Styling with TailwindCSS v3 (CDN)
- **JavaScript** - Interactivity (ES6+)
- **TailwindCSS** - Utility-first CSS framework
- **Font Awesome 6** - Icons
- **Leaflet.js v1.9** - Interactive maps
- **Chart.js v4.4** - Data visualization
- **REST Countries API v3.1** - Country data source

## File Structure

```
country-explorer/
├── index.html          # Homepage with statistics and featured countries
├── countries.html      # Main explorer page with search, filter, pagination
├── about.html          # About page with project info
├── style.css           # Custom CSS styles and animations
├── script.js           # Main JavaScript functionality
├── countries-data.js   # API handling and data processing module
└── README.md           # Project documentation
```

## API Integration

This project uses the [REST Countries API v3.1](https://restcountries.com/v3.1/all) for country data.

### Caching Strategy
- Data is cached in localStorage with 1-hour expiry
- Fallback error handling for API failures
- Timeout handling for slow connections (10 seconds)

## Key Functionalities

### script.js Functions
- `fetchAllCountries()` - Fetch and cache country data
- `renderCountryCards(countries, page)` - Render paginated country grid
- `filterCountries(searchTerm, region)` - Filter with search and region
- `showModal(country)` - Display detailed country modal
- `initLeafletMap(lat, lng, name)` - Initialize interactive map
- `updateStats()` - Update homepage statistics
- `darkModeToggle()` - Toggle dark/light theme
- `copyToClipboard(text)` - Copy country name to clipboard
- `exportToCSV()` - Export filtered data to CSV
- `debounce(func, delay)` - Optimize search input

### countries-data.js Module
- API fetching with cache management
- Search and filter utilities
- Data formatting helpers
- Language and currency extraction

## Responsive Breakpoints

- **Mobile**: < 640px (1 column)
- **Tablet**: 640px - 1024px (2 columns)
- **Desktop**: > 1024px (4 columns)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Setup Instructions

1. Clone or download the files
2. Open `index.html` in a web browser
3. No build process required - all dependencies loaded via CDN

## Notes

- All data is fetched from REST Countries API
- LocalStorage is used for caching and user preferences
- Leaflet maps require coordinate data (gracefully handles missing data)
- Skeleton loading states for better UX
- Toast notifications for user feedback

## License

MIT License - Free to use for personal and commercial projects.

## Contact

For questions or feedback, contact: contact@countryexplorer.com
