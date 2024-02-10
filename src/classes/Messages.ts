import { JankenAdvanced } from "./JankenAdvanced";
import { JankenNormal } from "./JankenNormal";

export class Messages {

    reply(interact: any) {
        const mode = interact.options.get('mode').value
        const jankenNormal = new JankenNormal(interact, mode)
        const jankenAdvanced = new JankenAdvanced(interact, mode)
        // reply to user who interacted with slash commands
        switch(interact.commandName) {
            case 'greetings':
                console.log(interact.member.nickname, '> starting greetings command');
                interact.reply('gaming gays')
                break
            // gaming command
            case 'gaming':
                switch(interact.options.getSubcommand()) {
                    // JANKEN GAME
                    // start
                    case 'janken_start':
                        console.log(interact.member.nickname, '> starting janken_start command');
                        if(mode === 'normal') jankenNormal.start()
                        else if(mode === 'advanced') jankenAdvanced.start()
                        break
                    case 'janken_join':
                        console.log(interact.member.nickname, '> starting janken_join command');
                        if(mode === 'normal') jankenNormal.join()
                        else if(mode === 'advanced') jankenAdvanced.join()
                        break
                    case 'janken_check':
                        console.log(interact.member.nickname, '> starting janken_check command');
                        if(mode === 'normal') jankenNormal.check()
                        else if(mode === 'advanced') jankenAdvanced.check()
                        break
                }
                break
        }
    }
}