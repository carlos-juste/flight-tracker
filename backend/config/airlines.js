// Configuración de aerolíneas a monitorear
const AIRLINES = {
  avianca: {
    name: 'Avianca',
    code: 'AV',
    iata: 'AV',
    icao: 'AVA',
    website: 'https://www.avianca.com',
    apiEndpoint: 'https://api.avianca.com',
    active: true,
    countries: ['Colombia', 'Ecuador']
  },
  iberia: {
    name: 'Iberia',
    code: 'IB',
    iata: 'IB',
    icao: 'IBE',
    website: 'https://www.iberia.com',
    apiEndpoint: 'https://api.iberia.com',
    active: true,
    countries: ['Spain']
  },
  aereuropa: {
    name: 'Air Europa',
    code: 'UX',
    iata: 'UX',
    icao: 'AEA',
    website: 'https://www.aireuropa.com',
    apiEndpoint: 'https://api.aireuropa.com',
    active: true,
    countries: ['Spain']
  },
  lan: {
    name: 'LATAM Airlines (ex-LAN)',
    code: 'LA',
    iata: 'LA',
    icao: 'LAN',
    website: 'https://www.latam.com',
    apiEndpoint: 'https://api.latam.com',
    active: true,
    countries: ['Colombia', 'Ecuador']
  },
  latam: {
    name: 'LATAM Airlines Group',
    code: 'LA',
    iata: 'LA',
    icao: 'LAT',
    website: 'https://www.latam.com',
    apiEndpoint: 'https://api.latam.com',
    active: true,
    countries: ['Colombia', 'Ecuador']
  },
  plusUltra: {
    name: 'Plus Ultra',
    code: 'PU',
    iata: 'PU',
    icao: 'PUE',
    website: 'https://www.plus-ultra.com',
    active: true,
    countries: ['Spain']
  }
};

// Aeropuertos de origen (Colombia y Ecuador)
const ORIGIN_AIRPORTS = {
  colombia: [
    { code: 'BOG', name: 'El Dorado - Bogotá', city: 'Bogotá', country: 'Colombia' },
    { code: 'MED', name: 'José María Córdova - Medellín', city: 'Medellín', country: 'Colombia' },
    { code: 'CLO', name: 'Alfonso Bonilla Aragón - Cali', city: 'Cali', country: 'Colombia' },
    { code: 'BAQ', name: 'Ernesto Cortissoz - Barranquilla', city: 'Barranquilla', country: 'Colombia' },
    { code: 'CTG', name: 'Rafael Núñez - Cartagena', city: 'Cartagena', country: 'Colombia' },
    { code: 'ADZ', name: 'Gustavo Rojas Pinilla - San Andrés', city: 'San Andrés', country: 'Colombia' }
  ],
  ecuador: [
    { code: 'UIO', name: 'Mariscal Sucre - Quito', city: 'Quito', country: 'Ecuador' },
    { code: 'GYE', name: 'José Joaquín de Olmedo - Guayaquil', city: 'Guayaquil', country: 'Ecuador' },
    { code: 'CUE', name: 'Mariscal Lamar - Cuenca', city: 'Cuenca', country: 'Ecuador' }
  ]
};

// Aeropuerto de destino
const DESTINATION_AIRPORT = {
  code: 'MAD',
  name: 'Adolfo Suárez Madrid-Barajas',
  city: 'Madrid',
  country: 'Spain'
};

// Tipos de guías/carga
const SHIPMENT_TYPES = {
  general: 'Carga General',
  perishable: 'Perecederos',
  dangerous: 'Mercancías Peligrosas',
  pharmaceutical: 'Farmacéuticos',
  mail: 'Correo',
  express: 'Envíos Exprés'
};

// Estados de las guías
const SHIPMENT_STATUSES = {
  pending: 'Pendiente',
  in_transit: 'En Tránsito',
  partial: 'Parcial',
  complete: 'Completa',
  delivered: 'Entregada',
  delayed: 'Retrasada',
  cancelled: 'Cancelada'
};

module.exports = {
  AIRLINES,
  ORIGIN_AIRPORTS,
  DESTINATION_AIRPORT,
  SHIPMENT_TYPES,
  SHIPMENT_STATUSES
};
