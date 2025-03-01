import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  TextChannel,
} from 'discord.js';
import client, { sendDiscordLoggingMessage } from './discord.service';

import { ORIGIN } from '@config';
import { PRModel } from '@/models/pr.model';
import { Role } from '@/enums/role.enum';
import { ServerEnum } from '@/enums/server.enum';
import { SheetModel } from '@/models/sheet.model';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import { uploadAvatar } from '@/utils/toolbox';

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
  const button = new ButtonBuilder()
    .setLabel('Sheet')
    .setStyle(ButtonStyle.Link)
    .setURL(`${ORIGIN}/sheet/${pr._id}/${user.discordId}/${newSheet._id}`);
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
}
