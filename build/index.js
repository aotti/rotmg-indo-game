"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const Commands_1 = require("./classes/Commands");
const Messages_1 = require("./classes/Messages");
// set the env file
const envFilePath = (0, path_1.resolve)(process.cwd(), '.env');
(0, dotenv_1.config)({ path: envFilePath });
// register commands
const command = new Commands_1.Commands();
command.register();
// Initialize Discord Bot 
const bot = new discord_js_1.Client({
    intents: [
        discord_js_1.IntentsBitField.Flags.Guilds,
        discord_js_1.IntentsBitField.Flags.GuildMessages,
        discord_js_1.IntentsBitField.Flags.MessageContent
    ]
});
// log message when bot online
bot.on('ready', (b) => {
    console.log(`${b.user.tag} is online at ${new Date().toLocaleTimeString()}`);
});
// listen to any slash command
bot.on('interactionCreate', (interact) => __awaiter(void 0, void 0, void 0, function* () {
    // check if user really use slash command
    if (!interact.isChatInputCommand())
        return;
    // reply to user who interacted with slash commands
    const messages = new Messages_1.Messages();
    messages.reply(interact);
}));
// make bot comes online
bot.login(process.env['BOT_TOKEN']);
