output "bucket_name" {
  value = aws_s3_bucket.audit.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.audit.arn
}

output "kms_key_arn" {
  value = aws_kms_key.audit.arn
}