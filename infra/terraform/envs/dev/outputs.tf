output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "ecr_backend_url" {
  value = module.ecr.backend_repository_url
}

output "ecr_frontend_url" {
  value = module.ecr.frontend_repository_url
}

output "audit_bucket_name" {
  value = module.s3_audit.bucket_name
}

output "rds_address" {
  value = module.rds.address
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}