import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, ThreadChannel } from "discord.js";
import { FetchBodyType, IABC_Response, IABC_Response_Profile, PlayingDataType } from "../lib/types.js";
import { config } from 'dotenv'
import { resolve } from 'path'
import { WebhookErrorFetch } from "../lib/WebhookErrorHandler.js";

// set the env file
const envFilePath = resolve(process.cwd(), '.env')
config({ path: envFilePath })

export class AbcLimaDasar {
    protected interact: ChatInputCommandInteraction
    protected baseUrl: string
    protected baseChannel: string
    protected discordAPIUrl: string
    // for collecting required data while playing
    protected static playingData: PlayingDataType = {
        room_id: 0,
        round_number: 0,
        game_rounds: 0,
        categories: [],
        finger_total: 0,
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
        try {
            // stuff for fetch
            const playerId = this.interact.user.id
            const fetchOptions = this.createFetchOptions('GET')!
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
                case 400: case 500: default:
                    // normal reply
                    await this.abcFetcherErrors(null, profileResponse.status, profileResponse, false)
                    break
            }
        } catch (error: any) {
            console.log(error);
            await WebhookErrorFetch(this.interact.commandName, error)
        }
    }

    // ~~ utility method ~~
    protected async abcFetcher(endpoint: string, options: RequestInit) {
        try {
            return (await fetch(this.baseUrl + endpoint, options)).json()
        } catch (err: any) {
            console.log(`error AbcLimaDasar abcFetcher`)
            console.log(err)
            // return error object
            return {
                status: 500,
                message: err.message,
                data: []
            }
        }
    }
    
    protected async fingerButtonInteraction() {
        try {
            // button stuff
            const fingerButtons = []
            let tempFingerButtons = []
            const fingerList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
            for(let i in fingerList) {
                // create button
                const button = new ButtonBuilder()
                    .setCustomId(fingerList[i])
                    .setLabel(fingerList[i])
                    .setStyle(ButtonStyle.Secondary)
                // push button to array 
                tempFingerButtons.push(button)
                // if array 1 have 5 buttons, move to array 2
                if(tempFingerButtons.length === 5 || fingerList.length-1 === +i) {
                    fingerButtons.push(tempFingerButtons)
                    tempFingerButtons = []
                }
            }
            // set button as components
            const fingerRow = this.createButtonComponents(fingerButtons)
            // display button
            const buttonResponse = await this.interact.editReply({
                content: `Select finger:`,
                // ### MAX 5 BUTTONS FOR EACH ROW
                components: fingerRow
            })
            // button interaction
            // ensures that only the user who triggered the interaction can use the buttons
            const collectorFilter = (data: any) => data.user.id === this.interact.user.id
            // waiting player to click a button
            const confirmation = await buttonResponse.awaitMessageComponent({ filter: collectorFilter, time: 20_000 })
            // edit message after clicked a button
            await confirmation.update({ content: `You selected **${confirmation.customId}** finger`, components: [] })
            // accumulate fingers
            AbcLimaDasar.playingData.finger_total += +confirmation.customId
            // return finger
            return confirmation.customId
        } catch (error: any) {
            // interact API error
            if(error.code !== 'InteractionCollectorError') {
                await WebhookErrorFetch(this.interact.commandName, error)
                return null
            }
            // no button response, cancel the game
            await this.interact.editReply({
                content: 'You only have 20 seconds to select fingers :eyes:',
                components: []
            })
            return null
        }
    }

    protected createButtonComponents(buttons: ButtonBuilder[][]) {
        const buttonComponent = []
        for(let button of buttons) {
            const newComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(button)
            buttonComponent.push(newComponent)
        }
        return buttonComponent
    }

    protected async abcFetcherErrors(channel: ThreadChannel | null, status: number, response: IABC_Response, replyFollowUp: boolean) {
        try {
            switch(status) {
                case 400:
                    // when theres error but inside the game room
                    if(channel) {
                        await channel.send({ content: `${response.message}`, flags: '4096' })
                    }
                    // error on slash command
                    replyFollowUp 
                        ? await this.interact.followUp({ content: `${response.message}`, flags: 'Ephemeral' })
                        : await this.interact.reply({ content: `${response.message}`, flags: 'Ephemeral' })
                    break
                case 500:
                    // when theres error but inside the game room
                    if(channel) {
                        await channel.send({ content: `*server-side error\nerror: ${JSON.stringify(response.message)}*`, flags: '4096' })
                    }
                    // error on slash command
                    replyFollowUp
                        ? await this.interact.followUp({ content: `*server-side error\nerror: ${JSON.stringify(response.message)}*`, flags: '4096' })
                        : await this.interact.reply({ content: `*server-side error\nerror: ${JSON.stringify(response.message)}*`, flags: '4096' })
                    break
                default:
                    // when theres error but inside the game room
                    if(channel) {
                        await channel.send({ content: `unknown error\n${JSON.stringify(response)}`, flags: '4096' })
                    }
                    // error on slash command
                    replyFollowUp
                        ? await this.interact.followUp({ content: `unknown error\n${JSON.stringify(response)}`, flags: '4096' })
                        : await this.interact.reply({ content: `unknown error\n${JSON.stringify(response)}`, flags: '4096' })
                    break
            }
        } catch (error: any) {
            console.log(error);
            await WebhookErrorFetch(`abcFetchErrors`, error)
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

    protected createFetchOptions(method: string, fetchBody?: {action: string; payload: {} | {}[]}): RequestInit | null {
        switch(method) {
            case 'GET':
                return {
                    method: method,
                    headers: {
                        'authorization': process.env['UUID_V4'],
                        'user-id': this.interact.user.id
                    }
                }
            case 'POST': case 'PATCH':
                return {
                    method: method, 
                    headers: {
                        'authorization': process.env['UUID_V4'],
                        'user-id': this.interact.user.id,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify(fetchBody) 
                }
            default:
                return null
        }
    }
}