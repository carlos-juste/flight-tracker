class FlightTrackerApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.charts = {};
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.init();
    }

    async init() {
        console.log('Inicializando Flight Tracker App...');
        this.initNavigation();
        this.initModals();
        this.initToasts();
        this.initLoadingSpinner();

        await this.loadInitialData();
        this.startAutoRefresh();
        this.setupGlobalListeners();
        console.log('Flight Tracker App inicializado correctamente');
    }

    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.switchSection(section);
            });
        });

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshCurrentSection();
            });
        }
    }

    switchSection(section) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });

        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });

        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
            this.loadSectionData(section);
        }
    }

    async loadInitialData() {
        try {
            const health = await api.healthCheck();
            if (health.status !== 'ok') {
                this.showToast('Error al conectar con el servidor', 'error');
                return;
            }
            await this.loadAirlines();
            await this.loadAirports();
            if (this.currentSection === 'dashboard') {
                await this.loadDashboardData();
            }
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            this.showToast('Error cargando datos iniciales', 'error');
        }
    }

    async loadAirlines() {
        try {
            const airlines = await api.getAirlines();
            this.cacheAirlines(airlines);
        } catch (error) {
            console.error('Error cargando aerolíneas:', error);
        }
    }

    cacheAirlines(airlines) {
        const airlineSelects = document.querySelectorAll('[id$="AirlineFilter"]');
        airlineSelects.forEach(select => {
            while (select.options.length > 1) {
                select.remove(1);
            }
            airlines.forEach(airline => {
                const option = document.createElement('option');
                option.value = airline.code;
                option.textContent = airline.name;
                select.appendChild(option);
            });
        });
    }

    async loadAirports() {
        try {
            const airports = await api.getAirports();
            this.cacheAirports(airports);
        } catch (error) {
            console.error('Error cargando aeropuertos:', error);
        }
    }

    cacheAirports(airports) {
        const airportSelects = document.querySelectorAll('[id$="OriginFilter"]');
        airportSelects.forEach(select => {
            while (select.options.length > 1) {
                select.remove(1);
            }
            const originAirports = airports.filter(a => a.type === 'origin');
            originAirports.forEach(airport => {
                const option = document.createElement('option');
                option.value = airport.code;
                option.textContent = `${airport.code} - ${airport.name}`;
                select.appendChild(option);
            });
        });
    }

    async loadDashboardData() {
        try {
            this.showLoadingSpinner();
            const stats = await api.getDashboardStats();
            this.updateStatsCards(stats);
            const recentFlights = await api.getFlights({
                destination_airport: 'MAD'
            });
            this.updateRecentFlightsTable(recentFlights);
            const recentShipments = await api.getShipments({
                destination_airport: 'MAD'
            });
            this.updateRecentShipmentsTable(recentShipments);
            this.loadCharts();
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            this.showToast('Error cargando datos del dashboard', 'error');
        } finally {
            this.hideLoadingSpinner();
        }
    }

    updateStatsCards(stats) {
        const statMappings = {
            totalFlights: 'totalFlights',
            totalShipments: 'totalShipments',
            completeShipments: 'completeShipments',
            partialShipments: 'partialShipments',
            pendingShipments: 'pendingShipments'
        };
        Object.entries(statMappings).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element && stats[key] !== undefined) {
                element.textContent = stats[key].toLocaleString();
            }
        });
    }

    updateRecentFlightsTable(flights) {
        const tbody = document.getElementById('recentFlightsBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (flights.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan=\"7\">No hay vuelos recientes</td>';
            tbody.appendChild(row);
            return;
        }
        flights.sort((a, b) => new Date(b.departure_time) - new Date(a.departure_time));
        const recentFlights = flights.slice(0, 5);
        recentFlights.forEach(flight => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${flight.flight_number}</strong></td>
                <td>${flight.airline_name}</td>
                <td>${flight.origin_airport} - ${flight.origin_name}</td>
                <td>${flight.destination_airport} - ${flight.destination_name}</td>
                <td>${this.formatDateTime(flight.departure_time)}</td>
                <td>${this.formatDateTime(flight.arrival_time)}</td>
                <td><span class=\"status-badge ${flight.status}\">${this.getStatusLabel(flight.status)}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    updateRecentShipmentsTable(shipments) {
        const tbody = document.getElementById('recentShipmentsBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (shipments.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan=\"6\">No hay guías recientes</td>';
            tbody.appendChild(row);
            return;
        }
        shipments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const recentShipments = shipments.slice(0, 5);
        recentShipments.forEach(shipment => {
            const row = document.createElement('tr');
            const packagesText = shipment.received_packages + '/' + shipment.total_packages;
            const packagesClass = shipment.total_packages === shipment.received_packages ? 'complete' :
                                  shipment.received_packages > 0 ? 'partial' : 'pending';
            row.innerHTML = `
                <td><strong>${shipment.guide_number}</strong></td>
                <td>${shipment.airline_name}</td>
                <td>${shipment.origin_airport} - ${shipment.origin_name}</td>
                <td><span class=\"package-badge ${packagesClass}\">${packagesText}</span></td>
                <td><span class=\"status-badge ${shipment.status}\">${this.getShipmentStatusLabel(shipment.status)}</span></td>
                <td>${this.formatDateTime(shipment.updated_at || shipment.created_at)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadCharts() {
        try {
            const shipmentsByAirline = await api.getShipmentsByAirline();
            this.createAirlineChart(shipmentsByAirline);
            const stats = await api.getDashboardStats();
            this.createStatusChart(stats);
        } catch (error) {
            console.error('Error cargando gráficos:', error);
        }
    }

    createAirlineChart(data) {
        const ctx = document.getElementById('airlineChart');
        if (!ctx) return;
        if (this.charts.airlineChart) {
            this.charts.airlineChart.destroy();
        }
        const labels = data.map(item => item.name);
        const values = data.map(item => item.total_shipments);
        this.charts.airlineChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Guías por Aerolínea',
                    data: values,
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.7)',
                        'rgba(124, 58, 237, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(239, 68, 68, 0.7)'
                    ],
                    borderColor: [
                        'rgba(37, 99, 235, 1)',
                        'rgba(124, 58, 237, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    createStatusChart(data) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        if (this.charts.statusChart) {
            this.charts.statusChart.destroy();
        }
        const statusLabels = ['Completas', 'Parciales', 'Pendientes'];
        const statusValues = [
            data.completeShipments || 0,
            data.partialShipments || 0,
            data.pendingShipments || 0
        ];
        const backgroundColors = [
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)'
        ];
        const borderColors = [
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)'
        ];
        this.charts.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusValues,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'flights':
                await this.loadFlightsData();
                break;
            case 'shipments':
                await this.loadShipmentsData();
                break;
        }
    }

    async refreshCurrentSection() {
        this.showLoadingSpinner();
        try {
            api.clearCache();
            await this.loadSectionData(this.currentSection);
            this.showToast('Datos actualizados correctamente', 'success');
        } catch (error) {
            console.error('Error actualizando datos:', error);
            this.showToast('Error actualizando datos', 'error');
        } finally {
            this.hideLoadingSpinner();
        }
    }

    startAutoRefresh() {
        if (this.autoRefreshEnabled) {
            this.refreshInterval = setInterval(() => {
                this.refreshCurrentSection();
            }, 300000);
        }
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    setupGlobalListeners() {
        const addFlightBtn = document.getElementById('addFlightBtn');
        if (addFlightBtn) {
            addFlightBtn.addEventListener('click', () => {
                this.showAddFlightModal();
            });
        }
        const addShipmentBtn = document.getElementById('addShipmentBtn');
        if (addShipmentBtn) {
            addShipmentBtn.addEventListener('click', () => {
                this.showAddShipmentModal();
            });
        }
    }

    showModal(title, content, buttons = []) {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');
        const modalOverlay = document.getElementById('modalOverlay');
        if (!modalTitle || !modalBody || !modalFooter || !modalOverlay) return;
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modalFooter.innerHTML = '';
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn btn-${btn.type}`;
            button.textContent = btn.text;
            button.addEventListener('click', btn.action);
            modalFooter.appendChild(button);
        });
        modalOverlay.classList.remove('hidden');
    }

    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        const icon = document.createElement('i');
        icon.className = `fas ${iconMap[type]} toast-icon`;
        const messageSpan = document.createElement('span');
        messageSpan.className = 'toast-message';
        messageSpan.textContent = message;
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '<i class=\"fas fa-times\"></i>';
        closeBtn.addEventListener('click', () => { toast.remove(); });
        toast.appendChild(icon);
        toast.appendChild(messageSpan);
        toast.appendChild(closeBtn);
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => { toast.remove(); }, 300);
        }, duration);
    }

    showLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.remove('hidden');
    }

    hideLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.add('hidden');
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

    getShipmentStatusLabel(status) {
        const labels = {
            pending: 'Pendiente',
            in_transit: 'En Tránsito',
            partial: 'Parcial',
            complete: 'Completa',
            delivered: 'Entregada',
            delayed: 'Retrasada',
            cancelled: 'Cancelada'
        };
        return labels[status] || status;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FlightTrackerApp();
});
