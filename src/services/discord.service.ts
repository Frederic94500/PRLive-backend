import { ChannelType, Client, GatewayIntentBits, TextChannel, ThreadAutoArchiveDuration } from 'discord.js';
import { DISCORD_BOT_LOGGING_CHANNEL_ID, DISCORD_BOT_TOKEN } from '@config';
import { PR, PRInput } from '@/interfaces/pr.interface';

import { Server } from '@/interfaces/server.interface';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once('ready', () => {
  console.log('Discord bot ready!');
});

client.login(DISCORD_BOT_TOKEN);

export default client;


export async function sendDiscordLoggingMessage(message: string): Promise<void> {
  try {
    const discordChannelLog = client.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
    discordChannelLog.send(message);
  } catch (err) {
    console.log(err);
  }
}

export async function createDiscordThread(server: Server, prData: PRInput, creatorId: string): Promise<string> {
  try {
    const discordServerName = client.guilds.cache.get(server.discordId).name;
    const discordChannelThreads = client.channels.cache.get(server.threadsId) as TextChannel;

    if (discordChannelThreads) {
      const thread = await discordChannelThreads.threads.create({
        name: prData.name,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        type: ChannelType.PrivateThread,
        reason: `${prData.name} for <@${creatorId}>`,
      });
      thread.send(`# ${prData.name}\nPR created by <@${creatorId}>\n\nDeadline: <t:${new Date(prData.deadline).getTime() / 1000}:F>`);

      sendDiscordLoggingMessage(`New PR created by <@${creatorId}> in ${discordServerName}: ${prData.name}\n\nDeadline: <t:${new Date(prData.deadline).getTime() / 1000}:F>`);

      return thread.id;
    }
  } catch (err) {
    sendDiscordLoggingMessage(`Error during creating PR for: ${prData.name}\nError: ${err}`);
  }
}

// export async function createDiscordAnnounceMessage(server: Server, prData: PRInput, creatorId: string, message: string): Promise<string> {
//   try {
//     const discordServerName = client.guilds.cache.get(server.discordId).name;

//     const discordAnnounceChannel = client.channels.cache.get(server.announceId) as TextChannel;
//     const discordMessageId = discordAnnounceChannel.send(
//       ``
//     )

//     sendDiscordLoggingMessage(`Post announce message for PR ${prData.name} in announce channel in ${discordServerName}\nChannel: ${discordAnnounceChannel}`);

//     return discordMessageId
//   } catch (err) {
//     sendDiscordLoggingMessage(`Error during creating PR for: ${prData.name}\nError: ${err}`);
//   }
// }

export function deleteDiscordThread(pr: PR): void {
  try {
    const discordChannelThread = client.channels.cache.get(pr.threadId) as TextChannel;
    discordChannelThread.delete();

    sendDiscordLoggingMessage(`PR deleted: ${pr.name}`);
  } catch (err) {
    sendDiscordLoggingMessage(`Error during deleting PR: ${pr.name}\nError: ${err}`);
  }
}
