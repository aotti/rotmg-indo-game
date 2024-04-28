import { ChatInputCommandInteraction } from "discord.js";
import { JankenAdvanced } from "./JankenAdvanced";
import { JankenNormal } from "./JankenNormal";
import { AbcLimaDasar } from "./AbcLimaDasar";
import { AbcLimaDasarRegister } from "./AbcLimaDasarRegister";
import { AbcLimaDasarStart } from "./AbcLimaDasarStart";
import { AbcLimaDasarJoin } from "./AbcLimaDasarJoin";

export class Messages {

    async reply(interact: ChatInputCommandInteraction) {
        const username = (interact.member as any).nickname || interact.user.username
        // get mode
        const mode = interact.options.get('mode')?.value || ''
        // initialize janken normal & advanced 
        const jankenNormal = new JankenNormal(interact, mode as string)
        const jankenAdvanced = new JankenAdvanced(interact, mode as string)
        // abc classes
        // register
        const abcRegister = new AbcLimaDasarRegister(interact)
        // start
        const categoryAmount = interact.options.get('category_amount')?.value
        const abcStart = new AbcLimaDasarStart(interact, categoryAmount as number)
        // join
        const abcJoin = new AbcLimaDasarJoin(interact)
        // reply to user who interacted with slash commands
        switch(interact.commandName) {
            case 'greetings':
                console.log(username, '> starting greetings command');
                interact.reply('gaming gays')
                break
            // gaming command
            case 'gaming':
                switch(interact.options.getSubcommand()) {
                    // JANKEN GAME
                    // start
                    case 'janken_battle':
                        console.log(username, '> starting janken_battle command');
                        // maintenis
                        // interact.reply({ content: 'janken sedang maintenis karna mudasir :skull:', flags: '4096' })
                        // run janken
                        mode === 'normal'
                            ? jankenNormal.battle()
                            : jankenAdvanced.battle()
                        break
                    // check player statistic
                    case 'janken_stats':
                        console.log(username, '> starting janken_stats command');
                        jankenAdvanced.stats()
                        break
                    // ABC GAME
                    // start
                    case 'abc_profile':
                        console.log(username, '> starting abc_profile command');
                        // maintenis
                        // interact.reply({ content: 'abc 5 bapak sedang maintenis :skull:', flags: '4096' })
                        abcRegister.profile()
                        break
                    case 'abc_register':
                        console.log(username, '> starting abc_register command');
                        // maintenis
                        // interact.reply({ content: 'abc 5 bapak sedang maintenis :skull:', flags: '4096' })
                        abcRegister.register()
                        break
                    case 'abc_start':
                        console.log(username, '> starting abc_start command');
                        // maintenis
                        // interact.reply({ content: 'abc 5 bapak sedang maintenis :skull:', flags: '4096' })
                        abcStart.start()
                        break
                    case 'abc_join':
                        console.log(username, '> starting abc_join command');
                        // maintenis
                        // interact.reply({ content: 'abc 5 bapak sedang maintenis :skull:', flags: '4096' })
                        abcJoin.join()
                        break
                }
                break
        }
    }
}