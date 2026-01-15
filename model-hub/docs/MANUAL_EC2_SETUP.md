# Manual EC2 Setup Guide

If you prefer to create the EC2 instance manually via AWS Console, follow this guide.

## 📋 Step-by-Step EC2 Instance Creation

### Step 1: Go to AWS Console
1. Open [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Make sure you're in your preferred region (e.g., `ap-southeast-2`)

### Step 2: Launch Instance
1. Click **"Launch Instance"** button
2. Enter these details:

#### Name and Tags
- **Name**: `model-hub-server`

#### Application and OS Images (AMI)
- Select: **Amazon Linux 2023 AMI** (Free tier eligible)
- Or: **Ubuntu Server 22.04 LTS** (Free tier eligible)

#### Instance Type
Choose one of these (Free tier eligible):
- ✅ **m7i-flex.large** (2 vCPU, 8GB RAM) - **RECOMMENDED** for ML demos
- **c7i-flex.large** (2 vCPU, 4GB RAM) - Compute optimized
- **t3.small** (2 vCPU, 2GB RAM) - Basic (may struggle with multiple demos)

#### Key Pair
- **Create new key pair**:
  - Name: `model-hub-key`
  - Type: RSA
  - Format: `.pem`
  - **DOWNLOAD and save** to `~/.ssh/model-hub-key.pem`
  - Set permissions: `chmod 400 ~/.ssh/model-hub-key.pem`
- Or select existing key pair if you have one

#### Network Settings
Click "Edit" and configure:

**Firewall (Security Group)**
- Create new or use existing
- **Allow these inbound rules:**

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | My IP | Remote access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Frontend |
| Custom TCP | TCP | 8000 | 0.0.0.0/0 | Backend API |
| Custom TCP | TCP | 8501-8600 | 0.0.0.0/0 | Streamlit Demos |

#### Storage
- Size: **50 GB**
- Type: **gp3** (faster than gp2)
- Delete on termination: ✅ Yes

### Step 3: Advanced Details (Optional)
- **IAM Instance Profile**: Create one with S3 full access if you want instance-based permissions

### Step 4: Launch Instance
1. Review your configuration
2. Click **"Launch Instance"**
3. Wait 1-2 minutes for instance to enter **"Running"** state

### Step 5: Get Public IP
1. Go to **Instances** in EC2 Console
2. Select your instance
3. Copy the **Public IPv4 address** (e.g., `13.239.45.123`)

### Step 6: Allocate Elastic IP (Optional but Recommended)
This gives you a static IP that doesn't change if you stop/start the instance:

1. Go to **EC2 → Elastic IPs**
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"**
4. Select the new Elastic IP
5. Click **Actions → Associate Elastic IP address**
6. Select your instance
7. Click **"Associate"**
8. **Note**: Use this Elastic IP instead of the Public IP in the deployment script

### Step 7: Configure MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your cluster
3. Click **"Network Access"**
4. Click **"Add IP Address"**
5. Add your EC2 Public IP (or Elastic IP)
6. Click **"Confirm"**

---

## 🚀 Deploy Using Manual Script

Now that your EC2 instance is ready, deploy the application:

```bash
cd /Users/rajat.gondkar/Desktop/Cloud\ EL/model-hub/scripts
./deploy-manual.sh
```

### The script will ask you for:
1. **EC2 Public IP**: The IP address from Step 5/6
2. **SSH Key Path**: Path to your `.pem` file (e.g., `~/.ssh/model-hub-key.pem`)
3. **SSH Username**: `ec2-user` (Amazon Linux) or `ubuntu` (Ubuntu)
4. **MongoDB URL**: Your MongoDB Atlas connection string
5. **JWT Secret**: Auto-generated or enter your own (min 32 chars)
6. **AWS Credentials**: Access Key ID and Secret Access Key
7. **S3 Bucket**: Your S3 bucket name
8. **GitHub Repo**: Repository URL (default provided)

### What the script does:
1. ✅ Tests SSH connection
2. ✅ Installs Docker and Docker Compose on EC2
3. ✅ Clones your GitHub repository
4. ✅ Creates `.env` file with your configuration
5. ✅ Builds and starts Docker containers
6. ✅ Shows you the access URLs

---

## 🔍 Verification

After deployment completes (2-3 minutes):

```bash
# Check services are running
curl http://YOUR_EC2_IP:8000/health

# Expected: {"status":"healthy","database":"connected","version":"1.0.0"}
```

Access your application:
- **Frontend**: `http://YOUR_EC2_IP:3000`
- **Backend**: `http://YOUR_EC2_IP:8000`
- **API Docs**: `http://YOUR_EC2_IP:8000/docs`

---

## ⚠️ Troubleshooting

### Can't SSH into instance
- Check security group allows SSH (port 22) from your IP
- Verify key permissions: `chmod 400 ~/.ssh/model-hub-key.pem`
- Try: `ssh -i ~/.ssh/model-hub-key.pem ec2-user@YOUR_IP`

### MongoDB connection fails
- Add EC2 IP to MongoDB Atlas IP whitelist
- Verify connection string is correct
- Check security group allows outbound traffic

### Docker containers won't start
```bash
# SSH into EC2
ssh -i ~/.ssh/model-hub-key.pem ec2-user@YOUR_IP

# Check logs
cd /opt/model-hub/model-hub
sudo docker-compose logs
```

### Frontend shows "Network Error"
- Update `NEXT_PUBLIC_API_URL` in `.env` with correct EC2 IP
- Rebuild: `sudo docker-compose up -d --build`

---

## 💰 Cost Savings

- **Stop instance** when not in use: **$0/hour**
- **Terminate** when done testing to avoid charges
- **Elastic IP** charges when NOT attached to running instance

---

## 📊 Next Steps

After successful deployment:
1. Set up a custom domain (optional)
2. Configure SSL/HTTPS with Let's Encrypt
3. Set up automated backups
4. Configure CloudWatch monitoring
5. Set up auto-scaling (for production)
