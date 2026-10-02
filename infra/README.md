# Infrastructure — Terraform

AWS infrastructure as code. **Implemented in Section 23.**

Provisions:
- VPC (private/public subnets, multi-AZ)
- ECS Fargate cluster
- RDS PostgreSQL
- S3 audit bucket (KMS + Object Lock)
- IAM roles for JIT elevation targets
- ECR repositories
- IRSA (IAM Roles for Service Accounts)