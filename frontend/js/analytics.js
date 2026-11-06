class AnalyticsManager {
    constructor() {
        this.app = window.app;
        this.charts = {};
        this.init();
    }

    init() {
        if (this.app.currentSection === 'analytics') {
            this.loadAnalyticsData();
        }
    }

    async loadAnalyticsData() {
        try {
            this.app.showLoadingSpinner();
            const dateFrom = this.getDateString(-30);
            const dateTo = this.getDateString(0);
            const dailyShipments = await api.getShipmentsByDateRange(dateFrom, dateTo);
            const flightsByAirline = await api.getFlightsByAirline();
            const shipmentsByAirline = await api.getShipmentsByAirline();
            this.createDailyShipmentsChart(dailyShipments);
            this.createFlightsByAirlineChart(flightsByAirline);
            this.createShipmentTypeChart();
        } catch (error) {
            console.error('Error cargando datos de analítica:', error);
            this.app.showToast('Error cargando datos de analítica', 'error');
        } finally {
            this.app.hideLoadingSpinner();
        }
    }

    createDailyShipmentsChart(data) {
        const ctx = document.getElementById('dailyShipmentsChart');
        if (!ctx) return;
        if (this.charts.dailyShipmentsChart) {
            this.charts.dailyShipmentsChart.destroy();
        }
        const labels = data.map(item => item.date);
        const totalData = data.map(item => item.total);
        const completeData = data.map(item => item.complete);
        const partialData = data.map(item => item.partial);
        const pendingData = data.map(item => item.pending);
        this.charts.dailyShipmentsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total de Guías',
                        data: totalData,
                        borderColor: 'rgba(37, 99, 235, 1)',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Completas',
                        data: completeData,
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Parciales',
                        data: partialData,
                        borderColor: 'rgba(245, 158, 11, 1)',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Pendientes',
                        data: pendingData,
                        borderColor: 'rgba(239, 68, 68, 1)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    }
                ]
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

    createFlightsByAirlineChart(data) {
        const ctx = document.getElementById('flightsByAirlineChart');
        if (!ctx) return;
        if (this.charts.flightsByAirlineChart) {
            this.charts.flightsByAirlineChart.destroy();
        }
        const labels = data.map(item => item.name);
        const values = data.map(item => item.flight_count);
        this.charts.flightsByAirlineChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Número de Vuelos',
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

    createShipmentTypeChart() {
        const ctx = document.getElementById('shipmentTypeChart');
        if (!ctx) return;
        if (this.charts.shipmentTypeChart) {
            this.charts.shipmentTypeChart.destroy();
        }
        const labels = ['Carga General', 'Perecederos', 'Farmacéuticos', 'Correo', 'Exprés', 'Peligrosos'];
        const data = [45, 20, 15, 10, 7, 3];
        const backgroundColors = [
            'rgba(37, 99, 235, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(124, 58, 237, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(236, 72, 153, 0.7)'
        ];
        const borderColors = [
            'rgba(37, 99, 235, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(124, 58, 237, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(236, 72, 153, 1)'
        ];
        this.charts.shipmentTypeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
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

    getDateString(daysAgo = 0) {
        const date = new Date();
        date.setDate(date.getDate() + daysAgo);
        return date.toISOString().split('T')[0];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.analyticsManager = new AnalyticsManager();
    }
});
