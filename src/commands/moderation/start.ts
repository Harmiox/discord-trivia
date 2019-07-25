import { Command, Message } from '@yamdbf/core';
import { TriviaClient } from '../../client/trivia-client';
import { checkModPermissions } from '../../middlewares/validate-mod';
import { AppLogger } from '../../util/app-logger';
import { TriviaGame } from '../../util/trivia-game';

/**
 * Start Command
 */

export default class extends Command<TriviaClient> {
	private logger: AppLogger = new AppLogger('StartCommand');

	public constructor() {
		super({
			desc: 'Start trivia in current channel.',
			group: 'Moderation',
			guildOnly: true,
			name: 'start',
			usage: `<prefix>start <delay>` 
		});

		// Attatch Middleware
		this.use((message: Message, args: any[]) => checkModPermissions(message, args, this));
	}

	public async action(message: Message, [option, value]: [string, string]): Promise<Message | Message[]> {
		// Check for existing trivia game in the server
		const existingGame: TriviaGame = await this.client.games.get(message.guild.id);
		if (existingGame) { return message.reply(`a trivia game has already been started in ${existingGame.message.channel}.`); }
		// If no existing trivia game, start a new one
		const game: TriviaGame = new TriviaGame(message, this.client);
		this.client.games.set(message.guild.id, game);
		game.start();
	
		return message;
	}


}