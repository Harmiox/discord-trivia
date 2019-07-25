import { Message } from "@yamdbf/core";
import { Collection, CollectorFilter, MessageEmbed, MessageReaction, ReactionCollector, ReactionCollectorOptions, TextChannel, User } from "discord.js";
import { TriviaClient } from "../client/trivia-client";
import { Points, Timers } from "../config/enum/trivia.enum";
import { ICurrentRound, IPlayer, IQuestion } from "../config/interfaces/trivia.interface";
import { AppLogger } from "./app-logger";

/**
 * Trivia Game
 */

export class TriviaGame {
	public message: Message;
	private client: TriviaClient;
	private questions: IQuestion[];
	private logger: AppLogger = new AppLogger('TriviaGame');
	private players: Map<string, IPlayer> = new Map();
	private emojis: string[] = [ '🇦', '🇧', '🇨', '🇩' ];
	private pointsToWin: number = 500;
	private currentRound: ICurrentRound;
	private winner: IPlayer;
	private embed: MessageEmbed = new MessageEmbed;

	constructor(message: Message, client: TriviaClient) {
		this.message = message;
		this.client = client;

		this.questions = this.shuffle(client.questions);
		this.embed.setColor('#7289DA');
	}

	public start(): void {
		this.ask();
	}

	public terminate(): void {
		// todo
		return;
	}

	private end(player?: User): void {
		if (!player) {
			// Find the player with the most points.
			this.winner = Array.from(this.players.values()).reduce((prev, curr) => prev.points > curr.points ? prev : curr);
			this.embed.setDescription(`The winner is ${this.winner.user} with **${this.winner.points}** points!`);
			this.message.channel.send({ embed: this.embed });
		} else {
			this.winner = this.players.get(player.id)
			this.embed.setDescription(`${this.winner.user} has won the game with **${this.winner.points}** points!`);
;			this.message.channel.send({ embed: this.embed });
		}
	}

	private async ask(): Promise<void> {
		const question: IQuestion = this.questions.shift();
		const answers: string[] = this.shuffle(question.answers);
		const timeLeftInSeconds: number = Timers[question.difficulty];

		const embed: MessageEmbed = new MessageEmbed()
			.setFooter(`Time: ${timeLeftInSeconds} seconds`)
			.setThumbnail(question.imageUrl || this.client.user.displayAvatarURL())
			.setDescription(`**${question.text}**`)
			.setColor('#7289DA');
		answers.forEach((answer: string, index: number) => {
			embed.addField('\u200B', `${this.emojis[index]} ${answer}`, true);
		});

		// Ask the question
		const message: Message = await this.message.channel.send({ embed }) as Message;
		// Collect the reactions
		const filter: CollectorFilter = (r: MessageReaction, u: User) =>  this.emojis.indexOf(r.emoji.name) >= 0;
		const options: ReactionCollectorOptions = { time: timeLeftInSeconds * 1000 };
		const collector: ReactionCollector = new ReactionCollector(message, filter, options)
			.on('collect', (r: MessageReaction, u: User) => this.onCollectorCollect(r, u))
			.on('end', (c: Collection<string, MessageReaction>, r: string) => this.onCollectorEnd(c, r));
		// Add the reactions
		for (const emoji of this.emojis) {
			message.react(emoji);
		}

		// The Current Round
		this.currentRound = { question, collector };
	}

	private async onCollectorCollect(reaction: MessageReaction, user: User) {
		// Make sure the reaction is the correct answer.
		const correctAnswer: string = this.currentRound.question.answer;
		const correctAnswerIndex: number = this.currentRound.question.answers.indexOf(correctAnswer);
		const correctReaction: string = this.emojis[correctAnswerIndex];
		const pointsWon: number = Points[this.currentRound.question.difficulty];
		if (user.bot) { return; }
		if (reaction.emoji.name !== correctReaction) { return this.logger.info(`Incorrect Reaction: ${reaction.emoji.name}`); }

		// Give the player their points.
		let player: IPlayer = this.players.get(user.id);
		if (!player) {
			const newPlayer: IPlayer = { user, points: pointsWon };
			player = newPlayer;
			this.players.set(user.id, newPlayer);
		} else {
			player.points += pointsWon;
		}

		// Ask the next question or end the game if they reach enough points to win.
		if (player.points < this.pointsToWin) {
			this.embed.setDescription(`${player.user} answered correctly first. They have received **${pointsWon}** points. *(${player.points}pts total)*`);
			await this.message.channel.send({ embed: this.embed });
			this.currentRound.collector.stop('next');
		} else if (player.points > this.pointsToWin) {
			this.end(user);
		}
	}

	private async onCollectorEnd(collected: Collection<string, MessageReaction>, reason: string) {
		// Ask next question or end the game if none are left
		if (this.questions.length === 0 && !this.winner) { return this.end(); }
		if (reason === 'time') {
			this.embed.setDescription('No one answered in time! moving to the next quesiton.');
			this.message.channel.send({ embed: this.embed }); 
		}

		return this.ask();
	}

	private shuffle(array: any[]): any[] {
		return array.sort(() => Math.random() - 0.5);
	}
}