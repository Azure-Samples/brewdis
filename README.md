---
page_type: sample
languages:
- java
products:
- Azure Spring Cloud
description: "Deploy Spring Boot app using Azure Spring Cloud and Redis Enterprise"
urlFragment: "brewdis"

---
# Deploy Spring Boot app using Azure Spring Cloud and Redis Enterprise 

Azure Spring Cloud enables you to easily run a Spring Boot based microservices application on Azure.

This quickstart shows you how to deploy an existing Java Spring Cloud application to Azure. When you're finished, you can continue to manage the application via the Azure CLI or switch to using the Azure portal.

## What will you experience
You will:
- Build an existing application locally
- Provision an Azure Spring Cloud service instance
- Deploy the application to Azure
- Open the application

## What you will need

In order to deploy a Java app to cloud, you need 
an Azure subscription. If you do not already have an Azure 
subscription, you can activate your 
[MSDN subscriber benefits](https://azure.microsoft.com/pricing/member-offers/msdn-benefits-details/) 
or sign up for a 
[free Azure account]((https://azure.microsoft.com/free/)).

In addition, you will need the following:

| [Azure CLI version 2.0.67 or higher](https://docs.microsoft.com/cli/azure/install-azure-cli?view=azure-cli-latest) 
| [Java 11](https://www.azul.com/downloads/azure-only/zulu/?version=java-11-lts&architecture=x86-64-bit&package=jdk) 
| [Gradle](https://gradle.org/install/) 
| [Git](https://git-scm.com/)
|

Create an instance of Azure Cache for Redis Enterprise:
| [Step-by-step directions](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/quickstart-create-redis-enterprise)
| [Start here https://aka.ms/redis-enterprise which includes preview feature flag](https://aka.ms/redis-enterprise)
|

## Install the Azure CLI extension

Install the Azure Spring Cloud extension for the Azure CLI using the following command

```bash
    az extension add --name spring-cloud
```

## Clone and build the repo

### Create a new folder and clone the sample app repository to your Azure Cloud account  

```bash
    mkdir source-code
    git clone https://github.com/selvasingh/brewdis
```

### Change directory and build the project

```bash
    cd brewdis
    ./gradlew build
```
This will take a few minutes.

## Provision Azure Spring Cloud service instance using Azure CLI

### Prepare your environment for deployments

Create a bash script with environment variables by making a copy of the supplied template:
```bash
    cp .scripts/setup-env-variables-azure-template.sh .scripts/setup-env-variables-azure.sh
```

Open `.scripts/setup-env-variables-azure.sh` and enter the following information:

```bash
    export SUBSCRIPTION=subscription-id # customize this
    export RESOURCE_GROUP=resource-group-name # customize this
    ...
    export SPRING_CLOUD_SERVICE=azure-spring-cloud-name # customize this
    ...
    export SPRING_REDIS_HOST=redis-server-host # customize this
    export SPRING_REDIS_PASSWORD=redis-password # customize this
```

Then, set the environment:
```bash
    source .scripts/setup-env-variables-azure.sh
```

### Login to the Azure CLI 
Login to the Azure CLI and choose your active subscription. Be sure to choose the active subscription that is whitelisted for Azure Spring Cloud

```bash
    az login
    az account list -o table
    az account set --subscription ${SUBSCRIPTION}
```

### Create Azure Spring Cloud service instance
Prepare a name for your Azure Spring Cloud service.  The name must be between 4 and 32 characters long and can contain only lowercase letters, numbers, and hyphens.  The first character of the service name must be a letter and the last character must be either a letter or a number.

Create a resource group to contain your Azure Spring Cloud service.

```bash
    az group create --name ${RESOURCE_GROUP} \
        --location ${REGION}
```

Create an instance of Azure Spring Cloud.

```bash
    az spring-cloud create --name ${SPRING_CLOUD_SERVICE} \
        --resource-group ${RESOURCE_GROUP} \
        --location ${REGION}
```

The service instance will take around five minutes to deploy.

Set your default resource group name and cluster name using the following commands:

```bash
    az configure --defaults \
        group=${RESOURCE_GROUP} \
        location=${REGION} \
        spring-cloud=${SPRING_CLOUD_SERVICE}
```

## Create a microservice application

Create Spring Cloud microservice `retail` app.

```bash
    az spring-cloud app create --name ${APP_NAME} --instance-count 1 --is-public true \
        --memory 2 \
        --runtime-version Java_11 \
        --jvm-options='-Xms2048m -Xmx2048m'
```

## Deploy application and set environment variables

Deploy the application to Azure.

```bash
    az spring-cloud app deploy --name ${APP_NAME} \
        --jar-path ${BREWDIS_JAR} \
        --env SPRING_REDIS_HOST=${SPRING_REDIS_HOST} \
              SPRING_REDIS_PASSWORD=${SPRING_REDIS_PASSWORD} \
              SPRING_REDIS_PORT=${SPRING_REDIS_PORT} \
              STOMP_HOST=${STOMP_HOST} \
              STOMP_PORT=${STOMP_PORT}
```

```bash
    az spring-cloud app show --name ${APP_NAME} | grep url
```

Navigate to the URL provided by the previous command to open the brewdis application.
    
![](./media/Brewdis-inventory.jpg)
![](./media/Brewdis-catalog.jpg)

## Market Targeting

When viewing the application you will find that if you are a user of the Edge browser, then you will see the availability count shown on the catalog page. We are testing out this new feature, and to start with we are just targeting users of the Edge browser.

```java
boolean showAvailabilityCount = featureManager.isEnabledAsync("beta").block();
```

This is done by using a Feature Flag and a Feature Filter to check which browser is being used. This is a custom Feature Filter that was designed to target 1 of 3 browsers, Edge, Firefox, and Chrome, depending on the configuration.

```java
public class BrowserFilter implements FeatureFilter {

    @Autowired
    private HttpServletRequest request;

    @Override
    public boolean evaluate(FeatureFilterEvaluationContext context) {
        String userAgent = request.getHeader(USERAGENT);
        String browser = (String) context.getParameters().get(BROWSER);
        if (userAgent.contains(EDGE_USERAGENT) && browser.equals(EDGE_BROWSER)) {
            return true;
        } else if (userAgent.contains(FIREFOX_USERAGENT) && browser.equals(FIREFOX_BROWSER)) {
            return true;
        } else if (userAgent.contains(CHROME_USERAGENT) && !userAgent.contains(EDGE_USERAGENT)
                && browser.equals(CHROME_BROWSER)) {
            return true;
        }
        return false;
    }
}
```
![](./media/brewdis-feature-flag-edge.jpg)

Additional information on how to use Feature Flags can be found [here](https://docs.microsoft.com/azure/azure-app-configuration/use-feature-flags-spring-boot).

### Feature Flags with Azure App Configuration

In addition to managing Feature Flags from a config file, they also can be stored and updated from Azure App Configuration.

1. Create a new Azure App Configuration store

```azurecli
az appconfig create -l ${REGION} -g ${RESOURCE_GROUP} --sku standard -n ${APP_NAME}-config
```

1. Create config store endpoint environment variable from the value given in the previous step

```azurecli
export CONFIG_STORE_ENDPOINT={YOUR_ENDPOINT_VALUE}
```

1. In the Azure Portal go to your Azure Spring Cloud instance, select Apps, your app, under Settings select Identity, then switch the Status toggle to On.

1. In the Azure Portal go to your new App Configuration instance, select Access control (IAM), + Add, Add role assignment.

    1. Select App Configuration Data Reader as the role

    1. In select enter {Azure Spring Cloud resource name}/apps/{App Name}, example brewdis/apps/retail. Note: If no value is found close the side bar, wait a moment and reselect + Add, then Add role assignment.

    1. Select Save.

1. Upload the first Feature Flag from the CLI

```azurecli
az appconfig kv import -n ${APP_NAME}-config -s file --path data/featureflag.yml --format yaml
```

Your Feature Flag has now been added to Azure App Configuration. You can view it in the portal by going to your App Configuration instance, and selecting Feature manager. Here you will see a key beta, which is your feature flag and it currently has a state of conditional. If you right click on the row and select edit you will see the feature flag information.

Here there is a list of feature filters, currently only browserFilter. Selecting the ... and selecting Edit parameters you will see the conditions used to trigger the feature flag. This is currently set to browser and edge. For this filter the valid values are; edge, chrome, and firefox.

To modify the condition update the value column and select Apply in the Edit parameters pane, then Apply again in the edit pane.

If your application is currently running, refreshing the page twice will allow the new feature flag to take effect. The first refresh is activity on the application to allow for a refresh to be triggered, the second one will update the page with the new feature flag. If no change happens this can be caused by the system cache of the feature flag value, by default this value is 30 seconds. Waiting 30 seconds and again twice refreshing the page will allow the value to be updated.

## Open logstream

You can open the log stream from your development machine.

```bash
    az spring-cloud app logs -f -n ${APP_NAME}
```
![](./media/az-spring-cloud-logs.jpg)

## Automate Deployments using GitHub Actions

### Prepare secrets in your Key Vault
If you do not have a Key Vault yet, run the following commands to provision a Key Vault:
```bash
    export KEY_VAULT=your-keyvault-name # customize this
    az keyvault create --name ${KEY_VAULT} -g ${RESOURCE_GROUP}
```

Create a service principal with enough scope/role to manage your Azure Spring Cloud resource group:
```bash
    az ad sp create-for-rbac --role contributor --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCEGROUP_ID> --sdk-auth
```
With results:
```json
    {
        "clientId": "<GUID>",
        "clientSecret": "<GUID>",
        "subscriptionId": "<GUID>",
        "tenantId": "<GUID>",
        "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
        "resourceManagerEndpointUrl": "https://management.azure.com/",
        "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
        "galleryEndpointUrl": "https://gallery.azure.com/",
        "managementEndpointUrl": "https://management.core.windows.net/"
    }
```
Add this service principle as a secret named `AZURE-CREDENTIALS-BREWREDIS-PROD` to your Key Vault, along with `SPRING-REDIS-HOST` and `SPRING-REDIS-PASSWORD`.

### Grant Access to Key Vault with Service Principal
To generate a key to access the Key Vault, execute command below:
```bash
    az ad sp create-for-rbac --role contributor --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.KeyVault/vaults/<KEY_VAULT> --sdk-auth
```
Then, follow [the steps here](https://docs.microsoft.com/azure/spring-cloud/spring-cloud-github-actions-key-vault#add-access-policies-for-the-credential) to add access policy for the Service Principal.

In the end, add this service principal as secrets named "AZURE_KEY_VAULT" in your forked GitHub repo following [the steps here](https://docs.microsoft.com/en-us/azure/spring-cloud/spring-cloud-github-actions-key-vault#add-access-policies-for-the-credential).

### Customize your workflow
Finally, edit the workfolw file `.github/workflows/app.yml` in your forked repo to fill in the names of resource group and the Azure Spring Cloud instance name that you just created:
```yml
    env:
      RESOURCE_GROUP: brewdis-prod # customize this
      SPRING_CLOUD_SERVICE: brewdis-spring-cloud # customize this
      SPRING_CLOUD_APP: brewdis-storefront # customize this
```
After you commited this change, you will see GitHub Actions triggered to build and deploy the `brewdis-api` app to your Azure Spring Cloud instance.

## Next Steps

In this quickstart, you've deployed an existing Spring Boot application using Azure CLI. To learn more about Azure Spring Cloud, go to:

- [Azure Spring Cloud](https://azure.microsoft.com/en-us/services/spring-cloud/)
- [Azure Spring Cloud docs](https://docs.microsoft.com/en-us/azure/java/)
- [Deploy Spring microservices from scratch](https://github.com/microsoft/azure-spring-cloud-training)
- [Deploy existing Spring microservices](https://github.com/Azure-Samples/azure-spring-cloud)
- [Azure for Java Cloud Developers](https://docs.microsoft.com/en-us/azure/java/)
- [Spring Cloud Azure](https://cloud.spring.io/spring-cloud-azure/)
- [Spring Cloud](https://spring.io/projects/spring-cloud)
