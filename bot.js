var Discord = require("discord.io")
var mysql = require("mysql2")
var logger = require("winston")
var auth = require("./auth.json")

logger.remove(logger.transports.Console)
logger.add(new logger.transports.Console, {
  colorize: true
})
logger.level = 'debug'

console.log(auth)

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'weeklywayne',
  database: 'weeklywayne',
  password: '9kgKHuNH5v'
})
connection.config.namedPlaceholders = true

const niceUnits = {
  lb: "Pounds",
  kg: "Kilograms",
  st: "Stone and Pounds"
}

Array.prototype.contains = function(element){
    return this.indexOf(element) > -1;
}

var bot = new Discord.Client({
  token: auth.token,
  autorun: true
})
bot.on('ready', (evt) => {
  logger.info("Connected")
  logger.info("Logged in as: ")
  logger.info(bot.username + " - (" + bot.id + ")")
})
bot.on("message", (user, userID, channelID, message, evt) => {
  if (message.substring(0,1) == "!") {
    var args = message.substring(1).split(" ")
    var command = args[0]
    args = args.splice(1)

    switch (command) {
      case "ping":
        bot.sendMessage({
          to: channelID,
          message: 'Pong!'
        })
        break
      case "hello":
        bot.sendMessage({
          to: channelID,
          message: "Hello " + evt.d.member.nick + ", we're initialised."
        })
        break
      case "setUnitPreference":
        if (["lb", "kg", "st"].contains(args[0])) {
          try {
            await registerUser(evt)
            await new Promise((resolve, reject) => {
              connection.execute("UPDATE users SET unit_preference = :pref WHERE id = :id", {
                pref: args[0],
                id: evt.d.author.id
              }, (err, res, fields) => {
                if (err) {
                  reject(err)
                }
                resolve(true)
              })
            })
            bot.sendMessage({
              to: channelID,
              message: evt.d.member.nick + ", your preference has been set to " + niceUnits[args[0]]
            })
          } catch (e) {
            bot.sendMessage({
              to: channelID,
              message: "Something went wrong!"
            })
          }
        } else {
          bot.sendMessage({
            to: channelID,
            message: "Please set your preference to one of 'lb' (pounds), 'kg' (kilograms) or 'st' (stone and pounds)"
          })
        }
    }

  }
})

function userExists(userId) {
  return new Promise((resolve, reject) => {
    connection.execut("SELECT * FROM users WHERE id = :id", {id: userId}, (err, res, fields) => {
      if (err) {
        reject(err)
      }
      if (res.length) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

function registerUser(evt) {
  return new Promise((resolve, reject) => {
    if(await userExists(evt.d.author.id)) {
      resolve(true)
    }
    connection.execute("INSERT INTO users VALUES (:id, :name, :sid, :pref)", {
      id: evt.d.author.id,
      name: evt.d.member.nick,
      sid: evt.d.guild_id,
      pref: "lb"
    }, (err, res, fields) => {
      if (err) {
        reject(err)
      }
      resolve(true)
    })
  })
}
