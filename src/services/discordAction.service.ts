import { AWS_S3_STATIC_PAGE_URL, ORIGIN } from '@config';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  ModalBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { askToUploadAudio, uploadAvatar } from '@/utils/toolbox';
import client, { sendDiscordLoggingMessage } from './discord.service';

import { PRModel } from '@/models/pr.model';
import { PRService } from './pr.service';
import { Role } from '@/enums/role.enum';
import { ServerEnum } from '@/enums/server.enum';
import { SheetModel } from '@/models/sheet.model';
import { Song } from '@/interfaces/song.interface';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import { v4 as uuidv4 } from 'uuid';

const form = [
  {
    customId: 'songInfo',
    label: 'Song Info - Format: "title" by artist',
    placeholder: 'Example: "Gurenge" by LiSA',
    style: TextInputStyle.Short,
    required: true,
  },
  {
    customId: 'source',
    label: 'Source',
    placeholder: 'Example: Kimetsu no Yaiba',
    style: TextInputStyle.Short,
    required: false, 
  },
  {
    customId: 'type',
    label: 'Type (Opening, Ending, Insert, Original...',
    placeholder: 'Example: Opening 1',
    style: TextInputStyle.Short,
    required: true,
  },
  {
    customId: 'startSample',
    label: 'Start sample (in seconds)',
    placeholder: 'Example: 0',
    style: TextInputStyle.Short,
    required: true,
  },
  {
    customId: 'urlVideo',
    label: 'URL Video',
    placeholder: 'Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    style: TextInputStyle.Short,
    required: true,
  }
];

async function checkUser(interaction: Interaction): Promise<User> {
  const userDiscord = interaction.user;
  let user: User = await UserModel.findOne({ discordId: userDiscord.id });
  if (user) return user;
  
  const image = await uploadAvatar(userDiscord.id, userDiscord.avatar);

  const newUser: User = {
    discordId: userDiscord.id,
    username: userDiscord.username,
    name: userDiscord.username.charAt(0).toUpperCase() + userDiscord.username.slice(1),
    image: image,
    role: Role.USER,
    server: ServerEnum.EU,
  };

  return await UserModel.create(newUser);
}


export async function buttonPRJoinHandler(interaction: Interaction) {
  if (!interaction.isButton()) return;
  
  const customId = interaction.customId;
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

  const user = await checkUser(interaction);
  const userDiscord = interaction.user;

  const sheet = await SheetModel.findOne({ prId: pr._id, voterId: userDiscord.id });
  if (sheet) {
    const button = new ButtonBuilder()
      .setLabel('Sheet')
      .setStyle(ButtonStyle.Link)
      .setURL(`${ORIGIN}/sheet/${pr._id}/${user.discordId}/${sheet._id}`);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
    await interaction.reply({ content: 'You have already joined this PR. Here is your sheet.', components: [row], ephemeral: true });
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

  const userDM = await userDiscord.createDM();
  const button = new ButtonBuilder()
    .setLabel('Sheet')
    .setStyle(ButtonStyle.Link)
    .setURL(`${ORIGIN}/sheet/${pr._id}/${user.discordId}/${newSheet._id}`);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  const message = `You have successfully joined PR **${pr.name}**!\nTo fill your sheet, please click Sheet.\n\nDeadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`

  try {
    await userDM.send({
      content: message,
      components: [row],
    });
    await interaction.reply({ content: 'You have successfully joined the PR. Please check your DM.', ephemeral: true });
  } catch (err) {
    sendDiscordLoggingMessage(`Error during sending DM to <@${user.discordId}> for sheet ${newSheet._id}: ${err}`);
    await interaction.reply({ content: `Error during sending DM to you.\n\n${message}`, components: [row], ephemeral: true });
  }

  const discordChannelThread = client.channels.cache.get(pr.threadId) as TextChannel;
  discordChannelThread.send(`Welcome <@${user.discordId}>\n\nDeadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`);

  sendDiscordLoggingMessage(`Sheet created for <@${user.discordId}> in PR ${pr.name} via Discord Announce Message`);
}

export async function buttonPRModalPickHandler(interaction: Interaction) {
  if (!interaction.isButton()) return;
  
  const customId = interaction.customId;
  const prId = customId.split('_')[1];
  
  const pr = await PRModel.findById(prId);
  if (!pr) {
    await interaction.reply({ content: 'PR not found.', ephemeral: true });
    return;
  }
  if (pr.finished) {
    await interaction.reply({ content: 'PR is finished, no more picking/joining.', ephemeral: true });
    return;
  }
  if (pr.nomination) {
    if (pr.nomination.endNomination) {
      await interaction.reply({ content: 'The nomination phase is over.', ephemeral: true });
      return;
    }
  }
  const userDiscord = interaction.user;
  if (pr.nomination.songPerUser <= pr.nomination.nominatedSongList.filter(nominated => nominated.nominator === userDiscord.id).length) {
    await interaction.reply({ content: `You have already picked **${pr.nomination.songPerUser}** songs.`, ephemeral: true });
    return;
  }

  const modal = new ModalBuilder()
    .setTitle(`Pick a song for PR ${pr.name}`)
    .setCustomId(`prpick_${pr._id}`);

  modal.addComponents(form.map(field => new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId(field.customId).setLabel(field.label).setPlaceholder(field.placeholder).setStyle(field.style).setRequired(field.required))));
  
  await interaction.showModal(modal);
}

export async function modalPRPickHandler(interaction: Interaction) {
  if (!interaction.isModalSubmit()) return;
  
  const customId = interaction.customId;
  const prId = customId.split('_')[1];
  
  const pr = await PRModel.findById(prId);
  if (!pr) {
    await interaction.reply({ content: 'PR not found.', ephemeral: true });
    return;
  }
  if (pr.finished) {
    await interaction.reply({ content: 'PR is finished, no more picking/joining.', ephemeral: true });
    return;
  }
  if (pr.nomination) {
    if (pr.nomination.endNomination) {
      await interaction.reply({ content: 'The nomination phase is over.', ephemeral: true });
      return;
    }
  }
  const userDiscord = interaction.user;
  if (pr.nomination.songPerUser <= pr.nomination.nominatedSongList.filter(nominated => nominated.nominator === userDiscord.id).length) {
    await interaction.reply({ content: `You have already picked ${pr.nomination.songPerUser} songs.`, ephemeral: true });
    return;
  }

  const user = await checkUser(interaction);

  const songInfo = interaction.fields.getTextInputValue('songInfo');
  const regex = /"(.+)" by (.+)/;
  const match = songInfo.match(regex);
  if (!match) {
    await interaction.reply({ content: 'Invalid song name format.', ephemeral: true });
    return;
  }

  let startSample: number;
  try {
    startSample = parseFloat(interaction.fields.getTextInputValue('startSample'));
  } catch (err) {
    await interaction.reply({ content: 'Invalid start sample format.', ephemeral: true });
    return;
  }
  if (isNaN(startSample)) {
    await interaction.reply({ content: 'Invalid start sample format.', ephemeral: true });
    return
  }

  const source = interaction.fields.getTextInputValue('source') || '';
  if (source.length > 128) {
    await interaction.reply({ content: 'Source is too long.', ephemeral: true });
    return;
  }

  const type = interaction.fields.getTextInputValue('type');
  if (type.length > 25) {
    await interaction.reply({ content: 'Type is too long.', ephemeral: true });
    return;
  }

  const urlVideo = interaction.fields.getTextInputValue('urlVideo');
  const urlRegex = /^https:\/\/.+/;
  if (!urlRegex.test(urlVideo)) {
    await interaction.reply({ content: 'Invalid URL Video format.', ephemeral: true });
    return;
  }

  const uuid = uuidv4();
  const urlAudio = `${AWS_S3_STATIC_PAGE_URL}/PR/${pr._id}/${uuid}.mp3`;
  askToUploadAudio(urlVideo, `PR/${pr._id}`, uuid);

  const songData: Song = {
    artist: match[2],
    title: match[1],
    source: source,
    type: type,
    urlVideo: urlVideo,
    urlAudio: urlAudio,
    uuid: '',
    orderId: 0,
    startSample: startSample,
    sampleLength: 30,
    tiebreak: 0,
    nominator: user.discordId,
  };

  try {
    new PRService().addSongPR(pr._id, songData);
    await interaction.reply({ content: `Song ${songData.artist} - ${songData.title} has been picked.`, ephemeral: true });
  } catch (err) {
    await interaction.reply({ content: `Error during picking song.\n\n${err}`, ephemeral: true });
    return;
  }
}
