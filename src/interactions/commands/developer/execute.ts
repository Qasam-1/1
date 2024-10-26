import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';

import { Command } from 'classes/command';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Developer,
  isDeveloperOnly: true,
  cooldown: 0,
  data: new SlashCommandBuilder()
    .setName('execute')
    .setDescription('Executes a console command')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild),
  async execute({ interaction }) {
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId('modal-execute')
        .setTitle('Execute command')
        .setComponents(
          new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId('command')
              .setLabel('command to execute')
              .setPlaceholder('cat src/classes/client.ts')
              .setMaxLength(4000)
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
          )
        )
    );
  }
});
