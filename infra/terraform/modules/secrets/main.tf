resource "aws_secretsmanager_secret" "database" {
  name                    = "${var.name_prefix}-database"
  recovery_window_in_days = 7

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username = var.database_username
    password = var.database_password
    host     = var.database_host
    port     = var.database_port
    dbname   = var.database_name
  })
}

resource "aws_secretsmanager_secret" "jwt" {
  name                    = "${var.name_prefix}-jwt"
  recovery_window_in_days = 7

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id = aws_secretsmanager_secret.jwt.id
  secret_string = jsonencode({
    secret = var.jwt_secret
  })
}

resource "aws_secretsmanager_secret" "vault" {
  name                    = "${var.name_prefix}-vault"
  recovery_window_in_days = 7

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "vault" {
  secret_id = aws_secretsmanager_secret.vault.id
  secret_string = jsonencode({
    token = var.vault_token
    addr  = var.vault_addr
  })
}