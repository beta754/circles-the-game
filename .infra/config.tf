terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }

    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

# the s3 provider uses AWS specific environment variables
# export AWS_ACCESS_KEY_ID="<your_access_key>"
# export AWS_SECRET_ACCESS_KEY="<your_secret_key>"
