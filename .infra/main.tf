# Git-Ops
# resource "tls_private_key" "flux" {
#   algorithm   = "ECDSA"
#   ecdsa_curve = "P256"
# }

# data "gitlab_project" "primary" {
#   path_with_namespace = "Augury-finance/flux-poc"
# }

# resource "gitlab_deploy_key" "primary" {
#   project  = data.gitlab_project.primary.id
#   title    = "Flux"
#   key      = tls_private_key.flux.public_key_openssh
#   can_push = true
# }

# Infrastructure
resource "digitalocean_container_registry" "registry" {
  name                   = "circles-the-game"
  subscription_tier_slug = "starter"
}

data "digitalocean_project" "ctg" {
  name = "circles-the-game"
}

# resource "digitalocean_project" "ctg" {
#   name        = "playground"
#   description = "A project to represent development resources."
#   purpose     = "Web Application"
#   environment = "Development"
# }

resource "digitalocean_project_resources" "init" {
  project = data.digitalocean_project.ctg.id
  resources = [
    digitalocean_kubernetes_cluster.primary.urn
  ]
}

resource "digitalocean_vpc" "primary_net" {
  name     = "app-net"
  region   = var.do_region
  ip_range = "172.16.0.0/16"
}

resource "digitalocean_kubernetes_cluster" "primary" {
  name   = "primary"
  region = var.do_region
  # Grab the latest version slug from `doctl kubernetes options versions`
  version  = "1.30.2-do.0"
  vpc_uuid = digitalocean_vpc.primary_net.id

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

# Kubernetes/Flux Bootstrap
# resource "kubernetes_namespace" "flux_system" {
#   metadata {
#     name = "flux-system"
#   }
# }
# resource "kubernetes_secret" "sops_keys" {
#   depends_on = [
#     kubernetes_namespace.flux_system
#   ]

#   type = "Opaque"

#   metadata {
#     name = "sops-keys"
#     namespace = "flux-system"
#   }

#   data = {
#     # must be named sops.asc
#     "sops.asc" = "${file("${path.module}/.secret/sops.private.key")}"
#   }
# }

# resource "flux_bootstrap_git" "primary" {
#   depends_on = [
#     gitlab_deploy_key.primary,
#     digitalocean_kubernetes_cluster.primary,
#     kubernetes_secret.sops_keys
#   ]

#   path = "clusters/beta"
#   components_extra = [
#     "image-reflector-controller",
#     "image-automation-controller"
#   ]
# }
