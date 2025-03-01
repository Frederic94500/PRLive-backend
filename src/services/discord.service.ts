import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
  TextChannel,
  ThreadAutoArchiveDuration,
  ThreadChannel,
} from 'discord.js';
import { DISCORD_BOT_LOGGING_CHANNEL_ID, DISCORD_BOT_TOKEN } from '@config';
import { PR, PRInput } from '@/interfaces/pr.interface';

import { Server } from '@/interfaces/server.interface';
import { buttonPRJoinHandler } from './discordAction.service';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;
  if (customId.startsWith('prjoin_')) {
    await buttonPRJoinHandler(interaction);
    return;
  } else {
    await interaction.reply({ content: 'Invalid button', ephemeral: true });
    return;
  }
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

      sendDiscordLoggingMessage(
        `New PR created by <@${creatorId}> in ${discordServerName}: ${prData.name}\n\nDeadline: <t:${new Date(prData.deadline).getTime() / 1000}:F>`,
      );

      return thread.id;
    }
  } catch (err) {
    sendDiscordLoggingMessage(`Error during creating PR for: ${prData.name}\nError: ${err}`);
  }
}

export function createDiscordAnnounceMessage(server: Server, pr: PR, message: string) {
  try {
    const discordAnnounceChannel = client.channels.cache.get(server.announceId) as TextChannel;

    const button = new ButtonBuilder().setLabel('Join PR').setStyle(ButtonStyle.Primary).setCustomId(`prjoin_${pr._id}`);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    discordAnnounceChannel.send({
      content: `Hello <@&${server.roleId}>!
A new PR has been created by <@${pr.creator}>!
# ${pr.name}
${message}
Number of songs: **${pr.songList.length}**
Deadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>
Click Join PR to participate!`,
      components: [row],
    });

    sendDiscordLoggingMessage(`Post announce message for PR ${pr.name} in announce channel in ${server.name}\nChannel: ${discordAnnounceChannel}`);
  } catch (err) {
    sendDiscordLoggingMessage(`Error during creating PR for: ${pr.name}\nError: ${err}`);
  }
}

export function deleteDiscordThread(pr: PR): void {
  try {
    const discordChannelThread = client.channels.cache.get(pr.threadId) as TextChannel;
    discordChannelThread.delete();

    sendDiscordLoggingMessage(`PR deleted: ${pr.name}`);
  } catch (err) {
    sendDiscordLoggingMessage(`Error during deleting PR: ${pr.name}\nError: ${err}`);
  }
}

export function addDiscordUserInThread(prName: string, prDeadline: string, threadId: string, voterId: string): void {
  try {
    const discordChannelThread = client.channels.cache.get(threadId) as TextChannel;
    discordChannelThread.send(`Welcome <@${voterId}>\n\nDeadline: <t:${new Date(prDeadline).getTime() / 1000}:F>`);

    sendDiscordLoggingMessage(`Sheet created for <@${voterId}> in PR: ${prName}`);
  } catch (error) {
    sendDiscordLoggingMessage(`Error during adding user ${voterId} in thread ${threadId}: ${error}`);
  }
}

export function removeDiscordUserInThread(prName: string, threadId: string, voterId: string): void {
  try {
    const discordChannelThread = client.channels.cache.get(threadId) as ThreadChannel;

    discordChannelThread.members.remove(voterId);
    sendDiscordLoggingMessage(`Sheet deleted for <@${voterId}> in PR: ${prName}`);
  } catch (error) {
    sendDiscordLoggingMessage(`Error during removing user ${voterId} in thread ${threadId}: ${error}`);
  }
}
