import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  inlineCode,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { createInfraction } from 'db/infraction';
import { getUserLanguage } from 'db/language';
import { getModeration } from 'db/moderation';

import { logger } from 'utils/logger';

import { InfractionType } from 'types/infraction';
import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Moderation,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('The reason for the warn').setMaxLength(300).setRequired(false)),
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    enum CustomIds {
      Confirm = 'button-warn-confirm',
      Cancel = 'button-warn-cancel'
    }

    const { options, guild, user, member } = interaction;

    const target = options.getUser('user', true);
    const targetMember = await guild.members.fetch(target.id).catch((err) => logger.debug({ err, userId: target.id }, 'Could not fetch target member'));
    const targetLng = await getUserLanguage(target.id);

    const config = await getModeration(guild.id, true);

    if (config.staffroleId && !member.permissions.has(PermissionFlagsBits.ModerateMembers) && !member.roles.cache.has(config.staffroleId)) {
      await interaction.editReply(t('moderation.staffrole.error', { lng }));
      return;
    }

    if (!targetMember) {
      await interaction.editReply(t('warn.target.invalid', { lng }));
      return;
    }

    if (config.reasonsRequired && !options.getString('reason', false)) {
      await interaction.editReply(t('moderation.reasons.required-error', { lng }));
      return;
    }

    const targetRolePos = targetMember?.roles.highest.position ?? 0;
    const staffRolePos = member.roles.highest.position ?? 0;

    if (targetRolePos >= staffRolePos) {
      await interaction.editReply(t('warn.target.pos-staff', { lng }));
      return;
    }

    const reason = options.getString('reason', false);

    const msg = await interaction.editReply({
      content: t('warn.confirm', { lng, user: target.toString() }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(CustomIds.Confirm).setEmoji('✔').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(CustomIds.Cancel).setEmoji('✖').setStyle(ButtonStyle.Danger)
        )
      ]
    });

    const collector = await msg.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      componentType: ComponentType.Button,
      time: 30_000
    });

    if (collector.customId === CustomIds.Cancel) {
      await collector.update({
        content: t('warn.cancelled', { lng }),
        components: []
      });
    } else if (collector.customId === CustomIds.Confirm) {
      const receivedDM = await client.users
        .send(target.id, {
          content: t('warn.target-dm', {
            lng: targetLng,
            guild: inlineCode(guild.name),
            reason: inlineCode(reason ?? t('none', { lng }))
          })
        })
        .catch((err) => logger.debug({ err, target }, 'Could not send DM'));

      await collector.update({
        content: [
          t('warn.confirmed', {
            lng,
            user: target.toString(),
            reason: inlineCode(reason ?? t('none', { lng }))
          }),
          receivedDM ? t('warn.dm-received', { lng }) : t('warn.dm-not-received', { lng })
        ].join('\n'),
        components: []
      });

      if (target.bot) {
        return;
      }

      await createInfraction(guild.id, target.id, user.id, InfractionType.Warn, reason ?? undefined, undefined, Date.now(), true);
    }
  }
});
