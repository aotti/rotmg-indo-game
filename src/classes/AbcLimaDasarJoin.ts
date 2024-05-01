import { ThreadChannel } from "discord.js"
import { AbcLimaDasar } from "./AbcLimaDasar.js"
import { IABC_Response_JoinRoom, IABC_Response_UpdateRoom } from "../lib/types.js"

export class AbcLimaDasarJoin extends AbcLimaDasar {

    async join() {
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
        // get password if not null
        const password = this.interact.options.get('password')?.value || null
        // fetching stuff
        const fetchOptions: RequestInit = { 
            method: 'GET',
            headers: {
                'authorization': process.env['UUID_V4'],
                'user-id': this.interact.user.id
            },
        }
        const joinResponse: IABC_Response_JoinRoom = await this.abcFetcher('/room/join', fetchOptions)
        switch(joinResponse.status) {
            case 200:
                const joinData = joinResponse.data[0]
                // password doesnt match
                if(joinData.password !== password) {
                    await this.interact.reply({ 
                        content: `room password doesnt match! <:saskeh:603658093863370786>`, 
                        flags: 'Ephemeral' 
                    })
                    break
                }
                // password match, join the room 
                const gameRoom = await this.interact.client.channels.fetch(joinData.thread_id) as ThreadChannel
                // summon the new player to the room
                gameRoom.send(`<@${this.interact.user.id}> joined`)
                // reply user with the room link 
                await this.interact.reply({ 
                    content: `click this link to join the room :flushed:\n<#${joinData.thread_id}>`, 
                    flags: 'Ephemeral' 
                })
                // fetching stuff for update room
                const fetchBodyUpdate = this.createFetchBody({
                    action: 'update room',
                    payload: {
                        id: joinData.id,
                        num_players: joinData.num_players + 1
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
                const updateRoomResponse: IABC_Response_UpdateRoom = await this.abcFetcher('/room/update', fetchOptionsUpdate)
                switch(updateRoomResponse.status) {
                    case 200:
                        const updateData = updateRoomResponse.data[0]
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
                        await gameRoom.messages.cache.get(editPlayerJoinId)?.edit(`**Player join:** ${editPlayerJoinCount} player(s)`)
                        break
                    case 400:
                        await this.interact.followUp({ content: `${updateRoomResponse.message}`, flags: 'Ephemeral' })
                        break
                    case 500:
                        await this.interact.followUp({ content: `*server-side error\nerror: ${JSON.stringify(updateRoomResponse.message)}*`, flags: '4096' })
                        break
                }
                break
            case 400:
                await this.interact.reply({ content: `${joinResponse.message}`, flags: 'Ephemeral' })
                break
            case 500:
                await this.interact.reply({ content: `*server-side error\nerror: ${joinResponse.message}*`, flags: '4096' })
                break
            default:
                await this.interact.reply({ content: `join: unknown error\n${JSON.stringify(joinResponse)}`, flags: '4096' })
        }
    }
}