import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { GoogleSDMClient } from '../services/googleSDMClient';
import { UserSession } from '../types';

const router = Router();

router.use(requireAuth);

router.post('/:deviceId/generate', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { offerSdp } = req.body;
    const session = req.session as UserSession;
    const sdmClient = new GoogleSDMClient(session.accessToken!);
    
    if (!offerSdp) {
      return res.status(400).json({ error: 'offerSdp is required' });
    }
    
    const deviceName = `enterprises/${process.env.GOOGLE_PROJECT_ID}/devices/${deviceId}`;
    const streamData = await sdmClient.generateWebRtcStream(deviceName, offerSdp);
    
    console.log('Full stream response:', JSON.stringify(streamData, null, 2));
    
    // Google's response has the stream data in the results field
    res.json(streamData);
  } catch (error) {
    console.error('Failed to generate stream:', error);
    res.status(500).json({ error: 'Failed to generate camera stream' });
  }
});

router.post('/:deviceId/extend', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { streamExtensionToken } = req.body;
    const session = req.session as UserSession;
    const sdmClient = new GoogleSDMClient(session.accessToken!);
    
    const deviceName = `enterprises/${process.env.GOOGLE_PROJECT_ID}/devices/${deviceId}`;
    const streamData = await sdmClient.extendWebRtcStream(deviceName, streamExtensionToken);
    res.json(streamData);
  } catch (error) {
    console.error('Failed to extend stream:', error);
    res.status(500).json({ error: 'Failed to extend camera stream' });
  }
});

router.post('/:deviceId/stop', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { streamToken } = req.body;
    const session = req.session as UserSession;
    const sdmClient = new GoogleSDMClient(session.accessToken!);
    
    const deviceName = `enterprises/${process.env.GOOGLE_PROJECT_ID}/devices/${deviceId}`;
    await sdmClient.stopWebRtcStream(deviceName, streamToken);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to stop stream:', error);
    res.status(500).json({ error: 'Failed to stop camera stream' });
  }
});

export const streamRouter = router;