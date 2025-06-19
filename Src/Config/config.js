/**
 * Configuration file for Telegram Bot
 */

module.exports = {
    // Bot Token - sama seperti Python version
    BOT_TOKEN: process.env.BOT_TOKEN || "8131425355:AAFWisLEDBnXm-NsJq-6EgVh247n4o7NwOY",
    
    // Owner ID - sama seperti Python version
    OWNER_ID: 7614202330,
    
    // Database configuration
    DATABASE: {
        filename: 'bot_database.db',
        options: {
            verbose: process.env.NODE_ENV === 'development' ? console.log : null
        }
    },
    
    // File settings
    FILES: {
        tempDir: 'temp',
        maxFileSize: 20 * 1024 * 1024, // 20MB
        allowedExtensions: ['.txt', '.vcf', '.xlsx', '.xls', '.csv']
    },
    
    // Bot settings
    BOT: {
        parseMode: 'Markdown',
        enableWebPreview: false,
        maxRetries: 3,
        retryDelay: 1000
    },
    
    // Environment
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || 3000
};