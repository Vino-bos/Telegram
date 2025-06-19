/**
 * Helper utilities for Node.js bot operations
 * Equivalent to Python utils/helpers.py
 */

const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');

/**
 * Clean up temporary file
 */
async function cleanupTempFile(filePath) {
    try {
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            console.log(`Cleaned up temp file: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error cleaning up file ${filePath}:`, error.message);
    }
}

/**
 * Send document file to user
 */
async function sendDocumentToUser(ctx, filePath, caption = null) {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const fileName = path.basename(filePath);
        
        await ctx.replyWithDocument(
            { source: fileBuffer, filename: fileName },
            { caption: caption }
        );
    } catch (error) {
        console.error('Error sending document:', error.message);
        await ctx.reply('❌ Gagal mengirim file. Silakan coba lagi.');
    }
}

/**
 * Ensure temp directory exists
 */
async function ensureTempDirectory() {
    const tempDir = path.join(process.cwd(), config.FILES.tempDir);
    try {
        await fs.ensureDir(tempDir);
        return tempDir;
    } catch (error) {
        console.error('Error creating temp directory:', error.message);
        throw error;
    }
}

/**
 * Validate file extension
 */
function validateFileExtension(filename, allowedExtensions) {
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
}

/**
 * Sanitize filename for safe file operations
 */
function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Format file size in human readable format
 */
function formatFileSize(sizeBytes) {
    if (sizeBytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(sizeBytes) / Math.log(k));
    
    return parseFloat((sizeBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file type is safe to process
 */
function isSafeFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    return config.FILES.allowedExtensions.includes(ext);
}

/**
 * Log user activity
 */
async function logUserActivity(userId, activity, details = null) {
    const timestamp = new Date().toISOString();
    console.log(`User Activity - ${timestamp} - User: ${userId} - Activity: ${activity} - Details: ${details || 'None'}`);
}

/**
 * Extract phone numbers from text
 */
function extractPhoneNumbers(text) {
    const phoneRegex = /(\+?[0-9]{1,4}[-.\s]?)?[0-9]{3,14}/g;
    const matches = text.match(phoneRegex);
    return matches || [];
}

/**
 * Parse a line of text to extract name and phone
 */
function parseContactLine(line) {
    line = line.trim();
    
    // Try different separators
    const separators = ['|', ',', ';', '\t'];
    
    for (const sep of separators) {
        if (line.includes(sep)) {
            const parts = line.split(sep).map(part => part.trim());
            if (parts.length >= 2) {
                return {
                    name: parts[0],
                    phone: parts[1],
                    email: parts[2] || null,
                    organization: parts[3] || null
                };
            }
        }
    }
    
    // If no separator found, try to split by space
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
        const phone = parts.find(part => /[0-9]{3,}/.test(part));
        if (phone) {
            const name = parts.filter(part => part !== phone).join(' ');
            return { name, phone, email: null, organization: null };
        }
    }
    
    return null;
}

/**
 * Create backup of original file
 */
async function createBackupFile(originalFile) {
    try {
        const ext = path.extname(originalFile);
        const baseName = path.basename(originalFile, ext);
        const dir = path.dirname(originalFile);
        const timestamp = Date.now();
        const backupFile = path.join(dir, `${baseName}_backup_${timestamp}${ext}`);
        
        await fs.copy(originalFile, backupFile);
        return backupFile;
    } catch (error) {
        console.error('Error creating backup file:', error.message);
        return null;
    }
}

/**
 * Count lines in a text file
 */
async function countLinesInFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return content.split('\n').length;
    } catch (error) {
        console.error('Error counting lines:', error.message);
        return 0;
    }
}

/**
 * Get comprehensive file information
 */
async function getFileInfo(filePath) {
    try {
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath);
        
        return {
            name: path.basename(filePath),
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            extension: ext,
            created: stats.birthtime,
            modified: stats.mtime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
        };
    } catch (error) {
        console.error('Error getting file info:', error.message);
        return null;
    }
}

/**
 * Initialize bot environment
 */
async function initializeBotEnvironment() {
    try {
        await ensureTempDirectory();
        console.log('Bot environment initialized successfully');
    } catch (error) {
        console.error('Error initializing bot environment:', error.message);
        throw error;
    }
}

module.exports = {
    cleanupTempFile,
    sendDocumentToUser,
    ensureTempDirectory,
    validateFileExtension,
    sanitizeFilename,
    formatFileSize,
    isSafeFileType,
    logUserActivity,
    extractPhoneNumbers,
    parseContactLine,
    createBackupFile,
    countLinesInFile,
    getFileInfo,
    initializeBotEnvironment
};