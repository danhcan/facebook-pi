import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { app } from './app.js';

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

export default app;
