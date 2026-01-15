# Deployment Scripts Guide

This directory contains scripts for deploying and managing AI Model Bazaar on AWS EC2.

## 🚀 Quick Start

### First Time Setup (Run Once)

```bash
# Step 1: Configure your credentials
./setup-credentials.sh
```

This will ask you for:
- EC2 IP address
- SSH key path
- MongoDB URL
- AWS credentials
- S3 bucket info

All credentials are saved securely to `~/.model-hub-config` (file permissions: 600)

### Deploy Application

```bash
# Step 2: Deploy to EC2
./deploy-to-ec2.sh
```

This uses your saved credentials to:
- Connect to EC2
- Install Docker & Docker Compose
- Clone repository
- Build containers
- Start services

## 📝 Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `setup-credentials.sh` | Save configuration | First time, or to update credentials |
| `deploy-to-ec2.sh` | Deploy application | Initial deployment or full redeploy |
| `manage-app.sh` | Manage running app | Daily operations (logs, restart, etc.) |

## 🛠️ Management Commands

After deployment, use `manage-app.sh` for common tasks:

```bash
# View live logs
./manage-app.sh logs

# Check container status
./manage-app.sh status

# Restart services
./manage-app.sh restart

# Stop services
./manage-app.sh stop

# Start services
./manage-app.sh start

# Update code from GitHub
./manage-app.sh update

# Open SSH shell
./manage-app.sh shell

# Check backend health
./manage-app.sh health
```

## 🔄 Common Workflows

### Deploy for the First Time
```bash
./setup-credentials.sh   # Enter all credentials
./deploy-to-ec2.sh       # Deploy application
```

### Redeploy After Code Changes
```bash
./deploy-to-ec2.sh       # Full redeploy (uses saved credentials)
```

### Quick Update (Faster)
```bash
./manage-app.sh update   # Pull code and rebuild
```

### Check if Everything is Working
```bash
./manage-app.sh status   # Check containers
./manage-app.sh health   # Check backend API
./manage-app.sh logs     # View logs
```

### Restart After Configuration Changes
```bash
./manage-app.sh restart  # Restart all services
```

## 🔐 Credential Storage

Credentials are stored in: `~/.model-hub-config`

**Security:**
- File permissions: `600` (owner read/write only)
- Location: Home directory (not in git repository)
- Contains sensitive information - keep secure!

**To update credentials:**
```bash
./setup-credentials.sh  # Will backup existing config
```

**To view current config (safely):**
```bash
cat ~/.model-hub-config | grep -v "SECRET\|PASSWORD\|mongodb"
```

## 📋 Prerequisites

Before running scripts:

1. **EC2 Instance Created** (via AWS Console)
   - Type: m7i-flex.large (recommended)
   - Security Group: Ports 22, 80, 443, 3000, 8000, 8501-8600
   - SSH Key downloaded (.pem file)

2. **MongoDB Atlas**
   - Cluster created
   - Database user configured
   - Connection URL ready

3. **AWS S3**
   - Bucket created
   - Access keys generated

4. **SSH Key**
   - .pem file downloaded
   - Permissions set: `chmod 400 key.pem`

## 🆘 Troubleshooting

### Can't connect to EC2
```bash
# Test SSH manually
ssh -i ~/.ssh/model-hub-key.pem ec2-user@YOUR_EC2_IP

# Check security group allows SSH from your IP
```

### Containers won't start
```bash
# View logs
./manage-app.sh logs

# Check status
./manage-app.sh status

# Try restart
./manage-app.sh restart
```

### MongoDB connection fails
1. Add EC2 IP to MongoDB Atlas IP Whitelist
2. Verify connection string is correct
3. Check security group allows outbound traffic

### Need to reset everything
```bash
# Stop application
./manage-app.sh stop

# SSH into EC2
./manage-app.sh shell

# On EC2, remove everything
sudo rm -rf /opt/model-hub

# Exit and redeploy
exit
./deploy-to-ec2.sh
```

## 📚 Legacy Scripts

- `deploy-manual.sh` - Original interactive script (deprecated, use setup-credentials.sh + deploy-to-ec2.sh instead)
- `setup-aws.sh` - CloudFormation-based setup (requires AWS CLI configured)
- `deploy-ec2.sh` - Generic deployment script

## 🔄 Update Workflow

When you push code to GitHub:

1. **Automatic** (if CI/CD is configured):
   - GitHub Actions will auto-deploy

2. **Manual** (quick):
   ```bash
   ./manage-app.sh update
   ```

3. **Manual** (full redeploy):
   ```bash
   ./deploy-to-ec2.sh
   ```

## 💡 Tips

- Run `setup-credentials.sh` only once (or when credentials change)
- Use `deploy-to-ec2.sh` for full deployments
- Use `manage-app.sh update` for quick code updates
- Keep your `~/.model-hub-config` file secure and backed up
- Use `manage-app.sh logs` to debug issues
