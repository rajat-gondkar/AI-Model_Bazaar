# Security Guidelines for AI Model Bazaar

## 🔐 Protecting Sensitive Information

This document explains how to keep your credentials and sensitive data secure.

## Files That Should NEVER Be Committed to Git

### ❌ Never commit these files:

1. **Environment files with real credentials:**
   - `.env`
   - `.env.local`
   - `.env.development`
   - `.env.production`
   - `.env.test`
   - Any file ending in `.env` (except `.env.example` files)

2. **SSH Keys and Certificates:**
   - `*.pem` files
   - `*.key` files
   - `*.ppk` files
   - Any SSH private keys

3. **Configuration files with credentials:**
   - `.model-hub-config`
   - `.aws/credentials`
   - Any file containing passwords, API keys, or secrets

4. **Database backups or exports containing data**

### ✅ Safe to commit (templates only):

- `.env.example`
- `.env.production.example`
- `README.md` files with instructions
- Configuration templates without actual credentials

## How Protection Works

### 1. .gitignore File

The `.gitignore` file is configured to automatically exclude sensitive files:

```gitignore
# Environment variables
.env
*.env
!.env.example
!.env.production.example

# SSH Keys
*.pem
*.key
*.ppk

# Credentials
.model-hub-config
.aws/
```

### 2. File Permissions

Sensitive files should have restrictive permissions:

```bash
# Make SSH keys readable only by you
chmod 400 ~/.ssh/your-key.pem

# Make config files private
chmod 600 ~/.model-hub-config
```

## Best Practices

### ✅ DO:

1. **Use example files as templates**
   ```bash
   cp .env.example .env
   # Then edit .env with your real credentials
   ```

2. **Verify files before committing**
   ```bash
   git status
   git diff --cached
   ```

3. **Use git check-ignore to verify protection**
   ```bash
   git check-ignore .env
   # Should output: .env (confirming it's ignored)
   ```

4. **Store secrets in environment variables or secret managers**
   - For production: Use AWS Secrets Manager or Parameter Store
   - For development: Use `.env` files (never committed)

5. **Rotate credentials if accidentally exposed**
   - Change all passwords immediately
   - Generate new API keys
   - Rotate JWT secrets
   - Review access logs

### ❌ DON'T:

1. **Never hardcode credentials in source code**
   ```python
   # ❌ BAD
   password = "mypassword123"
   
   # ✅ GOOD
   password = os.getenv("DATABASE_PASSWORD")
   ```

2. **Never commit environment files**
   ```bash
   # ❌ BAD
   git add .env
   
   # ✅ GOOD
   git add .env.example
   ```

3. **Never share credentials in chat, email, or tickets**
   - Use secure password managers
   - Share through encrypted channels only

4. **Never use production credentials in development**
   - Use separate credentials for dev/staging/production

## If You Accidentally Commit Sensitive Data

### 1. Immediate Actions:

```bash
# Remove the file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/sensitive/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (if already pushed to remote)
git push origin --force --all
```

### 2. Rotate All Exposed Credentials:
- [ ] Change MongoDB password
- [ ] Generate new AWS access keys
- [ ] Rotate JWT secret
- [ ] Update all deployed instances

### 3. Review GitHub Security:
- Check "Security" tab in GitHub for any detected secrets
- Review commit history for other potential exposures

## Checking for Leaks

### Before Committing:

```bash
# Check what will be committed
git status

# View actual changes
git diff --cached

# Verify sensitive files are ignored
git check-ignore .env model-hub/backend/.env

# Search for potential secrets in staged files
git grep -i "password\|secret\|key" -- "*.js" "*.py" "*.ts"
```

### Tools to Help:

1. **git-secrets** - Prevents committing secrets
   ```bash
   brew install git-secrets
   git secrets --install
   git secrets --register-aws
   ```

2. **detect-secrets** - Scans for secrets
   ```bash
   pip install detect-secrets
   detect-secrets scan
   ```

## Environment Variables Reference

### Required Environment Variables:

| Variable | Description | Example | Where Used |
|----------|-------------|---------|------------|
| `MONGODB_URL` | MongoDB connection string | `mongodb+srv://user:pass@...` | Backend |
| `JWT_SECRET_KEY` | JWT signing secret (32+ chars) | `[generated]` | Backend |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` | Backend |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `[secret]` | Backend |
| `S3_BUCKET_NAME` | S3 bucket name | `ai-model-bazaar-projects` | Backend |

### Generating Secure Secrets:

```bash
# Generate JWT secret (32 bytes = 64 hex chars)
openssl rand -hex 32

# Generate random password
openssl rand -base64 32
```

## Production Deployment Security

### AWS Deployment:

1. **Use IAM roles instead of access keys when possible**
   - EC2 instances can use IAM instance profiles
   - Avoid embedding access keys in environment files

2. **Use AWS Secrets Manager**
   ```python
   import boto3
   
   client = boto3.client('secretsmanager')
   secret = client.get_secret_value(SecretId='my-secret')
   ```

3. **Enable CloudTrail logging**
   - Monitor who accessed what credentials
   - Set up alerts for suspicious activity

4. **Use Security Groups properly**
   - Restrict SSH to your IP only
   - Don't expose all ports to 0.0.0.0/0

### MongoDB Atlas Security:

1. **Use IP Whitelist**
   - Add only your EC2 instance IP
   - Don't use 0.0.0.0/0 in production

2. **Use strong passwords**
   - Minimum 20 characters
   - Include letters, numbers, and symbols

3. **Enable MongoDB authentication**
   - Always use username/password
   - Consider using AWS PrivateLink

## Emergency Contacts

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Contact the maintainer privately
3. Provide details about the vulnerability
4. Wait for confirmation before public disclosure

## Regular Security Audits

### Monthly:
- [ ] Review `.gitignore` file
- [ ] Check for committed sensitive files
- [ ] Rotate development credentials
- [ ] Review access logs

### Quarterly:
- [ ] Rotate all production credentials
- [ ] Review IAM permissions
- [ ] Update security groups
- [ ] Audit user access

### After Team Changes:
- [ ] Revoke access for departing team members
- [ ] Rotate all shared credentials
- [ ] Review commit history

## Additional Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
