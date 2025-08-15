import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { UserSession } from '../types';

const router = Router();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/sdm.service',
  'openid',
  'profile',
  'email'
];

router.get('/google', (req, res) => {
  const isMobile = req.query.mobile === 'true';
  const state = isMobile ? 'mobile' : 'web';

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state // Pass mobile/web info through OAuth flow
  });
  res.redirect(authUrl);
});


router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const isMobile = state === 'mobile';

  if (!code || typeof code !== 'string') {
    const errorUrl = isMobile
      ? 'camux://auth?error=no_code'
      : `${process.env.FRONTEND_URL}/auth/error`;
    return res.redirect(errorUrl);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID!
    });

    const payload = ticket.getPayload();
    const session = req.session as UserSession;

    session.userId = payload!.sub;
    session.accessToken = tokens.access_token!;
    session.refreshToken = tokens.refresh_token!;
    session.tokenExpiry = tokens.expiry_date!;

    // Redirect based on client type
    if (isMobile) {
      // For mobile, pass session data through deep link
      // Generate a temporary token that can be exchanged for session
      const tempToken = Buffer.from(JSON.stringify({
        userId: session.userId,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        tokenExpiry: session.tokenExpiry,
        timestamp: Date.now()
      })).toString('base64');

      res.redirect(`camux://auth?success=true&token=${tempToken}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    }
  } catch (error) {
    console.error('Auth error:', error);
    const errorUrl = isMobile
      ? 'camux://auth?error=auth_failed'
      : `${process.env.FRONTEND_URL}/auth/error`;
    res.redirect(errorUrl);
  }
});

router.get('/status', (req, res) => {
  const session = req.session as UserSession;
  res.json({
    authenticated: !!session.userId,
    userId: session.userId
  });
});

router.post('/mobile/exchange', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    // Decode the temporary token
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());

    // Check if token is not too old (5 minutes max)
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - tokenData.timestamp > fiveMinutes) {
      return res.status(400).json({ error: 'Token expired' });
    }

    // Set up session for mobile app
    const session = req.session as UserSession;
    session.userId = tokenData.userId;
    session.accessToken = tokenData.accessToken;
    session.refreshToken = tokenData.refreshToken;
    session.tokenExpiry = tokenData.tokenExpiry;

    res.json({
      success: true,
      userId: session.userId
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(400).json({ error: 'Invalid token' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

export const authRouter = router;
