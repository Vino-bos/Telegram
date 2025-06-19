/**
 * User access management for Node.js bot
 * Equivalent to Python bot/user_manager.py
 */

const { getDbConnection } = require('./database');
const config = require('../config/config');

/**
 * Check if user has access to the bot
 */
async function checkUserAccess(userId) {
    return new Promise((resolve) => {
        const db = getDbConnection();
        const sql = 'SELECT user_id FROM authorized_users WHERE user_id = ?';
        
        db.get(sql, [userId], (err, row) => {
            if (err) {
                console.error('Error checking user access:', err.message);
                resolve(false);
            } else {
                resolve(!!row);
            }
        });
    });
}

/**
 * Check if user is the owner
 */
async function isOwner(userId) {
    return userId === config.OWNER_ID;
}

/**
 * Add user to authorized users
 */
async function addUser(userId, username = null, firstName = null) {
    return new Promise((resolve) => {
        const db = getDbConnection();
        const sql = `
            INSERT OR IGNORE INTO authorized_users (user_id, username, first_name)
            VALUES (?, ?, ?)
        `;
        
        db.run(sql, [userId, username, firstName], function(err) {
            if (err) {
                console.error('Error adding user:', err.message);
                resolve(false);
            } else {
                resolve(this.changes > 0);
            }
        });
    });
}

/**
 * Remove user from authorized users
 */
async function removeUser(userId) {
    return new Promise((resolve) => {
        // Don't allow removing owner
        if (userId === config.OWNER_ID) {
            resolve(false);
            return;
        }
        
        const db = getDbConnection();
        const sql = 'DELETE FROM authorized_users WHERE user_id = ?';
        
        db.run(sql, [userId], function(err) {
            if (err) {
                console.error('Error removing user:', err.message);
                resolve(false);
            } else {
                resolve(this.changes > 0);
            }
        });
    });
}

/**
 * Get total number of authorized users
 */
async function getTotalUsers() {
    return new Promise((resolve) => {
        const db = getDbConnection();
        const sql = 'SELECT COUNT(*) as count FROM authorized_users';
        
        db.get(sql, [], (err, row) => {
            if (err) {
                console.error('Error getting total users:', err.message);
                resolve(0);
            } else {
                resolve(row.count);
            }
        });
    });
}

/**
 * Get all authorized users
 */
async function getAllUsers() {
    return new Promise((resolve) => {
        const db = getDbConnection();
        const sql = 'SELECT * FROM authorized_users ORDER BY added_date DESC';
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error getting all users:', err.message);
                resolve([]);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Process add user command
 */
async function processAddUser(ctx, userInput) {
    const userId = parseInt(userInput.trim());
    
    if (isNaN(userId)) {
        await ctx.reply('❌ Format salah. Gunakan: ID_USER\nContoh: 123456789');
        return;
    }
    
    const added = await addUser(userId);
    if (added) {
        await ctx.reply(`✅ User ${userId} berhasil ditambahkan ke daftar akses.`);
    } else {
        await ctx.reply(`❌ User ${userId} sudah ada dalam daftar akses.`);
    }
}

/**
 * Process delete user command
 */
async function processDeleteUser(ctx, userInput) {
    const userId = parseInt(userInput.trim());
    
    if (isNaN(userId)) {
        await ctx.reply('❌ Format salah. Gunakan: ID_USER\nContoh: 123456789');
        return;
    }
    
    if (userId === config.OWNER_ID) {
        await ctx.reply('❌ Tidak dapat menghapus owner dari daftar akses.');
        return;
    }
    
    const removed = await removeUser(userId);
    if (removed) {
        await ctx.reply(`✅ User ${userId} berhasil dihapus dari daftar akses.`);
    } else {
        await ctx.reply(`❌ User ${userId} tidak ditemukan dalam daftar akses.`);
    }
}

module.exports = {
    checkUserAccess,
    isOwner,
    addUser,
    removeUser,
    getTotalUsers,
    getAllUsers,
    processAddUser,
    processDeleteUser
};