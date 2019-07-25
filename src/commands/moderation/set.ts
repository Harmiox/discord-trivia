import { Command, Message, Middleware } from '@yamdbf/core';
import { using } from '@yamdbf/core/bin/command/CommandDecorators';
import { Role, TextChannel } from 'discord.js';
import { TriviaClient } from '../../client/trivia-client';
import { GuildStorageKeys } from '../../config/enum/guild-storage-keys.enum';
import { checkModPermissions } from '../../middlewares/validate-mod';
import { AppLogger } from '../../util/app-logger';

/**
 * Set Command
 */

export default class extends Command<TriviaClient> {
	private logger: AppLogger = new AppLogger('SetCommand');

	public constructor() {
		super({
			desc: 'Set guild settings',
			group: 'Moderation',
			guildOnly: true,
			name: 'set',
			usage: `<prefix>set <option> <value>` 
		});

		// Attatch Middleware
		this.use((message: Message, args: any[]) => checkModPermissions(message, args, this));
	}

	@using(Middleware.resolve('option: String, value: String'))
	@using(Middleware.expect(
		`option: [`
		+ `'${GuildStorageKeys.commandsChannelId}',`
		+ `'${GuildStorageKeys.modRoleId}'`
		+ `], value: String`))
	public async action(message: Message, [option, value]: [string, string]): Promise<Message | Message[]> {
		try {
			switch (option) {
				case GuildStorageKeys.commandsChannelId:
					const channel: TextChannel = message.mentions.channels.first() || this.client.channels.get(value) as TextChannel;
					if (!channel) { return message.reply('please mention a channel or give the channel ID.'); }
					await message.guild.storage.set(GuildStorageKeys.commandsChannelId, channel.id);

					return message.reply(`the **${option}** option has been set to ${channel}.`);
				case GuildStorageKeys.modRoleId:
					const role: Role = message.mentions.roles.first() || message.guild.roles.get(value);
					if (!channel) { return message.reply('please mention a role or give the role ID.'); }
					await message.guild.storage.set(GuildStorageKeys.commandsChannelId, channel.id);
					
					return message.reply(`the **${option}** has been set to **${role.name} (${role.id})**.`);
				default:
					return message.reply('it appears that is not yet internally supported.');
			}
		} catch (err) {
			this.logger.error(err);

			return message.reply(`Error:\`\`\`\n${err.message}\`\`\``);
		}
		
	}
}