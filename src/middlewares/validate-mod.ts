import { Command, Message } from '@yamdbf/core';
import { GuildMember } from 'discord.js';
import { GuildStorageKeys } from '../config/enum/guild-storage-keys.enum';

export async function checkModPermissions(
  message: Message,
  args: any[],
  command: Command
// @ts-ignore
): Promise<[Message, any[]]> {
	if (message.guild) {
		const member: GuildMember = message.member || await message.guild.members.fetch(message.author.id);
		const requiredRoleId: string = await message.guild.storage.get(GuildStorageKeys.modRoleId);
		// Has Mod Role
		if (member.roles.has(requiredRoleId)) { return [message, args]; }
		// Is an Owner
		if (command.client.owner.indexOf(message.author.id) >= 0) { return [message, args]; }
	}
}
