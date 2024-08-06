terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }

    gitlab = {
      source  = "gitlabhq/gitlab"
      version = ">=15.10.0"
    }
  }
}

# the s3 provider uses AWS specific environment variables
# export AWS_ACCESS_KEY_ID="<your_access_key>"
# export AWS_SECRET_ACCESS_KEY="<your_secret_key>"
terraform {
  backend "s3" {
    # https://ctg-tfstate.nyc3.digitaloceanspaces.com
    endpoints = {
      s3 = "https://nyc3.digitaloceanspaces.com"
    }

    key                         = "terraform.tfstate"
    bucket                      = "ctg-tfstate"

    # Deactivate a few AWS-specific checks
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_s3_checksum            = true
    region                      = "us-east-1"
  }
}
