const { spawn } = require('child_process');

const services = [
  { name: 'auth-service', script: 'services/auth-service/dist/main.js' },
  { name: 'restaurant-service', script: 'services/restaurant-service/dist/main.js' },
  { name: 'order-service', script: 'services/order-service/dist/main.js' },
  { name: 'delivery-service', script: 'services/delivery-service/dist/main.js' },
  { name: 'notification-service', script: 'services/notification-service/dist/main.js' },
  { name: 'payment-service', script: 'services/payment-service/dist/main.js' },
];

const runningProcesses = [];

console.log('🚀 Crave Production Runner: Starting 6 internal microservices...');

// Internal services should not inherit public PORT to prevent port conflicts
const internalEnv = { ...process.env };
delete internalEnv.PORT;

for (const s of services) {
  const child = spawn('node', [s.script], {
    stdio: 'inherit',
    env: internalEnv,
  });

  child.on('error', (err) => {
    console.error(`[${s.name}] spawn error:`, err.message);
  });

  child.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[${s.name}] exited unexpectedly with code ${code} (signal: ${signal})`);
    }
  });

  runningProcesses.push(child);
}

// Allow internal microservices 3 seconds to connect to DB/MQ and bind internal ports
setTimeout(() => {
  console.log('🌐 Crave Production Runner: Starting API Gateway on public port...');
  const gateway = spawn('node', ['services/api-gateway/dist/main.js'], {
    stdio: 'inherit',
    env: { ...process.env, MICROSERVICES_MANAGED: 'true' }, // Needs public PORT provided by Render
  });

  gateway.on('error', (err) => {
    console.error('[api-gateway] spawn error:', err.message);
  });

  gateway.on('exit', (code) => {
    console.log(`[api-gateway] stopped with code ${code}`);
    cleanup(code || 0);
  });

  runningProcesses.push(gateway);
}, 3000);

function cleanup(exitCode = 0) {
  for (const proc of runningProcesses) {
    try {
      proc.kill('SIGTERM');
    } catch {}
  }
  process.exit(exitCode);
}

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));
