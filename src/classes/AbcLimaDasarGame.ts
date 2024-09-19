import { ThreadChannel } from "discord.js";
import { IABC_Response_GetWords, IABC_Response_Profile, IABC_Response_Rounds, IABC_Response_UpdateRoom } from "../lib/types.js";
import { WebhookErrorFetch } from "../lib/WebhookErrorHandler.js";
import { AbcLimaDasar } from "./AbcLimaDasar.js";

export class AbcLimaDasarGame extends AbcLimaDasar {
    
    async playing(gameRoom: ThreadChannel, wordsContainer: {id: number; word: string}[]) {
        try {
            const tempThis = this
            // countdown 
            gameRoom.send('Starting in 3 seconds...')
            setTimeout(() => {
                // split each word, eg: wordsContainer = ['apple, apel', 'japan, jepang', 'sabun']
                const tempWordsContainer = wordsContainer.map(v => v.word).join(', ').split(', ')
                // splitted words container
                const splittedWordsContainer = [] 
                for(let data of wordsContainer) {
                    const splitWord = data.word.split(', ')
                    // word can be splitted
                    if(splitWord.length > 1) splitWord.forEach(v => splittedWordsContainer.push({ id: data.id, word: v }))
                    // only 1 word
                    else splittedWordsContainer.push({ id: data.id, word: data.word })
                }
                // get the first letter of each word
                const alphabets = tempWordsContainer.map(v => v.slice(0,1)).filter((v,i,arr) => arr.indexOf(v) === i)
                // count player fingers then pick 2 letters
                const letters = this.pickLetters(alphabets)
                // words container for matching the player answers
                const matchedWordsContainer = [] as {id: number; word: string}[]
                // match the splitted words with letters
                // then use it to match the player answer
                for(let letter of letters) {
                    splittedWordsContainer.map(v => {
                        v.word.startsWith(letter) 
                            // push to matched words container
                            ? matchedWordsContainer.push(v) 
                            // else do nothing
                            : null
                    })
                }
                // round number info
                const gameRoundNumber = AbcLimaDasar.playingData.round_number === 1
                                        // round 1 must have letter info
                                        ? "---------------------------" +
                                        `\nJawaban harus diawali dengan huruf **${letters.join(' / ').toUpperCase()}**` +
                                        `\nRound ${AbcLimaDasar.playingData.round_number} :fire:` +
                                        "\n---------------------------"
                                        // other round
                                        : `\nRound ${AbcLimaDasar.playingData.round_number} :fire:` +
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
                            tempAnswers.push({ player_id: msg.author.id, answer: msg.content.replace('-', ' ').toLowerCase() })
                            // give react to the answer
                            msg.react('608521889945485312')
                            // get answer status
                            const playerAnswerStatus = AbcLimaDasar.playingData.player_data.map(v => {
                                if(v.answer_status === true)
                                    return v.answer_status 
                            }).filter(i => i)
                            // if theres only 1 answer OR answer length < total player joined, stop
                            if(playerAnswerStatus.length === 1 || playerAnswerStatus.length < AbcLimaDasar.playingData.player_data.length) return 
                            
                            // game result
                            const gameResultInfo = []
                            // loop player answer
                            for(let player of tempAnswers) {
                                type CounterReturnType = [number, string, number]
                                // points container
                                let [idCounter, correctCounter, pointsCounter]: CounterReturnType = [0, '', 0]
                                // match the answer
                                const isCorrect = matchedWordsContainer.map(v => {
                                    const matching = v.word.split(', ').indexOf(player.answer)
                                    // answer match
                                    if(matching !== -1) return [v.id, v.word] as [number, string]
                                }).filter(i=>i)[0]
                                // check if the answer exist
                                const isExist = wordsContainer.map(v => {
                                    const matching = v.word.split(', ').indexOf(player.answer)
                                    // answer match
                                    if(matching !== -1) return [v.id, v.word] as [number, string]
                                }).filter(i=>i)[0]
                                // match result
                                // correct answer
                                if(isCorrect) {
                                    // word id
                                    idCounter = isCorrect[0]
                                    // word answer
                                    correctCounter = `${isCorrect[1]} ✅`
                                    // point
                                    pointsCounter = 1
                                }
                                // wrong answer
                                else if(isExist) {
                                    idCounter = 0
                                    correctCounter = `${player.answer} ❌`
                                }
                                // word doesnt exist
                                else {
                                    idCounter = 9999
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
                            const fetchOptionsRounds = tempThis.createFetchOptions('POST', fetchBodyRounds)!
                            // insert data to abc_rounds each round
                            const roundsResponse: IABC_Response_Rounds = await tempThis.abcFetcher('/round/insert', fetchOptionsRounds)
                            switch(roundsResponse.status) {
                                case 200: 
                                    msg.react('🐱')
                                    break
                                case 400: case 500: default:
                                    // gameroom
                                    tempThis.abcFetcherErrors(gameRoom, roundsResponse.status, roundsResponse, false)
                                    break
                            }
                            // round number == game rounds, game over
                            const [round_number, game_rounds] = [AbcLimaDasar.playingData.round_number, AbcLimaDasar.playingData.game_rounds]
                            if(round_number === game_rounds) {
                                // set 3 correct words for education 😎 
                                const threeWords: string[] = []
                                for(let i=0; i<3; i++) {
                                    const random = Math.floor(Math.random() * matchedWordsContainer.length)
                                    threeWords.push(matchedWordsContainer[random].word)
                                }
                                // close the game
                                tempThis.gameOver(gameRoom, gameResultInfo, threeWords)
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
                                gameRoom.client.off('messageCreate', gameAnswersListener)
                                // start next round 
                                tempThis.playing(gameRoom, wordsContainer)
                            }
                        }
                    }
                })
            }, 3000);
        } catch (error: any) {
            console.log(error);
            await WebhookErrorFetch(`${this.interact.commandName}-playing`, error)
        }
    }

    private async gameOver(gameRoom: ThreadChannel, gameResultInfo: string[], threeWords: string[]) {
        try {
            // send game over message
            const gameOverInfo = `Game Over :pray: \nhere is the result: \n${gameResultInfo.join('\n')} \n***correct answers: ${threeWords.join(', ')}***` 
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
                        words_correct: player_data.answer_id.filter(v => v !== 0 && v !== 9999).length,
                        words_used: player_data.answer_id.length
                    }
                })
                const fetchOptionsProfile = this.createFetchOptions('PATCH', fetchBodyProfile)!
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
                    case 400: case 500: default:
                        // gameroom
                        await this.abcFetcherErrors(gameRoom, profileResponse.status, profileResponse, false)
                        break
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
            const fetchOptionsUpdate = this.createFetchOptions('PATCH', fetchBodyUpdate)!
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
                case 400: case 500: default:
                    // follow up
                    await this.abcFetcherErrors(null, updateRoomResponse.status, updateRoomResponse, true)
                    break
            }
        } catch (error: any) {
            console.log(error);
            await WebhookErrorFetch(`${this.interact.commandName}-gameOver`, error)
        }
    }

    private pickLetters(alphabets: string[]) {
        // pick letter
        const selectedLetters = []
        // select letter by total finger
        for(let i=0; i<2; i++) {
            // modulus the finger
            const selectedFinger = AbcLimaDasar.playingData.finger_total % alphabets.length
            // push the letter
            selectedLetters.push(alphabets.splice(selectedFinger, 1)[0])
        }
        // return the selected letters
        return selectedLetters
    }
}