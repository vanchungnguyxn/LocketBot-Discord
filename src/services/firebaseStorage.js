const { bucket } = require('../config/firebase');
const path = require('path');

async function uploadToFirebase(localPath, destination) {
    if (!bucket) {
        return { downloadUrl: localPath };
    }

    try {
        await bucket.upload(localPath, { destination });
        const file = bucket.file(destination);
        const [downloadUrl] = await file.getSignedUrl({
            action: 'read',
            expires: '2500-01-01'
        });

        return { downloadUrl };
    } catch (error) {
        console.error('Firebase upload error:', error);
        return { downloadUrl: localPath };
    }
}

module.exports = { uploadToFirebase }; 