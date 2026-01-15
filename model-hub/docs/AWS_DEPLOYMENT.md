# AWS EC2 Deployment Guide

This guide explains how to deploy AI Model Bazaar to AWS EC2 for production use.

## 📋 Prerequisites

Before starting, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured (`aws configure`)
3. **MongoDB Atlas** account with a cluster (free tier works)
4. **GitHub repository** (for CI/CD - optional)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              EC2 Instance (t3.medium)                │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │               Docker Containers                 │  │   │
│  │  │  ┌─────────────┐  ┌─────────────┐             │  │   │
│  │  │  │  Frontend   │  │   Backend   │             │  │   │
│  │  │  │  (Next.js)  │  │  (FastAPI)  │             │  │   │
│  │  │  │  Port 3000  │  │  Port 8000  │             │  │   │
│  │  │  └─────────────┘  └─────────────┘             │  │   │
│  │  │         ↓                 ↓                    │  │   │
│  │  │  ┌─────────────────────────────────────────┐  │  │   │
│  │  │  │        Demo Runner (Streamlit)          │  │  │   │
│  │  │  │        Ports 8501-8600                  │  │  │   │
│  │  │  └─────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                              │
│              ┌───────────────┴───────────────┐              │
│              ▼                               ▼              │
│   ┌────────────────────┐      ┌────────────────────────┐    │
│   │  MongoDB Atlas     │      │      Amazon S3         │    │
│   │  (External)        │      │   (Project Files)      │    │
│   └────────────────────┘      └────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Deployment (Automated)

### Option 1: Using CloudFormation (Recommended)

1. **Run the setup script:**
   ```bash
   cd model-hub/scripts
   chmod +x setup-aws.sh
   ./setup-aws.sh
   ```

2. **Follow the prompts** to enter your configuration values.

3. **Wait for deployment** (5-10 minutes).

4. **Access your application** using the URLs provided.

### Option 2: Manual Deployment

Follow the detailed steps below.

---

## 📝 Detailed Deployment Steps

### Step 1: Create EC2 Key Pair

```bash
# Create key pair
aws ec2 create-key-pair \
  --key-name model-hub-key \
  --region ap-southeast-2 \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/model-hub-key.pem

# Set permissions
chmod 400 ~/.ssh/model-hub-key.pem
```

### Step 2: Deploy CloudFormation Stack

```bash
# Navigate to the aws directory
cd model-hub/aws

# Deploy the stack
aws cloudformation deploy \
  --template-file cloudformation.yaml \
  --stack-name model-hub-stack \
  --region ap-southeast-2 \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName=model-hub \
    Environment=production \
    InstanceType=m7i-flex.large \
    KeyPairName=model-hub-key \
    MongoDBURL="your-mongodb-url" \
    JWTSecretKey="your-jwt-secret-32-chars" \
    AWSAccessKeyIdParam="your-aws-access-key" \
    AWSSecretAccessKeyParam="your-aws-secret-key" \
    S3BucketNameParam="ai-model-bazaar-projects" \
    AWSRegionParam="ap-southeast-2"
```

### Step 3: Get EC2 Instance Details

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name model-hub-stack \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Step 4: SSH into EC2 Instance

```bash
# Get the public IP
PUBLIC_IP=$(aws cloudformation describe-stacks \
  --stack-name model-hub-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`EC2PublicIP`].OutputValue' \
  --output text)

# SSH into the instance
ssh -i ~/.ssh/model-hub-key.pem ec2-user@$PUBLIC_IP
```

### Step 5: Deploy Application on EC2

```bash
# On the EC2 instance:

# Clone your repository
sudo git clone https://github.com/your-username/AI-Model_Bazaar.git /opt/model-hub
cd /opt/model-hub/model-hub

# Create .env file (values are already set from CloudFormation)
# If not, copy from .env.production.example and edit

# Build and start containers
sudo docker-compose up -d --build

# Check status
sudo docker-compose ps
sudo docker-compose logs -f
```

---

## 🔄 CI/CD with GitHub Actions

### Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

| Secret Name | Description |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for deployment |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for deployment |
| `EC2_SSH_PRIVATE_KEY` | Content of your EC2 private key file |

### Automatic Deployment

Once configured, pushing to the `main` branch will:

1. Run tests
2. Build Docker images
3. Deploy to EC2 automatically

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URL` | MongoDB connection string | Yes |
| `JWT_SECRET_KEY` | Secret for JWT tokens (min 32 chars) | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 | Yes |
| `S3_BUCKET_NAME` | S3 bucket for project files | Yes |
| `DEMO_BASE_URL` | Base URL for demos (your EC2 IP/domain) | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend | Yes |

### Security Group Ports

| Port | Service | Description |
|------|---------|-------------|
| 22 | SSH | Remote access |
| 80 | HTTP | Web traffic |
| 443 | HTTPS | Secure web traffic |
| 3000 | Frontend | Next.js application |
| 8000 | Backend | FastAPI server |
| 8501-8600 | Demos | Streamlit demo apps |

---

## 📊 Monitoring & Maintenance

### View Logs

```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend
```

### Restart Services

```bash
# Restart all
sudo docker-compose restart

# Restart specific service
sudo docker-compose restart backend
```

### Update Application

```bash
cd /opt/model-hub
sudo git pull origin main
cd model-hub
sudo docker-compose down
sudo docker-compose up -d --build
```

### Check Health

```bash
# Backend health
curl http://localhost:8000/health

# Container status
sudo docker-compose ps
```

---

## 💰 Cost Estimation

| Resource | Type | Monthly Cost (approx) |
|----------|------|----------------------|
| EC2 | m7i-flex.large (2vCPU/8GB) | FREE (AWS Free Tier) |
| EBS Storage | 50 GB gp3 | ~$4 |
| Elastic IP | 1 | ~$3.60 |
| S3 Storage | Variable | ~$0.023/GB |
| Data Transfer | Variable | ~$0.09/GB |

**Total estimated: ~$8-15/month** (with free tier EC2)

**Note:** Free tier eligibility varies by region and account. Available instances:
- **t3.small** - 2 vCPU, 2GB RAM (Basic, might struggle with multiple demos)
- **c7i-flex.large** - 2 vCPU, 4GB RAM (Compute optimized)
- **m7i-flex.large** - 2 vCPU, 8GB RAM (Memory optimized - **Recommended** for ML demos)

### Cost Optimization Tips

1. Use **Spot Instances** for dev/staging (70% savings)
2. Use **Reserved Instances** for production (30-40% savings)
3. Set up **auto-scaling** for variable traffic
4. Enable **S3 Intelligent Tiering** for storage

---

## 🔒 Security Best Practices

1. **Enable HTTPS** with SSL certificates (Let's Encrypt)
2. **Restrict SSH access** to your IP only
3. **Rotate secrets** regularly
4. **Enable CloudWatch** monitoring and alerts
5. **Set up automated backups** for EBS volumes
6. **Use IAM roles** instead of access keys where possible

---

## 🆘 Troubleshooting

### Container won't start

```bash
# Check logs
sudo docker-compose logs backend

# Check if ports are in use
sudo netstat -tlnp | grep 8000
```

### Can't connect to MongoDB

1. Check MongoDB Atlas IP whitelist (add EC2 Elastic IP)
2. Verify connection string format
3. Check network security group rules

### Demo apps not accessible

1. Verify security group allows ports 8501-8600
2. Check if containers are running: `docker ps`
3. Check demo logs: `docker-compose logs backend`

### Out of disk space

```bash
# Clean up Docker
sudo docker system prune -a

# Check disk usage
df -h
```

---

## 🗑️ Cleanup

To delete all AWS resources:

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack \
  --stack-name model-hub-stack \
  --region ap-southeast-2

# Delete key pair
aws ec2 delete-key-pair \
  --key-name model-hub-key \
  --region ap-southeast-2
```

---

## 📚 Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment)
