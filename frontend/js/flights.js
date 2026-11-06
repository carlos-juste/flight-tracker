class FlightsManager {
    constructor() {
        this.app = window.app;
        this.init();
    }

    init() {
        this.setupEventListeners();
        if (this.app.currentSection === 'flights') {
            this.loadFlightsData();
        }
    }

    setupEventListeners() {
        const filters = [
            'flightAirlineFilter',
            'flightOriginFilter',
            'flightStatusFilter',
            'flightDateFrom',
            'flightDateTo'
        ];

        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.loadFlightsData();
                });
            }
        });

        const searchFlightsBtn = document.getElementById('searchFlightsBtn');
        if (searchFlightsBtn) {
            searchFlightsBtn.addEventListener('click', () => {
                this.loadFlightsData();
            });
        }
    }

    async loadFlightsData() {
        try {
            this.app.showLoadingSpinner();
            const filters = this.getFlightFilters();
            const flights = await api.getFlights(filters);
            this.updateFlightsTable(flights);
        } catch (error) {
            console.error('Error cargando vuelos:', error);
            this.app.showToast('Error cargando vuelos', 'error');
        } finally {
            this.app.hideLoadingSpinner();
        }
    }

    getFlightFilters() {
        return {
            airline_code: document.getElementById('flightAirlineFilter')?.value || null,
            origin_airport: document.getElementById('flightOriginFilter')?.value || null,
            destination_airport: 'MAD',
            status: document.getElementById('flightStatusFilter')?.value || null,
            date_from: document.getElementById('flightDateFrom')?.value || null,
            date_to: document.getElementById('flightDateTo')?.value || null
        };
    }

    updateFlightsTable(flights) {
        const tbody = document.getElementById('flightsBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (flights.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan=\"10\">No se encontraron vuelos</td>';
            tbody.appendChild(row);
            return;
        }

        flights.sort((a, b) => new Date(b.departure_time) - new Date(a.departure_time));

        flights.forEach(flight => {
            const row = document.createElement('tr');
            const duration = flight.flight_duration_minutes ?
                `${Math.floor(flight.flight_duration_minutes / 60)}h ${flight.flight_duration_minutes % 60}m` :
                'N/A';

            row.innerHTML = `
                <td><strong>${flight.flight_number}</strong></td>
                <td>${flight.airline_name}</td>
                <td>${flight.origin_airport} - ${flight.origin_name}</td>
                <td>${flight.destination_airport} - ${flight.destination_name}</td>
                <td>${this.formatDateTime(flight.departure_time)}</td>
                <td>${this.formatDateTime(flight.arrival_time)}</td>
                <td>${duration}</td>
                <td>${flight.aircraft_type || 'N/A'}</td>
                <td><span class=\"status-badge ${flight.status}\">${this.getStatusLabel(flight.status)}</span></td>
                <td>
                    <div class=\"action-buttons\">
                        <button class=\"action-btn view\" title=\"Ver detalles\">
                            <i class=\"fas fa-eye\"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    getStatusLabel(status) {
        const labels = {
            scheduled: 'Programado',
            in_flight: 'En Vuelo',
            landed: 'Aterrizado',
            delayed: 'Retrasado',
            cancelled: 'Cancelado'
        };
        return labels[status] || status;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.flightsManager = new FlightsManager();
    }
});
