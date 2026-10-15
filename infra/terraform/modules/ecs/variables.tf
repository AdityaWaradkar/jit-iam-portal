variable "name_prefix" { type = string }
variable "environment" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "ecs_security_group_id" { type = string }

variable "backend_image" { type = string }
variable "frontend_image" { type = string }

variable "backend_task_role_arn" { type = string }
variable "frontend_task_role_arn" { type = string }
variable "execution_role_arn" { type = string }

variable "backend_target_group_arn" { type = string }
variable "frontend_target_group_arn" { type = string }

variable "database_secret_arn" { type = string }
variable "jwt_secret_arn" { type = string }
variable "vault_secret_arn" { type = string }

variable "backend_log_group_name" { type = string }
variable "frontend_log_group_name" { type = string }

variable "backend_cpu" {
  type    = number
  default = 512
}

variable "backend_memory" {
  type    = number
  default = 1024
}

variable "frontend_cpu" {
  type    = number
  default = 512
}

variable "frontend_memory" {
  type    = number
  default = 1024
}

variable "desired_count" {
  type    = number
  default = 1
}