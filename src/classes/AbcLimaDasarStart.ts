import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Channel, ChatInputCommandInteraction, ThreadChannel } from "discord.js";
import { AbcLimaDasar } from "./AbcLimaDasar";
import { IABC_Response_Categories, IABC_Response_CreateRoom, PlayerAnswersType, Thread_Create_Fail, Thread_Create_Success } from "../lib/types";

export class AbcLimaDasarStart extends AbcLimaDasar {
    private categoryAmount: number
    
    constructor(interact: ChatInputCommandInteraction, categoryAmount: number) {
        super(interact)
        this.categoryAmount = categoryAmount
    }

    async start() {
        // only run the game in base channel
        if(this.interact.channelId !== this.baseChannel) {
            return await this.interact.reply({
                content: 'this game only allowed in <#479503233157693443> channel :sob:',
                flags: 'Ephemeral'
            })
        }
        // defer reply
        await this.interact.deferReply({ ephemeral: true })
        // chosen categories after button interact
        const chosenCategories = []
        // loop to get categories
        for(let i=0; i<this.categoryAmount; i++) {
            // create buttons and interaction for category
            const category = await this.categoryButtonInteraction()
            if(category === null) return // fail to create buttons
            // check if the category is already exist
            const isCategoryExist = chosenCategories.indexOf(category)
            // similar category exist
            if(isCategoryExist !== -1) {
                return await this.interact.editReply({ 
                    content: `You selected the same category :skull:` 
                })
            }
            // push category
            chosenCategories.push(category)
        }
        // select categories done
        await this.interact.editReply({ 
            content: `You selected **${chosenCategories.join('** & **')}** categories :sunglasses:\ncreating room... :hourglass:` 
        })
        // stuff to insert into abc_rooms
        const gameStartData = {
            // name, password, num_players, max_players, rules
            name: this.interact.options.get('room_name')?.value as string,
            password: this.interact.options.get('room_password')?.value as string || null,
            num_players: 1, // should be only 1 if game just started
            max_players: this.interact.options.get('max_players')?.value as number,
            rules: `categories=${chosenCategories.join(',')};game_rounds=${this.interact.options.get('game_rounds')?.value}`
        }
        // fetching stuff
        const fetchBody = {
            action: 'create room',
            payload: gameStartData
        }
        const fetchOptions: RequestInit = {
            method: 'POST',
            headers: {
                'Authorization': this.interact.user.id,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fetchBody)
        }
        // insert data to abc_rooms
        const createRoomResponse: IABC_Response_CreateRoom = await this.abcFetcher('/room/create', fetchOptions)
        // check status
        switch(createRoomResponse.status) {
            case 200:
                const data = createRoomResponse.data[0]
                // create thread fetching stuff
                const createThreadOptions: RequestInit = {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${process.env['BOT_TOKEN']}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: `${this.indonesiaDatetime()} - ${data.name}`, // date + room name
                        auto_archive_duration: 60, // 1 hour
                        type: 12, // 11 = public, 12 = private
                        invitable: false // false = only thread creator can invite
                    })
                }
                const createThreadAPI = `${this.discordAPIUrl}/channels/${this.baseChannel}/threads`
                type CreateThreadType = Thread_Create_Success | Thread_Create_Fail
                const createThread: CreateThreadType = await (await fetch(createThreadAPI, createThreadOptions)).json()
                // create thread fail
                if((createThread as Thread_Create_Fail).code) {
                    const createThreadFail = createThread as Thread_Create_Fail
                    await this.interact.followUp({ content: `${JSON.stringify(createThreadFail.errors)}`, flags: '4096' })
                    break
                }
                // create thread success
                const createThreadSuccess = createThread as Thread_Create_Success
                await this.interact.editReply({ content: `ABC 5 Dasar room <#${createThreadSuccess.id}> created!` })
                // fetch thread channel for bot to send & listen to messages
                const gameRoom = await this.interact.channel!.client.channels.fetch(createThreadSuccess.id) as ThreadChannel
                this.playing([data, gameRoom])
                break
            case 400:
                await this.interact.followUp({ content: `${createRoomResponse.message}`, flags: 'Ephemeral' })
                break
            case 500:
                await this.interact.followUp({ content: `*server-side error\nerror: ${JSON.stringify(createRoomResponse.message)}*`, flags: '4096' })
                break
            default:
                await this.interact.followUp({ content: `create room: unknown error\n${JSON.stringify(createRoomResponse)}`, flags: '4096' })
        }
    }

    private playing(gameData: [IABC_Response_CreateRoom['data'][0], ThreadChannel]) {
        const [data, gameRoom] = gameData
        // send game created notice
        // categories=first,second;rounds=1 => split ; (split rules) 
        const gameRules = data.rules.split(';')
        // categories=first,second => split = (get values)
        // first,second => split , (get array)
        const gameCategories = gameRules[0].split('=')[1].split(',')
        // game_rounds=1 => split = (get number)
        const gameRounds = +gameRules[1].split('=')[1]
        const gameCreatedNotice = "ABC 5 Dasar gaming room :sunglasses:" + 
                                "\n---------------------------" +
                                `\n**Started by:** <@${this.interact.user.id}>` +
                                `\n**Categories:** ${gameCategories.join(' & ')}` +
                                `\n**Game round:** ${gameRounds} round(s)` +
                                `\n**Max player:** ${data.max_players} players`
        gameRoom.send(gameCreatedNotice)
        // send player count
        const gamePlayerCount = `**Player join:** ${data.num_players} player(s)` 
        gameRoom.send(gamePlayerCount)
        // send info about how to play the game
        const gameHowtoplay = "---------------------------" +
                            "\nSend the answer below and **your 1st message is gonna be the answer**" +
                            "\nThe game will last for 10 minutes, if there's only 1 player" +
                            "\nafter the times up, the game will be canceled"
        gameRoom.send(gameHowtoplay)
        // // send game round info
        // const gameRoundInfo = `Round 1`
        // gameRoom.send(gameRoundInfo)
        // listen to messages
        // collect player answers
        const playerAnswers: PlayerAnswersType[] = []
        gameRoom.client.on('messageCreate', async (msg) => {
            // ignore msg from bot
            if(msg.author.bot) return
            // listen to user messages
            // check if player already answered
            const isPlayerAnswered = playerAnswers.map(v => v.player_id).indexOf(msg.author.id)
            // if the player havent send any message 
            if(isPlayerAnswered === -1) {
                // push the player 1st message as answer
                playerAnswers.push({
                    player_id: msg.author.id,
                    answer: msg.content
                })
                // react :stonks: the answer
                await msg.react('608521889945485312')
            }
        })
    }

    // ~~ utility method ~~
    protected async categoryButtonInteraction() {
        // fetch stuff
        const fetchOptions: RequestInit = { method: 'GET' }
        const categoryResponse: IABC_Response_Categories = await this.abcFetcher('/word/categories', fetchOptions)
        if(categoryResponse.status === 200) {
            // button stuff
            const categoryButtons = [[], []] as any[][]
            const categoryList = categoryResponse.data.map(v => { return v.category })
            for(let i in categoryList) {
                // create button
                const button = new ButtonBuilder()
                    .setCustomId(categoryList[i])
                    .setLabel(categoryList[i])
                    .setStyle(ButtonStyle.Secondary)
                // push button to array 
                if(+i >= 5) {
                    categoryButtons[1].push(button)
                }
                else {
                    categoryButtons[0].push(button)
                }
            }
            // set button as components
            const categoryRow_1 = new ActionRowBuilder<ButtonBuilder>().addComponents(categoryButtons[0])
            const categoryRow_2 = new ActionRowBuilder<ButtonBuilder>().addComponents(categoryButtons[1])
            // display button
            const buttonResponse = await this.interact.editReply({
                content: `Select categories:`,
                // ### MAX 5 BUTTONS FOR EACH ROW
                components: [categoryRow_1, categoryRow_2]
            })
            // button interaction
            try {
                // ensures that only the user who triggered the interaction can use the buttons
                const collectorFilter = (i: any) => i.user.id === this.interact.user.id
                // waiting player to click a button
                const confirmation = await buttonResponse.awaitMessageComponent({ filter: collectorFilter, time: 20_000 })
                // edit message after clicked a button
                await confirmation.update({ content: `You selected **${confirmation.customId}** category`, components: [] })
                // return selected category
                return confirmation.customId
            } catch (err) {
                // no button response, cancel the game
                await this.interact.editReply({
                    content: 'You only have 20 seconds to select categories :eyes:',
                    components: []
                })
                return null
            }
        }
        else {
            // server side 
            await this.interact.reply({ content: `*server-side error\nerror: ${categoryResponse.message}*`, flags: '4096' })
            return null
        }
    }
}