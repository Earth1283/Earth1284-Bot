const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios');
const { token, clientId } = require('./config.json');

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random joke')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Choose a joke category')
        .setRequired(false)
        .addChoices(
          { name: 'Any', value: 'Any' },
          { name: 'Miscellaneous', value: 'Misc' },
          { name: 'Programming', value: 'Programming' },
          { name: 'Dark', value: 'Dark' },
          { name: 'Pun', value: 'Pun' },
          { name: 'Spooky', value: 'Spooky' },
          { name: 'Christmas', value: 'Christmas' },
        )),
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

// Register commands globally
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Handle /joke command
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'joke') {
    const category = interaction.options.getString('category') || 'Any';

    try {
      const response = await axios.get(`https://v2.jokeapi.dev/joke/${category}`, {
        params: { type: 'twopart' },
      });

      if (response.data.type === 'twopart') {
        await interaction.reply(`${response.data.setup}\n\n${response.data.delivery}`);
      } else {
        await interaction.reply(response.data.joke);
      }
    } catch (error) {
      console.error('Error fetching joke:', error);
      await interaction.reply('Sorry, I couldn\'t fetch a joke right now.');
    }
  }
});

client.login(token);
