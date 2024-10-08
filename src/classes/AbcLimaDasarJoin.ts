import { ThreadChannel } from "discord.js"
import { AbcLimaDasar } from "./AbcLimaDasar.js"
import { IABC_Response_JoinRoom, IABC_Response_UpdateRoom } from "../lib/types.js"
import { WebhookErrorFetch } from "../lib/WebhookErrorHandler.js"

export class AbcLimaDasarJoin extends AbcLimaDasar {

    async join() {
        try {
            // check if the player already joined
            const isPlayerJoined = AbcLimaDasar.playingData.player_data.map(v => v.player_id).indexOf(this.interact.user.id)
            if(isPlayerJoined !== -1) {
                // the player already joined
                return await this.interact.reply({ content: 'you already joined the game <:aneh:534350825762324482>', flags: 'Ephemeral' })
            }
            // check max player 
            const [num_players, max_players] = [AbcLimaDasar.playingData.num_players.count, AbcLimaDasar.playingData.max_players]
            if(max_players === 0) {
                // theres no game
                return await this.interact.reply({ content: 'there is no running game <:sadge:856388968409202689>', flags: 'Ephemeral' })
            }
            else if(num_players === max_players) {
                // room is full
                return await this.interact.reply({ content: 'the room is full :sob:', flags: 'Ephemeral' })
            }
            // if round number > 1, cant join anymore
            if(AbcLimaDasar.playingData.round_number > 1) {
                // game already started
                return await this.interact.reply({ 
                    content: 'you are too late, just wait for next game <:juriL:607465491962920962>', 
                    flags: 'Ephemeral' 
                })
            }
            // defer reply
            await this.interact.deferReply({ ephemeral: true })
            // get password if not null
            const password = this.interact.options.get('password')?.value || null
            // fetching stuff
            const fetchOptions = this.createFetchOptions('GET')!
            const joinResponse: IABC_Response_JoinRoom = await this.abcFetcher('/room/join', fetchOptions)
            if(joinResponse.status === 200) {
                const joinData = joinResponse.data[0]
                // password doesnt match
                if(joinData.password !== password) {
                    await this.interact.editReply({ 
                        content: `room password doesnt match! <:saskeh:603658093863370786>`
                    })
                    return
                }
                // select finger
                const chosenFingers = await this.fingerButtonInteraction()
                if(chosenFingers === null) return
                // password match, join the room 
                const gameRoom = await this.interact.client.channels.fetch(joinData.thread_id) as ThreadChannel
                // summon the new player to the room
                gameRoom.send(`<@${this.interact.user.id}> joined`)
                // reply user with the room link 
                await this.interact.editReply({ 
                    content: `click this link to join the room :flushed:\n<#${joinData.thread_id}>`
                })
                // fetching stuff for update room
                const fetchBodyUpdate = this.createFetchBody({
                    action: 'update room',
                    payload: {
                        id: joinData.id,
                        num_players: joinData.num_players + 1
                    }
                })
                const fetchOptionsUpdate = this.createFetchOptions('PATCH', fetchBodyUpdate)!
                // update room number players
                const updateRoomResponse: IABC_Response_UpdateRoom = await this.abcFetcher('/room/update', fetchOptionsUpdate)
                switch(updateRoomResponse.status) {
                    case 200:
                        const updateData = updateRoomResponse.data[0]
                        // edit message as data updated sign
                        await this.interact.editReply({ content: `click this link to join the room :flushed:\n<#${updateData.thread_id}> :wink:` })
                        // update playing data
                        AbcLimaDasar.playingData.num_players.count = joinData.num_players + 1
                        // insert player data to playing data
                        AbcLimaDasar.playingData.player_data.push({
                            player_id: this.interact.user.id,
                            answer_id: [],
                            answer_words: [],
                            answer_points: 0,
                            answer_status: false
                        })
                        // edit player join message
                        const [editPlayerJoinId, editPlayerJoinCount] = [AbcLimaDasar.playingData.num_players.message_id, AbcLimaDasar.playingData.num_players.count]
                        await gameRoom.messages.cache.get(editPlayerJoinId)?.edit(`**Player join:** ${editPlayerJoinCount} player(s) 👀`)
                        break
                    default:
                        // follow up
                        await this.abcFetcherErrors(null, updateRoomResponse.status, updateRoomResponse, true)
                        break
                }
            }
            // error
            else {
                await this.abcFetcherErrors(null, joinResponse.status, joinResponse, false)
            }
        } catch (error: any) {
            console.log(error);
            await WebhookErrorFetch(this.interact.commandName, error)
        }
    }
}