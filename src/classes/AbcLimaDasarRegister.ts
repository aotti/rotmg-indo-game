import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { AbcLimaDasar } from "./AbcLimaDasar";
import { IABC_Response_Register } from "../lib/types";

export class AbcLimaDasarRegister extends AbcLimaDasar{
    
    constructor(interact: ChatInputCommandInteraction) {
        super(interact)
    }

    // register player method
    async register() {
        // stuff for fetch
        const playerId = this.interact.user.id
        const username = this.interact.options.get('username')?.value as string
        // check id
        const [idStatus, idError] = this.checkId(playerId)
        if(idStatus) {
            return await this.interact.reply({ content: idError as string, flags: 'Ephemeral' })
        }
        // check username length
        const [usernameStatus, usernameError] = this.usernameLength(username)
        if(usernameStatus) {
            return await this.interact.reply({ content: usernameError as string, flags: 'Ephemeral' })
        }
        // fetch stuff
        const fetchBody = {
            action: 'register player',
            payload: {
                id: +playerId,
                username: username
            }
        }
        const fetchOptions: RequestInit = {
            method: 'POST',
            // headers is a must to send body
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fetchBody)
        }
        // fetching
        const registerResponse: IABC_Response_Register = await this.abcFetcher(`/register`, fetchOptions)
        // create embed
        const registerEmbed = new EmbedBuilder().setTitle('Player Register')
        // check status
        switch(registerResponse.status) {
            case 200:
                const playerData = registerResponse.data[0]
                // fill the embed with player data
                registerEmbed.setDescription(`
                    Registration success!
                    ────────────────────
                    id: ${playerData.id}
                    username: ${playerData.username}
                `)
                await this.interact.reply({ embeds: [registerEmbed], flags: 'Ephemeral' })
                break
            case 401:
                await this.interact.reply({ content: 'input data error', flags: 'Ephemeral' })
                break
            case 500:
                await this.interact.reply({ content: `*server-side error\nerror: ${JSON.stringify(registerResponse.message)}*`, flags: '4096' })
                break
        }
    }

    // ~~ utility method ~~
    protected checkId(playerId: string): [boolean, string | null] {
        // check if player id isNaN
        if(isNaN(+playerId)) {
            const message = "id tidak valid!"
            return [true, message]
        }
        // id length pass
        return [false, null]
    }

    protected usernameLength(username: string): [boolean, string | null] {
        // check username length
        if(username.length > 30) {
            const message = "jumlah karakter tidak boleh lebih dari 30 huruf!" +
                            `\nusername anda memiliki **${username.length} huruf**`
            return [true, message]
        }
        // username length pass
        return [false, null]
    }

    protected usernameSymbol(username: string): [boolean, string | null] {
        if(username.match(/[\W_]+/g)) {
            const message = "username hanya boleh huruf & angka!" +
                            `\nusername anda memiliki simbol **${username.match(/[\W_]+/g)?.join('')}**`
            return [true, message]
        }
        // username symbol pass
        return [false, null]
    }
}