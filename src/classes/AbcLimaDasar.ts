import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { IABC_Response_Stats } from "../lib/types";
import { config } from 'dotenv'
import { resolve } from 'path'

// set the env file
const envFilePath = resolve(process.cwd(), '.env')
config({ path: envFilePath })

export class AbcLimaDasar {
    protected interact: ChatInputCommandInteraction
    protected baseUrl: string

    constructor(interact: ChatInputCommandInteraction) {
        this.interact = interact
        this.baseUrl = process.env['ABC_API'] || 'http://localhost:3000/api'
    }
    
    async stats() {
        // stuff for fetch
        const playerId = +this.interact.user.id
        const fetchOptions: RequestInit = { method: 'GET' }
        // fetching
        const statsResponse: IABC_Response_Stats = await this.abcFetcher(`/profile/${playerId}`, fetchOptions)
        // create embed
        const statsEmbed = new EmbedBuilder().setTitle('Player Stats')
        // check status
        switch(statsResponse.status) {
            case 200:
                const playerData = statsResponse.data[0]
                // check if data is empty
                if(playerData == null) {
                    statsEmbed.addFields({
                        name: statsResponse.message as string,
                        value: 'You have to register to see your stats'
                    })
                    await this.interact.reply({ embeds: [statsEmbed], flags: 'Ephemeral' })
                    break
                }
                // fill the embed with player data
                statsEmbed.addFields({
                    name: playerData.username,
                    value: `game: ${playerData.game_played}
                            words used: ${playerData.words_used}`
                })
                await this.interact.reply({ embeds: [statsEmbed], flags: 'Ephemeral' })
                break
            case 400:
                await this.interact.reply({ content: 'input data error', flags: 'Ephemeral' })
                break
            case 500:
                await this.interact.reply({ content: `*server-side error\nerror: ${statsResponse.message}*`, flags: '4096' })
                break
        }
    }

    // ~~ utility method ~~
    protected async abcFetcher(endpoint: string, options: RequestInit) {
        let fetchResult
        try {
            return fetchResult = (await fetch(this.baseUrl + endpoint, options)).json()
        } catch (err: any) {
            console.log(`error AbcLimaDasar abcFetcher`)
            console.log(err)
            // return error object
            return fetchResult = {
                status: 500,
                message: err.message,
                data: []
            }
        }
    }
}