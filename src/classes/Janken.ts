import { EmbedBuilder } from "discord.js";
import { JankenPlayerType } from "../lib/types";

export class Janken {
    private static playerArray: JankenPlayerType[] = []

    #checkPlayerId(playerId: number): number {
        const checkPlayer = Janken.playerArray.map(v => { return v.id }).indexOf(playerId)
        return checkPlayer
    }

    #compareFingers(interact: any) {
        if(Janken.playerArray.length < 2) {
            // not enough player
            return interact.reply({ content: 'Not enough player to compare :nerd:', ephemeral: true })
        }
        const firstFinger = Janken.playerArray[0].finger
        const secondFinger = Janken.playerArray[1].finger
        // compare finger
        if(firstFinger === secondFinger) {
            return ['draw', 'draw']
        }
        else if(firstFinger !== secondFinger) {
            switch(true) {
                case firstFinger === 'rock' && secondFinger === 'scissor':
                    return ['win', 'lose']
                case firstFinger === 'rock' && secondFinger === 'paper':
                    return ['lose', 'win']
                case firstFinger === 'paper' && secondFinger === 'rock':
                    return ['win', 'lose']
                case firstFinger === 'paper' && secondFinger === 'scissor':
                    return ['lose', 'win']
                case firstFinger === 'scissor' && secondFinger === 'paper':
                    return ['win', 'lose']
                case firstFinger === 'scissor' && secondFinger === 'rock':
                    return ['lose', 'win']
            }
        }
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
            .setDescription('waiting other player...')
            .addFields({
                name: `${firstPlayer.username}`,
                value: `Finger: ${firstPlayer.finger}`
            })
        // reply message
        // flags [4096] = silent message
        // interact.reply({ embeds: [embedMessage], flags: [4096], ephemeral: true })
        interact.reply({ embeds: [embedMessage], ephemeral: true })
    }

    // join the existing game
    join(interact: any) {
        // ### CEK PLAYER SBLM JOIN GAME, UNTUK MENGHINDARI USER YG SAMA
        // ### CEK PLAYER SBLM JOIN GAME, UNTUK MENGHINDARI USER YG SAMA
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
        const [firstPlayerResult, secondPlayerResult] = this.#compareFingers(interact)
        // console.log(firstPlayerResult, secondPlayerResult);
        
    }

    // look for a running game
    check(interact: any) {
        if(Janken.playerArray.length === 0) {
            // no one playing
            interact.reply({ content: 'There is no game in progress :sob:', ephemeral: true })
        }
        else if(Janken.playerArray.length > 0) {
            // someone is playing
            interact.reply({ content: 'There is a player waiting :eyes:', ephemeral: true })
        }
    }
}