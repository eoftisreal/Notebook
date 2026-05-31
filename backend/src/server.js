const app = require('./app');
const env = require('./config/env');
const connectDb = require('./config/db');

async function start() {
  await connectDb();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on :${env.port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend', error);
  process.exit(1);
});
