/**
 * File converters for Node.js bot
 * Equivalent to Python bot/file_converters_simple.py
 */

const fs = require('fs-extra');
const path = require('path');
const XLSX = require('xlsx');
const { parseContactLine, cleanupTempFile, sendDocumentToUser } = require('../utils/helpers');
const { logFileOperation } = require('../utils/database');

/**
 * Convert TXT file to VCF format
 */
async function convertTxtToVcf(ctx, filePath) {
    const userId = ctx.from.id;
    
    try {
        await ctx.reply('🔄 Memproses konversi TXT ke VCF...');
        
        // Read file with encoding detection
        let content = '';
        const encodings = ['utf8', 'latin1'];
        
        for (const encoding of encodings) {
            try {
                content = await fs.readFile(filePath, encoding);
                break;
            } catch (error) {
                continue;
            }
        }
        
        if (!content) {
            await ctx.reply('❌ Tidak dapat membaca file. Format encoding tidak didukung.');
            return;
        }
        
        const lines = content.split('\n').filter(line => line.trim());
        let vcfContent = '';
        let contactCount = 0;
        
        for (const line of lines) {
            const contact = parseContactLine(line);
            if (contact && contact.name && contact.phone) {
                vcfContent += 'BEGIN:VCARD\n';
                vcfContent += 'VERSION:3.0\n';
                vcfContent += `FN:${contact.name}\n`;
                vcfContent += `TEL:${contact.phone}\n`;
                
                if (contact.email) {
                    vcfContent += `EMAIL:${contact.email}\n`;
                }
                if (contact.organization) {
                    vcfContent += `ORG:${contact.organization}\n`;
                }
                
                vcfContent += 'END:VCARD\n\n';
                contactCount++;
            }
        }
        
        if (contactCount === 0) {
            await ctx.reply('❌ Tidak ada kontak valid ditemukan dalam file.');
            return;
        }
        
        // Save VCF file
        const outputFile = filePath.replace(/\.(txt|csv)$/i, '_converted.vcf');
        await fs.writeFile(outputFile, vcfContent, 'utf8');
        
        // Send result
        const caption = `✅ Konversi berhasil!\n📇 Total kontak: ${contactCount}`;
        await sendDocumentToUser(ctx, outputFile, caption);
        
        // Log operation
        logFileOperation(userId, 'txt_to_vcf', path.basename(filePath), 'success');
        
        // Cleanup
        await cleanupTempFile(filePath);
        await cleanupTempFile(outputFile);
        
    } catch (error) {
        console.error('Error in convertTxtToVcf:', error);
        await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
        logFileOperation(userId, 'txt_to_vcf', path.basename(filePath), 'error');
    }
}

/**
 * Convert VCF file to TXT format
 */
async function convertVcfToTxt(ctx, filePath) {
    const userId = ctx.from.id;
    
    try {
        await ctx.reply('🔄 Memproses konversi VCF ke TXT...');
        
        // Read VCF file
        const vcfContent = await fs.readFile(filePath, 'utf8');
        
        // Simple VCF parsing (basic implementation)
        const contacts = [];
        const vcards = vcfContent.split('BEGIN:VCARD');
        
        for (const vcard of vcards) {
            if (!vcard.includes('END:VCARD')) continue;
            
            const fnMatch = vcard.match(/FN:(.+)/);
            const telMatch = vcard.match(/TEL:(.+)/);
            const emailMatch = vcard.match(/EMAIL:(.+)/);
            
            if (fnMatch && telMatch) {
                const name = fnMatch[1].trim();
                const phone = telMatch[1].trim();
                const email = emailMatch ? emailMatch[1].trim() : '';
                
                let contactLine = `${name}|${phone}`;
                if (email) {
                    contactLine += `|${email}`;
                }
                contacts.push(contactLine);
            }
        }
        
        if (contacts.length === 0) {
            await ctx.reply('❌ Tidak ada kontak ditemukan dalam file VCF.');
            return;
        }
        
        // Save TXT file
        const outputFile = filePath.replace(/\.vcf$/i, '_converted.txt');
        await fs.writeFile(outputFile, contacts.join('\n'), 'utf8');
        
        // Send result
        const caption = `✅ Konversi berhasil!\n📄 Total kontak: ${contacts.length}`;
        await sendDocumentToUser(ctx, outputFile, caption);
        
        // Log operation
        logFileOperation(userId, 'vcf_to_txt', path.basename(filePath), 'success');
        
        // Cleanup
        await cleanupTempFile(filePath);
        await cleanupTempFile(outputFile);
        
    } catch (error) {
        console.error('Error in convertVcfToTxt:', error);
        await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
        logFileOperation(userId, 'vcf_to_txt', path.basename(filePath), 'error');
    }
}

/**
 * Convert XLSX file to VCF format
 */
async function convertXlsxToVcf(ctx, filePath) {
    const userId = ctx.from.id;
    
    try {
        await ctx.reply('🔄 Memproses konversi XLSX ke VCF...');
        
        // Read workbook
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (data.length < 2) {
            await ctx.reply('❌ File Excel tidak memiliki data yang cukup.');
            return;
        }
        
        // Get headers
        const headers = data[0].map(h => (h || '').toString().toLowerCase());
        
        // Find name and phone columns
        let nameCol = -1;
        let phoneCol = -1;
        let emailCol = -1;
        let orgCol = -1;
        
        headers.forEach((header, index) => {
            if (header.includes('nama') || header.includes('name') || header.includes('contact')) {
                nameCol = index;
            } else if (header.includes('nomor') || header.includes('phone') || header.includes('telepon') || header.includes('hp') || header.includes('wa')) {
                phoneCol = index;
            } else if (header.includes('email') || header.includes('mail')) {
                emailCol = index;
            } else if (header.includes('organisasi') || header.includes('company') || header.includes('perusahaan') || header.includes('office')) {
                orgCol = index;
            }
        });
        
        if (nameCol === -1 || phoneCol === -1) {
            await ctx.reply('❌ Kolom nama atau nomor tidak ditemukan.');
            return;
        }
        
        // Process contacts
        let vcfContent = '';
        let contactCount = 0;
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length <= Math.max(nameCol, phoneCol)) continue;
            
            const name = row[nameCol];
            const phone = row[phoneCol];
            const email = emailCol >= 0 ? row[emailCol] : null;
            const org = orgCol >= 0 ? row[orgCol] : null;
            
            if (name && phone) {
                vcfContent += 'BEGIN:VCARD\n';
                vcfContent += 'VERSION:3.0\n';
                vcfContent += `FN:${name}\n`;
                vcfContent += `TEL:${phone}\n`;
                
                if (email) {
                    vcfContent += `EMAIL:${email}\n`;
                }
                if (org) {
                    vcfContent += `ORG:${org}\n`;
                }
                
                vcfContent += 'END:VCARD\n\n';
                contactCount++;
            }
        }
        
        if (contactCount === 0) {
            await ctx.reply('❌ Tidak ada kontak valid ditemukan.');
            return;
        }
        
        // Save VCF file
        const outputFile = filePath.replace(/\.(xlsx|xls)$/i, '_converted.vcf');
        await fs.writeFile(outputFile, vcfContent, 'utf8');
        
        // Send result
        const caption = `✅ Konversi berhasil!\n📇 Total kontak: ${contactCount}`;
        await sendDocumentToUser(ctx, outputFile, caption);
        
        // Log operation
        logFileOperation(userId, 'xlsx_to_vcf', path.basename(filePath), 'success');
        
        // Cleanup
        await cleanupTempFile(filePath);
        await cleanupTempFile(outputFile);
        
    } catch (error) {
        console.error('Error in convertXlsxToVcf:', error);
        await ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
        logFileOperation(userId, 'xlsx_to_vcf', path.basename(filePath), 'error');
    }
}

/**
 * Auto detect TXT format and convert to VCF
 */
async function convertTxt2VcfAuto(ctx, filePath) {
    // Use same logic as convertTxtToVcf
    await convertTxtToVcf(ctx, filePath);
}

/**
 * Process admin file - special handling for owner
 */
async function processAdminFile(ctx, filePath) {
    // Use same logic as convertTxtToVcf for now
    await convertTxtToVcf(ctx, filePath);
}

module.exports = {
    convertTxtToVcf,
    convertVcfToTxt,
    convertXlsxToVcf,
    convertTxt2VcfAuto,
    processAdminFile
};