import { TriviaClient } from './client/trivia-client';
import { ConfigService } from './config/config.service';
import { AppLogger} from './util/app-logger';

const logger: AppLogger = new AppLogger('Main');
const config: ConfigService = new ConfigService();

async function bootstrap(): Promise<void> {
	logger.info('Initiating Trivia Client');
	logger.info(`${Date.now()}`);

	const client: TriviaClient = new TriviaClient(config);
  client.start();
}

bootstrap();

process.on("unhandledRejection", error => {
	logger.error("Unhandled promise rejection:", error);
});
