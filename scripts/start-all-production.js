const { spawn } = require('child_process');

const services = [
  { name: 'auth-service', script: 'services/auth-service/dist/main.js' },
  { name: 'restaurant-service', script: 'services/restaurant-service/dist/main.js' },
  { name: 'order-service', script: 'services/order-service/dist/main.js' },
  { name: 'delivery-service', script: 'services/delivery-service/dist/main.js' },
  { name: 'notification-service', script: 'services/notification-service/dist/main.js' },
  { name: 'payment-service', script: 'services/payment-service/dist/main.js' },
];

console.log('🚀 Crave Production Runner: Starting internal microservices...');

for (const s of services) {
  const child = spawn('node', [s.script], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', (err) => {
    console.error(`[${s.name}] error:`, err.message);
  });
}

// Allow internal microservices 2 seconds to bind ports, then launch API Gateway on public PORT
setTimeout(() => {
  console.log('🌐 Crave Production Runner: Starting API Gateway on public port...');
  const gateway = spawn('node', ['services/api-gateway/dist/main.js'], {
    stdio: 'inherit',
    env: process.env,
  });

  gateway.on('exit', (code) => {
    process.exit(code || 0);
  });
}, 2000);
