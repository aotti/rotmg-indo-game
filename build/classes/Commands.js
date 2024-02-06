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
exports.Commands = void 0;
const discord_js_1 = require("discord.js");
class Commands {
    constructor() {
        this.commandList = [
            {
                name: 'greetings',
                description: 'the gaming bot greets you'
            },
            // game commands
            {
                name: 'gaming',
                description: 'gaming commands',
                options: [
                    // ~~~ JANKEN GAME COMMANDS ~~~
                    // start game
                    {
                        type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                        name: 'janken_start',
                        description: 'start the paper-rock-scissor game',
                        options: [
                            {
                                type: discord_js_1.ApplicationCommandOptionType.String,
                                name: 'finger',
                                description: 'the type of finger to be used',
                                required: true,
                                choices: [
                                    { name: 'Paper', value: 'Paper' },
                                    { name: 'Rock', value: 'Rock' },
                                    { name: 'Scissor', value: 'Scissor' }
                                ]
                            }
                        ]
                    },
                    // join game
                    {
                        type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                        name: 'janken_join',
                        description: 'join to existing paper-rock-scissor game',
                        options: [
                            {
                                type: discord_js_1.ApplicationCommandOptionType.String,
                                name: 'finger',
                                description: 'the type of finger to be used',
                                required: true,
                                choices: [
                                    { name: 'Paper', value: 'Paper' },
                                    { name: 'Rock', value: 'Rock' },
                                    { name: 'Scissor', value: 'Scissor' }
                                ]
                            }
                        ]
                    },
                    // check game
                    {
                        type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                        name: 'janken_check',
                        description: 'check if anyone is playing'
                    }
                ]
            }
        ];
    }
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env['BOT_TOKEN']);
            try {
                console.log('preparing commands');
                // set commands for the bot
                yield rest.put(discord_js_1.Routes.applicationGuildCommands(process.env['BOT_ID'], process.env['GUILD_ID']), { body: this.commandList });
                console.log('commands prepared');
            }
            catch (error) {
                console.log(`there was an error: ${error}`);
            }
        });
    }
}
exports.Commands = Commands;
