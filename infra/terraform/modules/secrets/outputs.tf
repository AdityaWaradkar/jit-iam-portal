output "database_secret_arn" {
  value = aws_secretsmanager_secret.database.arn
}

output "jwt_secret_arn" {
  value = aws_secretsmanager_secret.jwt.arn
}

output "vault_secret_arn" {
  value = aws_secretsmanager_secret.vault.arn
}