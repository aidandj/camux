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
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code || typeof code !== 'string') {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
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
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
});

router.get('/status', (req, res) => {
  const session = req.session as UserSession;
  res.json({
    authenticated: !!session.userId,
    userId: session.userId
  });
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