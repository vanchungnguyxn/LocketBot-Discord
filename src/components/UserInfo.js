const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class UserInfo {
  static createUserInfoEmbed(userData) {
    const { displayName, email, localId } = userData;
    
    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('Thông Tin Người Dùng')
      .setDescription([
        '**Avatar**',
        '',
        `**Locket Name:** ${displayName || 'Chưa cập nhật'}`,
        '',
        `**UID:** ${localId}`
      ].join('\n'))
      .setFooter({ text: 'Locket Bot' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('view_latest_moment')
          .setLabel('🖼️ Xem Moment mới nhất')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('back_to_menu')
          .setLabel('⬅️ Quay lại Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    return { embeds: [embed], components: [row] };
  }
}

module.exports = UserInfo; 