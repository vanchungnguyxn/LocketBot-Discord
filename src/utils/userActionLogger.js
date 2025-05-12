const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '../../user_actions.log');

function logUserAction({ discordId, email, action, detail }) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        discordId,
        email,
        action,
        detail: detail || null
    };
    fs.appendFileSync(LOG_PATH, JSON.stringify(logEntry) + '\n');
}

module.exports = { logUserAction }; 