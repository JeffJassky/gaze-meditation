import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './config.js';

async function main() {
  await mongoose.connect(config.mongodbUri);
  console.log('[gaze] mongo connected');

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[gaze] api listening on :${config.port}`);
  });
}

main().catch((err) => {
  console.error('[gaze] fatal startup error', err);
  process.exit(1);
});
