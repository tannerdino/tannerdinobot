// Imports
const tmi = require('tmi.js');
const lootDisplayComs = require('./commands/loot-tracker/loot-displaycoms.js');
const generalDisplayComs = require('./commands/general/general-displaycoms.js');
const config = require('./config/config.json');
const { getStreamUptime, } = require('./utils/twitch-utils.js');

const {
	displayCom_KillCountInfo,
	displayCom_KillCountSource,
	displayCom_LootInfo,
	displayCom_LootSource,
	displayCom_Last,
	displayCom_Realkc,
    displayCom_LootProgress,
    displayCom_KillCountProgress,
    displayCom_XpProgress,
} = lootDisplayComs;

const { displayCom_Help } = generalDisplayComs;

const opts = {
    identity: {
		username: config.twitch.username,
		password: config.twitch.password
	},	
    channels: config.twitch.channels
};
  

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler(target, context, msg, self) {
    if (self) {
		return; // Ignore messages from the bot
    }
  
    const commandName = sanitizeMessage(msg.trim());

    // Noob commands

    /* if (handleCom_WhyF2p(commandName)) {
        displayCom_WhyF2p(target, client);
    } */

    // general commands
    if (commandName.startsWith('!help') || commandName.startsWith('!command')) {
        displayCom_Help(target, client);
        return;
    }

    // loot commands
    if (commandName.startsWith('!kc') && commandName.length < 5) {
        displayCom_KillCountInfo(target, client);
        return;
    } 
    // !kc <sourceName>
    if (commandName.startsWith('!kc ') && commandName.length > 5) {
        const sourceName = commandName.substring(4).trim().toLowerCase();
        displayCom_KillCountSource(target, client, sourceName);
        return;
    } 
    if (commandName.startsWith('!loot') && commandName.length < 7) {
        displayCom_LootInfo(target, client);
        return;
    } 
    // !loot <query>
    if (commandName.startsWith('!loot ')) {
        const query = commandName.substring(6).trim().toLowerCase();
        displayCom_LootSource(target, client, query);
        return;
    }
    // !last <objName>
    if (commandName.startsWith('!last ')) {
        const objName = commandName.substring(6).trim();
        displayCom_Last(target, client, objName);
        return;
    } 
    if (commandName.startsWith('!realkc')) {
        displayCom_Realkc(target, client);
        return;
    } 
    if (commandName.startsWith('!streamloot')) {
        (async () => {
          try {
            const streamUptime = await getStreamUptime();
            console.log('Stream uptime:', streamUptime);
            
            const timestamp = Math.floor(Date.now() / 1000 - streamUptime);
            console.log('Timestamp:', timestamp);
        
            displayCom_LootProgress(target, client, timestamp);
          } catch (error) {
            // Handle errors
            console.error('An error occurred:', error);
          }
        })();
        return;
    }
    if (commandName.startsWith('!streamkc')) {
        (async () => {
          try {
            const streamUptime = await getStreamUptime();
            console.log('Stream uptime:', streamUptime);
            
            const timestamp = Math.floor(Date.now() / 1000 - streamUptime);
            console.log('Timestamp:', timestamp);
        
            displayCom_KillCountProgress(target, client, timestamp);
          } catch (error) {
            // Handle errors
            console.error('An error occurred:', error);
          }
        })();
        return;
    }
      
    if (commandName.startsWith('!todayloot')) {
        const timestamp = Math.floor(Date.now()/1000 - 24 * 60 * 60); // 1 day ago
        displayCom_LootProgress(target, client, timestamp);
        return;
    } 
    if (commandName.startsWith('!todaykc')) {
        const timestamp = Math.floor(Date.now()/1000 - 24 * 60 * 60); // 1 day ago
        displayCom_KillCountProgress(target, client, timestamp);
        return;
    } 
    // !lootprogress <unixTime>
    if (commandName.startsWith('!lootprogress ')) {
        const timestamp = Math.floor(Date.now()/1000 - commandName.substring(14).trim());
        console.log(timestamp);
        displayCom_LootProgress(target, client, timestamp);
        return;
    }
    // !kcprogress <unixTime>
    if (commandName.startsWith('!kcprogress ')) {
        const timestamp = Math.floor(Date.now()/1000 - commandName.substring(12).trim());
        displayCom_KillCountProgress(target, client, timestamp);
        return;
    }
    // !xpprogress <unixTime>
    if (commandName.startsWith('!xpprogress ')) {
        const timestamp = Math.floor(Date.now()/1000 - commandName.substring(12).trim());
        displayCom_XpProgress(target, client, timestamp);
        return;
    }
}
  

// Function to sanitize the message by removing non-printable or special characters
function sanitizeMessage(msg) {
	return msg.replace(/[^\x20-\x7E]/g, '');
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}
