import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getClientSettings } from 'db/client';

import { keys } from 'constants/keys';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.General,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Gives you an invite link for the bot')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
  async execute({ interaction, client, lng }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const settings = (await getClientSettings(keys.DISCORD_BOT_ID)) ?? { support: { botInvite: null } };

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.general).setTitle(t('invite.title', { lng })).setDescription(settings.support.botInvite)]
    });
  }
});
