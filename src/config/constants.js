const DISCORD = {
  INTENTS: [
    'Guilds',
    'GuildMessages',
    'MessageContent',
    'DirectMessages'
  ],
  PARTIALS: ['CHANNEL']
};

const FIREBASE = {
  AUTH_HEADERS: {
    'Content-Type': 'application/json',
    'X-Android-Package': 'com.locket.Locket',
    'X-Android-Cert': '187A27D3D7364A044307F56E66230F973DCCD5B7',
    'X-Firebase-Gmpid': '1:641029076083:android:eac8183b796b856d4fa606',
    'X-Firebase-Client': 'H4sIAAAAAAAAAKtWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA',
    'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9; SM-S9210 Build/PQ3B.190801.10101846)'
  },
  BASE_URL: 'https://www.googleapis.com/identitytoolkit/v3/relyingparty',
  API_KEY: process.env.FIREBASE_API_KEY,
  IOS_BUNDLE_ID: 'com.locket.Locket',
  IOS_CLIENT_VERSION: 'iOS/FirebaseSDK/10.23.1/FirebaseCore-iOS',
  GMPID_IOS: '1:641029076083:ios:cc8eb46290d69b234fa606',
  APPCHECK_TOKEN: process.env.FIREBASE_APPCHECK_TOKEN,
  INSTANCE_ID_TOKEN: process.env.FIREBASE_INSTANCE_ID
};

const LOCKET_API = {
  BASE_URL: 'https://api.locketcamera.com',
  ENDPOINTS: {
    LOGIN: '/identitytoolkit/v3/relyingparty/verifyPassword',
    SET_CLIENT_DATA: '/setClientData',
    VERIFY_CLIENT: '/verifyClient',
    POST_MOMENT: '/postMomentV2'
  }
};

const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác.',
    TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    INVALID_TOKEN: 'Token không hợp lệ.',
    NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại sau.'
  },
  UPLOAD: {
    FILE_TOO_LARGE: 'File quá lớn. Kích thước tối đa là 10MB.',
    INVALID_FILE_TYPE: 'Loại file không được hỗ trợ.',
    UPLOAD_FAILED: 'Không thể tải lên file. Vui lòng thử lại sau.'
  },
  GENERAL: {
    UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.',
    VALIDATION_ERROR: 'Dữ liệu không hợp lệ.'
  }
};

const UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
  MAX_RECIPIENTS: 10
};

const FIREBASE_HEADERS = {
  'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9; SM-S9210 Build/PQ3B.190801.10101846)',
  'X-Android-Package': 'com.locket.Locket',
  'X-Android-Cert': '187A27D3D7364A044307F56E66230F973DCCD5B7',
  'X-Firebase-Gmpid': '1:641029076083:android:eac8183b796b856d4fa606',
  'X-Firebase-Client': 'H4sIAAAAAAAAAKtWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA'
};

const LOGIN_HEADERS = {
  Accept: '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en',
  baggage: 'sentry-environment=production,sentry-public_key=78fa64317f434fd89d9cc728dd168f50,sentry-release=com.locket.Locket@1.82.0+3,sentry-trace_id=90310ccc8ddd4d059b83321054b6245b',
  Connection: 'keep-alive',
  'Content-Type': 'application/json',
  Host: 'www.googleapis.com',
  'sentry-trace': '90310ccc8ddd4d059b83321054b6245b-3a4920b34e94401d-0',
  'User-Agent': 'FirebaseAuth.iOS/10.23.1 com.locket.Locket/1.82.0 iPhone/18.0 hw/iPhone12_1',
  'X-Client-Version': 'iOS/FirebaseSDK/10.23.1/FirebaseCore-iOS',
  'X-Firebase-AppCheck': '', 
  'X-Firebase-GMPID': '1:641029076083:ios:cc8eb46290d69b234fa606',
  'X-Ios-Bundle-Identifier': 'com.locket.Locket',
};

const CREATE_POST_URL = 'https://api.locketcamera.com/postMomentV2';

const UPLOADER_HEADERS = {
  'content-type': 'application/octet-stream',
  'x-goog-upload-protocol': 'resumable',
  'x-goog-upload-offset': '0',
  'x-goog-upload-command': 'upload, finalize',
  'upload-incomplete': '?0',
  'upload-draft-interop-version': '3',
  'user-agent': 'com.locket.Locket/1.43.1 iPhone/17.3 hw/iPhone15_3 (GTMSUF/1)',
};

module.exports = {
  DISCORD,
  FIREBASE,
  LOCKET_API,
  ERROR_MESSAGES,
  UPLOAD,
  FIREBASE_HEADERS,
  LOGIN_HEADERS,
  CREATE_POST_URL,
  UPLOADER_HEADERS,
}; 