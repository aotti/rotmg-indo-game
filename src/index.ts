import { Client, IntentsBitField } from 'discord.js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { Commands } from './classes/Commands';
import { Messages } from './classes/Messages';

// set the env file
const envFilePath = resolve(process.cwd(), '.env')
config({ path: envFilePath })

// Initialize Discord Bot 
const bot = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMembers
    ]
});

// log message when bot online
bot.on('ready', (b) => {
    console.log(`${b.user.tag} is online at ${new Date().toLocaleTimeString()}`);
    // set custom status (activity)
    b.user.setActivity('/gaming')
    // register commands
    const command = new Commands()
    command.register()
})

// listen to any slash command
bot.on('interactionCreate', async (interact) => {
    // check if user really use slash command
    if(!interact.isChatInputCommand()) return
    // reply to user who interacted with slash commands
    const messages = new Messages()
    messages.reply(interact)
})

// make bot comes online
bot.login(process.env['BOT_TOKEN'])