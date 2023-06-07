function displayCom_Help(target, client) {
    const message = `Commands: !kc, !kc <sourceName>, !loot, !loot <sourceName>, !loot <objectName>, !last <objectName>, !realkc, !kcprogress <unix date>, !kcprogress <seconds ago>, !lootprogress <unix date>, !lootprogress <seconds ago>, !todayloot, !streamloot`;
    client.say(target, message);
    console.log(message);
}

module.exports = {
    displayCom_Help
};