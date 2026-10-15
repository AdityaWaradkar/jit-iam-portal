output "ecs_security_group_id" {
  value = aws_security_group.ecs.id
}

output "execution_role_arn" {
  value = aws_iam_role.execution.arn
}

output "backend_task_role_arn" {
  value = aws_iam_role.backend_task.arn
}

output "frontend_task_role_arn" {
  value = aws_iam_role.frontend_task.arn
}