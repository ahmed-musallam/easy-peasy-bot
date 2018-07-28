/**
 * A Bot for Slack!
 */

/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */
function onInstallation (bot, installer) {
  if (installer) {
    bot.startPrivateConversation({ user: installer }, function (err, convo) {
      if (err) throw new Error(err)
      else {
        convo.say('I am a bot that has just joined your team')
        convo.say('You must now /invite me to a channel so that I can be of use!')
      }
    })
  }
}

/**
 * Get initial config for controller
 */
function getConfig () {
  // Currently uses filesystem storage, which is adequate for one slack workspace
  // Botkit has a store integration with mongodb
  return {
    json_file_store: ((process.env.TOKEN) ? './db_slack_bot_ci/' : './db_slack_bot_a/') // use a different name if an app or CI
  }
}

/**
 * Are we being run as an app or a custom integration? The initialization will differ, depending
 */
function configureController (config) {
  var controller
  if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    // Treat this as a custom integration
    var customIntegration = require('./lib/custom_integrations')
    const token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN
    if (token) console.log('Token found, using it!')
    else console.log('could not fimd token... it will fail...')
    controller = customIntegration.configure(token, config, onInstallation)
  } else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    // Treat this as an app
    var app = require('./lib/apps')
    controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation)
  } else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment')
    process.exit(1)
  }
  return controller
}

/****************************
 *          MAIN
 ***************************/
const controller = configureController(getConfig())
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
  console.log('** The RTM api just connected!')
})
controller.on('rtm_close', function (bot) {
  console.log('** The RTM api just closed')
  // you may want to attempt to re-open
})

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, 'Hey, thanks for inviting me!')
})

controller.hears('hello', 'direct_message', function (bot, message) {
  bot.reply(message, 'Hello!')
})

const Shuriken = require('./lib/shuriken')
const shuriken = new Shuriken(controller)
