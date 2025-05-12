const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, InteractionType, StringSelectMenuBuilder, TextInputStyle, Events } = require('discord.js');
const locketService = require('../services/locket.service');
const axios = require('axios');
const path = require('path');
const os = require('os');
const fs = require('fs');
const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');
const UserInfo = require('../components/UserInfo');
const { uploadToFirebase } = require('../services/firebaseStorage');

class InteractionHandler {
    constructor() {
        this.waitingForFile = new Map(); // userId -> { caption, timeout }
    }

    async handleCommand(interaction) {
        const { commandName } = interaction;

        switch (commandName) {
            case 'locket': {
                const embed = new EmbedBuilder()
                    .setTitle('📸 LocketBot Menu')
                    .setDescription([
                        'Chào mừng bạn đến với **LocketBot**!',
                        '',
                        'Bạn có thể đăng nhập, đăng moment, và nhiều tính năng khác.',
                        '',
                        '➡️ Nhấn **Đăng nhập** để bắt đầu hoặc **Hướng dẫn** để xem chi tiết.'
                    ].join('\n'))
                    .setImage('https://cdn-icons-png.flaticon.com/512/3062/3062634.png')
                    .setColor(0x00bfff)
                    .setFooter({ text: 'LocketBot • Đăng nhập để bắt đầu', iconURL: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('login').setLabel('🔑 Đăng nhập').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('help').setLabel('❓ Hướng dẫn').setStyle(ButtonStyle.Secondary)
                );

                await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
                break;
            }
            case 'login':
                await this.handleLoginCommand(interaction);
                break;
            default:
                await interaction.reply('Unknown command');
        }
    }

    async handleButton(interaction) {
        const { customId } = interaction;

        switch (customId) {
            case 'help': {
                const embed = new EmbedBuilder()
                    .setTitle('❓ Hướng dẫn sử dụng LocketBot')
                    .setDescription('**Các bước sử dụng:**\n1. Gõ `/menu` để mở menu\n2. Ấn **Đăng nhập** và nhập email/mật khẩu\n3. Ấn **Post Moment** để đăng ảnh/video\n4. Ấn **Logout** khi xong\n\n**Lưu ý:**\n- Ảnh hỗ trợ: JPG, PNG, MP4, MOV\n- Cần có tài khoản Locket đã đăng ký trước.')
                    .setColor(0x43e97b)
                    .setFooter({ text: 'LocketBot', iconURL: 'https://file.hstatic.net/200000759485/article/locket_568e66dfbddb4e538c1f26203da9ae45.jpg' });
                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }
            case 'login':
                await this.showLoginModal(interaction);
                break;
            case 'view_profile': {
                const email = AuthService.getEmailByDiscord(interaction.user.id);
                if (!email) {
                    await interaction.reply({ content: 'Bạn chưa đăng nhập!', ephemeral: true });
                    return;
                }

                const cache = AuthService.tokenCache.get(email);
                if (!cache) {
                    await interaction.reply({ content: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', ephemeral: true });
                    return;
                }

                const userData = {
                    displayName: cache.displayName,
                    email: email,
                    localId: cache.userId
                };

                await interaction.reply(UserInfo.createUserInfoEmbed(userData));
                break;
            }
            case 'postMoment': {
                try {
                    const email = AuthService.getEmailByDiscord(interaction.user.id);
                    if (!email) {
                        await interaction.reply({ content: '❌ Bạn chưa đăng nhập! Vui lòng đăng nhập lại.', ephemeral: true });
                        return;
                    }

                    const user = await interaction.client.users.fetch(interaction.user.id);
                    const guideEmbed = new EmbedBuilder()
                        .setColor('#00bfff')
                        .setTitle('📸 Hướng dẫn đăng Moment')
                        .setDescription([
                            '**Các bước đăng Moment:**',
                            '1. Gửi ảnh/video kèm caption (nếu muốn) vào DM này.',
                            '',
                            '**Lưu ý:**',
                            '- Hỗ trợ: JPG, PNG, GIF, MP4, MOV',
                            '- Kích thước tối đa: 10MB',
                            '- Caption: nhập trong cùng tin nhắn với file hoặc gửi riêng sau đó.'
                        ].join('\n'))
                        .setFooter({ text: 'Locket Bot' })
                        .setTimestamp();

                    await user.send({ embeds: [guideEmbed] });

                    await interaction.reply({ content: '✅ Đã gửi hướng dẫn qua DM. Vui lòng kiểm tra tin nhắn riêng!', ephemeral: true });
                } catch (err) {
                    logger.error('Failed to send DM:', err);
                    await interaction.reply({ content: '❌ Không thể gửi DM. Vui lòng kiểm tra cài đặt Discord của bạn.', ephemeral: true });
                }
                break;
            }
            case 'logout':
                await this.handleLogout(interaction);
                break;
            case 'back_to_menu': {
                const embed = new EmbedBuilder()
                    .setColor('#00bfff')
                    .setTitle('📸 LocketBot Menu')
                    .setDescription([
                        'Chào mừng bạn đến với **LocketBot**!',
                        '',
                        'Bạn có thể đăng nhập, đăng moment, và nhiều tính năng khác.',
                        '',
                        '➡️ Nhấn **Đăng nhập** để bắt đầu hoặc **Hướng dẫn** để xem chi tiết.'
                    ].join('\n'))
                    .setImage('https://cdn-icons-png.flaticon.com/512/3062/3062634.png')
                    .setFooter({ text: 'LocketBot • Đăng nhập để bắt đầu', iconURL: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' });
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('login').setLabel('🔑 Đăng nhập').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('help').setLabel('❓ Hướng dẫn').setStyle(ButtonStyle.Secondary)
                );
                await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
                break;
            }
            case 'moments': {
                const email = AuthService.getEmailByDiscord(interaction.user.id);
                if (!email) {
                    await interaction.reply({ content: 'Bạn cần đăng nhập trước!', ephemeral: true });
                    return;
                }
                const idToken = await AuthService.getValidToken(email);
                if (!idToken) {
                    await interaction.reply({ content: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', ephemeral: true });
                    return;

                }
                try {
                    const response = await axios.post(
                        'https://api.locketcamera.com/getLatestMomentV2',
                        { data: { last_fetch: 1, should_count_missed_moments: true } },
                        { headers: { Authorization: `Bearer ${idToken}` } }
                    );
                    const moments = response.data.result?.data || [];
                    if (moments.length === 0) {
                        await interaction.reply({ content: 'Không có Moments nào.', ephemeral: true });
                        return;
                    }
                    const embeds = moments.map((moment, index) => {
                        return new EmbedBuilder()
                            .setColor(0x00bfff)
                            .setTitle(`Moment #${index + 1}`)
                            .setDescription([
                                `**Người gửi:** ${moment.display_name || moment.email || 'Không rõ'}`,
                                `**Ngày:** ${new Date(moment.date._seconds * 1000).toLocaleString()}`,
                                `**Caption:** ${moment.caption || 'Không có'}`,
                                `[🖼️ Xem ảnh](${moment.thumbnail_url})`
                            ].join('\n'))
                            .setImage(moment.thumbnail_url)
                            .setFooter({ text: 'Locket Bot' })
                            .setTimestamp();
                    });
                    await interaction.reply({ embeds, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'Lỗi khi lấy Moments.', ephemeral: true });
                }
                break;
            }
            default:
                await interaction.reply('Unknown button');
        }
    }

    async handleModal(interaction) {
        const { customId } = interaction;
        switch (customId) {
            case 'login_modal':
                await this.handleLoginModal(interaction);
                break;
            case 'postMomentModal': {
                const caption = interaction.fields.getTextInputValue('caption');
                this.setWaitingForFile(interaction.user.id, caption, interaction);
                break;
            }
            default:
                await interaction.reply('Unknown modal');
        }
    }

    async handleLoginCommand(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🔒 Đăng nhập Locket')
            .setDescription('**Chào mừng bạn đến với Locket Discord Bot!**\n\nĐể sử dụng các tính năng, vui lòng đăng nhập tài khoản Locket của bạn.\n\n➡️ Nhấn **Đăng nhập** bên dưới để bắt đầu.')
            .setColor(0x00bfff)
            .setThumbnail('https://file.hstatic.net/200000759485/article/locket_568e66dfbddb4e538c1f26203da9ae45.jpg')
            .setFooter({ text: 'Locket Bot • Bảo mật tuyệt đối • Cam kết không ghi LOG tài khoản người dùng', iconURL: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('login')
                    .setLabel('🔑 Đăng nhập')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    async showLoginModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('login_modal')
            .setTitle('🔒 Đăng nhập Locket');

        const emailInput = new TextInputBuilder()
            .setCustomId('email')
            .setLabel('Email Locket')
            .setPlaceholder('nhapemail@mail.com')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(50);

        const passwordInput = new TextInputBuilder()
            .setCustomId('password')
            .setLabel('Mật khẩu Locket')
            .setPlaceholder('Nhập mật khẩu...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(6)
            .setMaxLength(50);

        const firstActionRow = new ActionRowBuilder().addComponents(emailInput);
        const secondActionRow = new ActionRowBuilder().addComponents(passwordInput);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    }

    async handleLoginModal(interaction) {
        try {
            const email = interaction.fields.getTextInputValue('email');
            const password = interaction.fields.getTextInputValue('password');

            await interaction.deferReply({ ephemeral: true });

            const { userData } = await AuthService.login(email, password);
            
            AuthService.setDiscordMapping(interaction.user.id, email);

            const successEmbed = new EmbedBuilder()
                .setColor('#43e97b')
                .setTitle('🎉 Đăng nhập thành công!')
                .setDescription('Bạn đã đăng nhập vào Locket.\n\nBây giờ bạn có thể xem thông tin tài khoản hoặc đăng xuất khi cần.')
                .setFooter({ text: 'Locket Bot' })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('view_profile')
                        .setLabel('👤 Xem thông tin')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('view_latest_moment')
                        .setLabel('🖼️ Xem Moment mới nhất')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('moments')
                        .setLabel('📚 Xem danh sách Moments')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('postMoment')
                        .setLabel('📸 Đăng Moment')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('logout')
                        .setLabel('🔓 Đăng xuất')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.editReply({ embeds: [successEmbed], components: [row] });
            
            logger.info(`User ${interaction.user.tag} logged in successfully`);
        } catch (error) {
            logger.error('Login error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Đăng nhập thất bại')
                .setDescription(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
                .setFooter({ text: 'Locket Bot' })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
        }
    }

    async handleLogout(interaction) {
        AuthService.setDiscordMapping(interaction.user.id, null);
        const embed = new EmbedBuilder()
            .setColor(0x00bfff)
            .setTitle('🚪 Đăng xuất thành công')
            .setDescription('Bạn đã đăng xuất khỏi Locket.\n\nCảm ơn bạn đã sử dụng Locket Bot!')
            .setFooter({ text: 'Locket Bot', iconURL: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' });
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async handleMessageCreate(message) {
        try {
            if (message.author.bot) return;

            const isDM = message.channel.type === 1 || message.channel.type === 'DM' || message.channel.isDMBased?.();
            if (isDM) {
                const attachment = message.attachments.first();
                if (!attachment) return;

                // Kiểm tra định dạng file
                const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'];
                const fileExtension = attachment.name.split('.').pop().toLowerCase();
                if (!allowedFormats.includes(fileExtension)) return;

                // Kiểm tra kích thước file (tối đa 10MB)
                if (attachment.size > 10 * 1024 * 1024) return;

                const email = AuthService.getEmailByDiscord(message.author.id);
                if (!email) {
                    await message.reply('❌ Bạn chưa đăng nhập! Vui lòng đăng nhập lại.');
                    return;
                }

                const idToken = await AuthService.getValidToken(email);
                const { userId } = AuthService.tokenCache.get(email) || {};
                if (!idToken || !userId) {
                    await message.reply('❌ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    return;
                }
                const caption = message.content || '';
                const response = await fetch(attachment.url);
                const imageBuffer = Buffer.from(await response.arrayBuffer());
                const processingMsg = await message.reply('Đang xử lý file của bạn...');
                try {
                    await locketService.postMomentV2(idToken, userId, imageBuffer, caption);
                    await processingMsg.edit('Đã đăng moment thành công! 🎉');
                } catch (error) {
                    logger.error('Upload moment failed:', error);
                    await processingMsg.edit('Không thể đăng moment. Vui lòng thử lại sau.');
                }
                return;
            }
        } catch (error) {
            logger.error('Handle message create failed:', error);
            await message.reply('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        }
    }

    setWaitingForFile(userId, caption, interaction) {
        if (this.waitingForFile.has(userId)) {
            clearTimeout(this.waitingForFile.get(userId).timeout);
        }

        const timeout = setTimeout(async () => {
            this.waitingForFile.delete(userId);
            try {
                await interaction.followUp({ 
                    content: '⏰ Đã hết thời gian chờ upload file. Vui lòng thử lại.',
                    ephemeral: true 
                });
            } catch {}
        }, 120000); // 2 phút
        this.waitingForFile.set(userId, { caption, timeout });


        const guideEmbed = new EmbedBuilder()
            .setColor('#00bfff')
            .setTitle('📸 Upload Moment')
            .setDescription([
                'Vui lòng gửi ảnh hoặc video của bạn trong vòng 2 phút.',
                '',
                '**Lưu ý:**',
                '- Hỗ trợ: JPG, PNG, GIF, MP4, MOV',
                '- Kích thước tối đa: 10MB',
                `- Caption: ${caption || 'Không có'}`
            ].join('\n'))
            .setFooter({ text: 'Locket Bot' })
            .setTimestamp();

        if (!interaction.replied && !interaction.deferred) {
            interaction.reply({ embeds: [guideEmbed], ephemeral: true });
        } else {
            interaction.followUp({ embeds: [guideEmbed], ephemeral: true });
        }
    }

    async downloadFile(url, filePath) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Không thể tải file');
            }

            // Chuyển response thành buffer
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Ghi buffer vào file
            fs.writeFileSync(filePath, buffer);
        } catch (error) {
            logger.error('Download file failed:', error);
            throw new Error('Không thể tải file về máy');
        }
    }
}

locketService.getUserMoments = async function(idToken, userId) {
    const url = `https://api.locketcamera.com/v1/users/${userId}/moments`;
    const res = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        }
    });
    return res.data.moments || [];
};

module.exports = new InteractionHandler(); 