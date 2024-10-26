import { AutoModerationActionType, AutoModerationRuleTriggerType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.AutoModerationRuleCreate,
  once: false,
  async execute(_client, autoModerationRule) {
    const { guild, creatorId, triggerType, triggerMetadata, name, exemptRoles, exemptChannels, actions } = autoModerationRule;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.AutoModerationRuleCreate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | AutoModerationRuleCreate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle(t('log.autoModerationRuleCreate.title', { lng }))
            .addFields(
              {
                name: t('log.autoModerationRuleCreate.created-by', { lng }),
                value: `<@${creatorId}>`
              },
              {
                name: t('log.autoModerationRuleCreate.rule-name', { lng }),
                value: name
              },
              {
                name: t('log.autoModerationRuleCreate.rule-trigger-type', {
                  lng
                }),
                value: AutoModerationRuleTriggerType[triggerType]
              },
              {
                name: t('log.autoModerationRuleCreate.trigger-metadata', { lng }),
                value: [
                  `${t('log.autoModerationRuleCreate.keyword-filter', { lng })}: ${
                    triggerMetadata.keywordFilter
                      .map((word) => `\`${word}\``)
                      .join(', ')
                      .slice(0, 200) || '/'
                  }`,
                  `${t('log.autoModerationRuleCreate.regex-patterns', { lng })}: ${
                    triggerMetadata.regexPatterns
                      .map((pattern) => `\`${pattern}\``)
                      .join(', ')
                      .slice(0, 200) || '/'
                  }`,
                  `${t('log.autoModerationRuleCreate.mention-total-limit', { lng })}: ${triggerMetadata.mentionTotalLimit || '/'}`,
                  `${t('log.autoModerationRuleCreate.mention-raid-protection', { lng })}: ${triggerMetadata.mentionRaidProtectionEnabled}`
                ].join('\n')
              },
              {
                name: t('log.autoModerationRuleCreate.action', { lng }),
                value:
                  actions
                    .map((action) => `${AutoModerationActionType[action.type]}`)
                    .join('\n')
                    .slice(0, 1000) || '/'
              },
              {
                name: t('log.autoModerationRuleCreate.exempt-roles', { lng }),
                value:
                  exemptRoles
                    .map((role) => `<@&${role.id}>`)
                    .join(', ')
                    .slice(0, 1000) || '/'
              },
              {
                name: t('log.autoModerationRuleCreate.exempt-channels', { lng }),
                value:
                  exemptChannels
                    .map((channel) => `<#${channel.id}>`)
                    .join(', ')
                    .slice(0, 1000) || '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | AutoModerationRuleCreate: Could not send message'));
  }
});
