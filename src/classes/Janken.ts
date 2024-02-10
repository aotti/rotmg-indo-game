import { EmbedBuilder } from "discord.js";
import { JankenModeType, JankenPlayerType } from "../lib/types";

export class Janken {
    protected static playerArray: JankenModeType = {
        normal: [],
        advanced: []
    }
    protected interact: any
    protected mode: string

    // make interact accessible by child classes
    // ### TAMBAH PARAMETER UNTUK MEMISAH MODE normal DAN advanced
    // ### TAMBAH PARAMETER UNTUK MEMISAH MODE normal DAN advanced
    constructor(interact: any, mode: string) {
        this.interact = interact
        this.mode = mode
    }

    // comparing fingers
    // will be overridden by child method
    protected compareFingers(): string[] {
        return ['null', 'null']
    }

    // finger emoji
    // will be overridden by child method
    protected fingerEmoji(finger: string): string {
        return ':skull:'
    }

    private fingerMode(finger: string) {
        if(this.mode === 'normal') {
            switch(finger) {
                case 'rock':
                case 'paper':
                case 'scissor':
                    return false
                default:
                    return true
            }
        }
        else if(this.mode === 'advanced') {
            switch(finger) {
                case 'rock':
                case 'paper':
                case 'scissor':
                case 'sponge':
                case 'fire':
                case 'water':
                case 'air':
                    return false
                default:
                    return true
            }
        }
    }

    // check player id to make sure the player not play alone
    private checkPlayerId(playerId: number): number {
        const checkPlayer = (): number => {
            let playerExist = null
            playerExist = Janken.playerArray[this.mode].map(v => { return v.id }).indexOf(playerId)
            return playerExist
        }
        return checkPlayer()
    }

    private validateData(playerData: JankenPlayerType, command: string): { status: boolean, errorMessage: string } {
        switch(command) {
            // validation for janken_start command
            case 'start':
                if(this.checkPlayerId(playerData.id) !== -1) {
                    // player id exist
                    return { status: true, errorMessage: 'You already start the game :expressionless:' }
                }
                else if(Janken.playerArray[this.mode].length > 0) {
                    // game already started
                    return { status: true, errorMessage: `There is a running game (${this.mode}) :expressionless:` }
                }
                break
            // validation for janken_join command
            case 'join':
                if(this.checkPlayerId(playerData.id) !== -1) {
                    // player id exist and prevent same player doing solo game
                    return { status: true, errorMessage: 'You already join the game :expressionless:' }
                }
                else if(Janken.playerArray[this.mode].length < 1) {
                    // no running game 
                    return { status: true, errorMessage: `There is no running game (${this.mode}) :expressionless:` }
                }
                break
            default: 
                return { status: true, errorMessage: 'validation null' }
        }
        return { status: false, errorMessage: 'null'}
    }

    // start the game
    start() {
        // set player data
        const firstPlayer = {
            id: this.interact.member.user.id,
            username: this.interact.member.nickname,
            finger: this.interact.options.get('finger').value.toLowerCase(),
            result: null
        }
        // check finger mode
        const checkFinger = this.fingerMode(firstPlayer.finger)
        if(checkFinger) {
            // when player using advanced finger on NORMAL mode
            return this.interact.reply({ content: `Please use appropriate finger (${this.mode}) :clown:`, flags: [4096] })
        }
        // check some stuff before start the game
        const validation = this.validateData(firstPlayer, 'start')
        if(validation.status) {
            // check player id and game status
            return this.interact.reply({ content: validation.errorMessage, ephemeral: true })
        }
        // all stuff checked and no error found
        // push player data to array
        Janken.playerArray[this.mode].push(firstPlayer)
        // reply message
        // for everyone but silent - flags [4096]
        this.interact.reply({ content: `**${firstPlayer.username}** waiting a challenger (${this.mode}) :sunglasses:`, flags: [4096] })
    }

    // join the existing game
    join() {
        // set player data
        const secondPlayer = {
            id: this.interact.member.user.id,
            username: this.interact.member.nickname,
            finger: this.interact.options.get('finger').value.toLowerCase(),
            result: null
        }
        // check finger mode
        const checkFinger = this.fingerMode(secondPlayer.finger)
        if(checkFinger) {
            // when player using advanced finger on NORMAL mode
            return this.interact.reply({ content: `Please use appropriate finger (${this.mode}) :clown:`, flags: [4096] })
        }
        // check some stuff before start the game
        const validation = this.validateData(secondPlayer, 'join')
        if(validation.status) 
            return this.interact.reply({ content: validation.errorMessage, ephemeral: true })
        // push 2nd player to array
        Janken.playerArray[this.mode].push(secondPlayer)
        // compare finger from 1st and 2nd player
        const compareResult: string[] = this.compareFingers()
        Janken.playerArray[this.mode].map((v, i) => { v.result = compareResult[i] })
        // create embed result
        const embedResult = new EmbedBuilder()
            .setTitle(`Janken ${this.mode} (aduan jari)`)
            .setDescription(`game over <:daily_suicid:710973707241390202>\n───────────────────`)
        for(let player of Janken.playerArray[this.mode]) {
            const fingerEmoji = this.fingerEmoji(player.finger)
            embedResult.addFields({
                name: `${player.username} (${player.result})`,
                value: `Finger: ${player.finger} ${fingerEmoji}`
            })
        } 
        // display result
        // flags [4096] = silent message
        this.interact.reply({ embeds: [embedResult], flags: [4096] })
        // reset playerArray
        Janken.playerArray[this.mode] = []
    }

    // look for a running game
    check() {
        if(Janken.playerArray[this.mode].length === 0) {
            // no one playing
            this.interact.reply({ content: `There is no game in progress (${this.mode}) :sob:`, ephemeral: true })
        }
        else if(Janken.playerArray[this.mode].length > 0) {
            // someone is playing
            const waitingPlayer = Janken.playerArray[this.mode][0]
            this.interact.reply({ content: `**${waitingPlayer.username}** is waiting (${this.mode}) :eyes:`, ephemeral: true })
        }
    }
}