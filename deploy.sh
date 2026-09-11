#!/bin/bash
set -e

echo "===================================================="
echo "🚀 GitScience Enterprise Automated Deployment Script"
echo "===================================================="

# 1. Update system and install dependencies
echo "[1/6] Updating system and installing prerequisites..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw software-properties-common

# 2. Configure Firewall (UFW)
echo "[2/6] Configuring UFW Firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

# 3. Install Docker & Docker Compose (if not installed)
if ! [ -x "$(command -v docker)" ]; then
    echo "[3/6] Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
else
    echo "[3/6] Docker already installed, skipping..."
fi

if ! [ -x "$(command -v docker-compose)" ]; then
    echo "[4/6] Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "[4/6] Docker Compose already installed, skipping..."
fi

# 5. SSL / Certbot Setup
echo "[5/6] Setting up SSL structure..."
mkdir -p nginx/certs
if [ -f "nginx/certs/fullchain.pem" ]; then
    echo "SSL Certificates already exist. Skipping Let's Encrypt."
else
    echo "----------------------------------------------------"
    read -p "Do you want to generate Let's Encrypt SSL now? (y/n): " gen_ssl
    if [ "$gen_ssl" = "y" ]; then
        sudo apt-get install -y certbot
        read -p "Enter your domain (e.g., gitscience.org): " domain_name
        read -p "Enter your email (for SSL recovery): " email_addr
        sudo certbot certonly --standalone -d $domain_name -m $email_addr --agree-tos -n
        sudo cp /etc/letsencrypt/live/$domain_name/fullchain.pem ./nginx/certs/
        sudo cp /etc/letsencrypt/live/$domain_name/privkey.pem ./nginx/certs/
        sudo chown $USER:$USER ./nginx/certs/*.pem
    else
        echo "Skipping SSL generation. Nginx will use self-signed certificates from entrypoint."
    fi
fi

# 6. Check .env and Launch
echo "[6/6] Launching GitScience Cluster..."
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: .env file not found! Copying .env.production.template..."
    cp .env.production.template .env
    echo "❌ PLEASE EDIT .env WITH YOUR SECRETS THEN RUN THIS SCRIPT AGAIN."
    exit 1
fi

sudo docker-compose up -d --build

echo "===================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "Run 'docker-compose logs -f' to monitor the startup."
echo "===================================================="
