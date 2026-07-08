import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/container.js';

export function createTestApp() {
  return createApp(
    createContainer({
      checkDatabaseConnection: async () => true,
    })
  );
}
