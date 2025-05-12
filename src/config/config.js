require('dotenv').config();

module.exports = {
    discord: {
        token: process.env.DISCORD_BOT_TOKEN
    },
    firebase: {
        apiKey: process.env.FIREBASE_API_KEY
    },
    locket: {
        androidPackage: 'com.locket.Locket',
        androidCert: '187A27D3D7364A044307F56E66230F973DCCD5B7',
        firebaseGmpid: '1:641029076083:android:eac8183b796b856d4fa606',
        firebaseClient: 'H4sIAAAAAAAAAKtWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA',
        userAgent: 'Dalvik/2.1.0 (Linux; U; Android 9; SM-S9210 Build/PQ3B.190801.10101846)'
    }
}; 