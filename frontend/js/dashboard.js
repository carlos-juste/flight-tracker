class DashboardManager {
    constructor() {
        this.app = window.app;
        this.init();
    }

    init() {
        if (this.app.currentSection === 'dashboard') {
            this.loadDashboardData();
        }
    }

    async loadDashboardData() {
        try {
            this.app.showLoadingSpinner();
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
            this.app.showToast('Error cargando datos del dashboard', 'error');
        } finally {
            this.app.hideLoadingSpinner();
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
                <td>${this.app.formatDateTime(flight.departure_time)}</td>
                <td>${this.app.formatDateTime(flight.arrival_time)}</td>
                <td><span class=\"status-badge ${flight.status}\">${this.app.getStatusLabel(flight.status)}</span></td>
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
                <td><span class=\"status-badge ${shipment.status}\">${this.app.getShipmentStatusLabel(shipment.status)}</span></td>
                <td>${this.app.formatDateTime(shipment.updated_at || shipment.created_at)}</td>
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
        if (this.app.charts.airlineChart) {
            this.app.charts.airlineChart.destroy();
        }
        const labels = data.map(item => item.name);
        const values = data.map(item => item.total_shipments);
        this.app.charts.airlineChart = new Chart(ctx, {
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
        if (this.app.charts.statusChart) {
            this.app.charts.statusChart.destroy();
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
        this.app.charts.statusChart = new Chart(ctx, {
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
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.dashboardManager = new DashboardManager();
    }
});
