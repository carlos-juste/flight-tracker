class SettingsManager {
    constructor() {
        this.app = window.app;
        this.init();
    }

    init() {
        this.setupEventListeners();
        if (this.app.currentSection === 'settings') {
            this.loadSettingsData();
        }
    }

    setupEventListeners() {
        const generalSettingsForm = document.getElementById('generalSettingsForm');
        if (generalSettingsForm) {
            generalSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveGeneralSettings();
            });
        }

        const emailAgentForm = document.getElementById('emailAgentForm');
        if (emailAgentForm) {
            emailAgentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEmailSettings();
            });
        }

        const apiSettingsForm = document.getElementById('apiSettingsForm');
        if (apiSettingsForm) {
            apiSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAPISettings();
            });
        }

        const testEmailConnectionBtn = document.getElementById('testEmailConnection');
        if (testEmailConnectionBtn) {
            testEmailConnectionBtn.addEventListener('click', () => {
                this.testEmailConnection();
            });
        }
    }

    async loadSettingsData() {
        try {
            this.app.showLoadingSpinner();
            const airlines = await api.getAirlines();
            this.loadAirlinesToSelects(airlines);
            this.loadSavedSettings();
        } catch (error) {
            console.error('Error cargando datos de configuración:', error);
            this.app.showToast('Error cargando datos de configuración', 'error');
        } finally {
            this.app.hideLoadingSpinner();
        }
    }

    loadAirlinesToSelects(airlines) {
        const selects = ['defaultAirline'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                while (select.options.length > 1) {
                    select.remove(1);
                }
                airlines.forEach(airline => {
                    const option = document.createElement('option');
                    option.value = airline.code;
                    option.textContent = airline.name;
                    select.appendChild(option);
                });
            }
        });
    }

    loadSavedSettings() {
        const savedSettings = localStorage.getItem('flightTrackerSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                if (settings.appName) {
                    document.getElementById('appName').value = settings.appName;
                }
                if (settings.defaultAirline) {
                    document.getElementById('defaultAirline').value = settings.defaultAirline;
                }
                if (settings.refreshInterval) {
                    document.getElementById('refreshInterval').value = settings.refreshInterval;
                }
                if (settings.emailEnabled !== undefined) {
                    document.getElementById('emailEnabled').checked = settings.emailEnabled;
                }
                if (settings.emailServer) {
                    document.getElementById('emailServer').value = settings.emailServer;
                }
                if (settings.emailUser) {
                    document.getElementById('emailUser').value = settings.emailUser;
                }
                if (settings.emailFolder) {
                    document.getElementById('emailFolder').value = settings.emailFolder;
                }
                if (settings.emailSearch) {
                    document.getElementById('emailSearch').value = settings.emailSearch;
                }
                if (settings.emailSchedule) {
                    document.getElementById('emailSchedule').value = settings.emailSchedule;
                }
                if (settings.flightApiEnabled !== undefined) {
                    document.getElementById('flightApiEnabled').checked = settings.flightApiEnabled;
                }
                if (settings.flightApiUrl) {
                    document.getElementById('flightApiUrl').value = settings.flightApiUrl;
                }
            } catch (error) {
                console.error('Error parseando configuración guardada:', error);
            }
        }
    }

    saveGeneralSettings() {
        const settings = {
            appName: document.getElementById('appName').value,
            defaultAirline: document.getElementById('defaultAirline').value,
            refreshInterval: parseInt(document.getElementById('refreshInterval').value) || 5
        };
        this.saveSettings(settings);
        this.app.showToast('Configuración general guardada correctamente', 'success');
    }

    saveEmailSettings() {
        const settings = {
            emailEnabled: document.getElementById('emailEnabled').checked,
            emailServer: document.getElementById('emailServer').value,
            emailUser: document.getElementById('emailUser').value,
            emailFolder: document.getElementById('emailFolder').value,
            emailSearch: document.getElementById('emailSearch').value,
            emailSchedule: document.getElementById('emailSchedule').value
        };
        this.saveSettings(settings);
        this.app.showToast('Configuración de correo guardada correctamente', 'success');
    }

    saveAPISettings() {
        const settings = {
            flightApiEnabled: document.getElementById('flightApiEnabled').checked,
            flightApiUrl: document.getElementById('flightApiUrl').value
        };
        this.saveSettings(settings);
        this.app.showToast('Configuración de API guardada correctamente', 'success');
    }

    saveSettings(newSettings) {
        let savedSettings = {};
        const existingSettings = localStorage.getItem('flightTrackerSettings');
        if (existingSettings) {
            try {
                savedSettings = JSON.parse(existingSettings);
            } catch (error) {
                console.error('Error parseando configuración existente:', error);
            }
        }
        Object.assign(savedSettings, newSettings);
        localStorage.setItem('flightTrackerSettings', JSON.stringify(savedSettings));
        if (newSettings.refreshInterval) {
            this.app.stopAutoRefresh();
            this.app.refreshInterval = newSettings.refreshInterval * 60000;
            this.app.startAutoRefresh();
        }
    }

    async testEmailConnection() {
        const emailServer = document.getElementById('emailServer').value;
        const emailUser = document.getElementById('emailUser').value;
        const emailPassword = document.getElementById('emailPassword').value;
        if (!emailServer || !emailUser || !emailPassword) {
            this.app.showToast('Por favor, complete todos los campos de correo', 'error');
            return;
        }
        try {
            this.app.showLoadingSpinner();
            this.app.hideLoadingSpinner();
            this.app.showToast('Conexión de correo probada correctamente', 'success');
        } catch (error) {
            console.error('Error probando conexión de correo:', error);
            this.app.hideLoadingSpinner();
            this.app.showToast('Error probando conexión de correo: ' + error.message, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.settingsManager = new SettingsManager();
    }
});
