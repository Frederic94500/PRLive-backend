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
import { buttonPRJoinHandler, buttonPRModalPickHandler, modalPRPickHandler } from './discordAction.service';

import { PRStatus } from '@/enums/prStatus.enum';
import { Server } from '@/interfaces/server.interface';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  try {
    if (interaction.isButton()) {
      const customId = interaction.customId;
      try {
        if (customId.startsWith('prjoin_')) {
          await buttonPRJoinHandler(interaction);
        } else if (customId.startsWith('prmodalpick_')) {
          await buttonPRModalPickHandler(interaction);
        } else {
          await interaction.reply({ content: 'Invalid button', ephemeral: true });
        }
      } catch (err) {
        await interaction.reply({ content: 'Error during handling button', ephemeral: true });
        sendDiscordLoggingMessage(`Error during handling button: ${err}`);
        console.log(err);
      }
    } else if (interaction.isModalSubmit()) {
      const customId = interaction.customId;
      try {
        if (customId.startsWith('prpick_')) {
          await modalPRPickHandler(interaction);
        } else {
          await interaction.reply({ content: 'Invalid modal', ephemeral: true });
        }
      } catch (err) {
        await interaction.reply({ content: 'Error during handling modal', ephemeral: true });
        sendDiscordLoggingMessage(`Error during handling modal: ${err}`);
      }
    }
  } catch (err) {
    console.log(err);
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

    const row = new ActionRowBuilder<ButtonBuilder>();

    let infos = "";
    if (pr.status === PRStatus.NOMINATION) {
      infos = `Pick per user: **${pr.nomination.songPerUser}**\nNomination deadline: <t:${new Date(pr.nomination.deadlineNomination).getTime() / 1000}:F>\nDeadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`;
      const button = new ButtonBuilder().setLabel('Pick PR').setStyle(ButtonStyle.Primary).setCustomId(`prmodalpick_${pr._id}`);
      row.addComponents(button);
    } else if (pr.status === PRStatus.RANKING) {
      infos = `Number of songs: **${pr.songList.length}**\nDeadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`;
      const button = new ButtonBuilder().setLabel('Join PR').setStyle(ButtonStyle.Primary).setCustomId(`prjoin_${pr._id}`);
      row.addComponents(button);
    }

    discordAnnounceChannel.send({
      content: `Hello <@&${server.roleId}>!
A new PR has been created by <@${pr.creator}>!
# ${pr.name}
${message}
${infos}
Click Join PR to participate!`,
      components: [row],
    });

    sendDiscordLoggingMessage(`Post announce message for PR ${pr.name} in announce channel in ${server.name}\nChannel: ${discordAnnounceChannel}`);
  } catch (err) {
    sendDiscordLoggingMessage(`Error during creating PR for: ${pr.name}\nError: ${err}`);
  }
}

export function createDiscordBulkAnnounceMessage(server: Server, prs: PR[], message: string) {
  try {
    const discordAnnounceChannel = client.channels.cache.get(server.announceId) as TextChannel;
    const row = new ActionRowBuilder<ButtonBuilder>();
    const prListing: string[] = [];
    for (const pr of prs) {
      if (pr.status === PRStatus.RANKING) {
        const button = new ButtonBuilder().setLabel(`Join ${pr.name}`).setStyle(ButtonStyle.Primary).setCustomId(`prjoin_${pr._id}`);
        row.addComponents(button);
        prListing.push(`PR **${pr.name}** - **${pr.songList.length} songs** - Deadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`);
      } else if (pr.status === PRStatus.NOMINATION) {
        const button = new ButtonBuilder().setLabel(`Pick ${pr.name}`).setStyle(ButtonStyle.Primary).setCustomId(`prmodalpick_${pr._id}`);
        row.addComponents(button);
        prListing.push(`PR **${pr.name}** - **Pick per user: ${pr.nomination.songPerUser}** - Nomination deadline: <t:${new Date(pr.nomination.deadlineNomination).getTime() / 1000}:F> - Deadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`);
      }
    }
    
    discordAnnounceChannel.send({
      content: `Hello <@&${server.roleId}>!
${message}
${prListing.join('\n')}
Click Join PR to participate!`,
      components: [row],
    });

    sendDiscordLoggingMessage(`Post announce message for bulk PRs in announce channel in ${server.name}\nChannel: ${discordAnnounceChannel}`);
  } catch (err) {
    sendDiscordLoggingMessage(`Error during creating bulk announce message\nError: ${err}`);
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
