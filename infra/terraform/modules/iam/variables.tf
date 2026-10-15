variable "name_prefix" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "audit_bucket_arn" {
  type = string
}

variable "database_secret_arn" {
  type = string
}

variable "jwt_secret_arn" {
  type = string
}

variable "vault_secret_arn" {
  type = string
}