#!/bin/bash

# Solana Trading Bot VM Deployment Script
# This script sets up a complete trading bot on a fresh Ubuntu VM

set -e

echo "🚀 Starting Solana Trading Bot VM Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BOT_DIR="/opt/trading-bot"
SERVICE_USER="tradingbot"
REPO_URL="https://github.com/puppetortega11/reverse-inheritance-2025.git"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    nano \
    ufw \
    fail2ban

# Install Docker
print_status "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
print_status "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create service user
print_status "Creating service user..."
sudo useradd -r -s /bin/false -d $BOT_DIR $SERVICE_USER || true

# Create bot directory
print_status "Creating bot directory..."
sudo mkdir -p $BOT_DIR
sudo chown $SERVICE_USER:$SERVICE_USER $BOT_DIR

# Clone repository
print_status "Cloning trading bot repository..."
cd /tmp
git clone $REPO_URL trading-bot-temp
sudo cp -r trading-bot-temp/* $BOT_DIR/
sudo chown -R $SERVICE_USER:$SERVICE_USER $BOT_DIR
rm -rf trading-bot-temp

# Create environment file
print_status "Creating environment configuration..."
sudo tee $BOT_DIR/.env > /dev/null << EOF
# Solana Configuration
SOLANA_NETWORK=mainnet
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
JUPITER_API_URL=https://quote-api.jup.ag/v6

# Bot Configuration
BOT_WALLET_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
TRADING_STRATEGY=aggressive
MAX_POSITION_SIZE=10
STOP_LOSS_PERCENTAGE=5
TAKE_PROFIT_PERCENTAGE=15
MIN_TRADE_AMOUNT=0.01

# Security
JWT_SECRET=$(openssl rand -base64 32)
API_RATE_LIMIT=100

# Monitoring
ENABLE_METRICS=true
LOG_LEVEL=info
EOF

sudo chown $SERVICE_USER:$SERVICE_USER $BOT_DIR/.env
sudo chmod 600 $BOT_DIR/.env

# Create data and logs directories
sudo mkdir -p $BOT_DIR/{data,logs,ssl}
sudo chown -R $SERVICE_USER:$SERVICE_USER $BOT_DIR/{data,logs,ssl}

# Configure firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 9090/tcp

# Configure fail2ban
print_status "Configuring fail2ban..."
sudo tee /etc/fail2ban/jail.local > /dev/null << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# Create systemd service for the bot
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/trading-bot.service > /dev/null << EOF
[Unit]
Description=Solana Trading Bot
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$BOT_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$SERVICE_USER
Group=$SERVICE_USER

[Install]
WantedBy=multi-user.target
EOF

# Create monitoring service
sudo tee /etc/systemd/system/trading-bot-monitor.service > /dev/null << EOF
[Unit]
Description=Trading Bot Health Monitor
After=trading-bot.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$BOT_DIR
ExecStart=/bin/bash -c 'while true; do curl -f http://localhost:3000/api/health || systemctl restart trading-bot; sleep 60; done'
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create log rotation
sudo tee /etc/logrotate.d/trading-bot > /dev/null << EOF
$BOT_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload trading-bot
    endscript
}
EOF

# Enable and start services
print_status "Enabling services..."
sudo systemctl daemon-reload
sudo systemctl enable trading-bot
sudo systemctl enable trading-bot-monitor

# Create startup script
sudo tee $BOT_DIR/start-bot.sh > /dev/null << 'EOF'
#!/bin/bash
cd /opt/trading-bot
docker-compose up -d
echo "Trading bot started successfully!"
echo "Access the bot at: http://$(curl -s ifconfig.me):3000"
echo "Monitor at: http://$(curl -s ifconfig.me):3001 (admin/admin123)"
EOF

sudo chmod +x $BOT_DIR/start-bot.sh
sudo chown $SERVICE_USER:$SERVICE_USER $BOT_DIR/start-bot.sh

# Create update script
sudo tee $BOT_DIR/update-bot.sh > /dev/null << 'EOF'
#!/bin/bash
cd /opt/trading-bot
echo "Updating trading bot..."
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo "Trading bot updated successfully!"
EOF

sudo chmod +x $BOT_DIR/update-bot.sh
sudo chown $SERVICE_USER:$SERVICE_USER $BOT_DIR/update-bot.sh

# Create backup script
sudo tee $BOT_DIR/backup-bot.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/trading-bot"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

cd /opt/trading-bot
tar -czf "$BACKUP_DIR/trading-bot-backup-$DATE.tar.gz" data/ logs/ .env
echo "Backup created: $BACKUP_DIR/trading-bot-backup-$DATE.tar.gz"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "trading-bot-backup-*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x $BOT_DIR/backup-bot.sh
sudo chown $SERVICE_USER:$SERVICE_USER $BOT_DIR/backup-bot.sh

# Add backup to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * $BOT_DIR/backup-bot.sh") | crontab -

print_success "VM deployment completed successfully!"

echo ""
echo "🎉 Trading Bot VM Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit the environment file: sudo nano $BOT_DIR/.env"
echo "2. Add your bot wallet private key to BOT_WALLET_PRIVATE_KEY"
echo "3. Start the bot: sudo systemctl start trading-bot"
echo "4. Check status: sudo systemctl status trading-bot"
echo ""
echo "🌐 Access URLs:"
echo "• Trading Bot: http://$(curl -s ifconfig.me):3000"
echo "• Grafana Monitoring: http://$(curl -s ifconfig.me):3001 (admin/admin123)"
echo "• Prometheus Metrics: http://$(curl -s ifconfig.me):9090"
echo ""
echo "🔧 Management Commands:"
echo "• Start bot: sudo systemctl start trading-bot"
echo "• Stop bot: sudo systemctl stop trading-bot"
echo "• Restart bot: sudo systemctl restart trading-bot"
echo "• View logs: sudo journalctl -u trading-bot -f"
echo "• Update bot: $BOT_DIR/update-bot.sh"
echo "• Backup bot: $BOT_DIR/backup-bot.sh"
echo ""
echo "⚠️  IMPORTANT: Add your wallet private key to $BOT_DIR/.env before starting!"
echo ""
print_warning "Please reboot the system to ensure all services start properly: sudo reboot"
