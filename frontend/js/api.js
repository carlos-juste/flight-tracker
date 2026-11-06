class FlightTrackerAPI {
    constructor() {
        this.baseUrl = window.location.origin + '/api';
        this.cache = new Map();
        this.cacheTimeout = 300000;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        if (options.method === 'GET' || !options.method) {
            const cacheKey = url + JSON.stringify(options.params || {});
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : null
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (options.method === 'GET' || !options.method) {
                const cacheKey = url + JSON.stringify(options.params || {});
                this.cache.set(cacheKey, { data, timestamp: Date.now() });
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async getAirlines() {
        return this.request('/airlines');
    }

    async getAirports(type = null) {
        return this.request('/airports', { method: 'GET', params: { type } });
    }

    async getFlights(filter = {}) {
        const params = new URLSearchParams();
        if (filter.airline_code) params.append('airline_code', filter.airline_code);
        if (filter.origin_airport) params.append('origin_airport', filter.origin_airport);
        if (filter.destination_airport) params.append('destination_airport', filter.destination_airport);
        if (filter.status) params.append('status', filter.status);
        if (filter.date_from) params.append('date_from', filter.date_from);
        if (filter.date_to) params.append('date_to', filter.date_to);
        const queryString = params.toString();
        return this.request(`/flights${queryString ? '?' + queryString : ''}`);
    }

    async createFlight(flight) {
        return this.request('/flights', { method: 'POST', body: flight });
    }

    async getShipments(filter = {}) {
        const params = new URLSearchParams();
        if (filter.airline_code) params.append('airline_code', filter.airline_code);
        if (filter.origin_airport) params.append('origin_airport', filter.origin_airport);
        if (filter.destination_airport) params.append('destination_airport', filter.destination_airport);
        if (filter.status) params.append('status', filter.status);
        if (filter.guide_number) params.append('guide_number', filter.guide_number);
        if (filter.date_from) params.append('date_from', filter.date_from);
        if (filter.date_to) params.append('date_to', filter.date_to);
        const queryString = params.toString();
        return this.request(`/shipments${queryString ? '?' + queryString : ''}`);
    }

    async getShipmentByGuideNumber(guideNumber) {
        return this.request(`/shipments/${guideNumber}`);
    }

    async createShipment(shipment) {
        return this.request('/shipments', { method: 'POST', body: shipment });
    }

    async updateShipmentStatus(shipmentId, status, notes = null, updatedBy = null) {
        return this.request(`/shipments/${shipmentId}/status`, {
            method: 'PUT',
            body: { status, notes, updatedBy }
        });
    }

    async updateShipmentPackages(shipmentId, receivedPackages) {
        return this.request(`/shipments/${shipmentId}/packages`, {
            method: 'PUT',
            body: { receivedPackages }
        });
    }

    async getDashboardStats() {
        return this.request('/stats/dashboard');
    }

    async getShipmentsByDateRange(dateFrom, dateTo) {
        return this.request(`/stats/shipments-by-date?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    }

    async getFlightsByAirline() {
        return this.request('/stats/flights-by-airline');
    }

    async getShipmentsByAirline() {
        return this.request('/stats/shipments-by-airline');
    }

    async getAirlinesConfig() {
        return this.request('/config/airlines');
    }

    async getOriginAirportsConfig() {
        return this.request('/config/origin-airports');
    }

    async getDestinationAirportConfig() {
        return this.request('/config/destination-airport');
    }

    async getShipmentTypesConfig() {
        return this.request('/config/shipment-types');
    }

    async getShipmentStatusesConfig() {
        return this.request('/config/shipment-statuses');
    }

    async healthCheck() {
        return this.request('/health');
    }

    clearCache() {
        this.cache.clear();
    }
}

const api = new FlightTrackerAPI();
