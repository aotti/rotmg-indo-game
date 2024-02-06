import { EmbedBuilder } from "discord.js";
import { JankenPlayerType } from "../lib/types";

export class Janken {
    private static playerArray: JankenPlayerType[] = []

    #checkPlayerId(playerId: number): number {
        const checkPlayer = Janken.playerArray.map(v => { return v.id }).indexOf(playerId)
        return checkPlayer
    }

    #compareFingers(interact: any): string[] {
        if(Janken.playerArray.length < 2) {
            // not enough player
            return interact.reply({ content: 'Not enough player to compare :nerd:', ephemeral: true })
        }
        const firstFinger = Janken.playerArray[0].finger
        const secondFinger = Janken.playerArray[1].finger
        const tempResult = []
        // compare finger
        // draw condition
        if(firstFinger === secondFinger) {
            tempResult.push('draw', 'draw')
        }
        else if(firstFinger !== secondFinger) {
            switch(true) {
                // win condition
                case firstFinger === 'rock' && secondFinger === 'scissor':
                case firstFinger === 'paper' && secondFinger === 'rock':
                case firstFinger === 'scissor' && secondFinger === 'paper':
                    tempResult.push('win', 'lose')
                    break
                // lose condition
                case firstFinger === 'rock' && secondFinger === 'paper':
                case firstFinger === 'paper' && secondFinger === 'scissor':
                case firstFinger === 'scissor' && secondFinger === 'rock':
                    tempResult.push('lose', 'win')
                    break
            }
        }
        return tempResult
    }

    // start the game
    start(interact: any) {
        // set player data
        const firstPlayer = {
            id: interact.member.user.id,
            username: interact.member.nickname,
            finger: interact.options.get('finger').value.toLowerCase(),
            result: null
        }
        // check some stuff before start the game
        if(this.#checkPlayerId(firstPlayer.id) !== -1) {
            // player id exist
            return interact.reply({ content: 'You already start the game :expressionless:', ephemeral: true })
        }
        else if(Janken.playerArray.length > 0) {
            // game already started
            return interact.reply({ content: 'There is a running game :expressionless:', ephemeral: true })
        }
        // all stuff checked and no error found
        // push player data to array
        Janken.playerArray.push(firstPlayer)
        // create embed message
        const embedMessage = new EmbedBuilder()
            .setTitle('Janken (aduan jari)')
            .setDescription('waiting other player\n───────────────────')
            .addFields({
                name: `${firstPlayer.username}`,
                value: `Finger: ${firstPlayer.finger}`
            })
        // reply message
        // interact.reply({ embeds: [embedMessage], flags: [4096], ephemeral: true })
        interact.reply({ embeds: [embedMessage], ephemeral: true })
    }

    // join the existing game
    join(interact: any) {
        // set player data
        const secondPlayer = {
            id: interact.member.user.id,
            username: interact.member.nickname,
            finger: interact.options.get('finger').value.toLowerCase(),
            result: null
        }
        // check some stuff before start the game
        if(this.#checkPlayerId(secondPlayer.id) !== -1) {
            // player id exist and prevent same player doing solo game
            return interact.reply({ content: 'You already join the game :expressionless:', ephemeral: true })
        }
        else if(Janken.playerArray.length < 1) {
            // no running game 
            return interact.reply({ content: 'There is no running game :expressionless:', ephemeral: true })
        }
        // push 2nd player to array
        Janken.playerArray.push(secondPlayer)
        // compare finger from 1st and 2nd player
        const compareResult: string[] = this.#compareFingers(interact)
        Janken.playerArray.map((v, i) => { v.result = compareResult[i] })
        // create embed result
        const embedResult = new EmbedBuilder()
            .setTitle('Janken (aduan jari)')
            .setDescription(`game over <:daily_suicid:710973707241390202>\n───────────────────`)
        for(let player of Janken.playerArray) {
            embedResult.addFields({
                name: `${player.username} (${player.result})`,
                value: `Finger: ${player.finger}`
            })
        } 
        // display result
        // flags [4096] = silent message
        interact.reply({ embeds: [embedResult], flags: [4096] })
        // reset playerArray
        Janken.playerArray = []
    }

    // look for a running game
    check(interact: any) {
        if(Janken.playerArray.length === 0) {
            // no one playing
            interact.reply({ content: 'There is no game in progress :sob:', ephemeral: true })
        }
        else if(Janken.playerArray.length > 0) {
            // someone is playing
            const waitingPlayer = Janken.playerArray[0]
            interact.reply({ content: `${waitingPlayer.username} is waiting :eyes:`, ephemeral: true })
        }
    }
}