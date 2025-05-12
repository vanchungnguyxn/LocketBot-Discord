const logger = require('../utils/logger');
const Locket = require('./LocketService_iOS');

class AuthService {
  constructor() {
    this.tokenCache = new Map();
    this.discordToEmail = new Map();
  }

  setDiscordMapping(discordId, email) {
    this.discordToEmail.set(discordId, email);
  }

  getEmailByDiscord(discordId) {
    return this.discordToEmail.get(discordId);
  }

  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email và mật khẩu không được để trống');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email không hợp lệ');
      }
      let retries = 3;
      while (retries > 0) {
        try {
          logger.debug('Calling Locket.login with:', {
            email,
            password
          });
          
          const { idToken, refreshToken, userId, displayName } = await Locket.login(email, password);
          this.tokenCache.set(email, {
            idToken,
            refreshToken,
            userId,
            displayName,
            expiresAt: Date.now() + 50 * 60 * 1000 // 50 minutes
          });

          return { 
            idToken, 
            refreshToken,
            userData: {
              displayName,
              email,
              localId: userId
            }
          };
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err) {
      logger.error('AuthService.login error:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      throw new Error('Đăng nhập không thành công. Vui lòng kiểm tra email và mật khẩu.');
    }
  }

  async getValidToken(email) {
    const cache = this.tokenCache.get(email);
    if (cache && cache.expiresAt > Date.now()) {
      return cache.idToken;
    }
    return null;
  }

  async setClientData(email, clientData = {}) {
    try {
      const idToken = await this.getValidToken(email);
      if (!idToken) {
        throw new Error('Token không hợp lệ');
      }
      await Locket.setClientData({
        idToken,
        appCheckToken: process.env.FIREBASE_APPCHECK_TOKEN,
        clientData
      });
    } catch (err) {
      logger.error('AuthService.setClientData error:', err.response?.data || err.message);
      throw new Error('Không thể đồng bộ client data.');
    }
  }

  async verifyClient(email, payload = {}) {
    try {
      const idToken = await this.getValidToken(email);
      if (!idToken) {
        throw new Error('Token không hợp lệ');
      }
      await Locket.verifyClient({
        idToken,
        appCheckToken: process.env.FIREBASE_APPCHECK_TOKEN,
        ...payload
      });
    } catch (err) {
      logger.error('AuthService.verifyClient error:', err.response?.data || err.message);
      throw new Error('Xác thực client thất bại.');
    }
  }

  async postMoment(email, momentParams) {
    try {
      const idToken = await this.getValidToken(email);
      if (!idToken) {
        throw new Error('Token không hợp lệ');
      }
      const result = await Locket.postMoment({
        idToken,
        appCheckToken: process.env.FIREBASE_APPCHECK_TOKEN,
        ...momentParams
      });
      return result;
    } catch (err) {
      logger.error('AuthService.postMoment error:', err.response?.data || err.message);
      throw new Error('Đăng moment thất bại.');
    }
  }

  async loginWithFirebaseRest(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email và mật khẩu không được để trống');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email không hợp lệ');
      }
      const { idToken, refreshToken } = await Locket.loginWithFirebaseRest({ email, password });
      // Cache token
      this.tokenCache.set(email, {
        idToken,
        refreshToken,
        expiresAt: Date.now() + 50 * 60 * 1000 // 50 minutes
      });
      return { idToken, refreshToken };
    } catch (err) {
      logger.error('AuthService.loginWithFirebaseRest error:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      throw new Error('Đăng nhập không thành công. Vui lòng kiểm tra email và mật khẩu.');
    }
  }
}

module.exports = new AuthService();
