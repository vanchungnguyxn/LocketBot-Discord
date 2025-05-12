client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            await interactionHandler.handleCommand(interaction);
        } else if (interaction.isButton()) {
            await interactionHandler.handleButton(interaction);
        } else if (interaction.isModalSubmit()) {
            await interactionHandler.handleModal(interaction);
        } else if (interaction.isStringSelectMenu()) {
            await interactionHandler.handleSelectMenu(interaction);
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        try {
            const reply = interaction.replied ? interaction.followUp : interaction.reply;
            await reply({ content: 'Có lỗi xảy ra khi xử lý yêu cầu của bạn.', ephemeral: true });
        } catch (e) {
            console.error('Error sending error message:', e);
        }
    }
}); 