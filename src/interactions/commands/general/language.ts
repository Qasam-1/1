import { ApplicationIntegrationType, EmbedBuilder, inlineCode, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getGuildLanguage, updateGuildLanguage, updateUserLanguage } from 'db/language';

import { supportedLanguages } from 'utils/language';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.General,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription('See or change the language of replies by the bot')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('user')
        .setDescription('Your personal language preference')
        .addStringOption((option) => option.setName('language').setDescription('The new language to set').setAutocomplete(true).setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('server')
        .setDescription("The server's language preference")
        .addStringOption((option) => option.setName('language').setDescription('The new language to set').setAutocomplete(true).setRequired(false))
    ),
  async autocomplete({ interaction }) {
    const choices = supportedLanguages;

    const focused = interaction.options.getFocused();

    if (!focused.length) {
      await interaction.respond(choices.map((choice) => ({ name: choice, value: choice })).slice(0, 25));
      return;
    }

    const filtered = choices.filter((choice) => choice.toLowerCase().includes(focused.toLowerCase()));

    await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })).slice(0, 25));
  },
  async execute({ interaction, lng, client }) {
    await interaction.deferReply({ ephemeral: true });
    const { user, options } = interaction;

    const guildLng = await getGuildLanguage(interaction.guildId);

    switch (options.getSubcommand()) {
      case 'user':
        {
          const language = options.getString('language', false);

          if (!language) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('language.current', { lng, language: lng }))]
            });
            return;
          }

          if (!supportedLanguages.includes(language)) {
            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.colors.error)
                  .setDescription(
                    [
                      t('language.invalid', { lng, language }),
                      t('language.supported', { lng, languages: supportedLanguages.map((value) => inlineCode(value)).join(', ') })
                    ].join('\n')
                  )
              ]
            });
            return;
          }

          await updateUserLanguage(user.id, language);
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('language.success', { lng, language }))]
          });
        }
        break;
      case 'server':
        {
          const language = options.getString('language', false);

          if (!interaction.inCachedGuild()) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('language.invalid-guild', { lng }))]
            });
            return;
          }

          if (!language) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('language.current', { lng, language: guildLng }))]
            });
            return;
          }

          if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('language.no-permission', { lng }))]
            });
            return;
          }

          if (!supportedLanguages.includes(language)) {
            await interaction.editReply({
              embeds: [
                new EmbedBuilder().setColor(client.colors.error).setDescription(
                  [
                    t('language.invalid', { lng, language }),
                    t('language.supported', {
                      lng,
                      languages: supportedLanguages.map((value) => inlineCode(value)).join(', ')
                    })
                  ].join('\n')
                )
              ]
            });
            return;
          }

          await updateGuildLanguage(interaction.guildId, language);
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('language.success', { lng, language }))]
          });
        }
        break;
    }
  }
});
