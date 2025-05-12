const crypto = require('crypto');
const { LOCKET_API, FIREBASE, FIREBASE_HEADERS, LOGIN_HEADERS, CREATE_POST_URL, UPLOADER_HEADERS } = require('../config/constants');
const logger = require('../utils/logger');
const fetch = require('node-fetch');
const fs = require('fs');

class LocketService {
  /**
   * Gửi thẳng URL public lên Locket
   * @param {string} userId 
   * @param {string} idToken 
   * @param {string} fileOrUrl - nếu là string thì coi như URL public
   * @param {string} caption 
   */
  async uploadAndPost(userId, idToken, fileOrUrl, caption) {
    let mediaUrl = fileOrUrl;
    return this.postMoment(idToken, {
      thumbnail_url: mediaUrl,
      caption
    });
  }

  async getAppCheckToken() {
    const res = await fetch(`${LOCKET_API.BASE_URL}${LOCKET_API.ENDPOINTS.VERIFY_CLIENT}`, {
      method: 'POST',
      headers: {
        ...FIREBASE_HEADERS,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify({ data: { platform: "ios" } })
    });
    const json = await res.json();
    if (!res.ok || !json.token) {
      logger.error('Failed to get AppCheck token:', json);
      throw new Error('Failed to get AppCheck token');
    }
    return json.token;
  }

  async uploadImageToFirebaseStorage(userId, idToken, image) {
    try {
      const imageName = `${Date.now()}_vtd182.webp`;
      // Phase 1: Start upload
      const url = `https://firebasestorage.googleapis.com/v0/b/locket-img/o/users%2F${userId}%2Fmoments%2Fthumbnails%2F${imageName}?uploadType=resumable&name=users%2F${userId}%2Fmoments%2Fthumbnails%2F${imageName}`;
      const initHeaders = {
        'content-type': 'application/json; charset=UTF-8',
        authorization: `Bearer ${idToken}`,
        'x-goog-upload-protocol': 'resumable',
        accept: '*/*',
        'x-goog-upload-command': 'start',
        'x-goog-upload-content-length': `${image.size || image.length}`,
        'accept-language': 'vi-VN,vi;q=0.9',
        'x-firebase-storage-version': 'ios/10.13.0',
        'user-agent': 'com.locket.Locket/1.43.1 iPhone/17.3 hw/iPhone15_3 (GTMSUF/1)',
        'x-goog-upload-content-type': 'image/webp',
        'x-firebase-gmpid': '1:641029076083:ios:cc8eb46290d69b234fa609',
      };
      const data = JSON.stringify({
        name: `users/${userId}/moments/thumbnails/${imageName}`,
        contentType: 'image/*',
        bucket: '',
        metadata: { creator: userId, visibility: 'private' },
      });
      const response = await fetch(url, {
        method: 'POST',
        headers: initHeaders,
        body: data,
      });
      if (!response.ok) throw new Error(`Failed to start upload: ${response.statusText}`);
      const uploadUrl = response.headers.get('X-Goog-Upload-URL');
      let imageBuffer;
      if (image instanceof Buffer) {
        imageBuffer = image;
      } else {
        imageBuffer = fs.readFileSync(image.path);
      }
      let uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: UPLOADER_HEADERS,
        body: imageBuffer,
      });
      if (!uploadResponse.ok) throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
      const getUrl = `https://firebasestorage.googleapis.com/v0/b/locket-img/o/users%2F${userId}%2Fmoments%2Fthumbnails%2F${imageName}`;
      const getHeaders = {
        'content-type': 'application/json; charset=UTF-8',
        authorization: `Bearer ${idToken}`,
      };
      const getResponse = await fetch(getUrl, {
        method: 'GET',
        headers: getHeaders,
      });
      if (!getResponse.ok) throw new Error(`Failed to get download token: ${getResponse.statusText}`);
      const downloadToken = (await getResponse.json()).downloadTokens;
      return `${getUrl}?alt=media&token=${downloadToken}`;
    } catch (error) {
      logger.error('uploadImageToFirebaseStorage', error.message);
      throw error;
    } finally {
      if (image.path) {
        fs.unlinkSync(image.path);
      }
    }
  }

  async postMomentV2(idToken, userId, image, caption) {
    try {
      const imageUrl = await this.uploadImageToFirebaseStorage(userId, idToken, image);
      const postHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      };
      const postData = JSON.stringify({
        data: {
          thumbnail_url: imageUrl,
          caption: caption,
          sent_to_all: true,
        },
      });
      const postResponse = await fetch(CREATE_POST_URL, {
        method: 'POST',
        headers: postHeaders,
        body: postData,
      });
      if (!postResponse.ok) throw new Error(`Failed to create post: ${postResponse.statusText}`);
      return await postResponse.json();
    } catch (error) {
      logger.error('postMomentV2', error.message);
      throw error;
    }
  }

  _genAnalytics() {
    return {
      experiments: {
        flag_4: { "@type": "type.googleapis.com/google.protobuf.Int64Value", value: "43" },
        flag_10: { "@type": "type.googleapis.com/google.protobuf.Int64Value", value: "505" }
      },
      amplitude: {
        device_id: crypto.randomUUID(),
        session_id: {
          value: Date.now().toString(),
          "@type": "type.googleapis.com/google.protobuf.Int64Value"
        }
      },
      google_analytics: {
        app_instance_id: crypto.randomUUID()
      },
      platform: "ios"
    };
  }

  _genOverlays(caption) {
    if (!caption) return [];
    return [{
      data: {
        text: caption,
        text_color: "#FFFFFFE6",
        type: "standard",
        max_lines: {
          "@type":"type.googleapis.com/google.protobuf.Int64Value",
          value: "4"
        },
        background: { material_blur: "ultra_thin", colors: [] }
      },
      alt_text: caption,
      overlay_id: "caption:standard",
      overlay_type: "caption"
    }];
  }
}

module.exports = new LocketService();
