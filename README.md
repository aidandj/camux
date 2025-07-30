# Google Home Camera Viewer

A web application that allows you to view multiple Google Home cameras simultaneously using the Google Smart Device Management API.

## Features

- OAuth2 authentication with Google
- View all cameras linked to your Google Home account
- Adjustable grid layout (1-4 columns)
- WebRTC streaming with automatic stream extension
- Individual camera controls

## Prerequisites

1. A Google account with Google Home cameras
2. Node.js 18+ installed
3. Access to Google Cloud Console
4. Google Smart Device Management project

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the Smart Device Management API
4. Create OAuth2 credentials:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:5000/api/auth/callback`

### 2. Create a Device Access Project

1. Go to [Device Access Console](https://console.nest.google.com/device-access)
2. Create a new project ($5 one-time fee)
3. Note your Project ID

### 3. Configure access

https://nestservices.google.com/partnerconnections/<project-id>/auth?redirect_uri=https://www.google.com&access_type=offline&prompt=consent&client_id=<oauth2-&response_type=code&scope=https://www.googleapis.com/auth/sdm.service

### 3. Configure the Application

1. Clone this repository
2. Copy `.env.example` to `.env` in the server directory:
   ```bash
   cp server/.env.example server/.env
   ```
3. Fill in your credentials:
   - `GOOGLE_CLIENT_ID`: From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `GOOGLE_PROJECT_ID`: From Device Access Console
   - `SESSION_SECRET`: Generate a random string

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Usage

1. Navigate to http://localhost:3000
2. Click "Sign in with Google"
3. Authorize the application
4. View your cameras in the dashboard
5. Click "Start Stream" on any camera to begin viewing
6. Adjust grid size using the dropdown menu

## Technical Details

- **Frontend**: React with TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js with Express, TypeScript
- **Streaming**: WebRTC for camera feeds
- **Authentication**: OAuth2 with Google

## Limitations

- Camera streams expire after 5 minutes (automatically extended)
- WebRTC requires wire-powered cameras for stream extension
- Battery-powered cameras can stream while plugged in

## Troubleshooting

- **No cameras found**: Ensure cameras are linked to the Google account you're using
- **Stream fails to start**: Check browser console for WebRTC errors
- **Authentication fails**: Verify OAuth2 credentials and redirect URI

## Security Notes

- Never commit `.env` files
- Keep your API credentials secure
- Use HTTPS in production
- Implement proper session management
