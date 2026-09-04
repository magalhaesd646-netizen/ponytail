'use strict';

require('dotenv').config();
const monitor = require('../src/monitor');

monitor
  .run()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error('Erro ao rodar o monitor:', err.message);
    process.exit(1);
  });
