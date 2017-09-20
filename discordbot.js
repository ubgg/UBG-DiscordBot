/*
Discord Bot

####  REQUIRES NODEJS 7.0 or higher
####  REQUIRES NPM

1) In the command line you need to execute the command 'npm install' to install dependencies
2) Replace bot and firebase tokens
*/
//Dependencies
const Discord = require('discord.js');
const chalk = require('chalk');
const admin = require("firebase-admin");
const fs = require('fs');
var antispam = require("discord-anti-spam");
// const opusscript = require('opusscript');
// const ytdl = require('ytdl-core');
var textChannels;
var voicemembers;

var messageCounter = [];



const client = new Discord.Client();
const ADMINISTRATOR = 0x00000008;


//CONFIG  ////////////////////////////////////////////////////////////////////////////
///////////////////CONFIG/////////////////////////////////////////////////////////////
/////////////////////////////////////CONFIG///////////////////////////////////////////
//Bot token
//REPLACE ME!
//DONT REMOVE QUOTATION MARKS ON ANYTHING!! JUST INNER CONTENTS!
client.login('MzUxODM4Njg3NTEzODA0ODAw.DIYbNQ.ZdDa5z68xhY_TGAPpgPGRaoT5ZA');

//Firebase Credentials
//For help go to:
//  1) Go to your firebase app
//  2) Click on the gear on the top left and go to project settings
//  3) Go to the Service Accounts tab
//  4) Make sure the databaseURL matches the one shown on the website

//Example - require('./credentials.json'); if it's in the same directory as this code.
var serviceAccount = require("./discordtest-c82a1-firebase-adminsdk-2yxou-613ecfa586.json");

//change the databaseURL here
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://discordtest-c82a1.firebaseio.com"
});
//Change this to change the prefix to execute Commands
//ex. !help or ~help
const PREFIX = '!';

//Config for colors and costs              format
//                                      : 'COLOR':COST
//                                      : separate w/ commas. final line has no comma.
//Must create role in server first and name it exactly the same below - CASE SENSITIVE
const colorCosts = {
  'white': 100,
  'red': 200,
  'blue': 300,
  'green': 1000
};
const rankCost = 100;
const TOKEN_INTERVAL = (1 * 1000); //  Number of milliseconds
const INTERVAL_REWARD = 5; //  Amount of tokens per interval
const USE_INTERVAL_REWARDS_ON_START = true; //  Interval rewards begin on bot-connect
const deleteCommandAfterUse = true; //  true/false
antispam(client, {
  warnBuffer: 3, //Maximum amount of messages allowed to send in the interval time before getting warned.
  maxBuffer: 5, // Maximum amount of messages allowed to send in the interval time before getting banned.
  interval: 1000, // Amount of time in ms users can send a maximum of the maxBuffer variable before getting banned.
  warningMessage: "stop spamming or I'll whack your head off.", // Warning message send to the user indicating they are going to fast.
  banMessage: "has been banned for spamming, anyone else?", // Ban message, always tags the banned user in front of it.
  maxDuplicatesWarning: 7, // Maximum amount of duplicate messages a user can send in a timespan before getting warned
  maxDuplicatesBan: 10 // Maximum amount of duplicate messages a user can send in a timespan before getting banned
});




//////////////////////////////////////////////////////////////////////////////////////










//Bot connected
var timer;
client.on('ready', () => {

  let voiceChannels = client.channels;

  timer = client.setInterval(tokenTimer, TOKEN_INTERVAL);

  function tokenTimer() {
    for (var [key] of voiceChannels) {
      if (voiceChannels.get(key)['type'] == 'voice') {
        voicemembers = voiceChannels.get(key)['members'];
        for (var [key] of voicemembers) {
          var online = (voicemembers.get(key)['user']['presence']['status'] == 'online');
          if (online) {
            var id = voicemembers.get(key)['user']['id'];
            var allusers = ref.orderByChild('user').once('value', function(snapshot) {
              var users = snapshot.val().user;
              var keys = Object.keys(users);

              // if(online) console.log(chalk.green(user['username'] + ' is Online.'));
              // else console.log(chalk.red(user['username'] + ' is Offline.'));
              for (var i = 0; i < keys.length; i++) {
                if (keys[i] == id) {
                  var currentPoints = parseInt(users[keys[i]]['points']);
                  currentPoints += parseInt(INTERVAL_REWARD);
                  var thisuser = ref.child('/user/' + id);
                  thisuser.update({
                    'points': currentPoints
                  });
                }
              }
            });
          }
        }


      }
    }

  }

  if(!fs.existsSync('guildData.json')){
    let obj = {
      'guilds': []
    }

    let json = JSON.stringify(obj, undefined, 2);
    fs.writeFileSync('guildData.json', json, 'utf8');
  }


  if (!fs.existsSync('textChannelConfig.json')) {
    let obj = {
      'channels': []
    }
    let allChannels = client.channels;
    for (var [key] of allChannels) {
      // console.log(allChannels.get(key)['name'] + ' - ' + allChannels.get(key)['type']);
      if (allChannels.get(key)['type'] == 'text') {
        obj.channels.push({
          'name': allChannels.get(key)['name'],
          'messagesPerReward': 50,
          'reward': 20
        });
      }
    }
    var json = JSON.stringify(obj, undefined, 2);
    fs.writeFileSync('textChannelConfig.json', json, 'utf8', textChannelLoaded);
  } else {
    var file = fs.readFileSync('textChannelConfig.json');
    textChannels = JSON.parse(file);
    let allChannels = client.channels;
    for (var [key] of allChannels) {
      var match = false;
      for (var i = 0; i < textChannels.channels.length; i++) {
        if (allChannels.get(key)['name'] == textChannels.channels[i]['name']) {
          if (allChannels.get(key)['type'] == 'text') match = true;
        }
      }
      if (!match) {
        if (allChannels.get(key)['type'] == 'text'){
          textChannels.channels.push({
            'name': allChannels.get(key)['name'],
            'messagesPerReward': 50,
            'reward': 20
          });
        }
      }
      var json = JSON.stringify(textChannels, undefined, 2);
    }
    fs.writeFileSync('textChannelConfig.json', json, 'utf8', textChannelLoaded);
  }
  var file = fs.readFileSync('textChannelConfig.json');
  textChannels = JSON.parse(file);

  console.log(chalk.yellow('Connected as: ' + client.user.username));
});


//Commands prompted on message
client.on('message', message => {
  // console.log(message.channel.name)
  let found = false;
  for(var i = 0; i < messageCounter.length; i++){
    if(messageCounter[i].id == message.author.id){
      found = true;
      messageCounter[i].counter++;

      for(var j = 0; j < textChannels.channels.length; j++){
        if(message.channel.name == textChannels.channels[j].name){
          if(messageCounter[i].counter >= textChannels.channels[j].messagesPerReward){
            messageCounter[i].counter = 0;
            var reward = textChannels.channels[j].reward;
            var allusers = ref.orderByChild('user').once('value', function(snapshot) {
              var users = snapshot.val().user;
              var keys = Object.keys(users);


              for (var i = 0; i < keys.length; i++) {
                if (keys[i] == message.author.id) {
                  var currentPoints = parseInt(users[keys[i]]['points']);
                  currentPoints += parseInt(reward);
                  var thisuser = ref.child('/user/' + message.author.id);
                  thisuser.update({
                    'points': currentPoints
                  });
                }
              }
            });

            continue;
          }
        }
      }

    }
  }
  if(!found){
    var msgObj = {
      'id': message.author.id,
      'counter': 1
    }
    messageCounter.push(msgObj);
  }

  if (!message.content.startsWith(PREFIX)) return;

  //ex. !buycolor red otherstuff
  let noprefix = message.content.split(' ').slice(1); //result: red otherstuff
  var argstring = noprefix.join(' ');//result: red otherstuff
  var args = argstring.split(' ');//result : args[0] = red , args[1] = otherstuff
  var isAdmin = message.member.permissions.has(ADMINISTRATOR);

  if(message.content.startsWith(PREFIX + 'help')){
    message.channel.send('\n COMMANDS: \n'+
    '\t' + PREFIX + 'addme  - Adds user to databse.\n'+
    '\t' + PREFIX + 'tokens - The number of tokens the user has.\n' +
    '\t' + PREFIX + 'buycolor {color} - Changes color role. If no specified a list of available colors and prices will be printed\n' +
    '\t' + PREFIX + 'rankup - Increases rank for ' + rankCost + ' tokens.\n'
    );
  }else

  if(message.content.startsWith(PREFIX + 'createguild')){
    if(args[0] == '') return;
    let inGuild = false;
    let keys;
    var allusers = ref.orderByChild('user').once('value', function(snapshot) {
      var users = snapshot.val().user;
      keys = Object.keys(users);

      for (var i = 0; i < keys.length; i++) {
        if (keys[i] == message.author.id) {
          if(!(users[keys[i]]['guild'] == 'not-a-guild-member')){
            inGuild = true;
          }
        }
      }

      if(inGuild){
        message.reply('You must leave your current guild before you can create one.');
        return;
      }

      let guildFile = fs.readFileSync('guildData.json');
      let guildData = JSON.parse(guildFile);
      for(let i = 0; i < guildData.guilds.length; i++){
        if(args[0] == guildData.guilds[i].name){
          message.reply('A guild with that name already exists.');
          return;
        }
      }


      let newGuild = {
        'name': args[0],
        'ownerid': message.author.id,
        'ownername': message.author.username,
        'tokens': 0,
        'members': []
      }
      let newMember = {
        'name': message.author.username,
        'id': message.author.id
      }
      newGuild.members.push(newMember);
      guildData.guilds.push(newGuild);
      let tempuser = ref.child('user');
      let me = tempuser.child(message.author.id);
      me.update({
        'guild': args[0]
      });


      let json = JSON.stringify(guildData, undefined, 2);
      fs.writeFileSync('guildData.json', json, 'utf8');
    });
  }else
  //DOME
  if(message.content.startsWith(PREFIX + 'joinguild')){

  }else

  if(message.content.startsWith(PREFIX + 'leaveguild')){
    var users = ref.child('user');
    var me = users.child(message.author.id);

    let guildFile = fs.readFileSync('guildData.json');
    let guildData = JSON.parse(guildFile);

    var allusers = ref.orderByChild('user').once('value', function(snapshot) {
      var users = snapshot.val().user;
      var keys = Object.keys(users);

      for (var i = 0; i < keys.length; i++) {
        if (keys[i] == message.author.id) {
          let myGuild = users[keys[i]].guild;
          for(var i = 0; i < guildData.guilds.length; i++){
            if(guildData.guilds[i].name == myGuild){
              for(var j = 0; j < guildData.guilds[i].members.length; j++){
                if(guildData.guilds[i].members[j].id == message.author.id){
                  guildData.guilds[i].members.splice(j, 1);
                  me.update({
                    'guild': 'not-a-guild-member'
                  });
                  let json = JSON.stringify(guildData, undefined, 2);
                  fs.writeFileSync('guildData.json', json, 'utf8');
                  return;
                }
              }
            }
          }
        }
      }
    });



  }else

  if (message.content.startsWith(PREFIX + 'addme')) {
    var exists = false;

    var allusers = ref.orderByChild('user').once('value', function(snapshot) {
      var users = snapshot.val().user;
      var keys = Object.keys(users);

      for (var i = 0; i < keys.length; i++) {
        if (keys[i] == message.author.id) {
          message.reply('You\'ve already been added');
          exists = true;
        }
      }
    });


    if (!exists) {
      var users = ref.child('user');
      var me = users.child(message.author.id);
      me.update({
        username: message.author.username,
        points: 0,
        rank: 1,
        guild: 'not-a-guild-member'
      });
    }
  } else

  if (message.content.startsWith(PREFIX + 'tokens')) {
    var allusers = ref.orderByChild('user').once('value', function(snapshot) {
      var users = snapshot.val().user;
      var keys = Object.keys(users);

      for (var i = 0; i < keys.length; i++) {
        if (keys[i] == message.author.id) {
          message.reply(users[keys[i]]['points'] + ' tokens');
        }
      }
    });


  } else

  if (message.content.startsWith(PREFIX + 'addpoints')) {
    var allusers = ref.orderByChild('user').once('value', function(snapshot) {
      var users = snapshot.val().user;
      var keys = Object.keys(users);


      for (var i = 0; i < keys.length; i++) {
        if (keys[i] == message.author.id) {
          var currentPoints = parseInt(users[keys[i]]['points']);
          currentPoints += parseInt(args[0]);
          var thisuser = ref.child('/user/' + message.author.id);
          thisuser.update({
            'points': currentPoints
          });
        }
      }
    });
  } else

  if (message.content.startsWith(PREFIX + 'buycolor')) {
    var allusers = ref.orderByChild('user').once('value', function(snapshot) {
      var users = snapshot.val().user;
      var keys = Object.keys(users);


      for (var i = 0; i < keys.length; i++) {
        if (keys[i] == message.author.id) {
          if(args[0] == ''){
            var colors = Object.keys(colorCosts);
            var string = '\n Colors: \n';
            for(var j = 0; j < colors.length; j++){
              string += '\t' + colors[j] + ' ' + colorCosts[colors[j]] + ' tokens.\n';
            }
            message.reply(string);
          }
          var currentPoints = parseInt(users[keys[i]]['points']);
          if (currentPoints >= colorCosts[args[0]]) {

            currentPoints -= colorCosts[args[0]];
            var thisuser = ref.child('/user/' + message.author.id);
            thisuser.update({
              'points': currentPoints
            });
            var roles = message.member.guild.roles;
            var colors = Object.keys(colorCosts);
            var newcol = message.member.roles;
            for (var i = 0; i < colors.length; i++) {
              if (roles.exists('name', colors[i])) {
                for (var [key] of roles) {
                  var remove = roles.get(key);
                  if (remove['name'] == colors[i]) {
                    newcol.delete(key);
                  }
                }
              }
            }
            if (roles.exists('name', args[0])) {
              for (var [key] of roles) {
                var thisrole = roles.get(key);
                if (thisrole['name'] == args[0]) {

                  newcol.set(key, thisrole);
                }
              }


              message.member.setRoles(newcol);
            }
          }
          return;
        } else {
          message.reply('Sorry, not enough points');
        }
      }
    });

  } else

  if (message.content.startsWith(PREFIX + 'rankup')) {
    var allusers = ref.orderByChild('user').once('value', function(snapshot) {
      var users = snapshot.val().user;
      var keys = Object.keys(users);


      for (var i = 0; i < keys.length; i++) {
        if (keys[i] == message.author.id) {
          var currentRank = parseInt(users[keys[i]]['rank']);
          var currentPoints = parseInt(users[keys[i]]['points']);
          if (currentPoints >= rankCost) {
            currentPoints -= rankCost;
            currentRank += 1;
            var thisuser = ref.child('/user/' + message.author.id);
            thisuser.update({
              'points': currentPoints,
              'rank': currentRank
            });
            message.channel.send(message.author.username + ' Just upgraded to rank ' + currentRank + '!');
            console.log(chalk.bgCyan.white(message.author.username + ' Just upgraded to rank ' + currentRank + '!'));
          }
          return;
        } else {
          message.reply('Sorry, not enough points');
        }
      }
    });

  } else

  if (message.content.startsWith(PREFIX + 'starttimer') && isAdmin) {

    timer = client.setInterval(tokenTimer, TOKEN_INTERVAL);

    function tokenTimer() {
      let members = message.channel.members;
      for (var [key] of members) {
        let user = members.get(key)['user'];
        let online = user['presence']['status'] == 'online';


        if (online) {
          var allusers = ref.orderByChild('user').once('value', function(snapshot) {
            var users = snapshot.val().user;
            var keys = Object.keys(users);

            // if(online) console.log(chalk.green(user['username'] + ' is Online.'));
            // else console.log(chalk.red(user['username'] + ' is Offline.'));

            for (var i = 0; i < keys.length; i++) {
              if (keys[i] == user['id']) {
                var currentPoints = parseInt(users[keys[i]]['points']);
                currentPoints += parseInt(INTERVAL_REWARD);
                var thisuser = ref.child('/user/' + user['id']);
                console.log(chalk.white(user['username'] + ' was rewarded with ' + INTERVAL_REWARD + ' tokens.'));
                thisuser.update({
                  'points': currentPoints
                });
              }
            }
          });
        }


      }
    }

  } else

  if (message.content.startsWith(PREFIX + 'stoptimer') && isAdmin) {
    client.clearInterval(timer);
    console.log(chalk.redBright('Periodic Rewards stopped.'));

  }

  if(deleteCommandAfterUse){
    message.delete();
  }




});



function finish() {
  console.log(chalk.green('Success'));
}

function textChannelLoaded() {
  console.log(chalk.blue('Text Channel data loaded...'));
}

var database = admin.database();
var ref = database.ref('discord');
var ranks = database.ref('ranks');
ref.once("value", function(data) {
  console.log(chalk.yellow('Connected to firebase. '));
});
