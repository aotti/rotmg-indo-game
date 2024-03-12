import { ChatInputCommandInteraction } from "discord.js";
import { JankenAdvanced } from "./JankenAdvanced";
import { JankenNormal } from "./JankenNormal";
import { Janken } from "./Janken";

export class Messages {

    async reply(interact: ChatInputCommandInteraction) {
        const username = (interact.member as any).nickname || interact.user.username
        // janken classes
        const janken = new Janken(interact)
        // abc classes
        // ####
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
                        // interact.reply({ content: 'janken sedang maintenis karna mudasir :skull:', flags: '4096' })
                        // select mode
                        const mode = await janken.selectMode()
                        // initialize janken normal & advanced 
                        const jankenNormal = new JankenNormal(interact, mode)
                        const jankenAdvanced = new JankenAdvanced(interact, mode)
                        // run janken
                        mode === 'normal'
                            ? jankenNormal.battle()
                            : jankenAdvanced.battle()
                        break
                    // check player statistic
                    case 'janken_stats':
                        console.log(username, '> starting janken_stats command');
                        janken.stats()
                        break
                    // ABC GAME
                    // start
                    case 'abc_start':
                        console.log(username, '> starting abc_start command');
                        interact
                        break
                    case 'abc_join':
                        console.log(username, '> starting abc_join command');
                        break
                    case 'abc_answer':
                        console.log(username, '> starting abc_answer command');
                        break
                }
                break
        }
    }
}