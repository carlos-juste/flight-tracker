const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const database = require('./models/database');
const { AIRLINES, ORIGIN_AIRPORTS, DESTINATION_AIRPORT, SHIPMENT_TYPES, SHIPMENT_STATUSES } = require('./config/airlines');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

database.connect().then(() => {
  console.log('Base de datos inicializada correctamente');
}).catch(err => {
  console.error('Error inicializando base de datos:', err);
  process.exit(1);
});

const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.get('/airlines', async (req, res) => {
  try {
    const airlines = await database.getAirlines();
    res.json(airlines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/airports', async (req, res) => {
  try {
    const { type } = req.query;
    const airports = await database.getAirports(type);
    res.json(airports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/flights', async (req, res) => {
  try {
    const filter = {
      airline_code: req.query.airline_code,
      origin_airport: req.query.origin_airport,
      destination_airport: req.query.destination_airport || 'MAD',
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    const flights = await database.getFlights(filter);
    res.json(flights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/flights', async (req, res) => {
  try {
    const flight = req.body;
    const flightId = await database.insertFlight(flight);
    res.json({ id: flightId, message: 'Vuelo creado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/shipments', async (req, res) => {
  try {
    const filter = {
      airline_code: req.query.airline_code,
      origin_airport: req.query.origin_airport,
      destination_airport: req.query.destination_airport || 'MAD',
      status: req.query.status,
      guide_number: req.query.guide_number,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    const shipments = await database.getShipments(filter);
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/shipments/:guideNumber', async (req, res) => {
  try {
    const { guideNumber } = req.params;
    const shipment = await database.getShipmentByGuideNumber(guideNumber);
    if (!shipment) {
      return res.status(404).json({ error: 'Guía no encontrada' });
    }
    const items = await database.getShipmentItems(shipment.id);
    res.json({ shipment, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/shipments', async (req, res) => {
  try {
    const shipment = req.body;
    const shipmentId = await database.insertShipment(shipment);
    if (shipment.items && shipment.items.length > 0) {
      for (const item of shipment.items) {
        await database.insertShipmentItem({ ...item, shipment_id: shipmentId });
      }
    }
    res.json({ id: shipmentId, message: 'Guía creada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/shipments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, updatedBy } = req.body;
    await database.updateShipmentStatus(id, status, notes, updatedBy);
    res.json({ message: 'Estado de la guía actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/shipments/:id/packages', async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedPackages } = req.body;
    await database.updateShipmentPackages(id, receivedPackages);
    const shipment = await database.getShipmentByGuideNumber(id);
    if (shipment && shipment.total_packages === shipment.received_packages) {
      await database.updateShipmentStatus(id, 'complete', 'Todos los paquetes recibidos', 'system');
    } else if (shipment && shipment.received_packages > 0 && shipment.received_packages < shipment.total_packages) {
      await database.updateShipmentStatus(id, 'partial', 'Parte de los paquetes recibidos', 'system');
    }
    res.json({ message: 'Paquetes recibidos actualizados correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await database.getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/stats/shipments-by-date', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const stats = await database.getShipmentsByDateRange(dateFrom, dateTo);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/stats/flights-by-airline', async (req, res) => {
  try {
    const stats = await database.getFlightsByAirline();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/stats/shipments-by-airline', async (req, res) => {
  try {
    const stats = await database.getShipmentsByAirline();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/config/airlines', (req, res) => {
  res.json(AIRLINES);
});

apiRouter.get('/config/origin-airports', (req, res) => {
  res.json(ORIGIN_AIRPORTS);
});

apiRouter.get('/config/destination-airport', (req, res) => {
  res.json(DESTINATION_AIRPORT);
});

apiRouter.get('/config/shipment-types', (req, res) => {
  res.json(SHIPMENT_TYPES);
});

apiRouter.get('/config/shipment-statuses', (req, res) => {
  res.json(SHIPMENT_STATUSES);
});

app.use('/api', apiRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
  console.log(`Aplicación disponible en http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  try {
    await database.close();
    process.exit(0);
  } catch (err) {
    console.error('Error cerrando base de datos:', err);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT recibido, cerrando servidor...');
  try {
    await database.close();
    process.exit(0);
  } catch (err) {
    console.error('Error cerrando base de datos:', err);
    process.exit(1);
  }
});

module.exports = app;
