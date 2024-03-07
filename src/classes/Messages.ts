import { JankenAdvanced } from "./JankenAdvanced";
import { JankenNormal } from "./JankenNormal";

export class Messages {

    reply(interact: any) {
        const username = interact.member.nickname || interact.user.username
        // janken classes
        const mode = interact.options.get('mode')?.value || ''
        const jankenNormal = new JankenNormal(interact, mode)
        const jankenAdvanced = new JankenAdvanced(interact, mode)
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
                        if(mode === 'normal') jankenNormal.battle()
                        else if(mode === 'advanced') jankenAdvanced.battle()
                        break
                    // check player statistic
                    case 'janken_stats':
                        console.log(username, '> starting janken_stats command');
                        jankenNormal.stats()
                        break
                    // ABC GAME
                    // start
                    case 'abc_start':
                        console.log(username, '> starting abc_start command');
                        interact.send('game start')
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