import { ReactionCollector, User } from "discord.js";

export interface ICurrentRound {
	question: IQuestion;
	collector: ReactionCollector;
}

export interface IQuestion {
	text: string;
	answer: string;
	answers: [ string, string, string, string ];
	difficulty: 'easy' | 'medium' | 'hard';
	imageUrl: string;
}

export interface IPlayer {
	user: User;
	points: number;
}