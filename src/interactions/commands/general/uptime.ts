import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder, time, TimestampStyles } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.General,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Shows how long the bot has been running for')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('Shows the message to everyone when false').setRequired(false)),
  async execute({ interaction, lng, client }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.general)
          .setTitle(t('uptime.title', { lng }))
          .setDescription(
            t('uptime.description', {
              lng,
              uptime: time(Math.floor(interaction.client.readyTimestamp / 1000), TimestampStyles.RelativeTime)
            })
          )
      ]
    });
  }
});
