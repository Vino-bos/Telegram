/**
 * Database operations for Node.js bot
 * Equivalent to Python bot/database.py
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/config');

let db = null;

/**
 * Get database connection
 */
function getDbConnection() {
    if (!db) {
        const dbPath = path.join(process.cwd(), config.DATABASE.filename);
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
            }
        });
    }
    return db;
}

/**
 * Initialize database tables
 */
async function initDatabase() {
    return new Promise((resolve, reject) => {
        const database = getDbConnection();
        
        // Create tables
        const createTables = `
            CREATE TABLE IF NOT EXISTS authorized_users (
                id INTEGER PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL,
                username TEXT,
                first_name TEXT,
                added_date DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS file_operations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                operation_type TEXT NOT NULL,
                file_name TEXT NOT NULL,
                status TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS bug_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                username TEXT,
                bug_description TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        database.exec(createTables, (err) => {
            if (err) {
                console.error('Error creating tables:', err.message);
                reject(err);
            } else {
                // Insert owner as authorized user
                const insertOwner = `
                    INSERT OR IGNORE INTO authorized_users (user_id, username, first_name) 
                    VALUES (?, 'owner', 'Bot Owner')
                `;
                
                database.run(insertOwner, [config.OWNER_ID], (err) => {
                    if (err) {
                        console.error('Error inserting owner:', err.message);
                    }
                    resolve();
                });
            }
        });
    });
}

/**
 * Log file operation to database
 */
function logFileOperation(userId, operationType, fileName, status) {
    const database = getDbConnection();
    const sql = `
        INSERT INTO file_operations (user_id, operation_type, file_name, status)
        VALUES (?, ?, ?, ?)
    `;
    
    database.run(sql, [userId, operationType, fileName, status], (err) => {
        if (err) {
            console.error('Error logging file operation:', err.message);
        }
    });
}

/**
 * Log bug report to database
 */
function logBugReport(userId, username, bugDescription) {
    const database = getDbConnection();
    const sql = `
        INSERT INTO bug_reports (user_id, username, bug_description)
        VALUES (?, ?, ?)
    `;
    
    database.run(sql, [userId, username, bugDescription], (err) => {
        if (err) {
            console.error('Error logging bug report:', err.message);
        }
    });
}

/**
 * Get user statistics
 */
async function getUserStats(userId) {
    return new Promise((resolve, reject) => {
        const database = getDbConnection();
        const sql = `
            SELECT 
                COUNT(*) as total_operations,
                COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_operations,
                COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_operations
            FROM file_operations 
            WHERE user_id = ?
        `;
        
        database.get(sql, [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row || { total_operations: 0, successful_operations: 0, failed_operations: 0 });
            }
        });
    });
}

/**
 * Clean up old records from database
 */
function cleanupOldRecords(days = 30) {
    const database = getDbConnection();
    const sql = `
        DELETE FROM file_operations 
        WHERE timestamp < datetime('now', '-${days} days')
    `;
    
    database.run(sql, (err) => {
        if (err) {
            console.error('Error cleaning up old records:', err.message);
        } else {
            console.log(`Cleaned up old records older than ${days} days`);
        }
    });
}

module.exports = {
    getDbConnection,
    initDatabase,
    logFileOperation,
    logBugReport,
    getUserStats,
    cleanupOldRecords
};