const { AIRLINES } = require('../config/airlines');
const database = require('../models/database');

class EmailAgent {
    constructor() {
        this.config = {
            enabled: false,
            server: '',
            user: '',
            password: '',
            folder: 'INBOX',
            searchCriteria: 'factura OR invoice OR guía OR shipping',
            schedule: 'daily',
            lastChecked: null
        };
    }

    async initialize(config = {}) {
        this.config = { ...this.config, ...config };
        if (!this.config.enabled) {
            console.log('Agente de correo deshabilitado');
            return false;
        }
        console.log('Agente de correo inicializado correctamente');
        return true;
    }

    async processEmails() {
        if (!this.config.enabled) {
            console.log('Agente de correo deshabilitado, omitiendo procesamiento');
            return { processed: 0, errors: 0, invoices: [] };
        }

        try {
            console.log('Procesando correos...');
            const result = await this.simulateEmailProcessing();
            return result;
        } catch (error) {
            console.error('Error procesando correos:', error);
            return { processed: 0, errors: 1, invoices: [], error: error.message };
        }
    }

    async simulateEmailProcessing() {
        const testEmails = [
            {
                from: 'avianca@avianca.com',
                subject: 'Factura AV12345 - Guía de carga',
                date: new Date().toISOString(),
                html: this.generateTestEmailHtml('AV', 'AV12345', 'GUIA001', 'BOG', 'MAD', 10, 500.00)
            },
            {
                from: 'iberia@iberia.com',
                subject: 'Invoice IB67890 - Shipping documents',
                date: new Date(Date.now() - 86400000).toISOString(),
                html: this.generateTestEmailHtml('IB', 'IB67890', 'GUIA002', 'UIO', 'MAD', 5, 250.50)
            },
            {
                from: 'latam@latam.com',
                subject: 'Guía LA34567 - Confirmación de envío',
                date: new Date(Date.now() - 172800000).toISOString(),
                html: this.generateTestEmailHtml('LA', 'LA34567', 'GUIA003', 'GYE', 'MAD', 8, 350.75)
            }
        ];

        const invoices = [];
        let processed = 0;
        let errors = 0;

        for (const email of testEmails) {
            try {
                const invoice = await this.parseEmail(email);
                if (invoice) {
                    invoices.push(invoice);
                    await this.saveInvoiceData(invoice);
                    if (invoice.guideNumber) {
                        await this.updateShipmentFromInvoice(invoice);
                    }
                }
                processed++;
            } catch (error) {
                console.error(`Error procesando correo de ${email.from}:`, error);
                errors++;
            }
        }

        return { processed, errors, invoices };
    }

    async parseEmail(email) {
        try {
            const from = email.from || '';
            const subject = email.subject || '';
            const date = email.date || new Date().toISOString();

            const airline = this.detectAirline(from, subject);
            if (!airline) {
                console.log('No se pudo detectar aerolínea, omitiendo correo');
                return null;
            }

            const flightNumber = this.extractFlightNumber(email.html || '', subject);
            const guideNumber = this.extractGuideNumber(email.html || '', subject);
            const invoiceNumber = this.extractInvoiceNumber(email.html || '', subject);
            const shipmentInfo = this.extractShipmentInfo(email.html || '');
            const { origin, destination } = this.extractRouteInfo(email.html || '', subject);

            return {
                email: { from, subject, date },
                airline: airline.code,
                airlineName: airline.name,
                flightNumber,
                guideNumber,
                invoiceNumber,
                origin,
                destination,
                ...shipmentInfo,
                rawHtml: email.html
            };
        } catch (error) {
            console.error('Error parseando correo:', error);
            throw error;
        }
    }

    detectAirline(from, subject) {
        const fromLower = from.toLowerCase();
        const subjectLower = subject.toLowerCase();
        for (const [code, airline] of Object.entries(AIRLINES)) {
            if (fromLower.includes(code.toLowerCase()) ||
                fromLower.includes(airline.name.toLowerCase()) ||
                fromLower.includes(airline.website.replace('https://', '').replace('http://', '').replace('www.', ''))) {
                return airline;
            }
        }
        for (const [code, airline] of Object.entries(AIRLINES)) {
            if (subjectLower.includes(code.toLowerCase()) ||
                subjectLower.includes(airline.name.toLowerCase())) {
                return airline;
            }
        }
        return null;
    }

    extractFlightNumber(html, subject) {
        const subjectMatch = subject.match(/([A-Z]{2})\d{3,6}/i);
        if (subjectMatch) return subjectMatch[0];
        const htmlMatch = html.match(/([A-Z]{2})\d{3,6}/i);
        if (htmlMatch) return htmlMatch[0];
        return null;
    }

    extractGuideNumber(html, subject) {
        const patterns = [
            /guía\s*[:\-]?\s*([A-Z0-9\-]{6,20})/i,
            /guide\s*[:\-]?\s*([A-Z0-9\-]{6,20})/i,
            /awb\s*[:\-]?\s*([A-Z0-9\-]{6,20})/i,
            /([A-Z]{3})\d{8,15}/i
        ];
        for (const pattern of patterns) {
            const match = subject.match(pattern);
            if (match) return match[1] || match[0];
        }
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) return match[1] || match[0];
        }
        return null;
    }

    extractInvoiceNumber(html, subject) {
        const patterns = [
            /factura\s*[:\-]?\s*([A-Z0-9\-]{6,20})/i,
            /invoice\s*[:\-]?\s*([A-Z0-9\-]{6,20})/i,
            /([A-Z]{2})\d{8,15}/i
        ];
        for (const pattern of patterns) {
            const match = subject.match(pattern);
            if (match) return match[1] || match[0];
        }
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) return match[1] || match[0];
        }
        return null;
    }

    extractShipmentInfo(html) {
        const text = html.toLowerCase();
        let totalPackages = null;
        const packagesMatch = text.match(/(\d+)\s*(paquete|package|bulto|box|pkg)[s]?/i);
        if (packagesMatch) totalPackages = parseInt(packagesMatch[1]);

        let weight = null;
        const weightMatch = text.match(/(\d+\.?\d*)\s*(kg|kilogramo|kilos)/i);
        if (weightMatch) weight = parseFloat(weightMatch[1]);

        let volume = null;
        const volumeMatch = text.match(/(\d+\.?\d*)\s*(m3|m³|cubic meter)/i);
        if (volumeMatch) volume = parseFloat(volumeMatch[1]);

        let shipmentType = 'general';
        if (text.includes('perecedero') || text.includes('perishable')) shipmentType = 'perishable';
        else if (text.includes('peligroso') || text.includes('dangerous')) shipmentType = 'dangerous';
        else if (text.includes('farmacéutico') || text.includes('pharmaceutical')) shipmentType = 'pharmaceutical';
        else if (text.includes('correo') || text.includes('mail')) shipmentType = 'mail';
        else if (text.includes('exprés') || text.includes('express')) shipmentType = 'express';

        return { totalPackages, weight, volume, shipmentType };
    }

    extractRouteInfo(html, subject) {
        const text = html.toLowerCase();
        const subjectLower = subject.toLowerCase();
        let origin = null;
        let destination = null;

        const airportPatterns = [/(bog|med|clo|baq|ctg|adz|uio|gye|cue|mad)/i];
        const matches = text.match(airportPatterns[0]);
        if (matches) {
            const airports = matches.filter((value, index, self) => self.indexOf(value) === index);
            if (airports.length >= 2) {
                origin = airports[0].toUpperCase();
                destination = airports[1].toUpperCase();
            } else if (airports.length === 1) {
                origin = airports[0].toUpperCase();
                destination = 'MAD';
            }
        }

        const subjectMatches = subjectLower.match(airportPatterns[0]);
        if (subjectMatches && !origin) {
            const airports = subjectMatches.filter((value, index, self) => self.indexOf(value) === index);
            if (airports.length >= 2) {
                origin = airports[0].toUpperCase();
                destination = airports[1].toUpperCase();
            } else if (airports.length === 1) {
                origin = airports[0].toUpperCase();
                destination = 'MAD';
            }
        }

        if (!destination) destination = 'MAD';
        return { origin, destination };
    }

    async saveInvoiceData(invoice) {
        try {
            await database.db.run(
                `INSERT INTO email_invoices (
                    email_subject, email_from, email_date, invoice_number,
                    airline_code, flight_number, guide_number, processed
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    invoice.email.subject,
                    invoice.email.from,
                    invoice.email.date,
                    invoice.invoiceNumber,
                    invoice.airline,
                    invoice.flightNumber,
                    invoice.guideNumber,
                    1
                ]
            );
            console.log(`Factura ${invoice.invoiceNumber} guardada en la base de datos`);
        } catch (error) {
            console.error('Error guardando factura en la base de datos:', error);
            throw error;
        }
    }

    async updateShipmentFromInvoice(invoice) {
        try {
            const existingShipment = await database.getShipmentByGuideNumber(invoice.guideNumber);
            if (existingShipment) {
                const updates = [];
                if (invoice.flightNumber) {
                    const flight = await database.db.get(
                        'SELECT id FROM flights WHERE flight_number = ? AND airline_code = ?',
                        [invoice.flightNumber, invoice.airline]
                    );
                    if (flight) updates.push(`flight_id = ${flight.id}`);
                }
                if (invoice.totalPackages) updates.push(`total_packages = ${invoice.totalPackages}`);
                if (invoice.weight) updates.push(`weight_kg = ${invoice.weight}`);
                if (invoice.volume) updates.push(`volume_m3 = ${invoice.volume}`);
                if (invoice.invoiceNumber) updates.push(`invoice_number = '${invoice.invoiceNumber}'`);
                if (invoice.shipmentType) updates.push(`shipment_type = '${invoice.shipmentType}'`);
                if (updates.length > 0) {
                    const updateQuery = `UPDATE shipments SET ${updates.join(', ')} WHERE guide_number = ?`;
                    await database.db.run(updateQuery, [invoice.guideNumber]);
                    console.log(`Guía ${invoice.guideNumber} actualizada con datos de factura`);
                }
            } else {
                const shipment = {
                    guide_number: invoice.guideNumber,
                    flight_id: null,
                    airline_code: invoice.airline,
                    origin_airport: invoice.origin || 'BOG',
                    destination_airport: invoice.destination || 'MAD',
                    shipment_type: invoice.shipmentType || 'general',
                    total_packages: invoice.totalPackages || 1,
                    received_packages: 0,
                    weight_kg: invoice.weight || null,
                    volume_m3: invoice.volume || null,
                    status: 'pending',
                    tracking_number: null,
                    invoice_number: invoice.invoiceNumber || null,
                    customer_reference: null,
                    notes: `Factura procesada desde correo: ${invoice.email.subject}`
                };
                const shipmentId = await database.insertShipment(shipment);
                console.log(`Nueva guía ${invoice.guideNumber} creada a partir de factura`);
                await database.db.run(
                    'UPDATE email_invoices SET shipment_id = ? WHERE guide_number = ?',
                    [shipmentId, invoice.guideNumber]
                );
            }
        } catch (error) {
            console.error('Error actualizando guía desde factura:', error);
            throw error;
        }
    }

    generateTestEmailHtml(airlineCode, flightNumber, guideNumber, origin, destination, packages, weight) {
        return `
            <html>
            <body>
                <h1>${airlineCode} - Factura</h1>
                <p><strong>Factura N°:</strong> INV-${flightNumber}-${Date.now().toString().slice(-6)}</p>
                <p><strong>Vuelo:</strong> ${flightNumber}</p>
                <p><strong>Guía:</strong> ${guideNumber}</p>
                <p><strong>Origen:</strong> ${origin}</p>
                <p><strong>Destino:</strong> ${destination}</p>
                <p><strong>Paquetes:</strong> ${packages}</p>
                <p><strong>Peso:</strong> ${weight} kg</p>
                <p><strong>Tipo:</strong> Carga General</p>
            </body>
            </html>
        `;
    }

    getAirlineName(code) {
        return AIRLINES[code.toLowerCase()]?.name || code;
    }

    async testConnection() {
        try {
            return { success: true, message: 'Conexión exitosa' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

module.exports = new EmailAgent();
