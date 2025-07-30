import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { GoogleSDMClient } from '../services/googleSDMClient';
import { UserSession } from '../types';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const session = req.session as UserSession;
    const sdmClient = new GoogleSDMClient(session.accessToken!);

    const devices = await sdmClient.listDevices();

    if (!devices || devices.length === 0) {
      // Return empty cameras array with partner connection URL
      const partnerConnectionUrl = `https://nestservices.google.com/partnerconnections/${process.env.GOOGLE_PROJECT_ID}/auth?redirect_uri=${process.env.FRONTEND_URL}&access_type=offline&prompt=consent&client_id=${process.env.GOOGLE_CLIENT_ID}&response_type=code&scope=https://www.googleapis.com/auth/sdm.service`;

      return res.json({
        cameras: [],
        requiresPartnerConnection: true,
        partnerConnectionUrl,
        message: 'No devices found. Please link your cameras through the partner connection.'
      });
    }

    const cameras = devices.filter(device =>
      device.type?.includes('CAMERA') ||
      device.type?.includes('DOORBELL')
    );

    res.json({ cameras });
  } catch (error) {
    console.error('Failed to list devices:', error);
    res.status(500).json({ error: 'Failed to retrieve devices' });
  }
});

router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const session = req.session as UserSession;
    const sdmClient = new GoogleSDMClient(session.accessToken!);

    // The device name format for the API is: enterprises/{project}/devices/{device}
    const deviceName = `enterprises/${process.env.GOOGLE_PROJECT_ID}/devices/${deviceId}`;
    const device = await sdmClient.getDevice(deviceName);
    res.json(device);
  } catch (error) {
    console.error('Failed to get device:', error);
    res.status(500).json({ error: 'Failed to retrieve device details' });
  }
});

export const devicesRouter = router;
