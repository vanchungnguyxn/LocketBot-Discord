const { 
    Client, 
    GatewayIntentBits, 
    InteractionType 
  } = require('discord.js');
  const config = require('./src/config/config');
  const interactionHandler = require('./src/handlers/interactionHandler');
  const logger = require('./src/utils/logger');
  const locket = require('./src/utils/locketApi_iOS'); 
  require('dotenv').config();
  require('./src/config/firebase'); 

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ],
    partials: ['CHANNEL']
  });
  
  let currentUser = {
    idToken: null,
    refreshToken: null,
    appCheckToken: process.env.FIREBASE_APPCHECK_TOKEN,          
    firebaseInstanceIdToken: process.env.FIREBASE_INSTANCE_ID, 
  };
  

  async function loginFlow(email, password) {
    const { idToken, refreshToken } = await locket.login({
      email,
      password,
      appCheckToken: currentUser.appCheckToken
    });
  
    currentUser.idToken = idToken;
    currentUser.refreshToken = refreshToken;
  
    await locket.setClientData({
      idToken,
      appCheckToken: currentUser.appCheckToken,
      clientData: {
        time_zone: 'Asia/Ho_Chi_Minh',
      }
    });
  
    await locket.verifyClient({
      fcmToken: currentUser.firebaseInstanceIdToken,
      analytics: { /* ... nhồi analytics như traffic gốc */ },
      appCheckToken: currentUser.appCheckToken
    });
  
    return { idToken, refreshToken };
  }
  
  process.on('unhandledRejection', error => {
    logger.error('Unhandled promise rejection:', error);
  });
  
  process.on('uncaughtException', error => {
    logger.error('Uncaught exception:', error);
  });
  
  client.on('ready', () => {
    logger.info(`Bot logged in as ${client.user.tag}`);
  });
  
  client.on('interactionCreate', async interaction => {
    try {
      if (interaction.isCommand()) {
        await interactionHandler.handleCommand(interaction, { loginFlow, locket, currentUser });
      } else if (interaction.isButton()) {
        await interactionHandler.handleButton(interaction, { loginFlow, locket, currentUser });
      } else if (interaction.type === InteractionType.ModalSubmit) {
        await interactionHandler.handleModal(interaction, { loginFlow, locket, currentUser });
      }
    } catch (error) {
      logger.error('Interaction error:', error);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ Có lỗi xảy ra. Vui lòng thử lại sau.', ephemeral: true });
        } else {
          await interaction.followUp({ content: '❌ Có lỗi xảy ra. Vui lòng thử lại sau.', ephemeral: true });
        }
      } catch (err) {
        logger.error('Failed to send error message:', err);
      }
    }
  });
  
  client.on('messageCreate', async msg => {
    if (msg.channel.type === 1 && !msg.author.bot && msg.attachments.size > 0) {
        try {
            await interactionHandler.handleMessageCreate(msg);
        } catch (error) {
            logger.error('Failed to handle message:', error);
            await msg.reply('❌ Có lỗi xảy ra khi xử lý file của bạn.').catch(() => {});
        }
    }
  });
  
  client.login(config.discord.token).catch(error => {
    logger.error('Failed to login:', error);
    process.exit(1);
  });
  