import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ThreadChannel } from "discord.js";
import { AbcLimaDasar } from "./AbcLimaDasar.js";
import { IABC_Response_Categories, IABC_Response_CreateRoom, IABC_Response_GetWords, IABC_Response_Rounds, IABC_Response_Profile, IABC_Response_UpdateRoom, Thread_Create_Fail, Thread_Create_Success } from "../lib/types.js";
import { WebhookErrorFetch } from "../lib/WebhookErrorHandler.js";
import { AbcLimaDasarGame } from "./AbcLimaDasarGame.js";

export class AbcLimaDasarStart extends AbcLimaDasar {
    private categoryAmount: number
    private abcLimaDasarGame = new AbcLimaDasarGame(this.interact)
    
    constructor(interact: ChatInputCommandInteraction, categoryAmount: number) {
        super(interact)
        this.categoryAmount = categoryAmount
    }

    async start() {
        try {
            // only run the game in base channel
            if(this.interact.channelId !== this.baseChannel) {
                return await this.interact.reply({
                    content: `this command only allowed in <#${this.baseChannel}> channel :sob:`,
                    flags: 'Ephemeral'
                })
            }
            // check if there's running game
            const isGameStarted = AbcLimaDasar.playingData.game_status
            if(isGameStarted === 'playing') {
                // there is a running game
                return await this.interact.reply({ content: 'there is a running game <:mmyea:595475016959655967>', flags: 'Ephemeral' })
            }
            // defer reply
            await this.interact.deferReply({ ephemeral: true })
            // select finger
            const chosenFingers = await this.fingerButtonInteraction()
            if(chosenFingers === null) return
            // category selection
            const categorySelection = this.interact.options.get('category_selection')?.value
            let chosenCategories: string[] = []
            // player gonna pick the categories
            if(categorySelection) {
                // fetch stuff
                const fetchOptions = this.createFetchOptions('GET')!
                const categoryResponse: IABC_Response_Categories = await this.abcFetcher('/word/categories', fetchOptions)
                if(categoryResponse.status === 200) {
                    for(let i=0; i<this.categoryAmount; i++) {
                        // create buttons and interaction for category
                        const pickCategory = await this.categoryButtonInteraction(categoryResponse.data, i)
                        // fail to create buttons
                        if(pickCategory === null) return
                        // remove selected category from selection
                        const removeCategory = categoryResponse.data.map(v => v.category).indexOf(pickCategory)
                        if(removeCategory !== -1) {
                            // category removed
                            categoryResponse.data.splice(removeCategory, 1)
                            // push category to chosen categories
                            chosenCategories.push(pickCategory)
                        }
                        else {
                            return await this.interact.editReply({ content: `fail to remove category selection 💀` })
                        } 
                    }
                }
                else {
                    // server side 
                    return await this.interact.followUp({ content: `*server-side error\nerror: ${JSON.stringify(categoryResponse.message)}*`, flags: '4096' })
                }
            }
            // bot gonna pick random categories
            else {
                // random pick for category
                chosenCategories = await this.categoryRandomSelection(this.categoryAmount) as string[]
                // fail get categories
                if(chosenCategories === null) return 
            }
            // select categories done
            await this.interact.editReply({ 
                content: `You selected **${chosenFingers}** fingers and **${chosenCategories.length}** categories :sunglasses:\ncreating room... :hourglass:` 
            })
            // stuff to insert into abc_rooms
            const roomPassword = this.interact.options.get('room_password')?.value as string || null
            const gameStartData = {
                // id, name, password, num_players, max_players, rules, status
                name: this.interact.options.get('room_name')?.value as string,
                password: roomPassword,
                num_players: 1, // should be only 1 if game just started
                max_players: this.interact.options.get('max_players')?.value as number,
                rules: `categories=${chosenCategories.join(',')};game_rounds=${this.interact.options.get('game_rounds')?.value}`,
                status: 'open' // default, room always open when just created
            }
            // fetching stuff
            const fetchBodyCreate = this.createFetchBody({
                action: 'create room',
                payload: gameStartData
            })
            const fetchOptionsCreate = this.createFetchOptions('POST', fetchBodyCreate)!
            // insert data to abc_rooms
            const createRoomResponse: IABC_Response_CreateRoom = await this.abcFetcher('/room/create', fetchOptionsCreate)
            // check status
            switch(createRoomResponse.status) {
                case 200:
                    const createData = createRoomResponse.data[0]
                    // create thread fetching stuff
                    const createThreadOptions: RequestInit = {
                        method: 'POST',
                        headers: {
                            'authorization': `Bot ${process.env['BOT_TOKEN']}`,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: `${this.indonesiaDatetime()} - ${createData.name}`, // date + room name
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
                    // update fetching stuff
                    const fetchBodyUpdate = this.createFetchBody({
                        action: 'update room',
                        payload: {
                            id: createData.id,
                            thread_id: createThreadSuccess.id
                        }
                    })
                    const fetchOptionsUpdate = this.createFetchOptions('PATCH', fetchBodyUpdate)!
                    // update thread_id, the bot can summon the room
                    const updateRoomResponse: IABC_Response_UpdateRoom = await this.abcFetcher('/room/update', fetchOptionsUpdate)
                    switch(updateRoomResponse.status) {
                        case 200:
                            const updateData = updateRoomResponse.data[0]
                            await this.interact.editReply({ content: `ABC 5 Dasar room <#${updateData.thread_id}> created! :wink:` })
                            break
                        case 400: case 500: default:
                            await this.abcFetcherErrors(null, updateRoomResponse.status, updateRoomResponse, true)
                            break
                    }
                    // fetch thread channel for bot to send & listen to messages
                    const gameRoom = await this.interact.channel!.client.channels.fetch(createThreadSuccess.id) as ThreadChannel
                    // send game created notice
                    // categories=first,second;rounds=1 => split ; (split rules) 
                    const gameRules = createData.rules.split(';')
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
                                            `\n**Max player:** ${createData.max_players} players`
                    gameRoom.send(gameCreatedNotice)
                    // send player count
                    const gamePlayerCount = `**Player join:** ${createData.num_players} player(s) 👀` 
                    const gamePlayerCountMessage = await gameRoom.send(gamePlayerCount)
                    AbcLimaDasar.playingData.num_players.message_id = gamePlayerCountMessage.id
                    // send info about how to play the game
                    const gameHowtoplay = "---------------------------" +
                                        "\nSend the answer below" +
                                        "\n## **Your 1st message is gonna be the answer**" +
                                        "\nThe game will last for 10 minutes, if there's only 1 player" +
                                        "\nafter the times up, the game will be canceled" +
                                        "\n### **all player must react to 🔥 emoji to start the game**" +
                                        "\n---------------------------" 
                    const gameHowtoplayMsg = await gameRoom.send(gameHowtoplay)
                    await gameRoom.messages.cache.get(gameHowtoplayMsg.id)?.react('🔥')
                    // update playing data
                    AbcLimaDasar.playingData.room_id = createData.id
                    AbcLimaDasar.playingData.round_number = 1
                    AbcLimaDasar.playingData.game_rounds = gameRounds
                    AbcLimaDasar.playingData.categories = gameCategories
                    AbcLimaDasar.playingData.num_players.count = createData.num_players
                    AbcLimaDasar.playingData.max_players = createData.max_players
                    AbcLimaDasar.playingData.game_status = 'playing'
                    // insert player data to playing data
                    AbcLimaDasar.playingData.player_data.push({
                        player_id: this.interact.user.id,
                        answer_id: [],
                        answer_words: [],
                        answer_points: 0,
                        answer_status: false
                    })
                    // send game started for others
                    const discordUsername = (this.interact.member as any).nickname || this.interact.user.displayName
                    const gameStartedInfo = await this.interact.followUp({ 
                        content: `**${discordUsername}** started abc 5 dasar game ${roomPassword ? '🔒' : '👀'}`, flags: '4096' 
                    })
                    // delete message and lock the room after 10 mins
                    setTimeout(async () => {
                        // update room status 
                        // fetching stuff for update room
                        const fetchBodyUpdate = this.createFetchBody({
                            action: 'update room',
                            payload: {
                                id: AbcLimaDasar.playingData.room_id,
                                status: 'closed'
                            }
                        })
                        const fetchOptionsUpdate = this.createFetchOptions('PATCH', fetchBodyUpdate)!
                        // update room status
                        const updateRoomResponse: IABC_Response_UpdateRoom = await this.abcFetcher('/room/update', fetchOptionsUpdate)
                        switch(updateRoomResponse.status) {
                            case 200:
                                // lock the room
                                await gameRoom.setLocked(true, 'no one join')
                                // delete message
                                await gameStartedInfo.delete()
                                break
                            case 400: case 500: default:
                                // follow up
                                await this.abcFetcherErrors(null, updateRoomResponse.status, updateRoomResponse, true)
                                break
                        }
                    }, 600_000);
                    // all player have to react to start the game
                    let [reactMessage, playerReacts] = [false, 0]
                    const tempThis = this
                    gameRoom.client.on('messageReactionAdd', async function gamePrepare(msg) {
                        // match the message id to prevent react 🔥 anywhere
                        reactMessage = gameHowtoplayMsg.id === msg.message.id
                        // count player reacts, -1 due to bot
                        playerReacts = msg.count! - 1
                        // start the game if conditions match 
                        if(reactMessage && playerReacts === 2) {
                            // get words from database
                            const wordsContainer: {id: number; word: string}[] = []
                            for(let category of AbcLimaDasar.playingData.categories) {
                                // fetching stuff
                                const fetchOptionsWords = tempThis.createFetchOptions('GET')!
                                const wordsResponse: IABC_Response_GetWords = await tempThis.abcFetcher(`/word/${category}`, fetchOptionsWords)
                                switch(wordsResponse.status) {
                                    case 200:
                                        // push id and word to container
                                        wordsResponse.data.map(v => wordsContainer.push({id: v.id, word: v.word}))
                                        break
                                    case 400: case 500: default:
                                        // gameroom
                                        await tempThis.abcFetcherErrors(gameRoom, wordsResponse.status, wordsResponse, false)
                                        break
                                }
                            }
                            // game is running
                            tempThis.abcLimaDasarGame.playing(gameRoom, wordsContainer)
                            // turn off listener after all player have reacted
                            gameRoom.client.off('messageReactionAdd', gamePrepare)
                        }
                    })
                    break
                case 400: case 500: default:
                    // follow up
                    await this.abcFetcherErrors(null, createRoomResponse.status, createRoomResponse, true)
                    break
            }
        } catch (error: any) {
            console.log(error);
            await WebhookErrorFetch(`${this.interact.commandName}-start`, error)
        }
    }

    // ~~ utility method ~~
    protected async categoryButtonInteraction(categoryResponseData: IABC_Response_Categories['data'], num: number) {
        try {
            // button stuff
            const categoryButtons = []
            let tempCategoryButtons = []
            const categoryList = categoryResponseData.map(v => v.category)
            for(let i in categoryList) {
                // skip none category
                if(categoryList[i] === 'none') continue
                // create button
                const button = new ButtonBuilder()
                    .setCustomId(categoryList[i])
                    .setLabel(categoryList[i])
                    .setStyle(ButtonStyle.Secondary)
                // push button to array 
                tempCategoryButtons.push(button)
                // if array 1 have 5 buttons, move to array 2
                if(tempCategoryButtons.length === 5 || categoryList.length-1 === +i) {
                    categoryButtons.push(tempCategoryButtons)
                    tempCategoryButtons = []
                }
            }
            // set button as components
            const categoryRow = this.createButtonComponents(categoryButtons)
            // display button
            const buttonResponse = await this.interact.editReply({
                content: `Select category ${num+1}:`,
                // ### MAX 5 BUTTONS FOR EACH ROW
                components: categoryRow
            })
            // button interaction
            // ensures that only the user who triggered the interaction can use the buttons
            const collectorFilter = (i: any) => i.user.id === this.interact.user.id
            // waiting player to click a button
            const confirmation = await buttonResponse.awaitMessageComponent({ filter: collectorFilter, time: 20_000 })
            // edit message after clicked a button
            await confirmation.update({ content: `You selected **${confirmation.customId}** category`, components: [] })
            // return selected category
            return confirmation.customId
        } catch (error: any) {
            // interact API error
            if(error.code !== 'InteractionCollectorError') {
                await WebhookErrorFetch(this.interact.commandName, error)
                return null
            }
            // no button response, cancel the game
            await this.interact.editReply({
                content: 'You only have 20 seconds to select categories :eyes:',
                components: []
            })
            return null
        }
    }

    protected async categoryRandomSelection(categoryAmount: number) {
        try {
            // fetch stuff
            const fetchOptions = this.createFetchOptions('GET')!
            const categoryResponse: IABC_Response_Categories = await this.abcFetcher('/word/categories', fetchOptions)
            if(categoryResponse.status === 200) {
                // category stuff
                const categorySelected = []
                const fingerList = categoryResponse.data.map(v => v.category).filter(i => i != 'none')
                // select random categories
                for(let i=0; i<categoryAmount; i++) {
                    const randomCategory = Math.floor(Math.random() * fingerList.length)
                    categorySelected.push(fingerList.splice(randomCategory, 1)[0])
                }
                return categorySelected
            }
            else {
                // server side 
                await this.interact.followUp({ content: `*server-side error\nerror: ${JSON.stringify(categoryResponse.message)}*`, flags: '4096' })
                return null
            }
        } catch (error: any) {
            // interact API error
            await WebhookErrorFetch(this.interact.commandName, error)
            return null
        }
    }
}