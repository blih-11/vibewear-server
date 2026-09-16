import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Firebase project ID — public info (also embedded in the frontend's own
// firebase.js config), not a secret. Overridable via env var so the same
// code works if this project ID ever changes without a redeploy.
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'vibewear-3ce26';

// Verifying a Firebase ID token normally means pulling in the full
// firebase-admin SDK + a service-account key. We don't need that here — a
// Firebase ID token is just a standard RS256 JWT signed by Google, so we can
// verify its signature directly against Google's public certs (no secret
// required) and manually check the issuer/audience/expiry ourselves.
const client = jwksClient({
  jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  cache: true,
  cacheMaxAge: 12 * 60 * 60 * 1000, // 12h — Google rotates these keys infrequently
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function verifyIdToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        audience: FIREBASE_PROJECT_ID,
      },
      (err, decoded) => (err ? reject(err) : resolve(decoded))
    );
  });
}

// Verifies the caller is signed in AND is the same person as the :uid in the
// URL. Used on customer-facing routes like GET /api/orders/:uid so one
// shopper can't view another shopper's order history just by knowing (or
// guessing) their Firebase uid.
export async function requireOwnUid(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Sign-in required.' });

    const decoded = await verifyIdToken(token);
    if (decoded.uid !== req.params.uid) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this data.' });
    }
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session — please sign in again.' });
  }
}