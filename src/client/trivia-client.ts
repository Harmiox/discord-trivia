import { Client, Message } from '@yamdbf/core';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { ConfigService } from '../config/config.service';
import { AppLogger } from '../util/app-logger';
import { ICredentials } from '../config/interfaces/google-credentials.interface';
import { checkChannelPermissions } from '../middlewares/validate-channel';
import { TriviaGame } from '../util/trivia-game';
import { IQuestion } from '../config/interfaces/trivia.interface';
import { GuildMember } from 'discord.js';
const credentials: ICredentials = require('../../credentials.json');

/**
 * Trivia Client
 */

export class TriviaClient extends Client {
	public config: ConfigService;
	public questions: IQuestion[] = [];
	public games: Map<string, TriviaGame> = new Map();
	private logger: AppLogger = new AppLogger('TriviaClient');
	private disconnects: number = 0;

	constructor(config: ConfigService) {
		super({
			commandsDir: './dist/commands',
			owner: ['228781414986809344'], // Harmiox,
			pause: true,
			readyText: 'Trivia Client Ready',
			token: config.discord.token,
			unknownCommandError: false
		});

		this.config = config;

		// Middleware
		this.use((message: Message, args: any[]) => checkChannelPermissions(message, args, this)); 

		// Bind events to local client methods
		this.on('ready', this.onReady);
		this.on('warn', this.onWarn);
		this.on('pause', this.onPause);
		this.on('error', this.onError);
		this.on('disconnect', this.onDisconnect);
		this.on('reconnecting', this.onReconnecting);
	}

	public start() {
		this.logger.info(`${this.logger.context} has been started.`);

		return super.start();
	}

	public async fetchQuestions(): Promise<IQuestion[]> {
		this.logger.info('Fetching trivia questions...');
		// Fetch trivia questions
		let auth: JWT = new google.auth.JWT(
			credentials.client_email,
			null,
			credentials.private_key,
			['https://www.googleapis.com/auth/spreadsheets']
		);
		const range: string = 'Questions';
		const sheets = google.sheets('v4');
		const spreadsheetId: string = this.config.sheets.spreadsheetId;
		try {
			await auth.authorize();
			const options: {} = { auth, spreadsheetId, range }
			const questionsSheet = await sheets.spreadsheets.values.get(options);
			const rows: any[][] = questionsSheet.data.values;
			const questions: IQuestion[] = [];
			rows.forEach((row: string[], index: number) => {
				if (index <= 0) { return; }
				questions.push({
					answer: row[1],
					answers: [ row[1], row[2], row[3], row[4] ],
					difficulty: row[5] as 'easy' | 'medium' | 'hard',
					imageUrl: row[6],
					text: row[0]
				});
			});
			this.questions = questions;
			this.logger.info(`Successfully fetched ${this.questions.length} question(s).`);

			return this.questions;
		} catch (err) {
			this.logger.error(`Failed to fetch trivia questions from spreadsheet with ID '${spreadsheetId}': `, err);

			return;
		}
	}

	private onReady() {
    this.logger.info(`${this.logger.context} is ready (${this.guilds.size} guilds)`);
	}

	private onWarn(info: {}): void {
    this.logger.warn('Discord warning: ', info);
  }

	private async onPause(): Promise<void> {
		// Set the prefix
		await this.setDefaultSetting('prefix', '?');
		// Fetch questions
		await this.fetchQuestions();
		// Continue
    this.continue();
	}
	
	private onError(error: Error): void {
		this.logger.error('Client Error', error);
	}

	private onDisconnect(event: CloseEvent): void {
		this.logger.warn(`${this.logger.context} has been disconnected.`);
		this.disconnects += 1;
    this.logger.warn(`[DICONNECT:${event.code}] ${event.reason}`);
    if (event.code === 1000) {
			this.logger.warn('Disconnect with event code 1000. Exiting process...');
			process.exit();
    }
    if (this.disconnects >= 10) {
      this.logger.warn(`${this.disconnects} failed attempts on reconnecting. Exiting process...`);
    }
    this.logger.warn(`[ATTEMPT:${this.disconnects}] Attempting to login again...`);
    this.login(this.token).catch(err => {
			this.logger.info(`[ERROR] Error when attempting to login after disconnect.\n${err}`);
      process.exit();
    });
  }

  private onReconnecting(): void {
    this.logger.warn(`${this.logger.context} is reconnecting.`);
  }

}