import { Client, Message } from '@yamdbf/core';
import { GuildStorageKeys } from '../config/enum/guild-storage-keys.enum';
import { GuildMember } from 'discord.js';

export async function checkChannelPermissions(
  message: Message,
  args: any[],
  client: Client
// @ts-ignore
): Promise<[Message, any[]]> {
	if (message.guild) {
		// Has Mod Role
		const member: GuildMember = message.member || await message.guild.members.fetch(message.author.id);
		const requiredRoleId: string = await message.guild.storage.get(GuildStorageKeys.modRoleId);
		if (member.roles.has(requiredRoleId)) { return [message, args]; }
		// Isn't restricted to a single channel
		const requiredChannelId: string = await message.guild.storage.get(GuildStorageKeys.commandsChannelId);
		if (!requiredChannelId) { return [message, args]; }
		// Is in allowed channel
		if (message.channel.id === requiredChannelId) { return [message, args]; }
		// Is an Owner
		if (client.owner.indexOf(message.author.id) >= 0) { return [message, args]; }
	}
}
