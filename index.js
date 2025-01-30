const { Client, GatewayIntentBits } = require('discord.js');
const { token, clientId } = require('./config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios'); // Import Axios

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Translation/Localization for confirmation messages
const messages = {
  "en-US": {
    crashPrompt: "Are you sure you want to crash the bot? (Only for authorized user)",
    confirmLabel: "Confirm Crash",
    cancelLabel: "Cancel",
    crashConfirmMessage: "Bot is crashing now...",
    crashCancelMessage: "Crash cancelled."
  },
  "fr": {
    crashPrompt: "Êtes-vous sûr de vouloir planter le bot ? (Uniquement pour l'utilisateur autorisé)",
    confirmLabel: "Confirmer le plantage",
    cancelLabel: "Annuler",
    crashConfirmMessage: "Le bot plante maintenant...",
    crashCancelMessage: "Plantage annulé."
  },
  // Add more languages as needed
};

const commands = [
  new SlashCommandBuilder().setName('kick').setDescription('Kick a user from the server')
    .addUserOption(option => option.setName('target').setDescription('The user to kick').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for kicking the user').setRequired(false)),
  
  new SlashCommandBuilder().setName('warn').setDescription('Warn a user in the server')
    .addUserOption(option => option.setName('target').setDescription('The user to warn').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for warning the user').setRequired(false)),

  new SlashCommandBuilder().setName('ban').setDescription('Ban a user from the server')
    .addUserOption(option => option.setName('target').setDescription('The user to ban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for banning the user').setRequired(false)),

  new SlashCommandBuilder().setName('joke').setDescription('Get a random joke'), // Add /joke command
  
  new SlashCommandBuilder().setName('map').setDescription('View the server map'), // Add /map command

  // Add /crash command
  new SlashCommandBuilder().setName('crash').setDescription('Crash the bot (only for authorized user)'), // /crash command
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

// Register commands globally (across all guilds)
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');

    // Log all registered commands
    console.log('Registered commands:');
    commands.forEach(command => {
      console.log(`- Name: ${command.name}, Description: ${command.description}`);
    });
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();

// Event handler when bot is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Command handling
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Handle /kick command
  if (commandName === 'kick') {
    const user = interaction.options.getUser('target');
    const member = await interaction.guild.members.fetch(user.id);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      if (member.kickable) {
        await member.kick(reason);
        await interaction.reply(`${user.tag} has been kicked.`);

        // Send DM to the user
        try {
          await user.send(`You have been kicked from ${interaction.guild.name}. Reason: ${reason}`);
        } catch (err) {
          if (err.code === 50007) {
            console.log(`Could not DM ${user.tag}: DMs are disabled.`);
          } else {
            console.error('Error sending DM:', err);
          }
        }
      } else {
        await interaction.reply('I cannot kick this user.');
      }
    } catch (err) {
      console.error('Error kicking user:', err);
    }
  }

  // Handle /warn command
  if (commandName === 'warn') {
    const user = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await interaction.reply(`${user.tag} has been warned.`);

    // Send DM to the user
    try {
      await user.send(`You have been warned in ${interaction.guild.name}. Reason: ${reason}`);
    } catch (err) {
      if (err.code === 50007) {
        console.log(`Could not DM ${user.tag}: DMs are disabled.`);
      } else {
        console.error('Error sending DM:', err);
      }
    }
  }

  // Handle /ban command
  if (commandName === 'ban') {
    const user = interaction.options.getUser('target');
    const member = await interaction.guild.members.fetch(user.id);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      if (member.bannable) {
        await member.ban({ reason: `Banned by command. Reason: ${reason}` });
        await interaction.reply(`${user.tag} has been banned.`);

        // Send DM to the user about being banned
        try {
          await user.send(`You have been banned from ${interaction.guild.name}. Reason: ${reason}`);
        } catch (err) {
          if (err.code === 50007) {
            console.log(`Could not DM ${user.tag}: DMs are disabled.`);
          } else {
            console.error('Error sending DM:', err);
          }
        }
      } else {
        await interaction.reply('I cannot ban this user.');
      }
    } catch (err) {
      console.error('Error banning user:', err);
    }
  }

  // Handle /map command
  if (commandName === 'map') {
    await interaction.reply('View the server map :point_right: http://mc5.5ijiusi.com:8080');
  }

  // Handle /joke command
  if (commandName === 'joke') {
    try {
      const response = await axios.get('https://v2.jokeapi.dev/joke/Any', {
        params: {
          type: 'twopart', // Can also be 'single' for a one-liner
        },
      });

      // Check if joke is two-part
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

  // Handle /crash command with button
  if (commandName === 'crash') {
    // This is my user ID you can change this to yours if you want
    const authorizedUserId = '862583929320112130';
    const userId = interaction.user.id;

    if (userId === authorizedUserId) {
      const locale = interaction.locale || 'en-US'; // Default to 'en-US' if locale is not available
      const localizedMessages = messages[locale] || messages['en-US']; // Fallback to English if locale is not available

      const crashButton = {
        type: 1,
        components: [
          {
            type: 2,
            style: 4,
            label: localizedMessages.confirmLabel,
            custom_id: 'crash_confirm',
          },
          {
            type: 2,
            style: 2,
            label: localizedMessages.cancelLabel,
            custom_id: 'crash_cancel',
          },
        ],
      };

      await interaction.reply({
        content: localizedMessages.crashPrompt,
        components: [crashButton],
      });
    } else {
      await interaction.reply('You are not authorized to crash the bot.');
    }
  }
});

// Handle button interactions for /crash command
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  if (customId === 'crash_confirm') {
    // Re-authenticate before crashing
    // This is my USER ID you can change this to your user ID to make it so that you can crash the bot
    const authorizedUserId = '862583929320112130';
    const userId = interaction.user.id;

    const locale = interaction.locale || 'en-US'; // Default to 'en-US' if locale is not available
    const localizedMessages = messages[locale] || messages['en-US']; // Fallback to English if locale is not available

    if (userId === authorizedUserId) {
      // Crash the bot if the user is authorized
      await interaction.reply(localizedMessages.crashConfirmMessage);

      // Delete the confirmation message after crashing
      setTimeout(() => interaction.deleteReply(), 1000);

      process.exit(1); // This will crash the bot
    } else {
      await interaction.reply('You are not authorized to confirm this action.');
    }
  } else if (customId === 'crash_cancel') {
    // Cancel the crash if the user clicks Cancel
    const locale = interaction.locale || 'en-US';
    const localizedMessages = messages[locale] || messages['en-US'];

    await interaction.update({ content: localizedMessages.crashCancelMessage, components: [] });

    // Delete the confirmation message after canceling
    setTimeout(() => interaction.deleteReply(), 1000);
  }
});

// Login to Discord with your app's token provided in `config.json`
client.login(token);
