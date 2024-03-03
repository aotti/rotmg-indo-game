import { REST, Routes, ApplicationCommandOptionType } from 'discord.js'
import { CommandsType, SubCommandOptionsType } from '../lib/types';
import { Janken } from './Janken';

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
                // battle
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'janken_battle',
                    description: 'start the paper-rock-scissor game',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'mode',
                            description: 'janken mode, advanced has more finger options',
                            required: true,
                            choices: [
                                { name: 'Normal', value: 'normal' },
                                { name: 'Advanced', value: 'advanced' }
                            ]
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'finger',
                            description: 'the type of finger to be used',
                            required: true,
                            choices: [
                                { name: 'Paper', value: 'Paper' },
                                { name: 'Rock', value: 'Rock' },
                                { name: 'Scissor', value: 'Scissor' },
                                { name: 'Sponge (advanced)', value: 'Sponge' },
                                { name: 'Fire (advanced)', value: 'Fire' },
                                { name: 'Water (advanced)', value: 'Water' },
                                { name: 'Air (advanced)', value: 'Air' }
                            ]
                        }
                    ]
                },
                // player stats
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'janken_stats',
                    description: 'check your janken statistic',
                    options: []
                },
                // ~~~ TES EDIT REPLY ~~~
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'abc_start',
                    description: 'start abc game'
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'abc_join',
                    description: 'join abc game'
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'abc_answer',
                    description: 'answer abc game',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'answer',
                            description: 'put your answer',
                            required: true
                        }
                    ]
                }
            ]
        }
    ]

    async register() {
        const rest = new REST({ version: '10' }).setToken(process.env['BOT_TOKEN'])
        // call janken class and get all janken players
        const janken = new Janken(null, '')
        const getAllPlayers = await janken.getPlayers() // return array
        // create subCommandOptions \w choices
        // ### KALO MASUK KE HOSTING, METHOD register() HARUS SELALU RUN ULANG SETIAP ADA PLAYER BARU 
        // ### KALO MASUK KE HOSTING, METHOD register() HARUS SELALU RUN ULANG SETIAP ADA PLAYER BARU 
        const allPlayersCommand: SubCommandOptionsType = {
            type: ApplicationCommandOptionType.String,
            name: 'player',
            description: 'select the player stats you wanna see',
            choices: []
        }
        for(let player of getAllPlayers) {
            // push player name and id to choices
            allPlayersCommand.choices!.push({ name: player.username, value: `${player.id}` })
        }
        // push the subCommandOptions \w choices to options
        this.commandList[1].options![1].options!.push(allPlayersCommand)
        // start input commands to the bot
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