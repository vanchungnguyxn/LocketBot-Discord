const axios = require('axios');
require('dotenv').config();

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const BASE = 'https://api.locketcamera.com';
const FIREBASE_ID_TOOLKIT = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty';

function commonIosHeaders({ appCheckToken, firebaseInstanceIdToken, idToken } = {}) {
  const h = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'User-Agent': 'com.locket.Locket/1.123.0 iPhone/18.4.1 hw/iPhone13_4',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
  };
  if (appCheckToken)    h['X-Firebase-AppCheck']         = appCheckToken;
  if (firebaseInstanceIdToken) h['Firebase-Instance-Id-Token'] = firebaseInstanceIdToken;
  if (idToken)          h['Authorization']               = `Bearer ${idToken}`;
  return h;
}

module.exports = {
  async verifyClient({ fcmToken, analytics, appCheckToken }) {
    const payload = { data: { token: fcmToken, analytics } };
    const res = await axios.post(
      `${BASE}/verifyClient`,
      payload,
      { headers: commonIosHeaders({ appCheckToken }) }
    );
    return res.data;
  },

  async getAccountInfo({ idToken, appCheckToken }) {
    const res = await axios.post(
      `${FIREBASE_ID_TOOLKIT}/getAccountInfo?key=${FIREBASE_API_KEY}`,
      { idToken },
      { headers: {
          ...commonIosHeaders({ appCheckToken }),
          'X-Client-Version': 'iOS/FirebaseSDK/10.23.1/FirebaseCore-iOS',
          'X-Ios-Bundle-Identifier': 'com.locket.Locket',
        }
      }
    );
    return res.data;
  },

  async login({ email, password, appCheckToken }) {
    const res = await axios.post(
      `${FIREBASE_ID_TOOLKIT}/verifyPassword?key=${FIREBASE_API_KEY}`,
      { email, password, returnSecureToken: true },
      { headers: {
          ...commonIosHeaders({ appCheckToken }),
          'X-Ios-Bundle-Identifier': 'com.locket.Locket',
          'X-Client-Version': 'iOS/FirebaseSDK/10.23.1/FirebaseCore-iOS',
        }
      }
    );
    return res.data;
  },

  async loginWithFirebaseRest({ email, password }) {
    const res = await axios.post(
      `${FIREBASE_ID_TOOLKIT}/verifyPassword?key=${FIREBASE_API_KEY}`,
      { email, password, returnSecureToken: true },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return res.data; // { idToken, refreshToken, localId, ... }
  },

  async setClientData({ idToken, appCheckToken, clientData }) {
    const payload = { data: clientData };
    const res = await axios.post(
      `${BASE}/setClientData`,
      payload,
      { headers: commonIosHeaders({ idToken, appCheckToken }) }
    );
    return res.data;
  },

  /**
   * 5. postMomentV2: gửi ảnh/video lên Locket
   *    - thumbnail_url: từ Firebase Storage
   *    - md5: checksum file
   *    - recipients: array of friend-IDs
   *    - caption: string
   */
  async postMomentV2({ idToken, appCheckToken, thumbnail_url, md5, recipients, caption }) {
    const payload = {
      data: {
        thumbnail_url,
        md5,
        recipients,
        caption,
        analytics: {
          ios_version: '1.123.0.3',
          platform: 'ios',
          // ... Ở đây nhồi thêm experiments/device_id/session_id như trong traffic hoặc cl chi cũng được
        },
        sent_to_self_only: false,
        sent_to_all: false,
        overlays: [{
          overlay_id: 'caption:standard',
          overlay_type: 'caption',
          alt_text: caption,
          data: {
            type: 'standard',
            text: caption,
            max_lines: { '@type': 'type.googleapis.com/google.protobuf.Int64Value', value: 4 },
            text_color: '#FFFFFFE6',
            background: { material_blur: 'ultra_thin', colors: [] }
          }
        }]
      }
    };

    const res = await axios.post(
      `${BASE}/postMomentV2`,
      payload,
      { headers: commonIosHeaders({ idToken, appCheckToken }) }
    );
    return res.data;
  }
};