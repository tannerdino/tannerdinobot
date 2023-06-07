const axios = require('axios');
const config = require('../config/config.json');

async function getStreamUptime() {
  try {
    const userLogin = config.twitch.channels[0];
    const clientId = config.twitch.clientId;
    const oauth = config.twitch.oauth;
    const response = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${userLogin}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${oauth}`,
      },
    });
    console.log(response.data);
    if (response.data.data.length > 0) {
      const stream = response.data.data[0];
      const startedAt = new Date(stream.started_at);
      const currentTime = new Date();
      console.log('Started At:', startedAt);
      console.log('Current Time:', currentTime);
      const uptime = Math.floor((currentTime - startedAt) / 1000); // Calculate uptime in seconds
      console.log('Uptime:', uptime);

      return uptime;
    } else {
      return null;
    }
  } catch (error) {
    console.log('An error occurred while retrieving stream information:', error.response.data);
    throw error;
  }
}

module.exports = { getStreamUptime };
