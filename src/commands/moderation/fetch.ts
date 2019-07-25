import { Command, Message } from '@yamdbf/core';
import { TriviaClient } from '../../client/trivia-client';
import { IQuestion } from '../../config/interfaces/trivia.interface';
import { checkModPermissions } from '../../middlewares/validate-mod';
import { AppLogger } from '../../util/app-logger';

/**
 * Fetch Command
 */

export default class extends Command<TriviaClient> {
	private logger: AppLogger = new AppLogger('FetchCommand');

	public constructor() {
		super({
			desc: 'Fetch trivia questions from external database.',
			group: 'Moderation',
			guildOnly: true,
			name: 'fetch',
			usage: `<prefix>fetch` 
		});

		// Attatch Middleware
		this.use((message: Message, args: any[]) => checkModPermissions(message, args, this));
	}

	public async action(message: Message, [option, value]: [string, string]): Promise<Message | Message[]> {
		this.client.fetchQuestions()
			.then((questions: IQuestion[]) => {
				return message.reply(`**${questions.length}** questions have successfully been fetched and loaded.`);
			})
			.catch((err: Error) => {
				this.logger.error('Error when fetching questions from spreadsheet: ', err);
				return message.reply('an internal error occurred when trying to fetch the questions from the database.');
			});

		return;
	}
}