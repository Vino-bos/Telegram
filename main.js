/**
 * Telegram Bot untuk Konversi dan Manajemen File
 * Node.js Version - Clone dari Python Bot
 */

const { Telegraf } = require('telegraf');
const fs = require('fs-extra');
const path = require('path');
const { initDatabase } = require('./utils/database');
const { setupHandlers } = require('./handlers/index');
const config = require('./config/config');

// Setup logging
console.log = (...args) => {
    const timestamp = new Date().toISOString();
    process.stdout.write(`${timestamp} - INFO - ${args.join(' ')}\n`);
};

console.error = (...args) => {
    const timestamp = new Date().toISOString();
    process.stderr.write(`${timestamp} - ERROR - ${args.join(' ')}\n`);
};

class TelegramBot {
    constructor() {
        this.bot = new Telegraf(config.BOT_TOKEN);
        this.setupBot();
    }

    async setupBot() {
        try {
            // Initialize database
            await initDatabase();
            console.log('Database initialized successfully');

            // Setup handlers
            setupHandlers(this.bot);
            console.log('Handlers setup completed');

            // Setup commands menu
            await this.setupCommands();
            
            // Error handling
            this.bot.catch((err, ctx) => {
                console.error('Bot error:', err);
                if (ctx && ctx.reply) {
                    ctx.reply('❌ Terjadi kesalahan dalam memproses permintaan Anda.');
                }
            });

            // Start bot
            await this.bot.launch();
            console.log('Bot started successfully');

            // Graceful shutdown
            process.once('SIGINT', () => this.bot.stop('SIGINT'));
            process.once('SIGTERM', () => this.bot.stop('SIGTERM'));

        } catch (error) {
            console.error('Failed to start bot:', error);
            process.exit(1);
        }
    }

    async setupCommands() {
        const commands = [
            { command: 'start', description: 'Mulai menggunakan bot' },
            { command: 'help', description: 'Tampilkan bantuan' },
            { command: 'menu', description: 'Tampilkan semua menu' },
            
            // File Conversion
            { command: 'cv_txt_to_vcf', description: 'Convert TXT ke VCF' },
            { command: 'cv_vcf_to_txt', description: 'Convert VCF ke TXT' },
            { command: 'cv_xlsx_to_vcf', description: 'Convert XLSX ke VCF' },
            { command: 'txt2vcf', description: 'Convert TXT ke VCF otomatis' },
            
            // File Management
            { command: 'renamectc', description: 'Ganti nama kontak VCF' },
            { command: 'renamefile', description: 'Ganti nama file' },
            { command: 'gabungtxt', description: 'Gabung file TXT' },
            { command: 'gabungvcf', description: 'Gabung file VCF' },
            { command: 'pecahfile', description: 'Pecah file VCF' },
            { command: 'addctc', description: 'Tambah kontak ke VCF' },
            { command: 'delctc', description: 'Hapus kontak dari VCF' },
            { command: 'hitungctc', description: 'Hitung total kontak VCF' },
            
            // Utilities
            { command: 'totxt', description: 'Save pesan ke TXT' },
            { command: 'reset_conversions', description: 'Reset semua state' },
            
            // Admin Commands
            { command: 'adduser', description: 'Tambah user baru (Owner only)' },
            { command: 'deluser', description: 'Hapus user (Owner only)' },
            { command: 'totaluser', description: 'Total user terdaftar' }
        ];

        try {
            await this.bot.telegram.setMyCommands(commands);
            console.log('Bot commands setup completed');
        } catch (error) {
            console.error('Failed to setup commands:', error);
        }
    }
}

// Start the bot
const bot = new TelegramBot();

module.exports = TelegramBot;