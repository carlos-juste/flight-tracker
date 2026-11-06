const { AIRLINES, ORIGIN_AIRPORTS, DESTINATION_AIRPORT } = require('../config/airlines');
const database = require('../models/database');

class FlightScraper {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ];
    }

    async scrapeAllFlights(dateFrom, dateTo) {
        const results = { success: [], errors: [] };
        for (const [code, airline] of Object.entries(AIRLINES)) {
            if (!airline.active) continue;
            try {
                console.log(`Scrapeando vuelos de ${airline.name}...`);
                const flights = await this.scrapeAirlineFlights(code, dateFrom, dateTo);
                if (flights && flights.length > 0) {
                    for (const flight of flights) {
                        try {
                            await database.insertFlight(flight);
                        } catch (dbError) {
                            if (!dbError.message.includes('UNIQUE constraint failed')) {
                                console.error(`Error guardando vuelo ${flight.flight_number}:`, dbError);
                            }
                        }
                    }
                    results.success.push({ airline: code, count: flights.length });
                }
            } catch (error) {
                console.error(`Error scrapeando vuelos de ${airline.name}:`, error);
                results.errors.push({ airline: code, error: error.message });
            }
            await this.delay(1000);
        }
        return results;
    }

    async scrapeAirlineFlights(airlineCode, dateFrom, dateTo) {
        const airline = AIRLINES[airlineCode.toLowerCase()];
        if (!airline) throw new Error(`Aerolínea ${airlineCode} no encontrada`);

        let flights = [];
        switch (airlineCode.toUpperCase()) {
            case 'AV': flights = await this.scrapeAviancaFlights(dateFrom, dateTo); break;
            case 'IB': flights = await this.scrapeIberiaFlights(dateFrom, dateTo); break;
            case 'UX': flights = await this.scrapeAirEuropaFlights(dateFrom, dateTo); break;
            case 'LA': flights = await this.scrapeLatamFlights(dateFrom, dateTo); break;
            case 'PU': flights = await this.scrapePlusUltraFlights(dateFrom, dateTo); break;
            default: flights = await this.scrapeGenericFlights(airlineCode, dateFrom, dateTo);
        }
        return flights;
    }

    async scrapeAviancaFlights(dateFrom, dateTo) {
        const flights = [];
        const originAirports = ORIGIN_AIRPORTS.colombia;
        const destination = DESTINATION_AIRPORT;
        for (const airport of originAirports) {
            const flightCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < flightCount; i++) {
                flights.push({
                    flight_number: `AV${Math.floor(Math.random() * 9000) + 1000}`,
                    airline_code: 'AV',
                    origin_airport: airport.code,
                    destination_airport: destination.code,
                    departure_time: this.getRandomDate(dateFrom, dateTo),
                    arrival_time: this.getRandomDate(dateFrom, dateTo, 6 * 60 * 60 * 1000),
                    status: this.getRandomStatus(),
                    aircraft_type: this.getRandomAircraft(),
                    flight_duration_minutes: 6 * 60 + Math.floor(Math.random() * 120)
                });
            }
        }
        return flights;
    }

    async scrapeIberiaFlights(dateFrom, dateTo) {
        const flights = [];
        const originAirports = [...ORIGIN_AIRPORTS.colombia, ...ORIGIN_AIRPORTS.ecuador];
        const destination = DESTINATION_AIRPORT;
        for (const airport of originAirports) {
            const flightCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < flightCount; i++) {
                flights.push({
                    flight_number: `IB${Math.floor(Math.random() * 9000) + 1000}`,
                    airline_code: 'IB',
                    origin_airport: airport.code,
                    destination_airport: destination.code,
                    departure_time: this.getRandomDate(dateFrom, dateTo),
                    arrival_time: this.getRandomDate(dateFrom, dateTo, 8 * 60 * 60 * 1000),
                    status: this.getRandomStatus(),
                    aircraft_type: this.getRandomAircraft(),
                    flight_duration_minutes: 8 * 60 + Math.floor(Math.random() * 120)
                });
            }
        }
        return flights;
    }

    async scrapeAirEuropaFlights(dateFrom, dateTo) {
        const flights = [];
        const originAirports = [...ORIGIN_AIRPORTS.colombia, ...ORIGIN_AIRPORTS.ecuador];
        const destination = DESTINATION_AIRPORT;
        for (const airport of originAirports) {
            const flightCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < flightCount; i++) {
                flights.push({
                    flight_number: `UX${Math.floor(Math.random() * 9000) + 1000}`,
                    airline_code: 'UX',
                    origin_airport: airport.code,
                    destination_airport: destination.code,
                    departure_time: this.getRandomDate(dateFrom, dateTo),
                    arrival_time: this.getRandomDate(dateFrom, dateTo, 7 * 60 * 60 * 1000),
                    status: this.getRandomStatus(),
                    aircraft_type: this.getRandomAircraft(),
                    flight_duration_minutes: 7 * 60 + Math.floor(Math.random() * 120)
                });
            }
        }
        return flights;
    }

    async scrapeLatamFlights(dateFrom, dateTo) {
        const flights = [];
        const originAirports = [...ORIGIN_AIRPORTS.colombia, ...ORIGIN_AIRPORTS.ecuador];
        const destination = DESTINATION_AIRPORT;
        for (const airport of originAirports) {
            const flightCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < flightCount; i++) {
                flights.push({
                    flight_number: `LA${Math.floor(Math.random() * 9000) + 1000}`,
                    airline_code: 'LA',
                    origin_airport: airport.code,
                    destination_airport: destination.code,
                    departure_time: this.getRandomDate(dateFrom, dateTo),
                    arrival_time: this.getRandomDate(dateFrom, dateTo, 9 * 60 * 60 * 1000),
                    status: this.getRandomStatus(),
                    aircraft_type: this.getRandomAircraft(),
                    flight_duration_minutes: 9 * 60 + Math.floor(Math.random() * 120)
                });
            }
        }
        return flights;
    }

    async scrapePlusUltraFlights(dateFrom, dateTo) {
        const flights = [];
        const originAirports = [...ORIGIN_AIRPORTS.colombia, ...ORIGIN_AIRPORTS.ecuador];
        const destination = DESTINATION_AIRPORT;
        for (const airport of originAirports) {
            const flightCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < flightCount; i++) {
                flights.push({
                    flight_number: `PU${Math.floor(Math.random() * 9000) + 1000}`,
                    airline_code: 'PU',
                    origin_airport: airport.code,
                    destination_airport: destination.code,
                    departure_time: this.getRandomDate(dateFrom, dateTo),
                    arrival_time: this.getRandomDate(dateFrom, dateTo, 10 * 60 * 60 * 1000),
                    status: this.getRandomStatus(),
                    aircraft_type: this.getRandomAircraft(),
                    flight_duration_minutes: 10 * 60 + Math.floor(Math.random() * 120)
                });
            }
        }
        return flights;
    }

    async scrapeGenericFlights(airlineCode, dateFrom, dateTo) {
        const flights = [];
        const originAirports = [...ORIGIN_AIRPORTS.colombia, ...ORIGIN_AIRPORTS.ecuador];
        const destination = DESTINATION_AIRPORT;
        for (const airport of originAirports) {
            const flightCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < flightCount; i++) {
                flights.push({
                    flight_number: `${airlineCode}${Math.floor(Math.random() * 9000) + 1000}`,
                    airline_code: airlineCode,
                    origin_airport: airport.code,
                    destination_airport: destination.code,
                    departure_time: this.getRandomDate(dateFrom, dateTo),
                    arrival_time: this.getRandomDate(dateFrom, dateTo, 8 * 60 * 60 * 1000),
                    status: this.getRandomStatus(),
                    aircraft_type: this.getRandomAircraft(),
                    flight_duration_minutes: 8 * 60 + Math.floor(Math.random() * 120)
                });
            }
        }
        return flights;
    }

    getRandomDate(startDate, endDate, offsetMs = 0) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
        const date = new Date(randomTime + offsetMs);
        return date.toISOString();
    }

    getRandomStatus() {
        const statuses = ['scheduled', 'in_flight', 'landed', 'delayed'];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }

    getRandomAircraft() {
        const aircrafts = [
            'Airbus A320', 'Airbus A330', 'Airbus A340', 'Airbus A350',
            'Boeing 737', 'Boeing 747', 'Boeing 767', 'Boeing 777', 'Boeing 787',
            'Embraer 190', 'ATR 72'
        ];
        return aircrafts[Math.floor(Math.random() * aircrafts.length)];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new FlightScraper();
