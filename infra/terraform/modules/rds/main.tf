resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-db-subnets"
  subnet_ids = var.private_subnet_ids

  tags = {
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds-sg"
  description = "Allow Postgres from ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
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

resource "aws_db_instance" "postgres" {
  identifier              = "${var.name_prefix}-db"
  engine                  = "postgres"
  engine_version          = "16.4"
  instance_class          = var.instance_class
  allocated_storage       = var.allocated_storage_gb
  max_allocated_storage   = var.max_allocated_storage_gb
  storage_type            = "gp3"
  storage_encrypted       = true
  db_name                 = var.database_name
  username                = var.database_username
  password                = var.database_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  multi_az                = var.multi_az
  skip_final_snapshot     = var.skip_final_snapshot
  backup_retention_period = var.backup_retention_days
  deletion_protection     = var.deletion_protection

  tags = {
    Environment = var.environment
  }
}