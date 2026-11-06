class ModalManager {
    constructor() {
        this.app = window.app;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeModalBtn = document.getElementById('closeModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
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
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.modalManager = new ModalManager();
        window.app.showModal = window.modalManager.showModal.bind(window.modalManager);
        window.app.closeModal = window.modalManager.closeModal.bind(window.modalManager);
    }
});
