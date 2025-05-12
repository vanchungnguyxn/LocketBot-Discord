const { loginWithEmailAndPassword, refreshToken } = require('../locket-auth');
const axios = require('axios');
const { ERROR_MESSAGES } = require('../config/constants');

jest.mock('axios');

describe('Authentication Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loginWithEmailAndPassword', () => {
        const validCredentials = {
            email: 'test@example.com',
            password: 'password123'
        };

        it('should successfully login with valid credentials', async () => {
            const mockResponse = {
                data: {
                    idToken: 'mock-id-token',
                    refreshToken: 'mock-refresh-token',
                    expiresIn: '3600'
                }
            };

            axios.post.mockResolvedValueOnce(mockResponse);

            const result = await loginWithEmailAndPassword(
                validCredentials.email,
                validCredentials.password
            );

            expect(result).toEqual(mockResponse.data);
            expect(axios.post).toHaveBeenCalledTimes(1);
        });

        it('should throw error for invalid credentials', async () => {
            const mockError = {
                response: {
                    data: {
                        error: {
                            message: 'INVALID_PASSWORD'
                        }
                    }
                }
            };

            axios.post.mockRejectedValueOnce(mockError);

            await expect(
                loginWithEmailAndPassword(validCredentials.email, validCredentials.password)
            ).rejects.toThrow(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
        });

        it('should throw error for network issues', async () => {
            const mockError = {
                request: {},
                message: 'Network Error'
            };

            axios.post.mockRejectedValueOnce(mockError);

            await expect(
                loginWithEmailAndPassword(validCredentials.email, validCredentials.password)
            ).rejects.toThrow(ERROR_MESSAGES.AUTH.NETWORK_ERROR);
        });

        it('should throw error for missing credentials', async () => {
            await expect(
                loginWithEmailAndPassword('', '')
            ).rejects.toThrow(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
        });
    });

    describe('refreshToken', () => {
        const mockRefreshToken = 'mock-refresh-token';

        it('should successfully refresh token', async () => {
            const mockResponse = {
                data: {
                    id_token: 'new-id-token',
                    refresh_token: 'new-refresh-token',
                    expires_in: '3600'
                }
            };

            axios.post.mockResolvedValueOnce(mockResponse);

            const result = await refreshToken(mockRefreshToken);

            expect(result).toEqual(mockResponse.data);
            expect(axios.post).toHaveBeenCalledTimes(1);
        });

        it('should throw error when refresh token is invalid', async () => {
            const mockError = {
                response: {
                    data: {
                        error: {
                            message: 'INVALID_REFRESH_TOKEN'
                        }
                    }
                }
            };

            axios.post.mockRejectedValueOnce(mockError);

            await expect(
                refreshToken(mockRefreshToken)
            ).rejects.toThrow(ERROR_MESSAGES.AUTH.TOKEN_EXPIRED);
        });
    });
}); 