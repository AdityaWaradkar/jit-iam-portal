resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.name_prefix}-cache-subnets"
  subnet_ids = var.private_subnet_ids

  tags = {
    Environment = var.environment
  }
}

resource "aws_security_group" "cache" {
  name        = "${var.name_prefix}-cache-sg"
  description = "Allow Redis from ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [var.ecs_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.name_prefix}-cache"
  description                = "Redis for JIT IAM Portal"
  node_type                  = var.node_type
  num_cache_clusters         = var.num_nodes
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.cache.id]
  automatic_failover_enabled = var.num_nodes > 1
  at_rest_encryption_enabled = true
  transit_encryption_enabled = false

  tags = {
    Environment = var.environment
  }
}