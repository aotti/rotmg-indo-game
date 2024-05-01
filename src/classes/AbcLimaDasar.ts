import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { FetchBodyType, IABC_Response_Profile, PlayingDataType } from "../lib/types.js";
import { config } from 'dotenv'
import { resolve } from 'path'

// set the env file
const envFilePath = resolve(process.cwd(), '.env')
config({ path: envFilePath })

export class AbcLimaDasar {
    protected interact: ChatInputCommandInteraction
    protected baseUrl: string
    protected baseChannel: string
    protected discordAPIUrl: string
    // for collecting required data while playing
    // ### COBA BUAT STATIC VARIABLE
    protected static playingData: PlayingDataType = {
        room_id: 0,
        round_number: 0,
        game_rounds: 0,
        categories: [],
        num_players: {
            message_id: '',
            count: 0
        },
        max_players: 0,
        game_status: '', // not room status
        player_data: []
    }

    constructor(interact: ChatInputCommandInteraction) {
        this.interact = interact
        this.baseUrl = process.env['ABC_API'] || 'http://localhost:3000/api'
        this.baseChannel = process.env['ABC_CHANNEL'] || '491548301162840074'
        this.discordAPIUrl = 'https://discord.com/api/v10'
    }
    
    async profile() {
        // stuff for fetch
        const playerId = this.interact.user.id
        const fetchOptions: RequestInit = { method: 'GET' }
        // fetching
        const profileResponse: IABC_Response_Profile = await this.abcFetcher(`/profile/${playerId}`, fetchOptions)
        // create embed
        const profileDescription = `**words correct** \n number of words answered correctly
                                    **words used** \n number of words answered either its right/wrong
                                    ────────────────────`
        const profileEmbed = new EmbedBuilder()
            .setTitle('Player Stats')
            .setDescription(profileDescription)
        // check status
        switch(profileResponse.status) {
            case 200:
                const playerData = profileResponse.data[0]
                // check if data is empty
                if(playerData == null) {
                    profileEmbed.addFields({
                        name: profileResponse.message as string,
                        value: 'You have to register to see your profile'
                    })
                    await this.interact.reply({ embeds: [profileEmbed], flags: 'Ephemeral' })
                    break
                }
                // fill the embed with player data
                const profileValue = "`Game Played  :` " + playerData.game_played +
                                     "\n`Words Correct:` " + playerData.words_correct +
                                     "\n`Words Used   :` " + playerData.words_used 
                profileEmbed.addFields({
                    name: playerData.username,
                    value: profileValue
                })
                await this.interact.reply({ embeds: [profileEmbed], flags: 'Ephemeral' })
                break
            case 400:
                await this.interact.reply({ content: `${profileResponse.message}`, flags: 'Ephemeral' })
                break
            case 500:
                await this.interact.reply({ content: `*server-side error\nerror: ${profileResponse.message}*`, flags: '4096' })
                break
            default:
                await this.interact.reply({ content: `stats: unknown error\n${JSON.stringify(profileResponse)}`, flags: '4096' })
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

    protected indonesiaDatetime() {
        const d = new Date()
        // utc time
        const localTime = d.getTime()
        const localOffset = d.getTimezoneOffset() * 60_000
        const utc = localTime + localOffset
        // indonesia time
        const indonesiaOffset = 7
        const indonesiaTime = utc + (3_600_000 * indonesiaOffset)
        const indonesiaNow = new Date(indonesiaTime)
        return indonesiaNow.toLocaleDateString()
    }

    protected createFetchBody<T extends FetchBodyType>(data: T) {
        return {...data}
    }
}