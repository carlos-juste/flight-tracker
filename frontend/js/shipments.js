class ShipmentsManager {
    constructor() {
        this.app = window.app;
        this.init();
    }

    init() {
        this.setupEventListeners();
        if (this.app.currentSection === 'shipments') {
            this.loadShipmentsData();
        }
    }

    setupEventListeners() {
        const filters = [
            'shipmentAirlineFilter',
            'shipmentOriginFilter',
            'shipmentStatusFilter',
            'shipmentGuideNumber',
            'shipmentDateFrom',
            'shipmentDateTo'
        ];

        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.loadShipmentsData();
                });
            }
        });

        const guideNumberInput = document.getElementById('shipmentGuideNumber');
        if (guideNumberInput) {
            let searchTimeout;
            guideNumberInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.loadShipmentsData();
                }, 500);
            });
        }

        const searchShipmentsBtn = document.getElementById('searchShipmentsBtn');
        if (searchShipmentsBtn) {
            searchShipmentsBtn.addEventListener('click', () => {
                this.loadShipmentsData();
            });
        }
    }

    async loadShipmentsData() {
        try {
            this.app.showLoadingSpinner();
            const filters = this.getShipmentFilters();
            const shipments = await api.getShipments(filters);
            this.updateShipmentsTable(shipments);
        } catch (error) {
            console.error('Error cargando guías:', error);
            this.app.showToast('Error cargando guías', 'error');
        } finally {
            this.app.hideLoadingSpinner();
        }
    }

    getShipmentFilters() {
        return {
            airline_code: document.getElementById('shipmentAirlineFilter')?.value || null,
            origin_airport: document.getElementById('shipmentOriginFilter')?.value || null,
            destination_airport: 'MAD',
            status: document.getElementById('shipmentStatusFilter')?.value || null,
            guide_number: document.getElementById('shipmentGuideNumber')?.value || null,
            date_from: document.getElementById('shipmentDateFrom')?.value || null,
            date_to: document.getElementById('shipmentDateTo')?.value || null
        };
    }

    updateShipmentsTable(shipments) {
        const tbody = document.getElementById('shipmentsBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (shipments.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan=\"11\">No se encontraron guías</td>';
            tbody.appendChild(row);
            return;
        }

        shipments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        shipments.forEach(shipment => {
            const row = document.createElement('tr');
            const packagesText = shipment.received_packages + '/' + shipment.total_packages;
            const packagesClass = shipment.total_packages === shipment.received_packages ? 'complete' :
                                  shipment.received_packages > 0 ? 'partial' : 'pending';

            row.innerHTML = `
                <td><strong>${shipment.guide_number}</strong></td>
                <td>${shipment.flight_number || 'N/A'}</td>
                <td>${shipment.airline_name}</td>
                <td>${shipment.origin_airport} - ${shipment.origin_name}</td>
                <td>${shipment.destination_airport} - ${shipment.destination_name}</td>
                <td>${this.getShipmentTypeLabel(shipment.shipment_type)}</td>
                <td><span class=\"package-badge ${packagesClass}\">${packagesText}</span></td>
                <td>${shipment.weight_kg ? shipment.weight_kg.toFixed(2) : 'N/A'}</td>
                <td><span class=\"status-badge ${shipment.status}\">${this.getShipmentStatusLabel(shipment.status)}</span></td>
                <td>${this.formatDateTime(shipment.updated_at || shipment.created_at)}</td>
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

    getShipmentTypeLabel(type) {
        const labels = {
            general: 'Carga General',
            perishable: 'Perecederos',
            dangerous: 'Mercancías Peligrosas',
            pharmaceutical: 'Farmacéuticos',
            mail: 'Correo',
            express: 'Envíos Exprés'
        };
        return labels[type] || type;
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
    if (window.app) {
        window.shipmentsManager = new ShipmentsManager();
    }
});
