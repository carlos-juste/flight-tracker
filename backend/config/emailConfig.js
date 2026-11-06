const EMAIL_CONFIG = {
  enabled: process.env.EMAIL_ENABLED === 'true' || false,
  imap: {
    host: process.env.EMAIL_SERVER || '',
    port: 993,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASSWORD || ''
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  },
  processing: {
    folder: process.env.EMAIL_FOLDER || 'INBOX',
    searchCriteria: process.env.EMAIL_SEARCH || 'factura OR invoice OR guía OR shipping OR AWB',
    maxEmails: 50,
    markAsRead: true,
    moveToFolder: null
  },
  schedule: {
    enabled: true,
    frequency: process.env.EMAIL_SCHEDULE || 'daily',
    time: '08:00',
    timezone: 'America/Bogota'
  },
  patterns: {
    airlines: {
      'avianca': [/avianca/i, /av/i, /taca/i],
      'iberia': [/iberia/i, /ib/i],
      'aereuropa': [/air\\s*europa/i, /ux/i, /aireuropa/i],
      'latam': [/latam/i, /lan/i, /la/i],
      'plusultra': [/plus\\s*ultra/i, /pu/i, /plusultra/i]
    },
    guideNumber: [
      /guía\\s*[:\\-]?\\s*([A-Z0-9\\-]{6,20})/i,
      /guide\\s*[:\\-]?\\s*([A-Z0-9\\-]{6,20})/i,
      /awb\\s*[:\\-]?\\s*([A-Z0-9\\-]{6,20})/i,
      /([A-Z]{3})\\d{8,15}/i
    ],
    invoiceNumber: [
      /factura\\s*[:\\-]?\\s*([A-Z0-9\\-]{6,20})/i,
      /invoice\\s*[:\\-]?\\s*([A-Z0-9\\-]{6,20})/i,
      /([A-Z]{2})\\d{8,15}/i
    ],
    flightNumber: [
      /([A-Z]{2})\\d{3,6}/i
    ],
    airports: [
      /(bog|med|clo|baq|ctg|adz|uio|gye|cue|mad)/i
    ]
  }
};

module.exports = EMAIL_CONFIG;
