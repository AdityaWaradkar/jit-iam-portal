# Deployment Guide

This document explains how to deploy the JIT IAM Portal to AWS using Terraform. It covers prerequisites, cost, remote state setup, the deployment workflow, teardown, local validation, and the reference topology.

---

## 1. Overview

The JIT IAM Portal runs on AWS using ECS Fargate for compute, RDS Postgres for state, ElastiCache Redis for background task queues, an S3 bucket with Object Lock for the audit trail, and an Application Load Balancer that routes traffic between the frontend and the backend.

All resources are provisioned by Terraform. The configuration lives under `infra/terraform/` and is organized into reusable modules plus two environment compositions (dev and prod).

The configuration is provided as a production reference. It is not required to run the project locally. The local stack is started with `docker compose --profile full up --build`.

---

## 2. Prerequisites

Before you begin, confirm the following:

- Terraform 1.5 or newer is installed locally
- An AWS account exists with permissions to create VPC, ECS, RDS, ElastiCache, S3, IAM, ECR, Secrets Manager, CloudWatch, and ELB resources
- An ACM certificate exists for the domain you intend to use
- The AWS CLI is configured with credentials for the target account
- A registered domain or Route 53 hosted zone is available for DNS routing

To check the Terraform version:

```
terraform version
```

If Terraform is not installed, follow the official installation instructions for your platform.

---

## 3. Cost Estimate

A running deployment in the `us-east-1` region costs approximately:

| Component | Approximate monthly cost |
|---|---|
| RDS db.t4g.micro with 20 GB gp3 storage | $15 |
| ElastiCache cache.t4g.micro (single node) | $12 |
| NAT Gateway | $32 plus data processing |
| Application Load Balancer | $16 plus usage |
| ECS Fargate tasks (2 small tasks) | $10 to $30 |
| CloudWatch Logs and data transfer | Variable, typically under $5 |
| **Total for the dev environment** | **$85 to $100** |

The prod environment costs more due to multi-AZ RDS, two Redis nodes, a higher desired task count, and a longer log retention window.

Do not apply the configuration without a clear plan to tear it down. A forgotten RDS instance or NAT Gateway can accumulate charges silently.

---

## 4. Reference Topology

```
                     Internet
                        |
                     [ ALB ]
                  /api/*    /*
                    |        |
              [ backend ]  [ frontend ]
                    |
          +---------+---------+---------+
          |         |         |         |
       [ RDS ]  [ Redis ]  [ S3 ]  [ Secrets ]
       Postgres  Cache    Audit   Manager
                          Bucket
```

All compute services run in private subnets. Only the Application Load Balancer is reachable from the internet. Traffic from the ALB to the backend and frontend containers is unencrypted within the VPC, which is standard for ECS Fargate deployments. The database and cache security groups accept traffic only from the ECS security group.

---

## 5. Module Layout

The configuration is organized into modules under `infra/terraform/modules/`. Each module is self-contained and exposes inputs and outputs.

| Module | Purpose |
|---|---|
| `vpc` | VPC, public and private subnets across two availability zones, NAT gateways, route tables |
| `ecr` | Container registries for backend and frontend images with immutable tags and lifecycle policies |
| `logs` | CloudWatch log groups with configurable retention |
| `s3_audit` | Audit bucket with Object Lock in governance mode, KMS encryption, versioning, and lifecycle transitions |
| `secrets` | Secrets Manager entries for the database credentials, JWT signing key, and Vault token |
| `iam` | ECS task execution role, backend and frontend task roles, and the JIT target roles |
| `rds` | Postgres database with encryption at rest and automated backups |
| `elasticache` | Redis replication group with encryption at rest |
| `alb` | Application Load Balancer with HTTPS listener and path-based routing |
| `ecs` | ECS cluster, task definitions for backend and frontend, and Fargate services |

The environment compositions under `infra/terraform/envs/dev/` and `infra/terraform/envs/prod/` call these modules with environment-specific parameters. Only these two directories need to be modified when provisioning a new environment.

---

## 6. Remote State Management

Terraform state is stored in S3 with DynamoDB-based locking. The backend configuration is defined in the `terraform` block at the top of each environment's `main.tf`. The state bucket and DynamoDB table must exist before running `terraform init` without the `-backend=false` flag.

If you are only validating locally, use `terraform init -backend=false`. This skips the backend configuration entirely and does not require the state bucket to exist. It also does not require AWS credentials.

### Bootstrapping the Remote State Backend

Run these commands once per AWS account. They create the S3 bucket and DynamoDB table that hold the state.

```
aws s3 mb s3://jit-iam-portal-terraform-state --region us-east-1

aws s3api put-bucket-versioning \
  --bucket jit-iam-portal-terraform-state \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name jit-iam-portal-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

The `jit-iam-portal-terraform-state` bucket name must be globally unique. If it is already taken, choose a different name and update the `backend "s3"` block in both `envs/dev/main.tf` and `envs/prod/main.tf`.

---

## 7. Deploying

### Step 1: Bootstrap the remote state backend

Follow section 6 above. This is a one-time step.

### Step 2: Create the variables file

From the repo root:

```
cd infra/terraform/envs/dev
cp terraform.tfvars.example terraform.tfvars
```

### Step 3: Set the sensitive variables

Open `terraform.tfvars` and set real values for:

- `database_username`
- `database_password`
- `jwt_secret`
- `vault_token`
- `certificate_arn`

The `certificate_arn` must reference an existing ACM certificate in the same region. The certificate must cover the domain you will point at the ALB.

### Step 4: Initialize and plan

```
terraform init
terraform plan -out=tfplan
```

Read the plan output carefully. It lists every resource that will be created. If anything looks unexpected, stop and investigate before applying.

### Step 5: Apply

```
terraform apply tfplan
```

The apply takes several minutes. RDS and ElastiCache provisioning are the slowest steps.

### Step 6: Build and push container images

After apply succeeds, the ECR repository URLs are printed as outputs. Run:

```
terraform output ecr_backend_url
terraform output ecr_frontend_url
```

Build the backend and frontend images locally using the Dockerfiles from Sections 2 and 3, tag them with the ECR URLs, and push:

```
docker build -t <ecr_backend_url>:latest ./backend
docker push <ecr_backend_url>:latest

docker build -t <ecr_frontend_url>:latest ./frontend
docker push <ecr_frontend_url>:latest
```

### Step 7: Force a new ECS deployment

ECS services do not automatically pull new images. Trigger a rolling deployment:

```
aws ecs update-service \
  --cluster jit-iam-portal-dev-cluster \
  --service jit-iam-portal-dev-backend \
  --force-new-deployment

aws ecs update-service \
  --cluster jit-iam-portal-dev-cluster \
  --service jit-iam-portal-dev-frontend \
  --force-new-deployment
```

### Step 8: Verify the deployment

```
terraform output alb_dns_name
```

Open the ALB DNS name in a browser. Since the DNS name is not covered by the ACM certificate, you will get a certificate warning. To avoid this, create a CNAME or A record in Route 53 pointing your domain at the ALB and use the domain name instead.

The guided tour should load on the dashboard. If it does not, check the ECS service events:

```
aws ecs describe-services \
  --cluster jit-iam-portal-dev-cluster \
  --services jit-iam-portal-dev-backend jit-iam-portal-dev-frontend
```

Look for `taskDefinition` errors or `healthCheck` failures.

---

## 8. Local Validation

To validate the configuration without an AWS account:

```
cd infra/terraform/envs/dev
terraform init -backend=false
terraform validate
terraform fmt -recursive -check
```

Then repeat for `envs/prod`:

```
cd ../prod
terraform init -backend=false
terraform validate
terraform fmt -recursive -check
```

These commands do not contact AWS. They download the AWS provider from HashiCorp's public registry, parse the configuration, and verify internal consistency. No AWS account, no credentials, and no cost.

Expected output:

- `terraform init -backend=false` prints `Terraform has been successfully initialized!`
- `terraform validate` prints `Success! The configuration is valid.`
- `terraform fmt -recursive -check` prints nothing on success. If it lists files, run `terraform fmt -recursive` to fix them.

---

## 9. Tearing Down

To destroy all resources:

```
cd infra/terraform/envs/dev
terraform destroy
```

The S3 audit bucket has Object Lock enabled in governance mode with a 365-day retention policy. The bucket cannot be deleted until the retention has expired or an administrative override is applied. Since the retention period is long, you have two options:

1. Leave the audit bucket in place and delete only the other resources. Use `terraform destroy -target` to destroy specific modules.
2. Remove the Object Lock configuration manually, delete the bucket's contents, and then run `terraform destroy` for the bucket resource.

Governance mode allows an account with sufficient IAM permissions to bypass the retention. Compliance mode does not.

---

## 10. Security Notes

The configuration reflects a production-ready security posture.

- The RDS instance is not publicly accessible. It accepts connections only from the ECS security group.
- The Redis replication group is not publicly accessible. It accepts connections only from the ECS security group.
- The S3 audit bucket has public access blocked at four levels: public ACLs, public policy, ignored public ACLs, and restricted public buckets.
- The audit bucket uses KMS encryption with automatic key rotation.
- The task execution role has permission to read only the three specific secrets it needs.
- The backend task role has permission to write to the audit bucket and to assume roles matching the `JIT-*` pattern.
- The JIT target roles have a maximum session duration of one hour. Any credential issued by the portal expires within that window.
- The JIT target roles require an external ID when assumed. This prevents the confused deputy problem.

---

## 11. What This Configuration Does Not Do

- It does not provision a real HashiCorp Vault cluster. The demo runs with the mock Vault engine. A production deployment would add a Vault cluster or use HashiCorp Cloud Platform Vault.
- It does not configure DNS. Point your domain at the ALB manually or use Route 53.
- It does not set up CI/CD for building and pushing images. The `.github/workflows/` directory provides a starting point.
- It does not configure WAF, Shield, or edge security services. These are optional hardening steps.
- It does not enable VPC flow logs or CloudTrail. These are useful for production but add cost.
- It does not configure backup vaults or cross-region replication for the audit bucket. These are enhancements a compliance-heavy deployment would include.

---

## 12. Troubleshooting

**`terraform init` fails with "Error: Failed to get existing workspaces: S3 bucket does not exist"**

The state bucket has not been created. Follow the bootstrapping steps in section 6, or use `terraform init -backend=false` for local validation.

**The ECS service never reaches a stable state**

The task is likely failing its health check. Open the ECS console, click into the service, then into the failing task, and look at the stopped reason. Common causes:

- The container cannot pull the image from ECR. Confirm the task execution role has the `AmazonECSTaskExecutionRolePolicy` attached.
- The container cannot reach the database. Confirm the ECS security group is allowed in the RDS security group.
- The container starts but the health check fails. Increase the `start_period` in the health check definition or check the container logs.

**The ALB returns a 503**

The target group has no healthy targets. Check the ECS service status and the target group health in the AWS console.

**The guided tour does not auto-start**

The `localStorage` flag `jit-iam-portal-tour-seen` may be set from a previous visit. Clear site data in the browser or open the site in an incognito window.

---

## 13. Summary

The deployment guide covers the full lifecycle of an AWS deployment: prerequisites, cost, remote state, apply, image push, verification, teardown, and troubleshooting. It also documents the security posture of the configuration and the parts of a production deployment that this reference does not include.

The configuration validates locally without an AWS account. Applying it is optional and requires a clear plan to tear down afterward.

End of deployment guide.


## Verification

The CI and Security workflows run on every pull request. This section exists to confirm the pipelines are healthy.