# 🚀 VM Deployment Guide for Solana Trading Bot

This guide will help you deploy your Solana trading bot to a Virtual Machine (VM) for 24/7 operation.

## 🎯 Why Deploy to a VM?

- **24/7 Operation**: Bot runs continuously even when your computer is off
- **Better Performance**: Dedicated resources for trading
- **Reliability**: Professional hosting with uptime guarantees
- **Security**: Isolated environment with proper security measures
- **Monitoring**: Built-in monitoring and alerting systems

## 🖥️ Recommended VM Providers

### 1. **DigitalOcean** (Recommended)
- **Cost**: $6-12/month
- **Specs**: 1-2 CPU, 1-2GB RAM, 25-50GB SSD
- **Pros**: Simple setup, good performance, reliable
- **Link**: https://digitalocean.com

### 2. **Linode**
- **Cost**: $5-10/month
- **Specs**: 1-2 CPU, 1-2GB RAM, 25-50GB SSD
- **Pros**: Good value, reliable, good support
- **Link**: https://linode.com

### 3. **Vultr**
- **Cost**: $6-12/month
- **Specs**: 1-2 CPU, 1-2GB RAM, 25-50GB SSD
- **Pros**: Fast deployment, global locations
- **Link**: https://vultr.com

### 4. **AWS EC2**
- **Cost**: $8-15/month
- **Specs**: t3.micro or t3.small
- **Pros**: Enterprise-grade, highly reliable
- **Link**: https://aws.amazon.com/ec2

## 📋 VM Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04 LTS or newer
- **CPU**: 1 vCPU
- **RAM**: 1GB
- **Storage**: 25GB SSD
- **Network**: 1TB bandwidth

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 2 vCPU
- **RAM**: 2GB
- **Storage**: 50GB SSD
- **Network**: 2TB bandwidth

## 🚀 Quick Deployment Steps

### Step 1: Create VM
1. Sign up with your chosen provider
2. Create a new VM with Ubuntu 22.04 LTS
3. Note down your VM's IP address
4. SSH into your VM: `ssh root@YOUR_VM_IP`

### Step 2: Run Deployment Script
```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/puppetortega11/reverse-inheritance-2025/main/vm-deploy.sh | bash
```

### Step 3: Configure Environment
```bash
# Edit the environment file
sudo nano /opt/trading-bot/.env

# Add your bot wallet private key
BOT_WALLET_PRIVATE_KEY=your_private_key_here
```

### Step 4: Start the Bot
```bash
# Start the trading bot
sudo systemctl start trading-bot

# Check status
sudo systemctl status trading-bot

# View logs
sudo journalctl -u trading-bot -f
```

## 🔧 Manual Deployment (Alternative)

If you prefer manual setup:

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 3. Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 4. Clone Repository
```bash
git clone https://github.com/puppetortega11/reverse-inheritance-2025.git
cd reverse-inheritance-2025
```

### 5. Configure Environment
```bash
cp .env.example .env
nano .env  # Add your configuration
```

### 6. Start Services
```bash
docker-compose up -d
```

## 🔐 Security Configuration

### Firewall Setup
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
```

### SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com
```

## 📊 Monitoring Setup

### Access Monitoring Dashboards
- **Grafana**: http://YOUR_VM_IP:3001 (admin/admin123)
- **Prometheus**: http://YOUR_VM_IP:9090
- **Trading Bot**: http://YOUR_VM_IP:3000

### Key Metrics to Monitor
- Bot uptime and health
- Trading performance
- System resources (CPU, RAM, disk)
- Network connectivity
- Error rates

## 🛠️ Management Commands

### Bot Control
```bash
# Start bot
sudo systemctl start trading-bot

# Stop bot
sudo systemctl stop trading-bot

# Restart bot
sudo systemctl restart trading-bot

# Check status
sudo systemctl status trading-bot
```

### Logs and Debugging
```bash
# View bot logs
sudo journalctl -u trading-bot -f

# View Docker logs
docker-compose logs -f

# Check system resources
htop
```

### Updates and Maintenance
```bash
# Update bot
cd /opt/trading-bot
./update-bot.sh

# Backup bot data
./backup-bot.sh

# Check disk space
df -h
```

## 🔄 Automated Updates

### Set up automatic updates
```bash
# Add to crontab for weekly updates
(crontab -l 2>/dev/null; echo "0 3 * * 0 /opt/trading-bot/update-bot.sh") | crontab -
```

## 🚨 Troubleshooting

### Common Issues

#### Bot won't start
```bash
# Check logs
sudo journalctl -u trading-bot -f

# Check Docker
docker-compose ps
docker-compose logs
```

#### High memory usage
```bash
# Check memory usage
free -h
htop

# Restart bot
sudo systemctl restart trading-bot
```

#### Network issues
```bash
# Check connectivity
ping google.com
curl -I https://api.mainnet-beta.solana.com

# Check firewall
sudo ufw status
```

### Performance Optimization

#### Increase swap space
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### Optimize Docker
```bash
# Clean up unused Docker resources
docker system prune -a

# Limit container resources
# Add to docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 1G
#       cpus: '1.0'
```

## 💰 Cost Optimization

### VM Sizing
- Start with minimum specs and scale up as needed
- Monitor resource usage and adjust accordingly
- Use spot instances for cost savings (if available)

### Bandwidth Management
- Monitor bandwidth usage
- Optimize API calls to reduce data usage
- Use efficient data structures

## 📈 Scaling Considerations

### When to Scale Up
- Bot is consistently using >80% CPU/RAM
- Trading volume increases significantly
- Multiple trading strategies needed

### Scaling Options
- Upgrade VM specs
- Add load balancing
- Implement microservices architecture
- Use container orchestration (Kubernetes)

## 🔒 Security Best Practices

### Wallet Security
- Use a dedicated trading wallet
- Never share private keys
- Regularly rotate keys
- Use hardware wallets for large amounts

### System Security
- Keep system updated
- Use strong passwords
- Enable 2FA where possible
- Regular security audits
- Monitor for suspicious activity

## 📞 Support and Maintenance

### Regular Maintenance Tasks
- Weekly: Check bot performance and logs
- Monthly: Update system packages
- Quarterly: Review and optimize trading strategy
- Annually: Security audit and key rotation

### Backup Strategy
- Daily automated backups
- Test restore procedures
- Store backups in multiple locations
- Document recovery procedures

## 🎯 Success Metrics

### Trading Performance
- Profit/loss tracking
- Win rate monitoring
- Risk-adjusted returns
- Drawdown analysis

### System Performance
- Uptime percentage
- Response times
- Error rates
- Resource utilization

---

## 🚀 Ready to Deploy?

1. Choose your VM provider
2. Create a VM with Ubuntu 22.04 LTS
3. Run the deployment script
4. Configure your wallet
5. Start trading!

Your bot will now run 24/7, making money even while you sleep! 💰

For support, check the logs and monitoring dashboards, or refer to the troubleshooting section above.
