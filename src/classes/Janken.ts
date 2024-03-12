import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { IUColumnType, JankenModeType, JankenPlayerType, dbInsertType, dbSelectType, dbUpdateType } from "../lib/types";
import { DatabaseQueries } from "../lib/DatabaseQueries";
import { Commands } from "./Commands";

export class Janken {
    protected static playerArray: JankenModeType = {
        normal: [],
        advanced: []
    }
    protected interact: ChatInputCommandInteraction
    protected mode: string
    private dq = new DatabaseQueries()

    // make interact accessible by child classes
    constructor(interact: ChatInputCommandInteraction | null) {
        this.interact = interact as ChatInputCommandInteraction
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

    private validateData(playerData: JankenPlayerType, command: string) {
        switch(command) {
            // validation for janken_battle command
            case 'battle':
                if(this.checkPlayerId(playerData.id) !== -1) {
                    // player id exist
                    return { status: true, errorMessage: 'You already join the game :expressionless:' }
                }
                // check finger mode
                const checkFinger = this.fingerMode(playerData.finger)
                if(checkFinger) {
                    // when player using advanced finger on NORMAL mode
                    return { status: true, errorMessage: `Please use appropriate finger (${this.mode}) :clown:` }
                }
                break
            default: 
                return { status: true, errorMessage: 'validation null' }
        }
        return { status: false, errorMessage: 'null'}
    }

    async selectMode() {
        // prepare stuff for select mode buttons
        const modeButtons = []
        const modeNames = ['Normal', 'Advanced']
        // loop mode names
        for(let mode of modeNames) {
            // create mode button
            const modeButton = new ButtonBuilder()
                .setCustomId(mode.toLowerCase())
                .setLabel(mode)
                .setStyle(ButtonStyle.Secondary)
            // push button to array
            modeButtons.push(modeButton)
        }
        // set button as components
        const modeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(modeButtons)
        // display mode buttons
        const buttonResponse = await this.interact.reply({ 
            content: `Select janken mode:`, 
            components: [modeRow],
            flags: "Ephemeral"
        })
        // button interaction
        try {
            // ensures that only the user who triggered the interaction can use the buttons
            const collectorFilter = (i: any) => i.user.id === this.interact.user.id
            // waiting player to click a button
            const confirmation = await buttonResponse.awaitMessageComponent({ filter: collectorFilter, time: 10_000 })
            // set game mode
            this.mode = confirmation.customId
            // edit message after clicked a button
            await confirmation.update({ content: `You selected **${this.mode}** mode`, components: [] })
        } catch (err) {
            await this.interact.editReply({
                content: 'You only have 10 seconds to select mode :eyes:',
                components: []
            })
        }
        return this.mode
    }

    // play the game
    async battle() {
        // set player data
        const jankenPlayer = {
            id: +this.interact.member!.user.id,
            username: (this.interact.member as any).nickname || this.interact.user.username,
            finger: '',
            result: null
        }
        // prepare stuff for finger buttons
        const fingerNames = ['Paper', 'Rock', 'Scissor', 'Sponge', 'Fire', 'Water', 'Air']
        const normalFingers = []
        const advancedFingers = []
        for(let finger of fingerNames) {
            // different finger names for NORMAL and ADVANCED
            const advFinger = finger == 'Paper' || finger == 'Rock' || finger == 'Scissor' 
                            ? `${finger} (normal)` 
                            : `${finger} (advanced)`
            // create button
            const fb = new ButtonBuilder()
                .setCustomId(finger.toLowerCase())
                .setLabel(advFinger)
                .setStyle(ButtonStyle.Primary)
            // push button to array
            if(advFinger.match('advanced'))
                advancedFingers.push(fb)
            else 
                normalFingers.push(fb)
        }
        // set buttons as components
        const normalRow = new ActionRowBuilder<ButtonBuilder>().addComponents(normalFingers)
        const advancedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(advancedFingers)
        // display finger buttons
        const buttonResponse = await this.interact.editReply({
            content: `Select your finger (${this.mode})`,
            components: this.mode === 'normal' ? [normalRow] : [normalRow, advancedRow]
        })
        // button interaction
        try {
            // ensures that only the user who triggered the interaction can use the buttons
            const collectorFilter = (i: any) => i.user.id === this.interact.user.id
            // waiting player to click a button
            const confirmation = await buttonResponse.awaitMessageComponent({ filter: collectorFilter, time: 10_000 })
            // set player finger
            jankenPlayer.finger = confirmation.customId
            // edit message after clicked a button
            await confirmation.update({ content: `Your finger is **${jankenPlayer.finger}**`, components: [] })
        } catch (err) {
            await this.interact.editReply({
                content: 'You only have 10 seconds to select finger :eyes:',
                components: []
            })
        }
        // check some stuff before start the game
        const validation = this.validateData(jankenPlayer, 'battle')
        if(validation.status) {
            // check player id and game status
            return await this.interact.reply({ content: validation.errorMessage, ephemeral: true })
        }
        // all stuff checked and no error found
        // check num of players
        // player = 0
        if(Janken.playerArray[this.mode].length === 0) {
            // push player data to array
            Janken.playerArray[this.mode].push(jankenPlayer);
            // reply message
            // for everyone but silent - flags '4096' 
            await this.interact.followUp({ 
                content: `**${jankenPlayer.username}** waiting a challenger (${this.mode}) :sunglasses:`, 
                flags: '4096' 
            })
        }
        // player = 1
        else if(Janken.playerArray[this.mode].length === 1) {
            // push 2nd player to array
            Janken.playerArray[this.mode].push(jankenPlayer)
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
            await this.interact.followUp({ 
                embeds: [embedResult], 
                flags: '4096' 
            })
            // loop user data 
            for(let player of Janken.playerArray[this.mode]) {
                // create queryObject
                const checkPlayer = this.dq.queryBuilder('janken_players', 2345, 'id', +player.id) as dbSelectType
                this.dq.selectOne(checkPlayer)
                    .then(async resultSelect => {
                        // if theres error on database
                        if(resultSelect.error !== null) {
                            return console.log(`err: ${resultSelect.error}`);
                        }
                        // data get
                        else {
                            // set win/lose value
                            const [winResult, loseResult] = player.result === 'draw' 
                                                            ? [0, 0] 
                                                            : player.result === 'win' 
                                                                ? [1, 0] 
                                                                : [0, 1]
                            // set draw value
                            const drawResult = (winResult + loseResult) === 0 ? 1 : 0
                            // check is data empty
                            if(resultSelect.data?.length === 0) {
                                // set insert data
                                const insertData: IUColumnType = {
                                    id: +player.id,
                                    username: player.username,
                                    win: winResult,
                                    lose: loseResult,
                                    draw: drawResult
                                }
                                // insert player data
                                const insertPlayer = this.dq.queryBuilder('janken_players', 234, null, null, insertData) as dbInsertType
                                return this.dq.insert(insertPlayer)
                                    .then(resultInsert => {
                                        // re-run register command to update choice values
                                        // on janken_stats command
                                        const command = new Commands()
                                        command.register()
                                    })
                                    .catch(err => console.log(`err: ${err}`))
                            }
                            // destructure win and lose
                            const { win, lose, draw } = resultSelect.data![0] as {win: number, lose: number, draw: number}
                            // update player data
                            const updateData: IUColumnType = {
                                username: player.username,
                                win: win + winResult,
                                lose: lose + loseResult,
                                draw: draw + drawResult
                            }
                            const updatePlayer = this.dq.queryBuilder('janken_players', 234, 'id', +player.id, null, updateData) as dbUpdateType
                            return this.dq.update(updatePlayer)
                                .then(resultUpdate => {
                                    // re-run register command to update choice values
                                    // on janken_stats command
                                    const command = new Commands()
                                    command.register()
                                })
                                .catch(err => console.log(`err: ${err}`))
                        }
                    })
                    .catch(err => console.log(`janken join: ${err}`))
            }
            // reset playerArray
            Janken.playerArray[this.mode] = []
        }
    }

    // get player stats
    stats() {
        const playerId: string = this.interact.options.get('player')?.value as string || this.interact.member!.user.id
        const checkPlayer = this.dq.queryBuilder('janken_players', 2345, 'id', +playerId) as dbSelectType
        this.dq.selectOne(checkPlayer)
            .then(resultSelect => {
                // if user not found
                if(resultSelect.data?.length === 0) {
                    return this.interact.reply({ content: `You don't have any record :skull:`, ephemeral: true })
                }
                // ### TYPE ANY HARUS COBA GANTI DENGAN YG LEBIH SESUAI
                // ### TYPE ANY HARUS COBA GANTI DENGAN YG LEBIH SESUAI
                const { username, win, lose, draw } = resultSelect.data![0] as {username: string, win: number, lose: number, draw: number}
                const winRate = win / (win + lose + draw) * 100
                const statsDescription = `**${username}**` +
                                        `\ngame : ${win + lose + draw}` +
                                        `\nwin : ${win} (${winRate.toFixed(1)}%)` +
                                        `\nlose : ${lose}` +
                                        `\ndraw : ${draw}`
                const embedStats = new EmbedBuilder()
                    .setTitle('Janken Player Stats :sunglasses:')
                    .setDescription(statsDescription)
                return this.interact.reply({ embeds: [embedStats], ephemeral: true })
            })
            .catch(err => console.log(`janken stats: ${err}`))
    }

    // get all server members
    getPlayers() {
        const queryPlayers = this.dq.queryBuilder('janken_players', 12, 'id', 1) as dbSelectType
        return this.dq.selectAll(queryPlayers)
            .then(resultAll => {
                const allPlayers: any = resultAll.data
                return allPlayers
            })
            .catch(err => console.log(`janken getPlayers: ${err}`))
    }
}