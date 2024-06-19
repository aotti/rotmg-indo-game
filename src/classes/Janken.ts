import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { IUColumnType, JankenModeType, JankenPlayerType, dbInsertType, dbSelectType, dbUpdateType } from "../lib/types.js";
import { DatabaseQueries } from "../lib/DatabaseQueries.js";
import { Commands } from "./Commands.js";
import { WebhookErrorFetch } from "../lib/WebhookErrorHandler.js";

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
    protected fingerEmoji(finger: string) {
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

    // play the game
    async battle() {
        try {
            // set player data
            const jankenPlayer = {
                id: +this.interact.member!.user.id,
                username: (this.interact.member as any).nickname || this.interact.user.username,
                finger: this.interact.options.get('finger')!.value as string,
                result: null
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
                await this.interact.reply({ 
                    content: `You choose **${jankenPlayer.finger}** finger`, 
                    flags: "Ephemeral"
                })
                // delete ephemeral reply after 3 secs
                setTimeout(async () => {
                    await this.interact.deleteReply()
                }, 3000);
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
                await this.interact.reply({ 
                    content: `You choose **${jankenPlayer.finger}** finger`, 
                    flags: "Ephemeral"
                })
                // delete ephemeral reply after 3 secs
                setTimeout(async () => {
                    await this.interact.deleteReply()
                }, 3000);
                await this.interact.followUp({ 
                    embeds: [embedResult], 
                    flags: '4096' 
                })
                // loop user data 
                for(let player of Janken.playerArray[this.mode]) {
                    // create queryObject
                    const checkPlayerQuery = this.dq.queryBuilder('janken_players', 2345, 'id', +player.id) as dbSelectType
                    const checkPlayer = await this.dq.selectOne(checkPlayerQuery)
                    // if theres error on database
                    if(checkPlayer.error !== null) {
                        return this.interact.followUp({
                            content: `err: ${JSON.stringify(checkPlayer.error)}`,
                            flags: '4096'
                        });
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
                        if(checkPlayer.data?.length === 0) {
                            // set insert data
                            const insertData: IUColumnType = {
                                id: +player.id,
                                username: player.username,
                                win: winResult,
                                lose: loseResult,
                                draw: drawResult
                            }
                            // insert player data
                            const insertPlayerQuery = this.dq.queryBuilder('janken_players', 234, null, null, insertData) as dbInsertType
                            const insertPlayer = await this.dq.insert(insertPlayerQuery)
                            // if error
                            if(insertPlayer.error) {
                                return this.interact.followUp({
                                    content: `err: ${JSON.stringify(insertPlayer.error)}`,
                                    flags: '4096'
                                });
                            }
                            // re-run register command to update choice values
                            // on janken_stats command
                            const command = new Commands()
                            command.register()
                        }
                        // destructure win and lose
                        const { win, lose, draw } = checkPlayer.data![0] as {win: number, lose: number, draw: number}
                        // update player data
                        const updateData: IUColumnType = {
                            username: player.username,
                            win: win + winResult,
                            lose: lose + loseResult,
                            draw: draw + drawResult
                        }
                        const updatePlayerQuery = this.dq.queryBuilder('janken_players', 234, 'id', +player.id, null, updateData) as dbUpdateType
                        const updatePlayer = await this.dq.update(updatePlayerQuery)
                        // if error
                        if(updatePlayer.error) {
                            return this.interact.followUp({
                                content: `err: ${JSON.stringify(updatePlayer.error)}`,
                                flags: '4096'
                            });
                        }
                        // re-run register command to update choice values
                        // on janken_stats command
                        const command = new Commands()
                        command.register()
                    }
                }
                // reset playerArray
                Janken.playerArray[this.mode] = []
            }
        } catch (error: any) {
            console.log(error);
            await WebhookErrorFetch(JSON.stringify(error))
        }
    }

    // get player stats
    async stats() {
        try {
            const playerId: string = this.interact.options.get('player')?.value as string || this.interact.member!.user.id
            const checkPlayerQuery = this.dq.queryBuilder('janken_players', 2345, 'id', +playerId) as dbSelectType
            const checkPlayer = await this.dq.selectOne(checkPlayerQuery)
            // if user not found
            if(checkPlayer.data?.length === 0) {
                return this.interact.reply({ content: `You don't have any record :skull:`, ephemeral: true })
            }
            // user found
            const { username, win, lose, draw } = checkPlayer.data![0] as Record<'username'|'win'|'lose'|'draw', number>
            const winRate = win / (win + lose + draw) * 100
            const statsDescription = `**${username.toString()}**` +
                                    `\ngame : ${win + lose + draw}` +
                                    `\nwin : ${win} (${winRate.toFixed(1)}%)` +
                                    `\nlose : ${lose}` +
                                    `\ndraw : ${draw}`
            const embedStats = new EmbedBuilder()
                .setTitle('Janken Player Stats :sunglasses:')
                .setDescription(statsDescription)
            return this.interact.reply({ embeds: [embedStats], ephemeral: true })
        } catch (error: any) {
            console.log(error);
            await WebhookErrorFetch(JSON.stringify(error))
        }
    }

    // get all server members
    async getPlayers() {
        try {
            const queryPlayers = this.dq.queryBuilder('janken_players', 12, 'id', 1) as dbSelectType
            return (await this.dq.selectAll(queryPlayers)).data!
        } catch (error: any) {
            console.log(error);
            await WebhookErrorFetch(JSON.stringify(error))
            return []
        }
    }
}