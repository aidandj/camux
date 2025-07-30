package main

import (
	"fmt"
	"time"

	"github.com/pulumi/pulumi-gcp/sdk/v7/go/gcp/organizations"
	"github.com/pulumi/pulumi-gcp/sdk/v7/go/gcp/projects"
	"github.com/pulumi/pulumi-gcp/sdk/v7/go/gcp/serviceaccount"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get configuration
		cfg := config.New(ctx, "")
		projectName := cfg.Get("projectName")
		if projectName == "" {
			projectName = "camux"
		}

		billingAccount := cfg.Require("billingAccount")
		if billingAccount == "" {
			return fmt.Errorf("billingAccount is required - set with: pulumi config set billingAccount <YOUR_BILLING_ACCOUNT_ID>")
		}

		// Get organization ID (optional)
		orgID := cfg.Get("organizationId")

		// Create the project with timestamp-based unique ID
		timestamp := time.Now().Unix()
		projectID := fmt.Sprintf("%s-%d", projectName, timestamp)

		projectArgs := &organizations.ProjectArgs{
			Name:           pulumi.String(projectName),
			ProjectId:      pulumi.String(projectID),
			BillingAccount: pulumi.String(billingAccount),
		}

		if orgID != "" {
			projectArgs.OrgId = pulumi.String(orgID)
		}

		project, err := organizations.NewProject(ctx, projectName, projectArgs)
		if err != nil {
			return err
		}

		// Enable required APIs
		apis := []string{
			"smartdevicemanagement.googleapis.com",
			"cloudresourcemanager.googleapis.com",
			"iam.googleapis.com",
			"iap.googleapis.com",
			"iamcredentials.googleapis.com",
		}

		for _, api := range apis {
			_, err := projects.NewService(ctx, fmt.Sprintf("%s-api", api), &projects.ServiceArgs{
				Project: project.ProjectId,
				Service: pulumi.String(api),
			})
			if err != nil {
				return err
			}
		}

		// Create service account for the application
		serviceAccount, err := serviceaccount.NewAccount(ctx, "camera-viewer-sa", &serviceaccount.AccountArgs{
			AccountId:   pulumi.String("camera-viewer-sa"),
			DisplayName: pulumi.String("Camera Viewer Service Account"),
			Project:     project.ProjectId,
		})
		if err != nil {
			return err
		}

		// Create service account key
		serviceAccountKey, err := serviceaccount.NewKey(ctx, "camera-viewer-sa-key", &serviceaccount.KeyArgs{
			ServiceAccountId: serviceAccount.Name,
		})
		if err != nil {
			return err
		}

		// Note: OAuth2 client creation requires manual steps or using Google's Admin SDK
		// as it involves consent screen configuration which isn't fully supported in IaC

		// Export important values
		ctx.Export("projectId", project.ProjectId)
		ctx.Export("projectNumber", project.Number)
		ctx.Export("serviceAccountEmail", serviceAccount.Email)
		ctx.Export("serviceAccountKey", serviceAccountKey.PrivateKey)

		// Instructions for manual steps
		ctx.Export("nextSteps", pulumi.String(`
Manual steps required:

1. Configure OAuth consent screen:
   - Go to https://console.cloud.google.com/apis/credentials/consent
   - Select your project
   - Configure consent screen (external or internal based on your needs)
   - Add scopes: https://www.googleapis.com/auth/sdm.service

2. Create OAuth2 credentials:
   - Go to https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: Web application
   - Add authorized redirect URI: http://localhost:5000/api/auth/callback
   - Save the Client ID and Client Secret

3. Create Device Access Project:
   - Go to https://console.nest.google.com/device-access
   - Create a new project ($5 one-time fee)
   - Link it to your Google Cloud project
   - Note the Project ID

4. Update your .env file with the credentials
`))

		return nil
	})
}
