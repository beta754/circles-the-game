# Infrastructure
resource "digitalocean_container_registry" "registry" {
  name                   = "circles-the-game"
  subscription_tier_slug = "starter"
}

data "digitalocean_project" "ctg" {
  name = "circles-the-game"
}

resource "digitalocean_project_resources" "init" {
  project = data.digitalocean_project.ctg.id
  resources = [
    digitalocean_kubernetes_cluster.primary.urn
  ]
}

data "digitalocean_vpc" "primary_net" {
  name = "immortal"
}

resource "digitalocean_kubernetes_cluster" "primary" {
  name   = "primary"
  region = var.do_region
  # Grab the latest version slug from `doctl kubernetes options versions`
  version  = "1.30.2-do.0"
  vpc_uuid = data.digitalocean_vpc.primary_net.id

  # this is for testing purposes only. should not use this in prod.
  destroy_all_associated_resources = true
  registry_integration = true

  node_pool {
    name       = "primary"
    # can grab the slugs from `doctl kubernetes options sizes`
    size       = "s-1vcpu-2gb"
    node_count = 1
  }
}

resource "digitalocean_kubernetes_node_pool" "elasticity" {
  cluster_id = digitalocean_kubernetes_cluster.primary.id

  name       = "elasticity"
  # can grab the slugs from `doctl kubernetes options sizes`
  size       = "s-1vcpu-2gb"
  tags       = []

  auto_scale = true
  min_nodes = 1
  max_nodes = 2
}


# Github
data "github_repository" "repo" {
  full_name = "beta754/circles-the-game"
}

resource "github_actions_environment_secret" "kube_config" {
  repository      = data.github_repository.repo.name
  environment     = "primary"

  secret_name     = "KUBE_CONFIG"
  plaintext_value = base64encode(digitalocean_kubernetes_cluster.primary.kube_config[0].raw_config)
}
