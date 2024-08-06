provider "digitalocean" {
  token = var.do_token
}

provider "kubernetes" {
  host  = digitalocean_kubernetes_cluster.primary.endpoint
  token = digitalocean_kubernetes_cluster.primary.kube_config[0].token
  cluster_ca_certificate = base64decode(
    digitalocean_kubernetes_cluster.primary.kube_config[0].cluster_ca_certificate
  )
}

provider "gitlab" {
  token = var.gitlab_token
}

# provider "flux" {
#   kubernetes = {
#     host  = digitalocean_kubernetes_cluster.primary.endpoint
#     token = digitalocean_kubernetes_cluster.primary.kube_config[0].token
#     cluster_ca_certificate = base64decode(
#       digitalocean_kubernetes_cluster.primary.kube_config[0].cluster_ca_certificate
#     )
#   }
#   git = {
#     url    = "ssh://git@gitlab.com/${data.gitlab_project.primary.path_with_namespace}.git"
#     branch = "master"
#     ssh = {
#       username    = "git"
#       private_key = tls_private_key.flux.private_key_pem
#     }
#   }
# }

