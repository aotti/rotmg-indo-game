import { REST, Routes, ApplicationCommandOptionType } from 'discord.js'
import { CommandsType, SubCommandOptionsType } from '../lib/types';
import { Janken } from './Janken';

export class Commands {
    // command list
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
                                { name: 'Paper', value: 'paper' },
                                { name: 'Rock', value: 'rock' },
                                { name: 'Scissor', value: 'scissor' },
                                { name: 'Sponge (advanced)', value: 'sponge' },
                                { name: 'Fire (advanced)', value: 'fire' },
                                { name: 'Water (advanced)', value: 'water' },
                                { name: 'Air (advanced)', value: 'air' }
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
                // ~~~ ABC 5 DASAR COMMANDS ~~~
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'abc_stats',
                    description: 'check abc 5 dasar player stats'
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'abc_register',
                    description: 'register your data to play abc 5 dasar',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'username',
                            description: 'username will be lowercase no matter what; characters: alphabet, number, - or _',
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'abc_start',
                    description: 'start abc 5 dasar game',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: 'game_rounds',
                            description: 'set round number',
                            required: true,
                            choices: [
                                { name: '1 (一)', value: 1 },
                                { name: '2 (ニ)', value: 2 },
                                { name: '3 (三)', value: 3 },
                                { name: '4 (四)', value: 4 }
                            ]
                        },
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: 'category_amount',
                            description: 'select how many category you gonna pick',
                            required: true,
                            choices: [
                                { name: '1', value: 1 },
                                { name: '2', value: 2 }
                            ]
                        },
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: 'max_players',
                            description: 'set the limit of players who can join',
                            required: true,
                            choices: [
                                { name: '2', value: 2 },
                                { name: '3', value: 3 },
                                { name: '4', value: 4 },
                                { name: '5', value: 5 },
                                { name: '6', value: 6 },
                                { name: '7', value: 7 }
                            ]
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'room_name',
                            description: 'set room name, this name can be used to search for running game',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'room_password',
                            description: '(OPTIONAL) if you wanna play private game'
                        }
                    ]
                }
            ]
        }
    ]

    private async alterCommandList() {
        // call janken class and get all janken players
        const janken = new Janken(null)
        const getAllPlayers = await janken.getPlayers() // return array
        // create subCommandOptions \w choices
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
    }

    async register() {
        // ### KALO MASUK KE HOSTING, METHOD register() HARUS SELALU RUN ULANG SETIAP ADA PLAYER BARU 
        // ### KALO MASUK KE HOSTING, METHOD register() HARUS SELALU RUN ULANG SETIAP ADA PLAYER BARU 
        const rest = new REST({ version: '10' }).setToken(process.env['BOT_TOKEN'])
        // start input commands to the bot
        try {
            console.log('preparing commands');
            await this.alterCommandList()
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