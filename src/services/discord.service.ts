import { Client, GatewayIntentBits } from 'discord.js';

import { DISCORD_BOT_TOKEN } from '@config';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once('ready', () => {
  console.log('Discord bot ready!');
});

client.login(DISCORD_BOT_TOKEN);

export default client;
