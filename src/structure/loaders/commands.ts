import { ApplicationCommandType, Collection, REST, Routes } from 'discord.js';
import { t } from 'i18next';

import { readdir } from 'node:fs/promises';
import { performance } from 'perf_hooks';

import type { DiscordClient } from 'classes/client';
import type { Command } from 'classes/command';

import { initTranslation } from 'utils/language';
import { logger } from 'utils/logger';

import { keys } from 'constants/keys';

import { ModuleType } from 'types/interactions';

export async function getCommandsCollection() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commands = new Collection<string, Command<any>>();

  const startTime = performance.now();

  const path = process.cwd() + '/src/interactions/commands/';
  const files = await readdir(path, { recursive: true });

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

    try {
      const imported: { default?: Command } = await import('file://' + path + file);
      if (!imported?.default?.options?.data?.name) continue;

      commands.set(imported.default.options.data.name, imported.default);
    } catch (err) {
      logger.error({ err }, `Error while loading command (${file})`);
      continue;
    }
  }

  const endTime = performance.now();
  return { commands, startTime, endTime };
}

export async function loadCommands(client: DiscordClient) {
  const { commands, startTime, endTime } = await getCommandsCollection();
  client.commands = commands;

  logger.info(`[${client.cluster.id}] Loaded ${commands.size} commands (${Math.floor(endTime - startTime)}ms)`);
}

export async function registerCommands() {
  // Get the commands collection from helper function
  const { commands, startTime, endTime } = await getCommandsCollection();
  logger.info(`Loaded ${commands.size} commands (${Math.floor(endTime - startTime)}ms)`);

  // Get the bot token and bot id from the keys file and create a new REST instance
  const { DISCORD_BOT_ID, DISCORD_BOT_TOKEN } = keys;
  const rest = new REST().setToken(DISCORD_BOT_TOKEN);

  // Start timer and initialize i18next
  const translateStartTime = performance.now();
  await initTranslation();
  // Translate the commands
  const translatedCommands = commands
    .map((cmd) => cmd.options.data.toJSON())
    .map((cmd) => {
      // If there is no translation for the command, don't translate anything and return the command data
      if (t(`${cmd.name}.name`, { lng: 'en', ns: 'commands' }) === `${cmd.name}.name`) return cmd;

      // Translate the command name
      cmd.name_localizations = {
        'en-GB': t(`${cmd.name}.name`, { lng: 'en', ns: 'commands' }),
        'en-US': t(`${cmd.name}.name`, { lng: 'en', ns: 'commands' }),
        de: t(`${cmd.name}.name`, { lng: 'de', ns: 'commands' })
      };
      // Translate the command description
      cmd.description_localizations = {
        'en-GB': t(`${cmd.name}.description`, { lng: 'en', ns: 'commands' }),
        'en-US': t(`${cmd.name}.description`, { lng: 'en', ns: 'commands' }),
        de: t(`${cmd.name}.description`, { lng: 'de', ns: 'commands' })
      };
      // Translate the command options
      if (cmd.options?.length) {
        cmd.options.map((optionOne, indexOne) => {
          // Translate the option name
          optionOne.name_localizations = {
            'en-GB': t(`${cmd.name}.options.${indexOne}.name`, {
              lng: 'en',
              ns: 'commands'
            }),
            'en-US': t(`${cmd.name}.options.${indexOne}.name`, {
              lng: 'en',
              ns: 'commands'
            }),
            de: t(`${cmd.name}.options.${indexOne}.name`, {
              lng: 'de',
              ns: 'commands'
            })
          };
          // Translate the option description
          optionOne.description_localizations = {
            'en-GB': t(`${cmd.name}.options.${indexOne}.description`, {
              lng: 'en',
              ns: 'commands'
            }),
            'en-US': t(`${cmd.name}.options.${indexOne}.description`, {
              lng: 'en',
              ns: 'commands'
            }),
            de: t(`${cmd.name}.options.${indexOne}.description`, {
              lng: 'de',
              ns: 'commands'
            })
          };

          // Translate the option choices
          if ('choices' in optionOne && optionOne.choices?.length) {
            optionOne.choices.map((choiceOne, indexTwo) => {
              choiceOne.name_localizations = {
                'en-GB': t(`${cmd.name}.options.${indexOne}.choices.${indexTwo}`, { lng: 'en', ns: 'commands' }),
                'en-US': t(`${cmd.name}.options.${indexOne}.choices.${indexTwo}`, { lng: 'en', ns: 'commands' }),
                de: t(`${cmd.name}.options.${indexOne}.choices.${indexTwo}`, {
                  lng: 'de',
                  ns: 'commands'
                })
              };
              return choiceOne;
            });
          }

          // Translate the option options
          if ('options' in optionOne && optionOne.options?.length) {
            optionOne.options.map((optionTwo, indexTwo) => {
              // Translate the option option name
              optionTwo.name_localizations = {
                'en-GB': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.name`, { lng: 'en', ns: 'commands' }),
                'en-US': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.name`, { lng: 'en', ns: 'commands' }),
                de: t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.name`, { lng: 'de', ns: 'commands' })
              };
              // Translate the option option description
              optionTwo.description_localizations = {
                'en-GB': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.description`, { lng: 'en', ns: 'commands' }),
                'en-US': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.description`, { lng: 'en', ns: 'commands' }),
                de: t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.description`, { lng: 'de', ns: 'commands' })
              };

              // Translate the option option choices
              if ('choices' in optionTwo && optionTwo.choices?.length) {
                optionTwo.choices.map((choiceTwo, indexThree) => {
                  choiceTwo.name_localizations = {
                    'en-GB': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.choices.${indexThree}`, { lng: 'en', ns: 'commands' }),
                    'en-US': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.choices.${indexThree}`, { lng: 'en', ns: 'commands' }),
                    de: t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.choices.${indexThree}`, { lng: 'de', ns: 'commands' })
                  };
                  return choiceTwo;
                });
              }

              if ('options' in optionTwo && optionTwo.options?.length) {
                optionTwo.options.map((optionThree, indexThree) => {
                  // Translate the option option option name
                  optionThree.name_localizations = {
                    'en-GB': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.options.${indexThree}.name`, { lng: 'en', ns: 'commands' }),
                    'en-US': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.options.${indexThree}.name`, { lng: 'en', ns: 'commands' }),
                    de: t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.options.${indexThree}.name`, { lng: 'de', ns: 'commands' })
                  };
                  // Translate the option option option description
                  optionThree.description_localizations = {
                    'en-GB': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.options.${indexThree}.description`, { lng: 'en', ns: 'commands' }),
                    'en-US': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.options.${indexThree}.description`, { lng: 'en', ns: 'commands' }),
                    de: t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.options.${indexThree}.description`, { lng: 'de', ns: 'commands' })
                  };

                  // Translate the option option option choices
                  if ('choices' in optionThree && optionThree.choices?.length) {
                    optionThree.choices.map((choiceThree, indexFour) => {
                      choiceThree.name_localizations = {
                        'en-GB': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.options.${indexThree}.choices.${indexFour}`, {
                          lng: 'en',
                          ns: 'commands'
                        }),
                        'en-US': t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.options.${indexThree}.choices.${indexFour}`, {
                          lng: 'en',
                          ns: 'commands'
                        }),
                        de: t(`${cmd.name}.options.${indexOne}.options.${indexTwo}.options.${indexThree}.choices.${indexFour}`, { lng: 'de', ns: 'commands' })
                      };
                      return choiceThree;
                    });
                  }
                  return optionThree;
                });
              }
              return optionTwo;
            });
          }
          return optionOne;
        });
      }

      if (cmd.type !== ApplicationCommandType.ChatInput) cmd.description_localizations = {};

      return cmd;
    });
  // Stop timer and log the time it took to translate the commands
  const translateStopTime = performance.now();
  logger.debug(`Translated commands (${Math.floor(translateStopTime - translateStartTime)}ms)`);

  // Split the commands into two arrays, for developer only and non-developer only commands
  const commandsArray = translatedCommands.filter(
    (cmd) => !commands.get(cmd.name)?.options.isDeveloperOnly && commands.get(cmd.name)?.options.module !== ModuleType.Developer
  );
  const devCommandsArray = translatedCommands.filter(
    (cmd) => commands.get(cmd.name)?.options.isDeveloperOnly || commands.get(cmd.name)?.options.module === ModuleType.Developer
  );

  // Register the commands globally
  const commandsStartTime = performance.now();
  await rest
    .put(Routes.applicationCommands(DISCORD_BOT_ID), { body: commandsArray })
    .catch((err) => logger.error({ err }, 'Failed to register commands'))
    .then(() => {
      const commandsEndTime = performance.now();

      logger.info(`Registered ${commandsArray.length} global application commands (${Math.floor(commandsEndTime - commandsStartTime)}ms)`);
    });

  // Register the commands for each developer guild
  for (const guildId of keys.DEVELOPER_GUILD_IDS) {
    const guildCommandsStartTime = performance.now();
    await rest
      .put(Routes.applicationGuildCommands(DISCORD_BOT_ID, guildId), {
        body: devCommandsArray
      })
      .catch((err) => logger.error({ err }, `Failed to register guild commands for ${guildId}`))
      .then(() => {
        const guildCommandsEndTime = performance.now();
        logger.info(`Registered ${devCommandsArray.length} guild commands for ${guildId} (${Math.floor(guildCommandsEndTime - guildCommandsStartTime)}ms)`);
      });
  }
}
