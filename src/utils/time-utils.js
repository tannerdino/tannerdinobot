

function convertToEST(timestamp) {
    const date = new Date(timestamp * 1000); // Multiply by 1000 to convert from seconds to milliseconds
    const options = {
        timeZone: "America/New_York",
        timeZoneName: "short",
    };
    return date.toLocaleString("en-US", options);
}

module.exports = { convertToEST };