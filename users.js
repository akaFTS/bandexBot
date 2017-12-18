const moment = require('moment');
const lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('log.txt')
});

let dupeusers = [];
let dupegroups = [];
let todayusers = [];
lineReader.on('line', function (line) {
    let json = JSON.parse(line);

    if(json.user)
        dupeusers.push(json.user);

    if(json.group)
        dupegroups.push(json.group);

    if(moment(json.timestamp).isSame(moment(), 'day') && json.user) {
        todayusers.push(json.user);
    }
});

lineReader.on('close', function (line) {

    let users = [ ...new Set(dupeusers)];
    let groups = [...new Set(dupegroups)];
    let today = [... new Set(todayusers)];

    console.log("USERS:");
    users.forEach(user => {
        console.log(user);
    });
    console.log("Total: " + users.length);
    console.log("");
    console.log("");
    console.log("GROUPS:");
    groups.forEach(group => {
        console.log(group);
    });
    console.log("Total: " + groups.length);
    console.log("");
    console.log("");
    console.log("TODAY:");
    today.forEach(user => {
        console.log(user);
    });
    console.log("Total: " + today.length);
});