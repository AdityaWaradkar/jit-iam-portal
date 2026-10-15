variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "database_username" {
  type      = string
  sensitive = true
}

variable "database_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "vault_token" {
  type      = string
  sensitive = true
}

variable "vault_addr" {
  type    = string
  default = ""
}

variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN for the ALB HTTPS listener"
}