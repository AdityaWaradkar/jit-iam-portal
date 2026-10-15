variable "name_prefix" {
  type = string
}

variable "environment" {
  type = string
}

variable "retention_days" {
  type    = number
  default = 30
}