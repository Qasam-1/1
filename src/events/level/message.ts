import { EmbedBuilder, Events, roleMention, type MessageCreateOptions } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLanguage, getUserLanguage } from 'db/language';
import { appendXP, getLevel, getLevelConfig, getRandomExp, getRewardsForLevel } from 'db/level';

import { AnnouncementType } from 'types/level';

import { logger } from 'utils/logger';

const cooldowns = new Set();

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    if (!message.inGuild() || message.author.bot || cooldowns.has(message.author.id)) {
      return;
    }

    const { channel, author: user, guild, member } = message;

    // Check if levelling is disabled, or if the channel is ignored and return
    const level = (await getLevelConfig(guild.id)) ?? {
      enabled: false,
      ignoredChannels: [] as string[],
      enabledChannels: [] as string[],
      announcement: AnnouncementType.UserChannel
    };

    if (!level.enabled || level.ignoredChannels.includes(channel.id) || (level.enabledChannels.length && !level.enabledChannels.includes(channel.id))) {
      return;
    }

    let gainedXP = getRandomExp();

    for (const multiplier of level.multipliers) {
      if (!member?.roles.cache.has(multiplier.roleId)) {
        continue;
      }

      gainedXP *= multiplier.multiplier;
    }

    // Get current level before adding XP
    const currentLevel = await getLevel(user.id, guild.id, true);
    // Get updated level after adding XP
    const updatedLevel = await appendXP(user.id, guild.id, gainedXP);

    // After we added XP, we add the user to a cooldown
    // We do not want the user to level up by spamming
    cooldowns.add(user.id);
    // After 60 seconds, we remove the user from the cooldown
    setTimeout(() => cooldowns.delete(user.id), 60_000);

    // If the level is the same, return
    if (currentLevel.level === updatedLevel.level) {
      return;
    }

    // Now we know the user has levelled up, we can send a message

    // Get any rewards for the new level
    const rewards = await getRewardsForLevel(updatedLevel);

    // Get the language of the user or guild depending on if the message is sent in the guild or to the user
    const lng = level.announcement === AnnouncementType.OtherChannel ? await getGuildLanguage(guild.id) : await getUserLanguage(user.id);

    const levelUpEmbed = new EmbedBuilder()
      .setColor(client.colors.level)
      .setAuthor({
        name: user.displayName,
        iconURL: user.displayAvatarURL()
      })
      .addFields({
        name: t('level.up.title', { lng }),
        value: t('level.up.description', { lng, level: updatedLevel.level })
      });

    // If there are rewards, we add the roles to the message and if they could not be added, we let the user know
    if (rewards?.length && member) {
      const added = await member.roles.add(rewards.map((r) => r.roleId)).catch((err) => logger.debug({ err }, 'Could not add role(s)'));

      if (added) {
        levelUpEmbed.addFields({
          name: t('level.up.title-roles', { lng }),
          value: rewards.map((r) => roleMention(r.roleId)).join(' ')
        });
      } else {
        levelUpEmbed.addFields({
          name: t('level.up.title-roles-error', { lng }),
          value: rewards.map((r) => roleMention(r.roleId)).join(' ')
        });
      }
    }

    const levelUpMessage: MessageCreateOptions = {
      content: user.toString(),
      embeds: [levelUpEmbed]
    };

    switch (level.announcement) {
      case AnnouncementType.UserChannel:
        {
          // Send the message to the current channel
          const msg = await channel.send(levelUpMessage).catch((err) => logger.debug({ err }, 'Could not send message'));

          // Delete the message after 5 seconds
          setTimeout(async () => {
            if (msg && msg.deletable) await msg.delete().catch((err) => logger.debug({ err }, 'Could not delete message'));
          }, 5000);
        }
        break;
      case AnnouncementType.OtherChannel:
        {
          // Get the guilds announcement channel
          if (!level.channelId) return;
          const channel = guild.channels.cache.get(level.channelId);
          // If the channel is not sendable, return
          if (!channel?.isSendable()) return;

          // Send the message to the announcement channel
          await channel.send(levelUpMessage).catch((err) => logger.debug({ err }, 'Could not send message'));
        }
        break;
      case AnnouncementType.PrivateMessage:
        {
          // We don't need to keep the message content as the user mention when the message is sent to DMs
          // Instead we let the user know from what guild the message came from
          levelUpMessage.content = t('level.up.message', { lng, guild: guild.name });
          // Send the message to the user
          await client.users.send(user.id, levelUpMessage).catch((err) => logger.debug({ err, userId: user.id }, 'Could not send DM'));
        }
        break;
    }
  }
});
