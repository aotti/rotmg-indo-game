import { EmbedBuilder } from "discord.js";
import { JankenPlayerType } from "../lib/types";

export class Janken {
    private static playerArray: JankenPlayerType[] = []

    #checkPlayerId(interact: any): number {
        const checkPlayer = Janken.playerArray.map(v => { return v.id }).indexOf(interact.member.user.id)
        return checkPlayer
    }

    // start the game
    start(interact: any) {
        // check some stuff before start the game
        if(this.#checkPlayerId(interact) !== -1) {
            // player id exist
            return interact.reply({ content: 'You already start the game :expressionless:', ephemeral: true })
        }
        else if(Janken.playerArray.length > 0) {
            // game already started
            return interact.reply({ content: 'There is a running game :expressionless:', ephemeral: true })
        }
        // all stuff checked and no error found
        // set player data
        const firstPlayer = {
            id: interact.member.user.id,
            username: interact.member.nickname,
            finger: interact.options.get('finger').value.toLowerCase(),
            result: null
        }
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