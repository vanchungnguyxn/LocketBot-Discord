const axios = require('axios');
const { FIREBASE, ERROR_MESSAGES } = require('./src/config/constants');
const logger = require('./src/utils/logger');
require('dotenv').config();

/**
 * Authenticates a user with email and password using Firebase Authentication
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} Authentication response containing tokens
 * @throws {Error} If authentication fails
 */
async function loginWithEmailAndPassword(email, password) {
    try {
        // Validate input
        if (!email || !password) {
            throw new Error(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }

        const response = await axios.post(
            `${FIREBASE.BASE_URL}/verifyPassword?key=${process.env.FIREBASE_API_KEY}`,
            {
                email,
                password,
                returnSecureToken: true
            },
            {
                headers: FIREBASE.AUTH_HEADERS,
                timeout: 10000 // 10 second timeout
            }
        );

        logger.info(`User ${email} logged in successfully`);
        return response.data;
    } catch (error) {
        // Handle specific error cases
        if (error.response) {
            // Firebase specific error codes
            switch (error.response.data.error.message) {
                case 'INVALID_PASSWORD':
                case 'EMAIL_NOT_FOUND':
                    logger.warn(`Failed login attempt for ${email}: Invalid credentials`);
                    throw new Error(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
                case 'TOO_MANY_ATTEMPTS_TRY_LATER':
                    logger.warn(`Failed login attempt for ${email}: Too many attempts`);
                    throw new Error('Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.');
                default:
                    logger.error(`Firebase auth error for ${email}:`, error.response.data);
                    throw new Error(ERROR_MESSAGES.AUTH.NETWORK_ERROR);
            }
        } else if (error.request) {
            // Network error
            logger.error(`Network error during login for ${email}:`, error.message);
            throw new Error(ERROR_MESSAGES.AUTH.NETWORK_ERROR);
        } else {
            // Other errors
            logger.error(`Unexpected error during login for ${email}:`, error.message);
            throw new Error(ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR);
        }
    }
}

/**
 * Refreshes the authentication token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<Object>} New authentication tokens
 * @throws {Error} If token refresh fails
 */
async function refreshToken(refreshToken) {
    try {
        const response = await axios.post(
            `${FIREBASE.BASE_URL}/token?key=${process.env.FIREBASE_API_KEY}`,
            {
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            },
            {
                headers: FIREBASE.AUTH_HEADERS,
                timeout: 10000
            }
        );

        logger.info('Token refreshed successfully');
        return response.data;
    } catch (error) {
        logger.error('Token refresh failed:', error.message);
        throw new Error(ERROR_MESSAGES.AUTH.TOKEN_EXPIRED);
    }
}

module.exports = {
    loginWithEmailAndPassword,
    refreshToken
}; 