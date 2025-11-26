# AWS Deployment Guide for Model Hub

This guide covers deploying the Model Hub platform to AWS.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐     ┌──────────────────────────────────┐  │
│  │ Route 53     │────▶│  CloudFront / ALB                │  │
│  └──────────────┘     └──────────────────────────────────┘  │
│                              │                              │
│              ┌───────────────┴───────────────┐              │
│              ▼                               ▼              │
│   ┌────────────────────┐      ┌────────────────────────┐    │
│   │  Frontend (ECS)    │      │   Backend (EC2/ECS)    │    │
│   │  Next.js App       │      │   FastAPI              │    │
│   └────────────────────┘      └────────────────────────┘    │
│                                      │                      │
│              ┌───────────────────────┴──────┐               │
│              ▼                              ▼               │
│   ┌────────────────────┐      ┌────────────────────────┐    │
│   │  MongoDB Atlas     │      │      Amazon S3         │    │
│   │  (or DocumentDB)   │      │   (Project Files)      │    │
│   └────────────────────┘      └────────────────────────┘    │
│                                                             │
│   ┌────────────────────────────────────────────────────┐    │
│   │              Demo Runner (EC2)                     │    │
│   │  - Streamlit apps run in isolated venvs            │    │
│   │  - Dynamic port allocation (8501-8600)             │    │
│   └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- MongoDB Atlas account (or use Amazon DocumentDB)
- Domain name (optional, for custom domain)

## Step 1: Set Up MongoDB

### Option A: MongoDB Atlas (Recommended)
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Add your AWS IP/CIDR to the IP Access List
4. Get your connection string

### Option B: Amazon DocumentDB
```bash
aws docdb create-db-cluster \
  --db-cluster-identifier model-hub-cluster \
  --engine docdb \
  --master-username admin \
  --master-user-password <password>
```

## Step 2: Create S3 Bucket

```bash
# Create the bucket
aws s3 mb s3://model-hub-projects-<your-unique-id> --region us-east-1

# Enable versioning (optional but recommended)
aws s3api put-bucket-versioning \
  --bucket model-hub-projects-<your-unique-id> \
  --versioning-configuration Status=Enabled

# Set bucket policy for private access
aws s3api put-public-access-block \
  --bucket model-hub-projects-<your-unique-id> \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

## Step 3: Create IAM Role

Create an IAM role for the EC2/ECS instances:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::model-hub-projects-*",
        "arn:aws:s3:::model-hub-projects-*/*"
      ]
    }
  ]
}
```

## Step 4: Deploy Backend (EC2)

### Launch EC2 Instance

```bash
# Launch instance
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \  # Use latest Amazon Linux 2 AMI
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --iam-instance-profile Name=model-hub-role \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=model-hub-backend}]'
```

### Configure Security Group

```bash
# Allow inbound traffic
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 8000 \
  --cidr 0.0.0.0/0

# Allow Streamlit demo ports (8501-8600)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 8501-8600 \
  --cidr 0.0.0.0/0

# Allow SSH access
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 22 \
  --cidr your-ip/32
```

### Setup Backend on EC2

SSH into the instance and run:

```bash
# Update system
sudo yum update -y

# Install Python 3.11
sudo amazon-linux-extras install python3.11 -y

# Install Git
sudo yum install git -y

# Clone repository
git clone https://github.com/your-repo/model-hub.git
cd model-hub/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/model_hub
SECRET_KEY=$(openssl rand -hex 32)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=model-hub-projects-xxx
AWS_REGION=us-east-1
DEMO_BASE_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
DEMO_BASE_PORT=8501
CORS_ORIGINS=["https://your-frontend-domain.com"]
EOF

# Create systemd service
sudo tee /etc/systemd/system/model-hub.service << EOF
[Unit]
Description=Model Hub Backend
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/model-hub/backend
Environment="PATH=/home/ec2-user/model-hub/backend/venv/bin"
ExecStart=/home/ec2-user/model-hub/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable model-hub
sudo systemctl start model-hub
```

## Step 5: Deploy Frontend

### Option A: AWS Amplify (Easiest)

1. Go to AWS Amplify Console
2. Click "Get Started" under "Amplify Hosting"
3. Connect your GitHub repository
4. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd model-hub/frontend
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: model-hub/frontend/.next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api`
6. Deploy

### Option B: ECS with Fargate

Create Dockerfile for frontend:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Deploy to ECS:

```bash
# Build and push to ECR
aws ecr create-repository --repository-name model-hub-frontend
docker build -t model-hub-frontend .
docker tag model-hub-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/model-hub-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/model-hub-frontend:latest

# Create ECS cluster and service (use AWS Console or CloudFormation)
```

## Step 6: Set Up Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name model-hub-alb \
  --subnets subnet-xxxx subnet-yyyy \
  --security-groups sg-xxxx

# Create target groups
aws elbv2 create-target-group \
  --name model-hub-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxxx \
  --health-check-path /api/health

# Create listeners (HTTP -> HTTPS redirect recommended)
```

## Step 7: Configure Route 53 (Optional)

```bash
# Create hosted zone
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)

# Create A record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXX \
  --change-batch file://route53-changes.json
```

## Step 8: SSL Certificate

Use AWS Certificate Manager:

```bash
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS
```

## Environment Variables Summary

### Backend (.env)
```
MONGODB_URL=mongodb+srv://...
SECRET_KEY=your-secret-key
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=model-hub-projects-xxx
AWS_REGION=us-east-1
DEMO_BASE_URL=http://your-ec2-public-ip
DEMO_BASE_PORT=8501
CORS_ORIGINS=["https://yourdomain.com"]
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## Monitoring & Logging

### CloudWatch Logs
```bash
# Create log group
aws logs create-log-group --log-group-name /model-hub/backend

# Stream logs from EC2
# Add to systemd service: StandardOutput=journal
# Use CloudWatch agent to ship logs
```

### CloudWatch Alarms
```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name model-hub-cpu-high \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Cost Estimation

| Service | Estimated Monthly Cost |
|---------|----------------------|
| EC2 (t3.medium) | ~$30 |
| MongoDB Atlas (M0-M10) | $0 - $60 |
| S3 (10GB) | ~$0.25 |
| ALB | ~$20 |
| Route 53 | ~$0.50 |
| CloudFront (optional) | ~$10 |
| **Total** | **~$60-$120/month** |

## Troubleshooting

### Backend not starting
```bash
# Check logs
sudo journalctl -u model-hub -f

# Check port availability
sudo netstat -tlnp | grep 8000
```

### Demo not accessible
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxx

# Check if demo process is running
ps aux | grep streamlit
```

### S3 upload failing
```bash
# Test S3 access
aws s3 ls s3://your-bucket

# Check IAM role permissions
aws sts get-caller-identity
```

## Security Best Practices

1. **Use IAM Roles** instead of access keys where possible
2. **Enable VPC** for all resources
3. **Use HTTPS** everywhere
4. **Rotate secrets** regularly
5. **Enable CloudTrail** for auditing
6. **Use Security Groups** to limit access
7. **Enable encryption** for S3 and databases
8. **Regular updates** for all instances

## Cleanup

To delete all resources:

```bash
# Terminate EC2 instances
aws ec2 terminate-instances --instance-ids i-xxxx

# Delete ECS services/clusters
aws ecs delete-service --cluster model-hub --service backend --force
aws ecs delete-cluster --cluster model-hub

# Empty and delete S3 bucket
aws s3 rm s3://model-hub-projects-xxx --recursive
aws s3 rb s3://model-hub-projects-xxx

# Delete other resources (ALB, Route 53, etc.)
```
