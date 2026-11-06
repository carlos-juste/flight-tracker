const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/flight_tracker.db');
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error conectando a la base de datos:', err);
          reject(err);
        } else {
          console.log('Conectado a SQLite database');
          this.initializeDatabase().then(resolve).catch(reject);
        }
      });
    });
  }

  async initializeDatabase() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS airlines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        iata TEXT,
        icao TEXT,
        website TEXT,
        active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS airports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        city TEXT,
        country TEXT,
        type TEXT CHECK(type IN ('origin', 'destination')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS flights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flight_number TEXT NOT NULL,
        airline_code TEXT NOT NULL,
        origin_airport TEXT NOT NULL,
        destination_airport TEXT NOT NULL,
        departure_time TIMESTAMP,
        arrival_time TIMESTAMP,
        status TEXT DEFAULT 'scheduled',
        aircraft_type TEXT,
        flight_duration_minutes INTEGER,
        FOREIGN KEY (airline_code) REFERENCES airlines(code),
        FOREIGN KEY (origin_airport) REFERENCES airports(code),
        FOREIGN KEY (destination_airport) REFERENCES airports(code),
        UNIQUE(flight_number, departure_time, airline_code),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guide_number TEXT UNIQUE NOT NULL,
        flight_id INTEGER,
        airline_code TEXT NOT NULL,
        origin_airport TEXT NOT NULL,
        destination_airport TEXT NOT NULL,
        shipment_type TEXT,
        total_packages INTEGER DEFAULT 1,
        received_packages INTEGER DEFAULT 0,
        weight_kg REAL,
        volume_m3 REAL,
        status TEXT DEFAULT 'pending',
        tracking_number TEXT,
        invoice_number TEXT,
        customer_reference TEXT,
        notes TEXT,
        FOREIGN KEY (flight_id) REFERENCES flights(id),
        FOREIGN KEY (airline_code) REFERENCES airlines(code),
        FOREIGN KEY (origin_airport) REFERENCES airports(code),
        FOREIGN KEY (destination_airport) REFERENCES airports(code),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS shipment_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipment_id INTEGER NOT NULL,
        description TEXT,
        quantity INTEGER DEFAULT 1,
        weight_kg REAL,
        volume_m3 REAL,
        hs_code TEXT,
        FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS flight_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flight_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS shipment_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipment_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        updated_by TEXT,
        FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS email_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_subject TEXT,
        email_from TEXT,
        email_date TIMESTAMP,
        invoice_number TEXT,
        airline_code TEXT,
        flight_number TEXT,
        guide_number TEXT,
        shipment_id INTEGER,
        pdf_path TEXT,
        processed INTEGER DEFAULT 0,
        FOREIGN KEY (shipment_id) REFERENCES shipments(id),
        FOREIGN KEY (airline_code) REFERENCES airlines(code),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await new Promise((resolve, reject) => {
        this.db.run(table, (err) => {
          if (err) {
            console.error('Error creando tabla:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    await this.insertDefaultAirlines();
    await this.insertDefaultAirports();
  }

  async insertDefaultAirlines() {
    const airlines = [
      { code: 'AV', name: 'Avianca', iata: 'AV', icao: 'AVA', website: 'https://www.avianca.com' },
      { code: 'IB', name: 'Iberia', iata: 'IB', icao: 'IBE', website: 'https://www.iberia.com' },
      { code: 'UX', name: 'Air Europa', iata: 'UX', icao: 'AEA', website: 'https://www.aireuropa.com' },
      { code: 'LA', name: 'LATAM Airlines', iata: 'LA', icao: 'LAT', website: 'https://www.latam.com' },
      { code: 'PU', name: 'Plus Ultra', iata: 'PU', icao: 'PUE', website: 'https://www.plus-ultra.com' }
    ];

    for (const airline of airlines) {
      await new Promise((resolve) => {
        this.db.run(
          'INSERT OR IGNORE INTO airlines (code, name, iata, icao, website, active) VALUES (?, ?, ?, ?, ?, 1)',
          [airline.code, airline.name, airline.iata, airline.icao, airline.website],
          resolve
        );
      });
    }
  }

  async insertDefaultAirports() {
    const colombiaAirports = [
      { code: 'BOG', name: 'El Dorado - Bogotá', city: 'Bogotá', country: 'Colombia', type: 'origin' },
      { code: 'MED', name: 'José María Córdova - Medellín', city: 'Medellín', country: 'Colombia', type: 'origin' },
      { code: 'CLO', name: 'Alfonso Bonilla Aragón - Cali', city: 'Cali', country: 'Colombia', type: 'origin' }
    ];

    const ecuadorAirports = [
      { code: 'UIO', name: 'Mariscal Sucre - Quito', city: 'Quito', country: 'Ecuador', type: 'origin' },
      { code: 'GYE', name: 'José Joaquín de Olmedo - Guayaquil', city: 'Guayaquil', country: 'Ecuador', type: 'origin' }
    ];

    const destinationAirport = [
      { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain', type: 'destination' }
    ];

    const allAirports = [...colombiaAirports, ...ecuadorAirports, ...destinationAirport];

    for (const airport of allAirports) {
      await new Promise((resolve) => {
        this.db.run(
          'INSERT OR IGNORE INTO airports (code, name, city, country, type) VALUES (?, ?, ?, ?, ?)',
          [airport.code, airport.name, airport.city, airport.country, airport.type],
          resolve
        );
      });
    }
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  getAirlines() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM airlines WHERE active = 1', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getAirports(type = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM airports';
      const params = [];
      if (type) {
        query += ' WHERE type = ?';
        params.push(type);
      }
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getFlights(filter = {}) {
    return new Promise((resolve, reject) => {
      let query = `SELECT f.*, a.name as airline_name,
                   o.name as origin_name, o.city as origin_city, o.country as origin_country,
                   d.name as destination_name, d.city as destination_city, d.country as destination_country
            FROM flights f
            JOIN airlines a ON f.airline_code = a.code
            JOIN airports o ON f.origin_airport = o.code
            JOIN airports d ON f.destination_airport = d.code
            WHERE 1=1`;
      const params = [];
      if (filter.airline_code) {
        query += ' AND f.airline_code = ?';
        params.push(filter.airline_code);
      }
      if (filter.origin_airport) {
        query += ' AND f.origin_airport = ?';
        params.push(filter.origin_airport);
      }
      if (filter.destination_airport) {
        query += ' AND f.destination_airport = ?';
        params.push(filter.destination_airport);
      }
      if (filter.status) {
        query += ' AND f.status = ?';
        params.push(filter.status);
      }
      if (filter.date_from) {
        query += ' AND date(f.departure_time) >= date(?)';
        params.push(filter.date_from);
      }
      if (filter.date_to) {
        query += ' AND date(f.departure_time) <= date(?)';
        params.push(filter.date_to);
      }
      query += ' ORDER BY f.departure_time DESC';
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getShipments(filter = {}) {
    return new Promise((resolve, reject) => {
      let query = `SELECT s.*, a.name as airline_name,
                   o.name as origin_name, o.city as origin_city, o.country as origin_country,
                   d.name as destination_name, d.city as destination_city, d.country as destination_country,
                   f.flight_number, f.departure_time, f.arrival_time, f.status as flight_status
            FROM shipments s
            JOIN airlines a ON s.airline_code = a.code
            JOIN airports o ON s.origin_airport = o.code
            JOIN airports d ON s.destination_airport = d.code
            LEFT JOIN flights f ON s.flight_id = f.id
            WHERE 1=1`;
      const params = [];
      if (filter.airline_code) {
        query += ' AND s.airline_code = ?';
        params.push(filter.airline_code);
      }
      if (filter.origin_airport) {
        query += ' AND s.origin_airport = ?';
        params.push(filter.origin_airport);
      }
      if (filter.destination_airport) {
        query += ' AND s.destination_airport = ?';
        params.push(filter.destination_airport);
      }
      if (filter.status) {
        query += ' AND s.status = ?';
        params.push(filter.status);
      }
      if (filter.guide_number) {
        query += ' AND s.guide_number LIKE ?';
        params.push(`%${filter.guide_number}%`);
      }
      if (filter.date_from) {
        query += ' AND date(s.created_at) >= date(?)';
        params.push(filter.date_from);
      }
      if (filter.date_to) {
        query += ' AND date(s.created_at) <= date(?)';
        params.push(filter.date_to);
      }
      query += ' ORDER BY s.created_at DESC';
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getShipmentByGuideNumber(guideNumber) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT s.*, a.name as airline_name,
                o.name as origin_name, o.city as origin_city, o.country as origin_country,
                d.name as destination_name, d.city as destination_city, d.country as destination_country,
                f.flight_number, f.departure_time, f.arrival_time, f.status as flight_status
         FROM shipments s
         JOIN airlines a ON s.airline_code = a.code
         JOIN airports o ON s.origin_airport = o.code
         JOIN airports d ON s.destination_airport = d.code
         LEFT JOIN flights f ON s.flight_id = f.id
         WHERE s.guide_number = ?`,
        [guideNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getShipmentItems(shipmentId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM shipment_items WHERE shipment_id = ?',
        [shipmentId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  insertFlight(flight) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO flights (flight_number, airline_code, origin_airport, destination_airport,
                             departure_time, arrival_time, status, aircraft_type, flight_duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          flight.flight_number,
          flight.airline_code,
          flight.origin_airport,
          flight.destination_airport,
          flight.departure_time,
          flight.arrival_time,
          flight.status || 'scheduled',
          flight.aircraft_type,
          flight.flight_duration_minutes
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  insertShipment(shipment) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO shipments (guide_number, flight_id, airline_code, origin_airport, destination_airport,
                                shipment_type, total_packages, received_packages, weight_kg, volume_m3,
                                status, tracking_number, invoice_number, customer_reference, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shipment.guide_number,
          shipment.flight_id,
          shipment.airline_code,
          shipment.origin_airport,
          shipment.destination_airport,
          shipment.shipment_type,
          shipment.total_packages || 1,
          shipment.received_packages || 0,
          shipment.weight_kg,
          shipment.volume_m3,
          shipment.status || 'pending',
          shipment.tracking_number,
          shipment.invoice_number,
          shipment.customer_reference,
          shipment.notes
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  updateShipmentStatus(shipmentId, status, notes = null, updatedBy = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE shipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, shipmentId],
        (err) => {
          if (err) reject(err);
          else {
            this.db.run(
              `INSERT INTO shipment_status_history (shipment_id, status, notes, updated_by)
               VALUES (?, ?, ?, ?)`,
              [shipmentId, status, notes, updatedBy],
              (err2) => {
                if (err2) console.error('Error guardando historial:', err2);
                resolve();
              }
            );
          }
        }
      );
    });
  }

  updateShipmentPackages(shipmentId, receivedPackages) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE shipments SET received_packages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [receivedPackages, shipmentId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  insertShipmentItem(item) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO shipment_items (shipment_id, description, quantity, weight_kg, volume_m3, hs_code)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.shipment_id,
          item.description,
          item.quantity || 1,
          item.weight_kg,
          item.volume_m3,
          item.hs_code
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getDashboardStats() {
    return new Promise((resolve, reject) => {
      const queries = {
        totalFlights: 'SELECT COUNT(*) as count FROM flights',
        totalShipments: 'SELECT COUNT(*) as count FROM shipments',
        pendingShipments: "SELECT COUNT(*) as count FROM shipments WHERE status = 'pending'",
        inTransitShipments: "SELECT COUNT(*) as count FROM shipments WHERE status = 'in_transit'",
        completeShipments: "SELECT COUNT(*) as count FROM shipments WHERE status = 'complete'",
        partialShipments: "SELECT COUNT(*) as count FROM shipments WHERE status = 'partial'",
        recentFlights: `SELECT COUNT(*) as count FROM flights WHERE date(departure_time) >= date('now', '-7 days')`,
        recentShipments: `SELECT COUNT(*) as count FROM shipments WHERE date(created_at) >= date('now', '-7 days')`
      };
      const results = {};
      let completed = 0;
      const total = Object.keys(queries).length;
      Object.entries(queries).forEach(([key, query]) => {
        this.db.get(query, (err, row) => {
          if (err) {
            reject(err);
          } else {
            results[key] = row.count;
            completed++;
            if (completed === total) {
              resolve(results);
            }
          }
        });
      });
    });
  }

  getShipmentsByDateRange(dateFrom, dateTo) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT date(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as complete,
                SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
         FROM shipments
         WHERE date(created_at) BETWEEN date(?) AND date(?)
         GROUP BY date(created_at)
         ORDER BY date(created_at)`,
        [dateFrom, dateTo],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getFlightsByAirline() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT a.code, a.name, COUNT(f.id) as flight_count
         FROM airlines a
         LEFT JOIN flights f ON a.code = f.airline_code
         WHERE a.active = 1
         GROUP BY a.code, a.name
         ORDER BY a.name`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getShipmentsByAirline() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT a.code, a.name,
                COUNT(s.id) as total_shipments,
                SUM(CASE WHEN s.status = 'complete' THEN 1 ELSE 0 END) as complete,
                SUM(CASE WHEN s.status = 'partial' THEN 1 ELSE 0 END) as partial,
                SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END) as pending
         FROM airlines a
         LEFT JOIN shipments s ON a.code = s.airline_code
         WHERE a.active = 1
         GROUP BY a.code, a.name
         ORDER BY a.name`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = new Database();
