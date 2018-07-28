const ScoreStorage = require('./score_storage')
const NinjaType = require('./ninja_type')
const Message = require('./Message')

// matches something like <@XSEEFSXGA> ++
const GENERAL = /(<?@[^ >]+>?)[ ]*(\+\+|--)/g
const USER = '<@([^ >]+)>+'
const THING = '@([^ >]+)'
const PLUS = '[ ]*\\+\\+'
const MINUS = '[ ]*--'
const PLUS_USER = new RegExp(USER + PLUS, 'i')
const PLUS_THING = new RegExp(THING + PLUS, 'i')
const MINUS_USER = new RegExp(USER + MINUS, 'i')
const MINUS_THING = new RegExp(THING + MINUS, 'i')

// https://botkit.ai/docs/readme-slack.html#incoming-message-events
const TYPE = {
  direct_message: 'direct_message',
  direct_mention: 'direct_mention',
  mention: 'mention',
  ambient: 'ambient'
}
const ALLTYPES = Object.keys(TYPE)

module.exports = class Shuriken {
  constructor (controller) {
    this.controller = controller
    this.store = new ScoreStorage(this.controller.storage)
    this.setupListeners()
  }
  setupListeners () {
    this.listenForPlusMinus()
    this.listenForRanking()
    this.listenForChannelJoin()
  }
  listenForChannelJoin () {
    this.controller.on('bot_channel_join', function (bot, message) {
      bot.reply(message, 'Hey, thanks for inviting me!')
    })
  }
  listenForPlusMinus () {
    this.controller.hears(GENERAL.source, ALLTYPES, (bot, message) => {
      message
        .text
        .match(GENERAL)
        .forEach((matchedString, i) => {
          if (matchedString.match(PLUS_USER)) {
            this.handlePlusUser(PLUS_USER.exec(matchedString)[1], bot, message)
          } else if (matchedString.match(MINUS_USER)) {
            this.handleMinusUser(MINUS_USER.exec(matchedString)[1], bot, message)
          } else if (matchedString.match(PLUS_THING)) {
            this.handlePlusThing(PLUS_THING.exec(matchedString)[1], bot, message)
          } else if (matchedString.match(MINUS_THING)) {
            this.handleMinusThing(MINUS_THING.exec(matchedString)[1], bot, message)
          } else {
            console.log('well, well, well. A match we did not handle ')
            console.log('match ', matchedString)
            console.log('message ', message.text)
          }
        })
    })
  }
  getPrettyRanking (rankingName, ninjas) {
    const msg = new Message()
      .addLine()
      .add(`Top ${rankingName}:`.indent.bold)
      .addLine()
      .add(
        ninjas.reduce((acc, ninja, index) => {
          return acc
            .addLine(`${index + 1}. `.indent)
            .add(ninja.id.mention)
            .add(` [${ninja.score.toString()} `)
            .add(`${ninja.score > 1 || ninja.score < -1 ? 'shurikens' : 'shuriken'}]`)
            .add(index === 0 ? ':fire:' : '')
        }, new Message()).get()
      )
      .addLine()
      .quote()
      .get()
    return msg
  }
  listenForRanking () {
    this.controller.hears('ranking', TYPE.direct_mention, (bot, message) => {
      console.log('heard ranking!')
      this
        .store
        .getHighestFive()
        .then(topNinjas => {
          const msg = new Message()
            .add(this.getPrettyRanking('Users', topNinjas.users))
            .addLine('')
            .add(this.getPrettyRanking('Things', topNinjas.things))
            .get()
          bot.reply(message, msg)
        }).catch(err => {
          throw new Error(err)
        })
    })
  }

  handlePlusUser (userid, bot, message) {
    return this
      .store
      .plus(userid, NinjaType.user)
      .then(newScore => bot.reply(message, `superb. [<@${userid}>] now at ${newScore} points`))
  }
  handleMinusUser (userid, bot, message) {
    return this
      .store
      .minus(userid, NinjaType.user)
      .then(newScore => bot.reply(message, `womp Womp. [<@${userid}>] now at ${newScore} points`))
  }
  handlePlusThing (thing, bot, message) {
    return this
      .store
      .plus(thing, NinjaType.thing)
      .then(newScore => bot.reply(message, `fantastic. [${thing}] now at ${newScore} points`))
  }
  handleMinusThing (thing, bot, message) {
    return this
      .store
      .minus(thing, NinjaType.thing)
      .then(newScore => bot.reply(message, `oh... ok... [${thing}] now at ${newScore} points`))
  }
}
