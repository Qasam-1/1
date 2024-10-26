import type { UpdateQuery } from 'mongoose';

import { updateGuild } from 'db/guild';
import { customVoiceModel } from 'models/custom-voice';

import type { CustomVoiceDocument } from 'types/custom-voice';

/**
 * Gets the custom voice config
 * @param {string} guildId Guild ID to get the custom voice for
 * @returns {Promise<CustomVoiceDocument | null>} Custom voice config data or null if not found
 */
export async function getCustomVoice<T extends boolean>(
  guildId: string,
  insert: boolean = false as T
): Promise<T extends true ? CustomVoiceDocument : CustomVoiceDocument | null> {
  let document = await customVoiceModel.findOne({ guildId }).lean().exec();

  if (insert && !document) {
    document = await updateCustomVoice(guildId, {});
  }

  return document as T extends true ? CustomVoiceDocument : CustomVoiceDocument | null;
}

/**
 * Updates a custom voice config
 * @param {string} guildId Guild ID to update
 * @param {UpdateQuery<CustomVoiceDocument>} query Query to update the custom voice config with
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice config
 */
async function updateCustomVoice(guildId: string, query: UpdateQuery<CustomVoiceDocument>): Promise<CustomVoiceDocument> {
  const document = await customVoiceModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();

  await updateGuild(guildId, { $set: { customVoice: document._id } });

  return document;
}

/**
 * Sets the custom voice channel
 * @param {string} guildId Guild ID to set the custom voice config for
 * @param {string} channelId Channel ID where custom voice channels will be created in
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice config
 */
export async function setCustomVoiceChannel(guildId: string, channelId: string | null): Promise<CustomVoiceDocument> {
  return await updateCustomVoice(guildId, { $set: { channelId } });
}

/**
 * Sets the custom voice parent
 * @param {string} guildId Guild ID to set the custom voice config for
 * @param {string} parentId Parent/Category ID that holds the custom voice channels
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice config
 */
export async function setCustomVoiceParent(guildId: string, parentId: string | null): Promise<CustomVoiceDocument> {
  return await updateCustomVoice(guildId, { $set: { parentId } });
}

/**
 * Deletes a custom voice config
 * @param {string} guildId Guild ID to delete the custom voice config for
 * @returns {Promise<CustomVoiceDocument | null>} Deleted custom voice config or null if not found
 */
export async function deleteCustomVoice(guildId: string): Promise<CustomVoiceDocument | null> {
  return await customVoiceModel.findOneAndDelete({ guildId }).lean().exec();
}

/**
 * Enables the custom voice config
 * @param {string} guildId Guild ID to enable the custom voice config for
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice config
 */
export async function enableCustomVoice(guildId: string): Promise<CustomVoiceDocument> {
  return await updateCustomVoice(guildId, { $set: { enabled: true } });
}

/**
 * Disables the custom voice config
 * @param {string} guildId Guild ID to disable the custom voice config for
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice config
 */
export async function disableCustomVoice(guildId: string): Promise<CustomVoiceDocument> {
  return await updateCustomVoice(guildId, { $set: { enabled: false } });
}
