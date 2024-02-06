import { REST, Routes, ApplicationCommandOptionType } from 'discord.js'
import { CommandsType } from '../lib/types';

export class Commands {
    private commandList: CommandsType[] = [
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
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'janken_start',
                    description: 'start the paper-rock-scissor game',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
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
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'janken_join',
                    description: 'join to existing paper-rock-scissor game',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
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
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'janken_check',
                    description: 'check if anyone is playing'
                }
            ]
        }
    ]

    async register() {
        const rest = new REST({ version: '10' }).setToken(process.env['BOT_TOKEN'])
        try {
            console.log('preparing commands');
            // set commands for the bot
            await rest.put(
                Routes.applicationGuildCommands(process.env['BOT_ID'], process.env['GUILD_ID']),
                { body: this.commandList }
            )
            console.log('commands prepared');
        } catch (error) {
            console.log(`there was an error: ${error}`);
        }
    }
}