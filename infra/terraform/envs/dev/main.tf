terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }

  backend "s3" {
    bucket         = "jit-iam-portal-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "jit-iam-portal-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "jit-iam-portal"
      Environment = "dev"
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  name_prefix = "jit-iam-portal-dev"
}

module "vpc" {
  source      = "../../modules/vpc"
  name_prefix = local.name_prefix
  environment = "dev"
}

module "ecr" {
  source      = "../../modules/ecr"
  name_prefix = local.name_prefix
  environment = "dev"
}

module "logs" {
  source         = "../../modules/logs"
  name_prefix    = local.name_prefix
  environment    = "dev"
  retention_days = 30
}

module "s3_audit" {
  source      = "../../modules/s3_audit"
  name_prefix = local.name_prefix
  environment = "dev"
  account_id  = data.aws_caller_identity.current.account_id
}

module "secrets" {
  source            = "../../modules/secrets"
  name_prefix       = local.name_prefix
  environment       = "dev"
  database_username = var.database_username
  database_password = var.database_password
  database_host     = module.rds.address
  database_port     = module.rds.port
  database_name     = module.rds.database_name
  jwt_secret        = var.jwt_secret
  vault_token       = var.vault_token
  vault_addr        = var.vault_addr
}

module "rds" {
  source                = "../../modules/rds"
  name_prefix           = local.name_prefix
  environment           = "dev"
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  ecs_security_group_id = module.iam.ecs_security_group_id
  database_username     = var.database_username
  database_password     = var.database_password
  instance_class        = "db.t4g.micro"
  multi_az              = false
  deletion_protection   = false
}

module "iam" {
  source              = "../../modules/iam"
  name_prefix         = local.name_prefix
  environment         = "dev"
  vpc_id              = module.vpc.vpc_id
  audit_bucket_arn    = module.s3_audit.bucket_arn
  database_secret_arn = module.secrets.database_secret_arn
  jwt_secret_arn      = module.secrets.jwt_secret_arn
  vault_secret_arn    = module.secrets.vault_secret_arn
}

module "elasticache" {
  source                = "../../modules/elasticache"
  name_prefix           = local.name_prefix
  environment           = "dev"
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  ecs_security_group_id = module.iam.ecs_security_group_id
  node_type             = "cache.t4g.micro"
  num_nodes             = 1
}

module "alb" {
  source            = "../../modules/alb"
  name_prefix       = local.name_prefix
  environment       = "dev"
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = var.certificate_arn
}

module "ecs" {
  source                    = "../../modules/ecs"
  name_prefix               = local.name_prefix
  environment               = "dev"
  private_subnet_ids        = module.vpc.private_subnet_ids
  ecs_security_group_id     = module.iam.ecs_security_group_id
  backend_image             = "${module.ecr.backend_repository_url}:latest"
  frontend_image            = "${module.ecr.frontend_repository_url}:latest"
  backend_task_role_arn     = module.iam.backend_task_role_arn
  frontend_task_role_arn    = module.iam.frontend_task_role_arn
  execution_role_arn        = module.iam.execution_role_arn
  backend_target_group_arn  = module.alb.backend_target_group_arn
  frontend_target_group_arn = module.alb.frontend_target_group_arn
  database_secret_arn       = module.secrets.database_secret_arn
  jwt_secret_arn            = module.secrets.jwt_secret_arn
  vault_secret_arn          = module.secrets.vault_secret_arn
  backend_log_group_name    = module.logs.backend_log_group_name
  frontend_log_group_name   = module.logs.frontend_log_group_name
  desired_count             = 1
}