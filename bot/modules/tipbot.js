'use strict';

const bitcoin = require('bitcoin');
let config = require('config');
let spamchannel = config.get('sandboxchannel');
let regex = require('regex');
let pulseConfig = config.get('pulse');
const pulse = new bitcoin.Client(pulseConfig);
const helpmsg = {
  embed: {
    description:
      '__**TIPS**__\n\n' +
      '**Balance**: `$pulse balance`\n' +
      '**Deposit Address**: `$pulse deposit`\n' +
      '**Withdraw**: `$pulse withdraw <address> <amount>`\n' +
      '**Private Tip**: `$privatetip <user> <amount>`\n\n' +
      '__**RAINS**__ Use this to tip everyone in a role.\n\n' +
      '**Rain**: `$rain <role> <amount>`\n' +
      '**Private Role Tip**: `$privatetip <role> <amount>`\n\n' +
      '__**MULTI TIPS**__ Use this to tip multiple people at once.\n\n' +
      '**Multi Tip**: `$multitip <user> <user> <amount>`\n' +
      '**Private Multi Tip** `$multitip private <user> <user> <amount>`\n' +
      '**Note**: Multi tips can contain any amount of users to tip.\n\n' +
      '__**FURTHER INFORMATION**__\n\n' +
      '**Help**: `$pulse help` *Get this message.\n' +
      '',
    color: 1109218
  }
};

exports.commands = ['pulse', 'multitip', 'rain', 'tips'];
exports.pulse = {
  usage: '<subcommand>',
  description: 'Tip a given user with an amount of PLSE or perform wallet specific operations.',
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(' ')
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      channelwarning = 'Please use <#' + spamchannel + '> or DMs to talk to bots.',
      MultiorRole = false;
    switch (subcommand) {
      case 'help':
        privateOrSandboxOnly(msg, channelwarning, doHelp, [helpmsg]);
        break;
      case 'balance':
        privateOrSandboxOnly(msg, channelwarning, doBalance, [tipper]);
        break;
      case 'deposit':
        privateOrSandboxOnly(msg, channelwarning, doDeposit, [tipper]);
        break;
      case 'withdraw':
        privateOrSandboxOnly(msg, channelwarning, doWithdraw, [tipper, words, helpmsg]);
        break;
      default:
        doTip(bot, msg, tipper, words, helpmsg, MultiorRole);
    }
  }
};

exports.multitip = {
  usage: '<subcommand>',
  description: 'Tip multiple users simultaneously for the same amount of PLSE each.',
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(' ')
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      channelwarning = 'Please use <#' + spamchannel + '> or DMs to talk to bots.',
      MultiorRole = true;
    switch (subcommand) {
      case 'help':
        privateOrSandboxOnly(msg, channelwarning, doHelp, [helpmsg]);
        break;
      default:
        doMultiTip(bot, msg, tipper, words, helpmsg, MultiorRole);
        break;
    }
  }
};

exports.rain = {
  usage: '<subcommand>',
  description: 'Tip all users in a specified role an amount of PLSE.',
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(' ')
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      channelwarning = `Please use <#${spamchannel}> or DMs to talk to bots.`,
      MultiorRole = true;
    switch (subcommand) {
      case 'help':
        privateOrSandboxOnly(msg, channelwarning, doHelp, [helpmsg]);
        break;
      default:
        doRoleTip(bot, msg, tipper, words, helpmsg, MultiorRole);
        break;
    }
  }
};

exports.tips = {
  usage: '',
  description: 'Lists all available tipbot commands with brief descriptions for each one.',
  process: async function(bot, msg, suffix) {
    msg.reply(helpmsg);
  }
};

function privateOrSandboxOnly(message, wrongchannelmsg, fn, args) {
  if (!inPrivateOrBotSandbox(message)) {
    message.reply(wrongchannelmsg);
    return;
  }
  fn.apply(null, [message, ...args]);
}

function doHelp(message, helpmsg) {
  message.author.send(helpmsg);
}

function doBalance(message, tipper) {
  pulse.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting balance.').then(message => message.delete(5000));
    } else {
      message.reply(`You have *${balance}* PLSE`);
    }
  });
}

function doDeposit(message, tipper) {
  getAddress(tipper, function(err, address) {
    if (err) {
      message.reply('Error getting your deposit address.').then(message => message.delete(5000));
    } else {
      message.reply(`Your address is ${address}`);
    }
  });
}

function doWithdraw(message, tipper, words, helpmsg) {


  if (words.length < 4) {
    return doHelp(message, helpmsg);
  }

  let address = words[2],
    amount = getValidatedAmount(words[3]);

  if (amount === null) {
    message.reply('Invalid amount of credits specified... Cannot withdraw credits.').then(message => message.delete(5000));
    return;
  }

  pulse.sendFrom(tipper, address, Number(amount), function(err, txId) {
    if (err) {
      return message.reply(err.message).then(message => message.delete(5000));
    }
    message.reply(`${amount} PLSE has been withdrawn to ${address}.
${txLink(txId)}`);
  });
}



















  //   if (words.length < 4) {
  //     return doHelp(message, helpmsg);
  //   }
  //   let amountOffset = 3;
    
  //   let address = words[2],
    
    
  //     amount = getValidatedAmount(words[amountOffset]);

  //   // if (amount === null) {
  //   //   message.reply('Invalid amount of credits specified... Cannot withdraw credits.').then(message => message.delete(5000));
  //   //   return;
  //   // }

  //   pulse.sendFrom(tipper, address, amount, function(err, txId) {
  //     if (err) {
  //       return message.reply(err.message).then(message => message.delete(5000));
  //     } 
  //     message.reply(`${amount} PLSE has been withdrawn to ${address}.
  // ${txLink(txId)}`);
  //   });
  // }

function doTip(bot, message, tipper, words, helpmsg, MultiorRole) {
  if (words.length < 3 || !words) {
    return doHelp(message, helpmsg);
  }

  let prv = false;
  let amountOffset = 2;
  if (words.length >= 4 && words[1] === 'private') {
    prv = true;
    amountOffset = 3;
  }

  let amount = getValidatedAmount(words[amountOffset]);

  if (amount === null) {
    return message.reply('Invalid amount of credits specified...').then(message => message.delete(5000));
  }

  if (message.mentions.users.first() && message.mentions.users.first().id) {
    return sendPLSE(bot, message, tipper, message.mentions.users.first().id.replace('!', ''), amount, prv, MultiorRole);
  }
  message.reply('Sorry, I could not find the user you are trying to tip...');
}

function doMultiTip(bot, message, tipper, words, helpmsg, MultiorRole) {
  if (!words) {
    doHelp(message, helpmsg);
    return;
  }
  if (words.length < 4) {
    doTip(bot, message, tipper, words, helpmsg, MultiorRole);
    return;
  }
  let prv = false;
  if (words.length >= 5 && words[1] === 'private') {
    prv = true;
  }
  let [userIDs, amount] = findUserIDsAndAmount(message, words, prv);
  if (amount == null) {
    message.reply('Invalid amount of credits specified...').then(message => message.delete(5000));
    return;
  }
  if (!userIDs) {
    message.reply('Sorry, I could not find the user you are trying to tip...').then(message => message.delete(5000));
    return;
  }
  for (let i = 0; i < userIDs.length; i++) {
    sendPLSE(bot, message, tipper, userIDs[i].toString(), amount, prv, MultiorRole);
  }
}

function doRoleTip(bot, message, tipper, words, helpmsg, MultiorRole) {
  if (!words || words.length < 3) {
    doHelp(message, helpmsg);
    return;
  }
  let isPrivateTip = words.length >= 4 && words[1] === 'private';
  let amountOffset = isPrivateTip ? 3 : 2;

  let amount = getValidatedAmount(words[amountOffset]);
  if (amount === null) {
    message.reply("I don't know how to tip that amount of PLSE...").then(message => message.delete(10000));
    return;
  }

  let roleToTip = message.mentions.roles.first();
  if (roleToTip !== null) {
    let membersOfRole = roleToTip.members.keyArray();
    if (membersOfRole.length > 0) {
      let userIDs = membersOfRole.map(member => member.replace('!', ''));
      userIDs.forEach(u => {
        sendPLSE(bot, message, tipper, u, amount, isPrivateTip, MultiorRole);
      });
    } else {
      return message.reply('Sorry, I could not find any users to tip in that role...').then(message => message.delete(10000));
    }
  } else {
    return message.reply('Sorry, I could not find any roles in your tip...').then(message => message.delete(10000));
  }
}

function findUserIDsAndAmount(message, words, prv) {
  let idList = [];
  let amount = null;
  let count = 0;
  let startOffset = 1;
  if (prv) startOffset = 2;
  let regex = new RegExp(/<@!?[0-9]+>/);
  for (let i = startOffset; i < words.length; i++) {
    if (regex.test(words[i])) {
      count++;
      idList.push(words[i].match(/[0-9]+/));
    } else {
      amount = getValidatedAmount(words[Number(count) + 1]);
      break;
    }
  }
  return [idList, amount];
}

function sendPLSE(bot, message, tipper, recipient, amount, privacyFlag, MultiorRole) {
  getAddress(recipient.toString(), function(err, address) {
    if (err) {
      message.reply(err.message).then(message => message.delete(5000));
    } else {
      pulse.sendFrom(tipper, address, Number(amount), 1, null, null, function(err, txId) {
        if (err) {
          message.reply(err.message).then(message => message.delete(5000));
        } else {
          let tx = txLink(txId);
          let msgtail = `
DM me with \`$pulse\` for all available commands!`;
          if (privacyFlag) {
            let usr = message.guild.members.find('id', recipient).user;
            let authmsg = `You have sent a private tip to @${usr.tag} with the amount of ${amount} PLSE.
${tx}${msgtail}`;
            message.author.send(authmsg);
            if (message.author.id !== usr.id) {
              let recipientmsg = `You have just been privately tipped ${amount} PLSE by @${message.author.tag}.
${tx}${msgtail}`;
              usr.send(recipientmsg);
            }
          } else {
            let generalmsg = `just tipped <@${recipient}> ${amount} PLSE.
${tx}${msgtail}`;
            message.reply(generalmsg);
          }
        }
      });
    }
  });
}
function getAddress(userId, cb) {
  pulse.getAddressesByAccount(userId, function(err, addresses) {
    if (err) {
      cb(err);
    } else if (addresses.length > 0) {
      cb(null, addresses[0]);
    } else {
      pulse.getNewAddress(userId, function(err, address) {
        if (err) {
          cb(err);
        } else {
          cb(null, address);
        }
      });
    }
  });
}

function inPrivateOrBotSandbox(msg) {
  return msg.channel.type === 'dm' || msg.channel.id === spamchannel;
}

function getValidatedAmount(amount) {
  amount = amount.toLowerCase().replace('plse', '');
  return amount.match(/^[0-9]+(\.[0-9]+)?$/) ? amount : null;
}

function txLink(txId) {
  return 'ENTER YOUR EXPLORER HERE' + txId + '>';
}
