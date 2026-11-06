const database = require('../backend/models/database');
const { AIRLINES, ORIGIN_AIRPORTS, DESTINATION_AIRPORT, SHIPMENT_TYPES } = require('../backend/config/airlines');

async function seedDatabase() {
    try {
        console.log('Iniciando seeding de la base de datos...');
        await database.connect();
        console.log('Conectado a la base de datos');

        const flightsCount = await seedFlights();
        console.log(`Insertados ${flightsCount} vuelos de prueba`);

        const shipmentsCount = await seedShipments();
        console.log(`Insertadas ${shipmentsCount} guías de prueba`);

        console.log('Seeding completado correctamente');
    } catch (error) {
        console.error('Error durante el seeding:', error);
    } finally {
        await database.close();
    }
}

async function seedFlights() {
    const flights = [];
    const destination = DESTINATION_AIRPORT;
    for (const [code, airline] of Object.entries(AIRLINES)) {
        if (!airline.active) continue;
        const originAirports = [...ORIGIN_AIRPORTS.colombia, ...ORIGIN_AIRPORTS.ecuador];
        for (const airport of originAirports) {
            const flightCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < flightCount; i++) {
                const flight = {
                    flight_number: `${code}${Math.floor(Math.random() * 9000) + 1000}`,
                    airline_code: code,
                    origin_airport: airport.code,
                    destination_airport: destination.code,
                    departure_time: getRandomDate(-7, 7),
                    arrival_time: getRandomDate(-7, 7, 6 * 60 * 60 * 1000),
                    status: getRandomStatus(),
                    aircraft_type: getRandomAircraft(),
                    flight_duration_minutes: 6 * 60 + Math.floor(Math.random() * 120)
                };
                flights.push(flight);
            }
        }
    }

    for (const flight of flights) {
        try {
            await database.insertFlight(flight);
        } catch (error) {
            if (!error.message.includes('UNIQUE constraint failed')) {
                console.error('Error insertando vuelo:', error);
            }
        }
    }
    return flights.length;
}

async function seedShipments() {
    const shipments = [];
    const destination = DESTINATION_AIRPORT;
    const flights = await database.getFlights({ destination_airport: 'MAD' });

    for (const flight of flights) {
        const shipmentCount = Math.floor(Math.random() * 4);
        for (let i = 0; i < shipmentCount; i++) {
            const shipment = {
                guide_number: `GUIA-${flight.airline_code}-${Math.floor(Math.random() * 90000) + 10000}`,
                flight_id: flight.id,
                airline_code: flight.airline_code,
                origin_airport: flight.origin_airport,
                destination_airport: flight.destination_airport,
                shipment_type: getRandomShipmentType(),
                total_packages: Math.floor(Math.random() * 10) + 1,
                received_packages: Math.floor(Math.random() * (Math.floor(Math.random() * 10) + 1)),
                weight_kg: (Math.random() * 1000).toFixed(2),
                volume_m3: (Math.random() * 10).toFixed(3),
                status: getRandomShipmentStatus(),
                tracking_number: `TRK-${Math.floor(Math.random() * 900000) + 100000}`,
                invoice_number: `INV-${flight.airline_code}-${Math.floor(Math.random() * 90000) + 10000}`,
                customer_reference: `CLI-${Math.floor(Math.random() * 90000) + 10000}`,
                notes: `Guía generada automáticamente para vuelo ${flight.flight_number}`
            };
            if (shipment.received_packages > shipment.total_packages) {
                shipment.received_packages = shipment.total_packages;
            }
            if (shipment.received_packages === shipment.total_packages) {
                shipment.status = 'complete';
            } else if (shipment.received_packages > 0) {
                shipment.status = 'partial';
            }
            shipments.push(shipment);
        }
    }

    for (let i = 0; i < 10; i++) {
        const airlineCode = Object.keys(AIRLINES)[Math.floor(Math.random() * Object.keys(AIRLINES).length)];
        const originAirport = [...ORIGIN_AIRPORTS.colombia, ...ORIGIN_AIRPORTS.ecuador]
            [Math.floor(Math.random() * ([...ORIGIN_AIRPORTS.colombia, ...ORIGIN_AIRPORTS.ecuador].length))];
        const shipment = {
            guide_number: `GUIA-NOFLIGHT-${Math.floor(Math.random() * 90000) + 10000}`,
            flight_id: null,
            airline_code: airlineCode,
            origin_airport: originAirport.code,
            destination_airport: destination.code,
            shipment_type: getRandomShipmentType(),
            total_packages: Math.floor(Math.random() * 10) + 1,
            received_packages: Math.floor(Math.random() * (Math.floor(Math.random() * 10) + 1)),
            weight_kg: (Math.random() * 1000).toFixed(2),
            volume_m3: (Math.random() * 10).toFixed(3),
            status: 'pending',
            tracking_number: `TRK-${Math.floor(Math.random() * 900000) + 100000}`,
            invoice_number: `INV-${airlineCode}-${Math.floor(Math.random() * 90000) + 10000}`,
            customer_reference: `CLI-${Math.floor(Math.random() * 90000) + 10000}`,
            notes: 'Guía sin vuelo asociado'
        };
        if (shipment.received_packages > shipment.total_packages) {
            shipment.received_packages = shipment.total_packages;
        }
        shipments.push(shipment);
    }

    for (const shipment of shipments) {
        try {
            const shipmentId = await database.insertShipment(shipment);
            const itemCount = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < itemCount; i++) {
                const item = {
                    shipment_id: shipmentId,
                    description: `Artículo ${i + 1} - ${getRandomProduct()}`,
                    quantity: Math.floor(Math.random() * 10) + 1,
                    weight_kg: (Math.random() * 100).toFixed(2),
                    volume_m3: (Math.random() * 1).toFixed(3),
                    hs_code: `HS${Math.floor(Math.random() * 90000000) + 10000000}`
                };
                await database.insertShipmentItem(item);
            }
        } catch (error) {
            if (!error.message.includes('UNIQUE constraint failed')) {
                console.error('Error insertando guía:', error);
            }
        }
    }
    return shipments.length;
}

function getRandomDate(startDays = -7, endDays = 7, offsetMs = 0) {
    const start = new Date();
    start.setDate(start.getDate() + startDays);
    const end = new Date();
    end.setDate(end.getDate() + endDays);
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    const date = new Date(randomTime + offsetMs);
    return date.toISOString();
}

function getRandomStatus() {
    const statuses = ['scheduled', 'in_flight', 'landed', 'delayed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

function getRandomShipmentStatus() {
    const statuses = ['pending', 'in_transit', 'partial', 'complete', 'delivered', 'delayed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

function getRandomAircraft() {
    const aircrafts = [
        'Airbus A320', 'Airbus A330', 'Airbus A340', 'Airbus A350',
        'Boeing 737', 'Boeing 747', 'Boeing 767', 'Boeing 777', 'Boeing 787',
        'Embraer 190', 'ATR 72'
    ];
    return aircrafts[Math.floor(Math.random() * aircrafts.length)];
}

function getRandomShipmentType() {
    const types = Object.keys(SHIPMENT_TYPES);
    return types[Math.floor(Math.random() * types.length)];
}

function getRandomProduct() {
    const products = [
        'Electrónicos', 'Ropa', 'Alimentos', 'Medicamentos', 'Documentos',
        'Maquinaria', 'Productos Químicos', 'Juguetes', 'Libros', 'Muebles'
    ];
    return products[Math.floor(Math.random() * products.length)];
}

seedDatabase().catch(console.error);
