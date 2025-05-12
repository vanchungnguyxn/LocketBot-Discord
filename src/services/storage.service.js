const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { storage } = require('../config/firebase');
const { STORAGE } = require('../config/constants');
const logger = require('../utils/logger');

class StorageService {
    async uploadToLocket(userId, idToken, file, type) {
        try {
            const path = type === 'image' 
                ? STORAGE.PATHS.IMAGES.replace('{userId}', userId)
                : STORAGE.PATHS.VIDEOS.replace('{userId}', userId);

            const fileName = `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `${path}/${fileName}`);

            const metadata = {
                contentType: file.type,
                customMetadata: {
                    userId,
                    type
                }
            };

            await uploadBytes(storageRef, file.buffer, metadata);
            return await getDownloadURL(storageRef);
        } catch (error) {
            logger.error('Storage upload failed:', error);
            throw error;
        }
    }

    async uploadToFallback(file) {
        try {
            const fallbackRef = ref(storage, `fallback/${Date.now()}_${file.name}`);
            await uploadBytes(fallbackRef, file.buffer, {
                contentType: file.type
            });
            return await getDownloadURL(fallbackRef);
        } catch (error) {
            logger.error('Fallback storage upload failed:', error);
            throw error;
        }
    }
}

module.exports = new StorageService(); 