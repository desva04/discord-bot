const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Preset warna
const PRESET_COLORS = {
    'red': '#ff0000', 'green': '#008000', 'blue': '#0000ff', 'yellow': '#ffff00',
    'purple': '#800080', 'orange': '#ffa500', 'pink': '#FFC0CB', 'cyan': '#00ffff',
    'grey': '#808080', 'gray': '#808080', 'black': '#000000', 'white': '#ffffff',
    'random': null
};

// Status (1-4 tanpa waktu, 5 HANYA waktu)
const statuses = [
    { name: 'Varies Store ✨', type: ActivityType.Streaming},
    { name: 'setup • design • we deliver the best✨', type: ActivityType.Playing },
    { name: 'Work in silence, show the results🔥', type: ActivityType.Watching },
    { name: 'No shortcuts, just hard work 🔥', type: ActivityType.Listening }
];

    // 🔐 FUNGSI CEK OWNER ROLE - INI YANG KURANG!
async function isOwner(message) {
    const ownerRoleId = process.env.OWNER_ROLE_ID;
    
    console.log(`🔍 [PERMISSION CHECK]`);
    console.log(`   User: ${message.author.tag}`);
    console.log(`   Owner Role ID: ${ownerRoleId}`);
    console.log(`   User Roles: ${message.member?.roles.cache.map(r => r.id).join(', ') || 'No roles'}`);
    
    // Cek apakah user punya role owner
        if (!ownerRoleId) {
    console.log('❌ OWNER_ROLE_ID tidak ada di .env!');
        return false;
    }
    
        const hasOwnerRole = message.member?.roles.cache.has(ownerRoleId);
    console.log(`   Has Owner Role: ${hasOwnerRole}`);
    
        return hasOwnerRole;
}

client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} Ready!`);
    
    setInterval(() => {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const time = new Date().toLocaleTimeString('id-ID', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
        });
        
        let displayName;
        if (status.timeOnly) {
            displayName = time;
        } else {
            displayName = status.name;
        }
        
        client.user.setActivity(displayName, { type: status.type });
    }, 5000);
    
    client.user.setActivity('Bot Started', { type: 0 });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(',')) return;
    
    const args = message.content.slice(1).trim().split('\n').map(arg => arg.trim());
    const firstLine = args[0];
    const cmdParts = firstLine.split('|').map(part => part.trim());
    const cmd = cmdParts[0]?.toLowerCase();
    const multiLineContent = args.slice(1).join('\n');

    // cek bot
    if (cmd === 'ping') {
    const sent = await message.channel.send('🏓 Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;

    return sent.edit(`🏓 Pong!\n⚡ Latency: ${latency}ms`);
}

    // .help → USER CMD KELIATAN
    if (cmd === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('📖 **Embed Bot Help**')
            .setDescription('Prefix `,` | Warna bebas (Hex/Preset)')
            .setColor('#7cfae5')
            .addFields(
                { 
                    name: '🖼️ **Gambar**', 
                    value: '```,image|imgURL\nwarna\n\n,image|warna\nimgURL\nisi pesan```', 
                    inline: false 
                },
                { 
                    name: '📝 **Embed**', 
                    value: '```,embed|warna\nisi pesan\n\n,embed|judul|isi pesan|warna\n\n,embed|judul|isi pesan|warna|imgURL/gifURL```', 
                    inline: false 
                },
                { 
                    name: '🤖 **Cek Bot**', 
                    value: '```,ping```', 
                    inline: false 
                },
                { 
                    name: '🌈 **Warna**', 
                    value: '```\nHex: #ff0000 ff0000\nPreset: red green blue yellow purple orange pink cyan grey black white random```', 
                    inline: false 
                }
            )
            .setFooter({ text: 'Never give up, great things take time ⏳' })
            .setTimestamp();
            
        return message.channel.send({ embeds: [helpEmbed] });
    }
    
    // LAINNYA → HAPUS USER CMD
    await message.delete().catch(() => {});

    const secondLine = args[1] || '';

    // Parse warna
    const getColor = (colorInput) => {
        if (/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(colorInput.replace('#', ''))) {
            return colorInput.startsWith('#') ? colorInput : `#${colorInput}`;
        }
        if (PRESET_COLORS[colorInput.toLowerCase()]) {
            return PRESET_COLORS[colorInput.toLowerCase()];
        }
        if (colorInput.toLowerCase() === 'random') {
            return '#' + Math.floor(Math.random()*16777215).toString(16);
        }
        return process.env.DEFAULT_COLOR || '#0099ff';
    };

    // .embed|warna (ISI DARI BAWAH)
    if (cmd === 'embed' && cmdParts.length === 2) {
        const color = getColor(cmdParts[1]);
        const description = multiLineContent;

    if (!description) return;

        const embed = new EmbedBuilder()
        .setDescription(description)
        .setColor(color);

    return message.channel.send({ embeds: [embed] });
}

    // .image|warna (link + isi dari bawah)
if (cmd === 'image' && cmdParts.length === 2) {
    const color = getColor(cmdParts[1]);

    // ambil baris bawah
    const lines = multiLineContent.split('\n').filter(Boolean);

    const imageUrl = lines[0]; // baris pertama = link gambar
    const description = lines.slice(1).join('\n'); // sisanya = isi

    if (!imageUrl) return;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setImage(imageUrl);

    if (description) {
        embed.setDescription(description);
    }

    return message.channel.send({ embeds: [embed] });
}

    // .image|link
    // warna
    if (cmd === 'image' && cmdParts.length >= 2) {
        const imageUrl = cmdParts[1];
        const color = getColor(secondLine);
        if (!imageUrl) return;
        
        const embed = new EmbedBuilder().setColor(color).setImage(imageUrl);
        return message.channel.send({ embeds: [embed] });
    }

    // .embed|judul|isi|warna|imageurl ← TAMBAHAN INI
    if (cmd === 'embed' && cmdParts.length >= 5 && !cmdParts[5]) {
        const title = cmdParts[1];
        const description = [cmdParts[2], multiLineContent]
  .filter(Boolean)
  .join('\n\n');
        const color = getColor(cmdParts[3]);
        const imageUrl = cmdParts[4];
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setImage(imageUrl);
            
        return message.channel.send({ embeds: [embed] });
    }

    // .embed|judul|isi|warna|banner|thumb ← LENGKAP
    if (cmd === 'embed' && cmdParts.length >= 6) {
        const title = cmdParts[1];
        const description = [cmdParts[2], multiLineContent]
  .filter(Boolean)
  .join('\n\n');
        const color = getColor(cmdParts[3]);
        const bannerUrl = cmdParts[4];
        const thumbUrl = cmdParts[5];
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color);
            
        if (bannerUrl) embed.setImage(bannerUrl);
        if (thumbUrl) embed.setThumbnail(thumbUrl);
            
        return message.channel.send({ embeds: [embed] });
    }

    // .embed|judul|isi|warna ← DASAR
    if (cmd === 'embed' && cmdParts.length >= 4 && !cmdParts[4]) {
        const title = cmdParts[1];
        const description = [cmdParts[2], multiLineContent]
  .filter(Boolean)
  .join('\n\n');
        const color = getColor(cmdParts[3]);
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color);
            
        return message.channel.send({ embeds: [embed] });
    }
});

        const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Bot is alive!');
});

client.login(process.env.TOKEN)
 .then(() => console.log("✅ LOGIN SUCCESS"))
    .catch(err => console.error("❌ LOGIN ERROR:", err));

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
    console.log("TOKEN:", process.env.TOKEN ? "ADA" : "TIDAK ADA");
});
