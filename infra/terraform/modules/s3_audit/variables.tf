variable "name_prefix" {
  type = string
}

variable "environment" {
  type = string
}

variable "account_id" {
  type = string
}

variable "object_lock_retention_days" {
  type    = number
  default = 365
}