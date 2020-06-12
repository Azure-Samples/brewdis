data "azurerm_resource_group" "demo01" {
    name                      = var.rgName
}
 
resource "azurerm_redis_cache" "demo01" {
  count               = length(var.redisRegions)
  name                = "brewredis-${var.redisRegions[count.index]}"
  location            = var.redisRegions[count.index]
  resource_group_name = data.azurerm_resource_group.demo01.name
  capacity            = 2
  family              = "C"
  sku_name            = "Standard"
}

resource "azurerm_spring_cloud_service" "demo01" {
  name                = var.svcName
  resource_group_name = data.azurerm_resource_group.demo01.name
  location            = "westeurope"

  config_server_git_setting {
    uri          = "https://github.com/selvasingh/spring-petclinic-microservices-config"
    label        = "master"
    search_paths= ["."]
  }
}

resource "azurerm_spring_cloud_app" "brew" {
  name                = var.appName
  resource_group_name = data.azurerm_resource_group.demo01.name
  service_name        = azurerm_spring_cloud_service.demo01.name
}
