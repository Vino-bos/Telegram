# Telegram File Converter Bot - Node.js Version

Bot Telegram untuk konversi dan manajemen file yang dibuat dengan Node.js. Clone dari versi Python dengan fungsionalitas yang sama.

## Features

### 🔄 File Conversion
- **TXT ↔ VCF**: Konversi dua arah antara file teks dan vCard
- **XLSX → VCF**: Konversi file Excel ke vCard dengan smart column detection
- **Auto Detection**: Deteksi otomatis format file dan separator

### 📁 File Management
- **Merge Files**: Gabung multiple file TXT/VCF
- **Split Files**: Pecah file VCF berdasarkan jumlah atau bagian
- **Rename Operations**: Ganti nama file dan kontak
- **Contact Management**: Tambah, hapus, dan edit kontak VCF

### 🛡️ Security & Access Control
- **User Management**: Sistem akses berbasis whitelist
- **Owner Privileges**: Command khusus untuk owner
- **Logging**: Pencatatan semua operasi file dan bug reports

### 🚀 Advanced Features
- **Smart Column Detection**: Deteksi otomatis kolom nama, nomor, email
- **Multiple Format Support**: Berbagai separator (|, ,, ;, tab)
- **Encoding Detection**: Support UTF-8, Latin-1
- **Error Handling**: Robust error handling dan recovery
- **Database Integration**: SQLite untuk user management dan logging

## Installation

### Prerequisites
- Node.js 16.0.0 atau lebih tinggi
- npm atau yarn

### Local Setup
```bash
# Clone repository
git clone <repository-url>
cd telegram-bot-nodejs

# Install dependencies
npm install

# Set environment variables
export BOT_TOKEN="your_bot_token_here"

# Run bot
npm start
```

### Development Mode
```bash
# Install development dependencies
npm install --include=dev

# Run in development mode with auto-reload
npm run dev
```

## Configuration

### Environment Variables
```bash
# Required
BOT_TOKEN=your_telegram_bot_token

# Optional
NODE_ENV=production
PORT=3000
```

### Bot Configuration
Edit `src/config/config.js` untuk menyesuaikan:
- Owner ID
- File size limits
- Allowed file extensions
- Database settings

## GitHub Deployment

### 1. Repository Setup
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit"

# Add GitHub remote
git remote add origin https://github.com/yourusername/telegram-bot-nodejs.git
git push -u origin main
```

### 2. GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy Bot

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
```

### 3. Heroku Deployment
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-bot-name

# Set environment variables
heroku config:set BOT_TOKEN=your_token_here

# Deploy
git push heroku main
```

### 4. Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## Project Structure

```
telegram-bot-nodejs/
├── src/
│   ├── config/
│   │   └── config.js              # Configuration settings
│   ├── converters/
│   │   └── fileConverters.js      # File conversion logic
│   ├── handlers/
│   │   └── index.js               # Command handlers
│   ├── utils/
│   │   ├── database.js            # Database operations
│   │   ├── userManager.js         # User access control
│   │   └── helpers.js             # Helper utilities
│   └── main.js                    # Main bot application
├── temp/                          # Temporary files
├── .gitignore
├── package.json
└── README.md
```

## Usage

### Basic Commands
- `/start` - Mulai menggunakan bot
- `/help` - Tampilkan bantuan
- `/menu` - Tampilkan semua menu

### File Conversion
- `/cv_txt_to_vcf` - Convert TXT ke VCF
- `/cv_vcf_to_txt` - Convert VCF ke TXT
- `/cv_xlsx_to_vcf` - Convert XLSX ke VCF
- `/txt2vcf` - Auto convert TXT ke VCF

### Admin Commands (Owner Only)
- `/adduser` - Tambah user baru
- `/deluser` - Hapus user
- `/totaluser` - Total user terdaftar

## Supported File Formats

### Input Formats
- **TXT**: File teks dengan format `Nama|Nomor` atau `Nama,Nomor`
- **VCF**: File vCard standar
- **XLSX/XLS**: File Excel dengan kolom nama dan nomor
- **CSV**: File CSV dengan separator koma

### Output Formats
- **VCF**: vCard 3.0 dengan support multiple fields
- **TXT**: Format teks sederhana

## Database Schema

### authorized_users
- `id`: Primary key
- `user_id`: Telegram user ID
- `username`: Telegram username
- `first_name`: User first name
- `added_date`: Timestamp

### file_operations
- `id`: Primary key
- `user_id`: User ID
- `operation_type`: Jenis operasi
- `file_name`: Nama file
- `status`: Status operasi
- `timestamp`: Timestamp

### bug_reports
- `id`: Primary key
- `user_id`: User ID
- `username`: Username
- `bug_description`: Deskripsi bug
- `timestamp`: Timestamp

## API Reference

### Core Functions

#### File Converters
```javascript
convertTxtToVcf(ctx, filePath)     // Convert TXT to VCF
convertVcfToTxt(ctx, filePath)     // Convert VCF to TXT
convertXlsxToVcf(ctx, filePath)    // Convert XLSX to VCF
```

#### User Management
```javascript
checkUserAccess(userId)            // Check user access
isOwner(userId)                    // Check if user is owner
addUser(userId, username)          // Add new user
removeUser(userId)                 // Remove user
```

#### Database Operations
```javascript
logFileOperation(userId, type, filename, status)
logBugReport(userId, username, description)
getUserStats(userId)
```

## Development

### Adding New Features
1. Create handler in `src/handlers/`
2. Add converter logic in `src/converters/`
3. Update command registration in `src/main.js`
4. Add tests in `tests/`

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Code Style
```bash
# Format code
npm run format

# Lint code
npm run lint
```

## Troubleshooting

### Common Issues

1. **Bot tidak merespon**
   - Periksa BOT_TOKEN
   - Pastikan bot sudah distart di @BotFather

2. **File conversion gagal**
   - Periksa format file input
   - Pastikan file tidak corrupt
   - Cek encoding file

3. **Permission denied**
   - Pastikan user sudah ditambahkan ke authorized_users
   - Periksa owner ID di config

### Logs
```bash
# View application logs
npm run logs

# View error logs only
npm run logs:error
```

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- GitHub Issues: [Create an issue](https://github.com/yourusername/telegram-bot-nodejs/issues)
- Telegram: Contact bot owner
- Email: your.email@example.com

## Changelog

### v1.0.0 (2025-06-19)
- Initial release
- Clone dari Python version
- All core features implemented
- GitHub deployment ready