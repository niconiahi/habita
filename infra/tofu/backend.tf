# State stored in Cloudflare R2
# Initialize with: tofu init -backend-config=backend.hcl

terraform {
  backend "s3" {
    bucket = "habita-backup"
    key    = "tofu/terraform.tfstate"
    region = "auto"

    # R2 doesn't support these — disable them
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_requesting_account_id  = true
    skip_region_validation      = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}
