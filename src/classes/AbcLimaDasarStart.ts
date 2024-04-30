import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ThreadChannel } from "discord.js";
import { AbcLimaDasar } from "./AbcLimaDasar";
import { IABC_Response_Categories, IABC_Response_CreateRoom, IABC_Response_GetWords, IABC_Response_Rounds, IABC_Response_Profile, IABC_Response_UpdateRoom, Thread_Create_Fail, Thread_Create_Success } from "../lib/types";

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
        // chosen categories after button interact
        const chosenCategories = []
        // loop to get categories
        for(let i=0; i<this.categoryAmount; i++) {
            // create buttons and interaction for category
            const category = await this.categoryButtonInteraction(i)
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
            // id, name, password, num_players, max_players, rules, status
            name: this.interact.options.get('room_name')?.value as string,
            password: this.interact.options.get('room_password')?.value as string || null,
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
        const fetchOptionsCreate: RequestInit = {
            method: 'POST', 
            headers: {
                'authorization': process.env['UUID_V4'],
                'user-id': this.interact.user.id,
                'content-type': 'application/json'
            },
            body: JSON.stringify(fetchBodyCreate)
        }
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
                const fetchOptionsUpdate: RequestInit = {
                    method: 'PATCH', 
                    headers: {
                        'authorization': process.env['UUID_V4'],
                        'user-id': this.interact.user.id,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify(fetchBodyUpdate) 
                }
                // update thread_id, the bot can summon the room
                const updateRoomResponse: IABC_Response_UpdateRoom = await this.abcFetcher('/room/update', fetchOptionsUpdate)
                switch(updateRoomResponse.status) {
                    case 200:
                        const updateData = updateRoomResponse.data[0]
                        await this.interact.editReply({ content: `ABC 5 Dasar room <#${updateData.thread_id}> created! :wink:` })
                        break
                    case 400:
                        await this.interact.followUp({ content: `${updateRoomResponse.message}`, flags: 'Ephemeral' })
                        break
                    case 500:
                        await this.interact.followUp({ content: `*server-side error\nerror: ${JSON.stringify(updateRoomResponse.message)}*`, flags: '4096' })
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
                const gamePlayerCount = `**Player join:** ${createData.num_players} player(s)` 
                const gamePlayerCountMessage = await gameRoom.send(gamePlayerCount)
                AbcLimaDasar.playingData.num_players.message_id = gamePlayerCountMessage.id
                // send info about how to play the game
                const gameHowtoplay = "---------------------------" +
                                    "\nSend the answer below and **your 1st message is gonna be the answer**" +
                                    "\nThe game will last for 10 minutes, if there's only 1 player" +
                                    "\nafter the times up, the game will be canceled" +
                                    "\n---------------------------" 
                gameRoom.send(gameHowtoplay)
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
                const gameStartedInfo = await this.interact.followUp({ content: `**${discordUsername}** started abc 5 dasar game :eyes:`, flags: '4096' })
                // delete message after 30 mins
                setTimeout(() => {
                    gameStartedInfo.delete()
                }, 1800_0e3);
                // game is running
                this.playing(gameRoom)
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

    private async playing(gameRoom: ThreadChannel) {
        const tempThis = this
        // countdown 
        gameRoom.send('Starting in 3 seconds...')
        setTimeout(() => {
            // round number info
            const gameRoundNumber = `Round ${AbcLimaDasar.playingData.round_number} :fire:` +
                                    "\n---------------------------"
            gameRoom.send(gameRoundNumber)
            // alternative playingData.player_data container 
            // declare outside listener to prevent data loss when any return fired
            let tempAnswers: {player_id: string, answer: string}[] = []
            // listen to user messages 
            gameRoom.client.on('messageCreate', async function gameAnswersListener(msg) {
                // listen only to the game room & ignore msg from bot 
                if(msg.channelId !== gameRoom.id || msg.author.bot) return
                // check if player exist
                const isPlayerJoined = AbcLimaDasar.playingData.player_data.map(v => v.player_id).indexOf(msg.author.id)
                // player exist
                if(isPlayerJoined !== -1) {
                    // check if player already answered
                    const isPlayerAnswered = AbcLimaDasar.playingData.player_data[isPlayerJoined].answer_status
                    if(isPlayerAnswered === false) {
                        // update player answer status
                        AbcLimaDasar.playingData.player_data[isPlayerJoined].answer_status = true
                        // push answer
                        tempAnswers.push({ player_id: msg.author.id, answer: msg.content })
                        // give react to the answer
                        msg.react('608521889945485312')
                        // get answer status
                        const playerAnswerStatus = AbcLimaDasar.playingData.player_data.map(v => {
                            if(v.answer_status === true)
                                return v.answer_status 
                        }).filter(i => i)
                        // if theres only 1 answer OR answer length < total player joined, stop
                        if(playerAnswerStatus.length === 1 || playerAnswerStatus.length < AbcLimaDasar.playingData.player_data.length) return 
    
                        // get words from database
                        const wordsContainer: {id: number; word: string}[] = []
                        for(let category of AbcLimaDasar.playingData.categories) {
                            // fetching stuff
                            const fetchOptionsWords: RequestInit = { method: 'GET' }
                            const wordsResponse: IABC_Response_GetWords = await tempThis.abcFetcher(`/word/${category}`, fetchOptionsWords)
                            switch(wordsResponse.status) {
                                case 200:
                                    // push id and word to container
                                    wordsResponse.data.map(v => wordsContainer.push({id: v.id, word: v.word}))
                                    break
                                case 400:
                                    await gameRoom.send({ content: `${wordsResponse.message}`, flags: '4096' })
                                    break
                                case 500:
                                    await gameRoom.send({ content: `*server-side error\nerror: ${JSON.stringify(wordsResponse.message)}*`, flags: '4096' })
                                    break
                                default:
                                    await gameRoom.send({ content: `get words: unknown error\n${JSON.stringify(wordsResponse)}`, flags: '4096' })
                            }
                        }
                        
                        // game result
                        const gameResultInfo = []
                        // loop player answer
                        for(let player of tempAnswers) {
                            type CounterReturnType = [number, string, number]
                            // points container
                            let [idCounter, correctCounter, pointsCounter]: CounterReturnType = [0, '', 0]
                            // match the answer
                            const isCorrect = wordsContainer.map(v => {
                                const matching = v.word.split(', ').indexOf(player.answer)
                                if(matching !== -1)
                                    return [v.id, v.word] as [number, string]
                            }).filter(i=>i)[0]
                            // match result
                            if(isCorrect) {
                                // word id
                                idCounter = isCorrect[0]
                                // word answer
                                correctCounter = `${player.answer} ✅`
                                // point
                                pointsCounter = 1
                            }
                            else {
                                idCounter = 0
                                correctCounter = `${player.answer} ❌`
                            }
                            // update the playing data
                            const abc_player = AbcLimaDasar.playingData.player_data.map(v => v.player_id).indexOf(player.player_id)
                            AbcLimaDasar.playingData.player_data[abc_player].answer_id.push(idCounter)
                            AbcLimaDasar.playingData.player_data[abc_player].answer_words.push(correctCounter)
                            AbcLimaDasar.playingData.player_data[abc_player].answer_points += pointsCounter 
                            // update game result
                            const answersResult = AbcLimaDasar.playingData.player_data[abc_player].answer_words
                            const answersPoints = AbcLimaDasar.playingData.player_data[abc_player].answer_points
                            gameResultInfo.push(`<@${player.player_id}>\n${answersResult.join(' | ')} - ${answersPoints} point(s)`)
                        }
                        // reset temp answers each round
                        tempAnswers = []
                        // collect all data for bulk insert
                        const tempRoundsPayload: { [key: string]: string | number }[] = []
                        // looping playing data 
                        for(let player_data of AbcLimaDasar.playingData.player_data) {
                            const round_number = AbcLimaDasar.playingData.round_number
                            // insert temp payload
                            tempRoundsPayload.push({
                                room_id: AbcLimaDasar.playingData.room_id,
                                round_number: AbcLimaDasar.playingData.round_number,
                                game_rounds: AbcLimaDasar.playingData.game_rounds,
                                player_id: player_data.player_id,
                                answer_id: player_data.answer_id[round_number - 1],
                                answer_words: player_data.answer_words[round_number - 1],
                                answer_points: player_data.answer_points
                            })
                        }
                        // fetching stuff for abc_rounds 
                        const fetchBodyRounds = tempThis.createFetchBody({
                            action: 'insert rounds',
                            // send player_id, room_id, word_id, round_number, game_rounds, answer_points (words_correct)
                            payload: tempRoundsPayload
                        })
                        const fetchOptionsRounds: RequestInit = {
                            method: 'POST',
                            // headers is a must to send body
                            headers: {
                                'authorization': process.env['UUID_V4'],
                                'user-id': tempThis.interact.user.id,
                                'content-type': 'application/json' // required for body
                            },
                            body: JSON.stringify(fetchBodyRounds)
                        }
                        // insert data to abc_rounds each round
                        const roundsResponse: IABC_Response_Rounds = await tempThis.abcFetcher('/round/insert', fetchOptionsRounds)
                        switch(roundsResponse.status) {
                            case 200: 
                                msg.react('🐱')
                                break
                            case 400:
                                await gameRoom.send({ content: `${roundsResponse.message}`, flags: '4096' })
                                break
                            case 500:
                                await gameRoom.send({ content: `*server-side error\nerror: ${JSON.stringify(roundsResponse.message)}*`, flags: '4096' })
                                break
                            default:
                                await gameRoom.send({ content: `insert rounds: unknown error\n${JSON.stringify(roundsResponse)}`, flags: '4096' })
                        }
                        // round number == game rounds, game over
                        const [round_number, game_rounds] = [AbcLimaDasar.playingData.round_number, AbcLimaDasar.playingData.game_rounds]
                        if(round_number === game_rounds) {
                            tempThis.gameOver(gameRoom, gameResultInfo)
                        }
                        // next round
                        else if(round_number < game_rounds) {
                            // increment round number
                            AbcLimaDasar.playingData.round_number += 1
                            // reset answer status
                            const player_data = AbcLimaDasar.playingData.player_data
                            for(let player of player_data) {
                                player.answer_status = false
                            }
                            // turn off listener before start next round
                            gameRoom.client.removeListener('messageCreate', gameAnswersListener)
                            // start next round 
                            tempThis.playing(gameRoom)
                        }
                    }
                }
            })
        }, 3000);
    }

    private async gameOver(gameRoom: ThreadChannel, gameResultInfo: string[]) {
        // send game over message
        const gameOverInfo = `Game Over :pray: \nhere is the result: \n${gameResultInfo.join('\n')}`  
        const gameOverInfoId = (await gameRoom.send(gameOverInfo)).id
        // wink emojis for update
        const winkArray: string[] = []
        // loop player data
        for(let player_data of AbcLimaDasar.playingData.player_data) {
            winkArray.push(':wink:')
            // fetching stuff
            const fetchBodyProfile = this.createFetchBody({
                action: 'update profile',
                payload: {
                    // player_id, game_played, words_correct, words_used
                    player_id: player_data.player_id,
                    game_played: 1,
                    words_correct: player_data.answer_id.filter(v => v !== 0).length,
                    words_used: player_data.answer_id.length
                }
            })
            const fetchOptionsProfile: RequestInit = {
                method: 'PATCH',
                // headers is a must to send body 
                headers: {
                    'authorization': process.env['UUID_V4'],
                    'user-id': this.interact.user.id,
                    'content-type': 'application/json' // required for body
                },
                body: JSON.stringify(fetchBodyProfile)
            } 
            // update player profile
            const profileResponse: IABC_Response_Profile = await this.abcFetcher('/profile/update', fetchOptionsProfile)
            switch(profileResponse.status) {
                case 200:
                    // profile updated message
                    const editGameOverInfo = gameOverInfo + 
                                            "\n---------------------------" +
                                            "\nplayer profiles updated " + winkArray.join(' ')
                    await gameRoom.messages.cache.get(gameOverInfoId)?.edit(editGameOverInfo)
                    break
                case 400:
                    await gameRoom.send({ content: `${profileResponse.message}`, flags: '4096' })
                    break
                case 500:
                    await gameRoom.send({ content: `*server-side error\nerror: ${profileResponse.message}*`, flags: '4096' })
                    break
                default:
                    await gameRoom.send({ content: `stats: unknown error\n${JSON.stringify(profileResponse)}`, flags: '4096' })
            }
        }
        // fetching stuff for update room
        const fetchBodyUpdate = this.createFetchBody({
            action: 'update room',
            payload: {
                id: AbcLimaDasar.playingData.room_id,
                status: 'closed'
            }
        })
        const fetchOptionsUpdate: RequestInit = {
            method: 'PATCH', 
            headers: {
                'authorization': process.env['UUID_V4'],
                'user-id': this.interact.user.id,
                'content-type': 'application/json'
            },
            body: JSON.stringify(fetchBodyUpdate) 
        }
        // update room status
        const updateRoomResponse: IABC_Response_UpdateRoom = await this.abcFetcher('/room/update', fetchOptionsUpdate)
        switch(updateRoomResponse.status) {
            case 200:
                await gameRoom.messages.cache.get(gameOverInfoId)?.react('🚪')
                // reset all playind data values
                AbcLimaDasar.playingData.room_id = 0
                AbcLimaDasar.playingData.round_number = 0
                AbcLimaDasar.playingData.game_rounds = 0
                AbcLimaDasar.playingData.categories = []
                AbcLimaDasar.playingData.num_players.count = 0
                AbcLimaDasar.playingData.num_players.message_id = ''
                AbcLimaDasar.playingData.max_players = 0
                AbcLimaDasar.playingData.game_status = ''
                AbcLimaDasar.playingData.player_data = []
                // lock the room, auto archive in 1 hour
                await gameRoom.setLocked(true, 'game over')
                break
            case 400:
                await this.interact.followUp({ content: `${updateRoomResponse.message}`, flags: 'Ephemeral' })
                break
            case 500:
                await this.interact.followUp({ content: `*server-side error\nerror: ${JSON.stringify(updateRoomResponse.message)}*`, flags: '4096' })
                break
        }
    }

    // ~~ utility method ~~
    protected async categoryButtonInteraction(i: number) {
        // fetch stuff
        const fetchOptions: RequestInit = { method: 'GET' }
        const categoryResponse: IABC_Response_Categories = await this.abcFetcher('/word/categories', fetchOptions)
        if(categoryResponse.status === 200) {
            // button stuff
            const categoryButtons = [[], []] as any[][]
            const categoryList = categoryResponse.data.map(v => v.category)
            for(let i in categoryList) {
                // skip none category
                if(categoryList[i] === 'none') continue
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
                content: `Select category ${i}:`,
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