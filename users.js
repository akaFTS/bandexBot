const moment = require('moment');
const lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('storage/actions.log')
});

const fs = require('fs');
let subscribers = JSON.parse(fs.readFileSync('storage/subscriptions', 'utf8'));

let dupeusers = [];
let dupegroups = [];
let todayusers = [];
let userids = {};
lineReader.on('line', function (line) {
    let json = JSON.parse(line);

    if(json.user) {
        dupeusers.push(json.user);
        userids["u" + json.userid] = json.user;
    }

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

    console.log();
    console.log("SUBSCRIPTIONS: ");
    subscribers = subscribers.subscribers;
    let subnum = 0;
    Object.keys(userids).forEach((uid) => {
        if(subscribers[uid]) {
            let preferences = subscribers[uid];
            let log = userids[uid];
            let blog = log;
            if(preferences.almoco) {
                log += " - ALMOÇO: ";
                Object.keys(preferences.almoco).forEach((bandex) => {
                    if(preferences.almoco[bandex]) {
                        log += `${bandex} `;
                    }
                });
            }
            if(preferences.janta) {
                log += " - JANTA: ";
                Object.keys(preferences.janta).forEach((bandex) => {
                    if(preferences.janta[bandex]) {
                        log += `${bandex} `;
                    }
                });
            }
            if(preferences.paused) {
                log += " (PAUSADO)";
            }
            if(blog == log) 
                return;
            console.log(log);
            subnum++;
        }
    });
    console.log("TOTAL: "+subnum);
});