// Imports
const dbUtils = require("../../utils/db-utils.js");
const permittedObj = require("./permitted-obj.js");
const timeUtils = require("../../utils/time-utils.js");
const twitchUtils = require("../../utils/twitch-utils.js");

const {
    getKillCountAfterTimestamp,
    getKillCount,
    getLoot,
    getLootAfterTimestamp,
    getLootByObjectId,
    getMaxTimestamp,
    getObjAlchByID,
    getObjIDByName,
    getObjNameByID,
    getSourceLoot,
    getSourceNames,
    getTotalCount,
} = dbUtils;

const { getStreamUptime } = twitchUtils;
const { convertToEST } = timeUtils;

const permittedObjectIDs = permittedObj.ids;

function displayCom_KillCountInfo(target, client) {
    getKillCount((info) => {
        const formattedInfo = info
            .map((entry) => `${entry.sourceName}: ${entry.uniqueSourceIds}`)
            .join(", ");
        client.say(target, formattedInfo);
        console.log(formattedInfo);
    });
}

function displayCom_KillCountSource(target, client, sourceName) {
    getKillCount((info) => {
        const sourceInfo = info.find(
            (entry) => entry.sourceName.toLowerCase() === sourceName
        );
        if (sourceInfo) {
            const formattedInfo = `${sourceInfo.sourceName} KC: ${sourceInfo.uniqueSourceIds}`;
            client.say(target, formattedInfo);
            console.log(formattedInfo);
        } else {
            console.log(`Source name "${sourceName}" not found`);
        }
    });
}

function displayCom_LootInfo(target, client) {
    getLoot(permittedObjectIDs, (lootCounts) => {
        const formattedInfo = Object.entries(lootCounts)
            .map(([objectId, count]) => `${objectId}: ${count}`)
            .join(", ");
        const message = `${formattedInfo}`;
        client.say(target, message);
        console.log(message);
    });
}

function displayCom_LootSource(target, client, query) {
    const objectId = getObjIDByName(query);

    if (objectId) {
        getLootByObjectId(objectId, (sourceLootCounts) => {
            const formattedInfo = Object.entries(sourceLootCounts)
                .filter(([_, count]) => count > 0)
                .map(([sourceName, count]) => `${sourceName}: ${count}`)
                .join(", ");

            // Calculate the total loot count
            const totalLootCount = Object.values(sourceLootCounts).reduce(
                (total, count) => total + count,
                0
            );
            const message = `${formattedInfo} | Total: ${totalLootCount}`;
            client.say(target, message);
            console.log(message);
        });
    } else {
        getSourceLoot(query, permittedObjectIDs, (lootCounts) => {
            const formattedInfo = Object.entries(lootCounts)
                .filter(([_, count]) => count > 0)
                .map(([objectId, count]) => {
                    const objectName = getObjNameByID(objectId);
                    return `${objectName}: ${count}`;
                })
                .join(", ");

            // Get the kill count for the monster
            getKillCount((killCounts) => {
                const killCount = killCounts.find((entry) => entry.sourceName.toLowerCase() === query);
                if (killCount) {
                    const message = `Count: ${killCount.uniqueSourceIds} | ${formattedInfo}`;
                    client.say(target, message);
                    console.log(message);
                } else {
                    const message = `${formattedInfo}`;
                    client.say(target, message);
                    console.log(message);
                }
            });
        });
    }
}

function displayCom_Last(target, client, objName) {
    const objectId = getObjIDByName(objName);
    const displayName = getObjNameByID(objectId);
    if (objectId) {
        getMaxTimestamp(objectId, (maxModified, sourceName) => {
            if (maxModified) {
                const estTime = convertToEST(maxModified);
                const message = `${displayName}: ${estTime} from ${sourceName}`;
                client.say(target, message);
                console.log(message);
            } else {
                console.log(`No modified time available for object name "${displayName}"`);
            }
        });
    } else {
        console.log(`Object name "${objName}" not found`);
    }
}

// Function to calculate real kill counts
function displayCom_Realkc(target, client) {
    getKillCount((rows) => {
        const hillGiantRow = rows.find(
            (row) => row.sourceName === "Hill Giant"
        );
        const mossGiantRow = rows.find(
            (row) => row.sourceName === "Moss Giant"
        );
        const oborRow = rows.find((row) => row.sourceName === "Obor");
        const bryophytaRow = rows.find((row) => row.sourceName === "Bryophyta");

        const hillGiantKc = hillGiantRow ? hillGiantRow.uniqueSourceIds : 0;
        const mossGiantKc = mossGiantRow ? mossGiantRow.uniqueSourceIds : 0;
        const oborKc = oborRow ? oborRow.uniqueSourceIds : 0;
        const bryophytaKc = bryophytaRow ? bryophytaRow.uniqueSourceIds : 0;

        const estimatedHillGiantKc = Math.round(
            (6501 - 500) * 120 + 500 * 60 + hillGiantKc
        );
        const estimatedMossGiantKc = Math.round(
            2200 * 140 + (6628 - 2200) * 56.475 + mossGiantKc
        );
        const estimatedOborKc = 4228 + oborKc;
        const estimatedBryoKc = 5919 + bryophytaKc;

        const message = `Hill Giants: ${estimatedHillGiantKc}, Moss Giants: ${estimatedMossGiantKc}, Obor: ${estimatedOborKc}, Bryophyta: ${estimatedBryoKc}`;
        client.say(target, message);
        console.log(message);
    });
}
function displayCom_LootProgress(target, client, timestamp) {
    console.log(timestamp);
    if (timestamp < 3000000) {
      timestamp = Math.floor(Date.now()/1000) - timestamp;
    } 
  
    getLootAfterTimestamp(timestamp, permittedObjectIDs, (lootCounts) => {
      console.log("Loot Counts:", lootCounts);
  
      const formattedInfo = Object.entries(lootCounts)
        .map(([objectName, count]) => `${objectName}: ${count}`)
        .join(", ");
  
      const message = `Loot after ${convertToEST(timestamp)}: ${formattedInfo}`;
      client.say(target, message);
      console.log(message);
    });
  }
  
  
  
function displayCom_KillCountProgress(target, client, timestamp) {
    //if time is before 2020, then assume its x seconds ago
    if (timestamp < 3000000) {
        timestamp = Math.floor(Date.now()/1000) - timestamp;
    }
    getKillCountAfterTimestamp(timestamp, (info) => {
        const formattedInfo = info
            .map((entry) => `${entry.sourceName}: ${entry.killCount}`)
            .join(", ");
        const message = `Counts after ${convertToEST(timestamp)}: ${formattedInfo}`;
        client.say(target, message);
        console.log(message);
    });
  }
  

module.exports = {
    displayCom_KillCountInfo,
    displayCom_KillCountSource,
    displayCom_KillCountProgress,
    displayCom_LootInfo,
    displayCom_LootSource,
    displayCom_LootProgress,
    displayCom_Last,
    displayCom_Realkc,
};