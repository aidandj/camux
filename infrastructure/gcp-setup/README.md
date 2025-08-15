# Google Cloud Infrastructure Setup

This directory contains Pulumi infrastructure code to set up the Google Cloud project for the Google Home Camera Viewer application.

## Prerequisites

1. [Install Pulumi](https://www.pulumi.com/docs/install/)
2. [Install Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
3. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```
4. Have a Google Cloud billing account ID ready

## Setup Instructions

1. Navigate to this directory:
   ```bash
   cd infrastructure/gcp-setup
   ```

2. Install Go dependencies:
   ```bash
   go mod download
   ```

3. Configure Pulumi to use local backend and initialize stack:
   ```bash
   pulumi login --local
   pulumi stack init dev
   ```

4. Configure required settings:
   ```bash
   # Required: Your billing account ID
   pulumi config set billingAccount YOUR_BILLING_ACCOUNT_ID

   # Optional: Organization ID (if using an organization)
   pulumi config set organizationId YOUR_ORG_ID

   # Optional: Custom project name (defaults to 'camux')
   pulumi config set projectName my-camera-viewer
   ```

5. Deploy the infrastructure:
   ```bash
   pulumi up
   ```

6. Note the outputs:
   - `projectId`: Your new Google Cloud project ID
   - `serviceAccountEmail`: Service account email for the application
   - `serviceAccountKey`: Base64-encoded service account key

## Local State Storage

This setup uses Pulumi's local backend, which stores state files in the `.pulumi/` directory. This means:
- No Pulumi cloud account required
- State is stored locally on your machine
- Make sure to add `.pulumi/` to your `.gitignore`
- For team collaboration, consider using a shared backend like S3 or GCS

## What This Creates

- A new Google Cloud project with billing enabled
- Enables required APIs:
  - Smart Device Management API
  - Cloud Resource Manager API
  - IAM API
  - Identity-Aware Proxy API
- Creates a service account for the application
- Generates service account credentials

## Manual Steps Required

After running the Pulumi deployment, you'll need to complete these manual steps:

1. **Configure OAuth Consent Screen**:
   - Visit the [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
   - Select your project
   - Configure as external (for personal use) or internal (for organization)
   - Add required scopes: `https://www.googleapis.com/auth/sdm.service`

2. **Create OAuth2 Credentials**:
   - Visit [API Credentials](https://console.cloud.google.com/apis/credentials)
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add redirect URI: `http://localhost:6001/api/auth/callback`
   - Save the Client ID and Secret

3. **Create Device Access Project**:
   - Visit [Device Access Console](https://console.nest.google.com/device-access)
   - Create a new project ($5 one-time fee)
   - Link it to your Google Cloud project
   - Note the Project ID

## Cleanup

To destroy all created resources:
```bash
pulumi destroy
```
