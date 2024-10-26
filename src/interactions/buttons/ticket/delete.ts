import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildLanguage } from 'db/language';
import { deleteTicketById, findTicket, getTicketGroup } from 'db/ticket';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Ticket,
  customId: 'button-tickets-delete',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const { guildId, channelId, customId, user, member } = interaction;

    const guildLng = await getGuildLanguage(guildId);

    const group = await getTicketGroup(customId.split('_')[1]);

    if (!group) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-group', { lng }))],
        ephemeral: true
      });
      return;
    }

    const ticket = await findTicket(channelId);

    if (!ticket) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-ticket', { lng }))],
        ephemeral: true
      });
      return;
    }

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      if (!member.roles.cache.has(group.staffRoleId)) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.staff-only', { lng }))],
          ephemeral: true
        });
        return;
      }
    }

    const hasTranscriptChannel = group.transcriptChannelId ? true : false;

    const description = [t('ticket.ticket-deleted', { lng: guildLng, deletedBy: user.toString() }), t('ticket.delete-time', { lng: guildLng })].join('\n');

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.ticket)
          .setDescription(hasTranscriptChannel ? description + '\n' + t('ticket.delete-reminder', { lng: guildLng }) : description)
      ],
      components: hasTranscriptChannel
        ? [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`button-tickets-save_${group._id.toString()}`)
                .setLabel(t('ticket.save', { lng: guildLng }))
                .setEmoji('🗂️')
                .setStyle(ButtonStyle.Success)
            )
          ]
        : []
    });

    setTimeout(async () => {
      const isDeleted = await interaction.channel?.delete().catch((err) => logger.debug({ err, channelId }, 'Could not delete ticket channel'));

      if (!isDeleted) {
        await interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.error', { lng: guildLng }))] })
          .catch((err) => logger.debug({ err }, 'Could not edit reply'));
        return;
      }

      await deleteTicketById(ticket._id);
    }, 5000);
  }
});
