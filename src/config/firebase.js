const admin = require('firebase-admin');
const path = require('path');

let adminApp;
let bucket;

try {
    const serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));
    
    adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });

    if (process.env.FIREBASE_STORAGE_BUCKET) {
        bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
    }
} catch (error) {
    console.warn('Firebase initialization skipped:', error.message);
}

module.exports = { admin: adminApp, bucket }; 