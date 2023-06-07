// Imports
const sqlite3 = require("sqlite3").verbose();
const config = require('../config/config.json');
const objectData = require('../databases/item-list.json');
const dbPath = config.twitch.dbPath;

function getObjNameByID(objectId) {
    const object = objectData[objectId];
    return object ? object.name : "Unknown";
}

function getObjIDByName(objectName) {
    const lowerCaseObjectName = objectName.toLowerCase().replace(/[\u2018\u2019]/g, "");

    for (const objectId in objectData) {
        const object = objectData[objectId];
        if (object.name.toLowerCase() === lowerCaseObjectName) {
            return parseInt(objectId);
        }

        const singularForm = object.name.endsWith("s") ? object.name.slice(0, -1) : object.name;
        if (singularForm.toLowerCase() === lowerCaseObjectName) {
            return parseInt(objectId);
        }
    }

    return null;
}

function getObjAlchByID(objectId) {
    const object = objectData[objectId];
    return object ? object.highalch : null;
}

// Function to fetch the source information from the database
function getKillCount(callback) {
    const db = new sqlite3.Database(dbPath);
    db.all(`
    SELECT sourceName, COUNT(DISTINCT sourceId) AS uniqueSourceIds
    FROM source
    GROUP BY sourceName
    `,
        (error, rows) => {
            db.close();
            if (error) {
                console.error("Error retrieving data: " + error.message);
                return;
            }
            callback(rows);
        }
    );
}

function getLoot(permittedObjectIDs, callback) {
    const db = new sqlite3.Database(dbPath);
    const lootCounts = {};
    db.serialize(() => {
        const statement = db.prepare(`
        SELECT objectId, SUM(count) AS totalCount
        FROM loot
        WHERE objectId IN (${permittedObjectIDs.join(",")})
        GROUP BY objectId
        `);

        statement.each(
            (error, row) => {
                if (error) {
                    console.error("Error retrieving data: " + error.message);
                    return;
                }
                const objectName = getObjNameByID(row.objectId);
                lootCounts[objectName] = row.totalCount || 0;
            },
            () => {
                statement.finalize();
                db.close();
                callback(lootCounts);
            }
        );
    });
}

// Separate concerns and improve parameter destructuring
function getSourceLoot(sourceName, permittedObjectIDs) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      const lootCounts = {};
  
      db.serialize(() => {
        const statement = db.prepare(`
          SELECT objectId, SUM(count) AS totalCount
          FROM loot
          WHERE LOWER(sourceName) = LOWER(?)
            AND objectId IN (${permittedObjectIDs.map(() => "?").join(",")})
          GROUP BY objectId
        `);
  
        statement.each(sourceName, permittedObjectIDs, (error, row) => {
          if (error) {
            reject(error);
            return;
          }
          const objectId = row.objectId;
          lootCounts[objectId] = row.totalCount || 0;
        }, () => {
          statement.finalize();
          db.close();
  
          resolve(lootCounts);
        });
      });
    });
  }

function getLootByObjectId(objectId, callback) {
    const db = new sqlite3.Database(dbPath);
    const sourceLootCounts = {};

    db.serialize(() => {
        const statement = db.prepare(`
        SELECT sourceName, SUM(count) AS totalCount
        FROM loot
        WHERE objectId = ?
        GROUP BY sourceName
        `);

        statement.each(
            objectId,
            (error, row) => {
                if (error) {
                    console.error("Error retrieving data: " + error.message);
                    return;
                }
                sourceLootCounts[row.sourceName] = row.totalCount || 0;
            },
            () => {
                statement.finalize();
                db.close();
                callback(sourceLootCounts);
            }
        );
    });
}

function getMaxTimestamp(objectId, callback) {
    const db = new sqlite3.Database(dbPath);
    const tableName = "loot"; // Replace 'YourTableName' with the actual table name
    const query = `SELECT MAX(modified) AS maxModified, sourceName FROM ${tableName} WHERE objectId = ?`;
    db.get(query, [objectId], (err, row) => {
        if (err) {
            console.error(err);
            callback(null);
        } else {
            callback(row.maxModified, row.sourceName);
        }
        db.close(); // Close the database connection after the query is complete
    });
}

function getLootAfterTimestamp(timestamp, permittedObjectIDs, callback) {
    const db = new sqlite3.Database(dbPath);
    const lootCounts = {};
    // Check if the timestamp is a valid Unix timestamp
    if (!Number.isInteger(timestamp) || timestamp < 0) {
        console.error("Invalid Unix timestamp:", timestamp);
        return;
    }
    db.serialize(() => {
      const statement = db.prepare(`
        SELECT objectId, SUM(count) AS totalCount
        FROM loot
        WHERE modified >= ? AND objectId IN (${permittedObjectIDs.join(",")})
        GROUP BY objectId
      `);
  
      statement.each(
        timestamp,
        (error, row) => {
          if (error) {
            console.error("Error retrieving data: " + error.message);
            return;
          }
          const objectId = row.objectId;
          const count = row.totalCount || 0;
          const objectName = getObjNameByID(objectId);
          lootCounts[objectName] = count;
        },
        () => {
          statement.finalize();
          db.close();
          callback(lootCounts);
        }
      );
    });
  }
  
function getKillCountAfterTimestamp(timestamp, callback) {
    const db = new sqlite3.Database(dbPath);
    // Check if the timestamp is a valid Unix timestamp
    if (!Number.isInteger(timestamp) || timestamp < 0) {
        console.error("Invalid Unix timestamp:", timestamp);
        return;
    }
    db.all(
      `
      SELECT sourceName, COUNT(DISTINCT sourceId) AS killCount
      FROM source
      WHERE modified >= ?
      GROUP BY sourceName
      `,
      timestamp,
      (error, rows) => {
        db.close();
        if (error) {
            console.error("Error retrieving data: " + error.message);
            return;
        }
        callback(rows);
      }
    );
}

// Retrieve the total count for a specific objectId and sourceName
async function getTotalCount(objectId, sourceName) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
  
      db.get(
        `
        SELECT SUM(count) AS totalCount
        FROM loot
        WHERE LOWER(sourceName) = LOWER(?)
          AND objectId = ?
        `,
        sourceName,
        objectId,
        (error, row) => {
          if (error) {
            reject(error);
            return;
          }
          const totalCount = row ? row.totalCount : 0;
          resolve(totalCount);
        }
      );
  
      db.close();
    });
}

function getSourceNames() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.all(
            `
            SELECT DISTINCT sourceName
            FROM source
            `,
        (error, rows) => {
            if (error) {
                reject(error);
                return;
            }
        const sourceNames = rows.map(row => row.sourceName);
        resolve(sourceNames);
        });
        db.close();
    });
}  

  

// Export all the retrieve functions
module.exports = {
    getKillCountAfterTimestamp,
    getKillCount,
    getLoot,
    getLootAfterTimestamp,
    getLootByObjectId,
    getMaxTimestamp,
    getObjAlchByID,
    getObjIDByName,
    getObjNameByID,
    getTotalCount,
    getSourceNames,
    getSourceLoot,
};