import type { AnySelectMenuInteraction, PermissionsString } from 'discord.js';

import type { DiscordClient } from 'classes/client';

import type { ModuleType } from 'types/interactions';

export class Selection {
  constructor(
    public options: {
      module: ModuleType;
      customId: string;
      cooldown?: number; // Cooldown between button executes per user (in milliseconds)
      isDeveloperOnly?: boolean; // If true, can only be used by developers
      isAuthorOnly?: boolean; // If true, can only be used by the original command executor
      isCustomIdIncluded?: boolean; // If true, customId does not need to be an exact match
      permissions?: PermissionsString[]; // Array of permissions required to use the button
      botPermissions?: PermissionsString[]; // Array of permissions the bot requires
      execute({ client, interaction, lng }: { client: DiscordClient; interaction: AnySelectMenuInteraction; lng: string }): unknown;
    }
  ) {}
}
