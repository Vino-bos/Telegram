/**
 * Main handlers setup for Node.js bot
 * Equivalent to Python bot/handlers.py
 */

const { checkUserAccess, isOwner, processAddUser, processDeleteUser, getTotalUsers } = require('../utils/userManager');
const { convertTxtToVcf, convertVcfToTxt, convertXlsxToVcf, convertTxt2VcfAuto, processAdminFile } = require('../converters/fileConverters');
const { logBugReport } = require('../utils/database');
const { ensureTempDirectory, isSafeFileType } = require('../utils/helpers');
const fs = require('fs-extra');
const path = require('path');

// Session data storage (in production, use Redis or database)
const sessions = new Map();

function getSession(userId) {
    if (!sessions.has(userId)) {
        sessions.set(userId, {});
    }
    return sessions.get(userId);
}

function clearSession(userId) {
    sessions.delete(userId);
}

/**
 * Setup all bot handlers
 */
function setupHandlers(bot) {
    // Basic commands
    bot.command('start', startCommand);
    bot.command('help', helpCommand);
    bot.command('menu', menuCommand);
    
    // File conversion commands
    bot.command('cv_txt_to_vcf', cvTxtToVcfCommand);
    bot.command('cv_vcf_to_txt', cvVcfToTxtCommand);
    bot.command('cv_xlsx_to_vcf', cvXlsxToVcfCommand);
    bot.command('txt2vcf', txt2vcfCommand);
    bot.command('cvadminfile', cvAdminFileCommand);
    
    // File management commands
    bot.command('renamectc', renameCtcCommand);
    bot.command('renamefile', renameFileCommand);
    bot.command('gabungtxt', gabungTxtCommand);
    bot.command('gabungvcf', gabungVcfCommand);
    bot.command('pecahfile', pecahFileCommand);
    bot.command('pecahctc', pecahCtcCommand);
    bot.command('addctc', addCtcCommand);
    bot.command('delctc', delCtcCommand);
    bot.command('hitungctc', hitungCtcCommand);
    
    // Utility commands
    bot.command('totxt', toTxtCommand);
    bot.command('reset_conversions', resetConversionsCommand);
    bot.command('laporkanbug', laporkanBugCommand);
    
    // Admin commands
    bot.command('adduser', addUserCommand);
    bot.command('deluser', delUserCommand);
    bot.command('totaluser', totalUserCommand);
    
    // File handlers
    bot.on('document', handleDocument);
    bot.on('text', handleTextMessage);
}

/**
 * Start command handler
 */
async function startCommand(ctx) {
    const userId = ctx.from.id;
    const username = ctx.from.username || 'Unknown';
    const firstName = ctx.from.first_name || 'User';
    
    if (!await checkUserAccess(userId)) {
        await ctx.reply('❌ Akses ditolak. Hubungi admin untuk mendapatkan akses.');
        return;
    }
    
    const welcomeText = `🤖 *Selamat datang di Bot Konversi File!*

👋 Halo ${firstName}!

*Fitur Utama:*
📄 Convert TXT ↔ VCF
📊 Convert XLSX → VCF  
📇 Manajemen kontak VCF
📁 Gabung & pecah file
🔧 Tools file management

*Cara Mulai:*
• Ketik /menu untuk melihat semua fitur
• Ketik /help untuk bantuan lengkap
• Upload file dan ikuti instruksi bot

✨ Bot siap digunakan!`;
    
    await ctx.replyWithMarkdown(welcomeText);
}

/**
 * Help command handler
 */
async function helpCommand(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    const helpText = `📚 *BANTUAN BOT KONVERSI FILE*

*Cara Menggunakan:*
1. Pilih command yang diinginkan
2. Ikuti instruksi yang diberikan bot
3. Upload file jika diperlukan
4. Bot akan memproses dan mengirim hasil

*Format File yang Didukung:*
• TXT - File teks biasa
• VCF - File kontak vCard
• XLSX - File Excel

*Tips:*
• Pastikan file tidak rusak sebelum upload
• Gunakan /reset\\_conversions jika bot tidak merespon
• Laporkan bug dengan /laporkanbug

Ketik /menu untuk melihat semua fitur!`;
    
    await ctx.replyWithMarkdown(helpText);
}

/**
 * Menu command handler
 */
async function menuCommand(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    const menuText = `🤖 *MENU BOT KONVERSI FILE*

🔄 *File Conversion*
/cv\\_txt\\_to\\_vcf - Convert TXT ke VCF
/cv\\_vcf\\_to\\_txt - Convert VCF ke TXT  
/cv\\_xlsx\\_to\\_vcf - Convert XLSX ke VCF
/txt2vcf - Convert TXT ke VCF otomatis
/cvadminfile - Kelola file admin

📁 *File Management*
/renamectc - Ganti nama kontak VCF
/renamefile - Ganti nama file
/gabungtxt - Gabung beberapa file TXT
/gabungvcf - Gabung beberapa file VCF
/pecahfile - Pecah file VCF jadi beberapa bagian
/pecahctc - Pecah VCF sesuai jumlah kontak
/addctc - Tambah kontak ke VCF
/delctc - Hapus kontak dari VCF
/hitungctc - Hitung total kontak VCF
/totxt - Simpan pesan ke file TXT

⚙️ *Other Menu*
/reset\\_conversions - Reset duplikat respon
/laporkanbug - Laporkan bug

✨ *Menu Owner*
/adduser - Tambah pengguna
/deluser - Hapus akses pengguna
/totaluser - Lihat jumlah pengguna`;
    
    await ctx.replyWithMarkdown(menuText);
}

/**
 * File conversion command handlers
 */
async function cvTxtToVcfCommand(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    await ctx.replyWithMarkdown(
        "📄📇 *Convert TXT ke VCF*\n\n" +
        "Upload file .txt yang berisi daftar kontak\n" +
        "Format: Nama|Nomor (satu kontak per baris)"
    );
    
    const session = getSession(ctx.from.id);
    session.waitingFor = 'txt_to_vcf';
}

async function cvVcfToTxtCommand(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    await ctx.replyWithMarkdown(
        "📇📄 *Convert VCF ke TXT*\n\n" +
        "Upload file .vcf untuk dikonversi ke format TXT"
    );
    
    const session = getSession(ctx.from.id);
    session.waitingFor = 'vcf_to_txt';
}

async function cvXlsxToVcfCommand(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    await ctx.replyWithMarkdown(
        "📊📇 *Konversi XLSX ke VCF (Advanced)*\n\n" +
        "🔸 *Upload file Excel* (.xlsx atau .xls)\n\n" +
        "*Fitur Advanced:*\n" +
        "✅ *Multi-sheet support* - Otomatis pilih sheet pertama\n" +
        "✅ *Smart column detection* - Deteksi otomatis kolom nama & nomor\n" +
        "✅ *Multiple field support* - Nama, nomor, email, organisasi, alamat\n" +
        "✅ *Data validation* - Validasi format nomor telepon\n" +
        "✅ *Auto phone formatting* - Format nomor Indonesia (+62)\n" +
        "✅ *Skip invalid rows* - Lewati baris kosong/tidak valid\n" +
        "✅ *Detailed reporting* - Laporan konversi lengkap\n" +
        "✅ *Advanced VCF format* - Dengan UID, timestamp, multiple fields\n\n" +
        "*Kolom yang dideteksi otomatis:*\n" +
        "• *Nama:* Nama, Name, Full Name, Contact Name\n" +
        "• *Nomor:* Nomor, Phone, Telepon, HP, Mobile, WA\n" +
        "• *Email:* Email, E-mail, Mail\n" +
        "• *Organisasi:* Organisasi, Company, Perusahaan, Office\n" +
        "• *Alamat:* Alamat, Address, Lokasi\n\n" +
        "💡 *Tips:* Pastikan kolom menggunakan nama yang jelas untuk hasil terbaik!"
    );
    
    const session = getSession(ctx.from.id);
    session.waitingFor = 'xlsx_to_vcf';
}

async function txt2vcfCommand(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    await ctx.replyWithMarkdown(
        "📊➡️📇 *TXT to VCF Auto Detect*\n\n" +
        "Upload file .txt dan bot akan otomatis mendeteksi format\n" +
        "Mendukung berbagai format pemisah (koma, titik koma, dll)\n" +
        "Deteksi otomatis Admin Navy! 🚢"
    );
    
    const session = getSession(ctx.from.id);
    session.waitingFor = 'txt2vcf_auto';
}

async function cvAdminFileCommand(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    if (!await isOwner(ctx.from.id)) {
        await ctx.reply('❌ Command ini hanya untuk owner.');
        return;
    }
    
    await ctx.replyWithMarkdown(
        "🗃️👩‍💼 *Admin File Processing*\n\n" +
        "Upload file untuk diproses dengan privilage admin"
    );
    
    const session = getSession(ctx.from.id);
    session.waitingFor = 'admin_file';
}

// Placeholder handlers for other commands
async function renameCtcCommand(ctx) {
    await ctx.reply('🚧 Fitur sedang dalam pengembangan');
}

async function renameFileCommand(ctx) {
    await ctx.reply('🚧 Fitur sedang dalam pengembangan');
}

async function gabungTxtCommand(ctx) {
    await ctx.reply('🚧 Fitur sedang dalam pengembangan');
}

async function gabungVcfCommand(ctx) {
    await ctx.reply('🚧 Fitur sedang dalam pengembangan');
}

async function pecahFileCommand(ctx) {
    await ctx.reply('🚧 Fitur sedang dalam pengembangan');
}

async function pecahCtcCommand(ctx) {
    await ctx.reply('🚧 Fitur sedang dalam pengembangan');
}

async function addCtcCommand(ctx) {
    await ctx.reply('🚧 Fitur sedang dalam pengembangan');
}

async function delCtcCommand(ctx) {
    await ctx.reply('🚧 Fitur sedang dalam pengembangan');
}

async function hitungCtcCommand(ctx) {
    await ctx.reply('🚧 Fitur sedang dalam pengembangan');
}

async function toTxtCommand(ctx) {
    await ctx.reply('🚧 Fitur sedang dalam pengembangan');
}

async function resetConversionsCommand(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    clearSession(ctx.from.id);
    await ctx.reply('✅ State conversation berhasil direset.');
}

async function laporkanBugCommand(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    await ctx.reply('🐞 Ketik deskripsi bug yang ingin dilaporkan:');
    const session = getSession(ctx.from.id);
    session.waitingFor = 'bug_report';
}

// Admin commands
async function addUserCommand(ctx) {
    if (!await isOwner(ctx.from.id)) {
        await ctx.reply('❌ Command ini hanya untuk owner.');
        return;
    }
    
    await ctx.reply('👤 Ketik ID user yang ingin ditambahkan:');
    const session = getSession(ctx.from.id);
    session.waitingFor = 'add_user';
}

async function delUserCommand(ctx) {
    if (!await isOwner(ctx.from.id)) {
        await ctx.reply('❌ Command ini hanya untuk owner.');
        return;
    }
    
    await ctx.reply('❌ Ketik ID user yang ingin dihapus:');
    const session = getSession(ctx.from.id);
    session.waitingFor = 'delete_user';
}

async function totalUserCommand(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    const total = await getTotalUsers();
    await ctx.reply(`👥 Total user terdaftar: ${total}`);
}

/**
 * Handle document uploads
 */
async function handleDocument(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        await ctx.reply('❌ Akses ditolak.');
        return;
    }
    
    const session = getSession(ctx.from.id);
    const waitingFor = session.waitingFor;
    
    if (!waitingFor) {
        await ctx.reply('❌ Silakan pilih command terlebih dahulu sebelum upload file.');
        return;
    }
    
    const document = ctx.message.document;
    const fileName = document.file_name || 'unknown_file';
    
    if (!isSafeFileType(fileName)) {
        await ctx.reply('❌ Tipe file tidak didukung.');
        return;
    }
    
    try {
        // Download file
        const fileUrl = await ctx.telegram.getFileLink(document.file_id);
        const tempDir = await ensureTempDirectory();
        const filePath = path.join(tempDir, fileName);
        
        // Download file from Telegram
        const response = await fetch(fileUrl.href);
        const buffer = await response.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(buffer));
        
        // Process based on waiting state
        if (waitingFor === 'txt_to_vcf') {
            await convertTxtToVcf(ctx, filePath);
        } else if (waitingFor === 'vcf_to_txt') {
            await convertVcfToTxt(ctx, filePath);
        } else if (waitingFor === 'xlsx_to_vcf') {
            await convertXlsxToVcf(ctx, filePath);
        } else if (waitingFor === 'txt2vcf_auto') {
            await convertTxt2VcfAuto(ctx, filePath);
        } else if (waitingFor === 'admin_file') {
            await processAdminFile(ctx, filePath);
        }
        
        // Clear session
        clearSession(ctx.from.id);
        
    } catch (error) {
        console.error('Error handling document:', error);
        await ctx.reply('❌ Terjadi kesalahan saat memproses file.');
    }
}

/**
 * Handle text messages
 */
async function handleTextMessage(ctx) {
    if (!await checkUserAccess(ctx.from.id)) {
        return;
    }
    
    const session = getSession(ctx.from.id);
    const waitingFor = session.waitingFor;
    const text = ctx.message.text;
    
    if (!waitingFor) {
        return;
    }
    
    try {
        if (waitingFor === 'bug_report') {
            logBugReport(ctx.from.id, ctx.from.username || 'Unknown', text);
            await ctx.reply('✅ Bug report berhasil dikirim. Terima kasih!');
            clearSession(ctx.from.id);
        } else if (waitingFor === 'add_user') {
            await processAddUser(ctx, text);
            clearSession(ctx.from.id);
        } else if (waitingFor === 'delete_user') {
            await processDeleteUser(ctx, text);
            clearSession(ctx.from.id);
        }
    } catch (error) {
        console.error('Error handling text message:', error);
        await ctx.reply('❌ Terjadi kesalahan saat memproses pesan.');
    }
}

module.exports = {
    setupHandlers
};