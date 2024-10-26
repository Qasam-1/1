import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

import { Button } from 'classes/button';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Developer,
  customId: 'button-execute-edit',
  isDeveloperOnly: true,
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
              .setValue(
                interaction.message.embeds[0].description?.replace('```js', '').split('').reverse().join('').replace('```', '').split('').reverse().join('') ??
                  ''
              )
              .setPlaceholder('console.log("hello world!");')
              .setMaxLength(4000)
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
          )
        )
    );
  }
});
