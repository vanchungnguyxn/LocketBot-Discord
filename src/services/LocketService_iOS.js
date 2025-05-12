// src/services/LocketService_iOS.js
const axios = require('axios');
const { LOCKET_API, FIREBASE } = require('../config/constants');
const logger = require('../utils/logger');

class LocketService {
  constructor() {
    this.tokenCache = new Map(); 
  }

  async login(email, password) {
    const url = `${FIREBASE.BASE_URL}/verifyPassword?key=${FIREBASE.API_KEY}`;
    try {
      logger.debug('Calling Firebase Auth with:', { email, url });
      
      const requestBody = {
        email: email,
        password: password,
        returnSecureToken: true
      };

      logger.debug('Request body:', requestBody);

      const res = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-Android-Package': 'com.locket.Locket',
          'X-Android-Cert': '187A27D3D7364A044307F56E66230F973DCCD5B7',
          'X-Firebase-Gmpid': '1:641029076083:android:eac8183b796b856d4fa606',
          'X-Firebase-Client': 'H4sIAAAAAAAAAKtWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA',
          'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9; SM-S9210 Build/PQ3B.190801.10101846)'
        }
      });

      logger.debug('Firebase Auth response:', res.data);

      const { idToken, refreshToken, localId, displayName } = res.data;
      this.tokenCache.set(email, {
        idToken,
        refreshToken,
        userId: localId,
        displayName,
        expiresAt: Date.now() + 50 * 60 * 1000  // renew trước 10'
      });
      return { idToken, refreshToken, userId: localId, displayName };
    } catch (err) {
      logger.error('iOS login failed:', err.response?.data || err.message);
      if (err.response?.data?.error?.message) {
        throw new Error(err.response.data.error.message);
      }
      throw new Error('Đăng nhập không thành công.');
    }
  }

  async getIdToken(email) {
    const cache = this.tokenCache.get(email);
    if (cache && cache.expiresAt > Date.now()) {
      return cache.idToken;
    }
    return null;
  }

  async setClientData(email, clientData = {}) {
    const idToken = await this.getIdToken(email);
    if (!idToken) throw new Error('No valid token');
    const url = `${LOCKET_API.BASE_URL}${LOCKET_API.ENDPOINTS.SET_CLIENT_DATA}`;
    await axios.post(url, {
      data: clientData
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'X-Firebase-Appcheck': FIREBASE.APPCHECK_TOKEN
      }
    });
  }

  async verifyClient(email, payload = {}) {
    const idToken = await this.getIdToken(email);
    const url = `${LOCKET_API.BASE_URL}${LOCKET_API.ENDPOINTS.VERIFY_CLIENT}`;
    await axios.post(url, { data: payload }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'X-Firebase-Appcheck': FIREBASE.APPCHECK_TOKEN
      }
    });
  }

  // 5) postMomentV2
  async postMoment(email, { thumbnail_url, caption }) {
    const idToken = await this.getIdToken(email);
    if (!idToken) throw new Error('No valid token');

    const url = `${LOCKET_API.BASE_URL}${LOCKET_API.ENDPOINTS.POST_MOMENT}`;
    
    const body = {
      data: {
        thumbnail_url,
        caption,
        overlays: [{
          data: {
            background: {
              material_blur: "ultra_thin",
              colors: []
            },
            text_color: "#FFFFFFE6",
            type: "standard",
            max_lines: 4,
            text: caption
          },
          alt_text: caption,
          overlay_id: "caption:standard",
          overlay_type: "caption"
        }],
        sent_to_all: false,
        sent_to_self_only: false,
        show_personally: false
      }
    };

    try {
      const res = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'X-Firebase-Appcheck': FIREBASE.APPCHECK_TOKEN
        }
      });

      logger.debug('Post moment response:', res.data);
      return res.data;
    } catch (err) {
      logger.error('Post moment failed:', err.response?.data || err.message);
      throw new Error('Đăng moment thất bại: ' + (err.response?.data?.error?.message || err.message));
    }
  }
}

module.exports = new LocketService();
