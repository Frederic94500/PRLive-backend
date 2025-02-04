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
} from 'discord.js';
import { DISCORD_BOT_LOGGING_CHANNEL_ID, DISCORD_BOT_TOKEN, ORIGIN } from '@config';
import { PR, PRInput } from '@/interfaces/pr.interface';

import { PRModel } from '@/models/pr.model';
import { Role } from '@/enums/role.enum';
import { Server } from '@/interfaces/server.interface';
import { ServerEnum } from '@/enums/server.enum';
import { SheetModel } from '@/models/sheet.model';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import { uploadAvatar } from '@/utils/toolbox';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;
  if (!customId.startsWith('prjoin_')) {
    await interaction.reply({ content: 'Invalid button', ephemeral: true });
    return;
  }

  const prId = customId.split('_')[1];
  const pr = await PRModel.findById(prId);
  if (!pr) {
    await interaction.reply({ content: 'PR not found.', ephemeral: true });
    return;
  }
  if (pr.finished) {
    await interaction.reply({ content: 'PR is finished, no more joining.', ephemeral: true });
    return;
  }
  if (pr.nomination) {
    if (!pr.nomination.endNomination) {
      await interaction.reply({ content: 'Nomination is not closed yet.', ephemeral: true });
      return;
    }
  }

  const userDiscord = interaction.user;
  let user = await UserModel.findOne({ discordId: userDiscord.id });
  if (!user) {
    const image = await uploadAvatar(userDiscord.id, userDiscord.avatar);

    const newUser: User = {
      discordId: userDiscord.id,
      username: userDiscord.username,
      name: userDiscord.username.charAt(0).toUpperCase() + userDiscord.username.slice(1),
      image: image,
      role: Role.USER,
      server: ServerEnum.EU,
    };

    await UserModel.create(newUser);
  }
  user = await UserModel.findOne({ discordId: userDiscord.id });
  
  const sheet = await SheetModel.findOne({ prId: pr._id, voterId: userDiscord.id });
  if (sheet) {
    await interaction.reply({ content: 'You have already joined this PR.', ephemeral: true });
    return;
  }
  const newSheet = await SheetModel.create({
    prId: pr._id,
    voterId: user.discordId,
    latestUpdate: Date.now().toString(),
    name: user.name,
    image: user.image,
    sheet: pr.songList.map(song => ({
      uuid: song.uuid,
      orderId: song.orderId,
      rank: null,
      score: null,
      comment: '',
    })),
  });

  await interaction.reply({ content: 'You have successfully joined the PR.', ephemeral: true });

  const userDM = await userDiscord.createDM();
  const button = new ButtonBuilder().setLabel('Sheet').setStyle(ButtonStyle.Link).setURL(`${ORIGIN}/sheet/${pr._id}/${user.discordId}/${newSheet._id}`);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  try {
    await userDM.send({
      content: `You have successfully joined PR **${pr.name}**!\nTo fill your sheet, please click Sheet.\n\nDeadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`,
      components: [row],
    });
  } catch (err) {
    sendDiscordLoggingMessage(`Error during sending DM to <@${user.discordId}> for sheet ${newSheet._id}: ${err}`);
  }

  const discordChannelThread = client.channels.cache.get(pr.threadId) as TextChannel;
  discordChannelThread.send(`Welcome <@${user.discordId}>\n\nDeadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`);
  
  sendDiscordLoggingMessage(`Sheet created for <@${user.discordId}> in PR ${pr.name} via Discord Announce Message`);
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
      content:
`Hello <@&${server.roleId}>!
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
