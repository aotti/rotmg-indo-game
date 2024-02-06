import { Janken } from "./Janken";

export class Messages {
    private janken = new Janken()

    reply(interact: any) {
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
                        this.janken.start(interact)
                        break
                    case 'janken_join':
                        console.log(interact.member.nickname, '> starting janken_join command');
                        this.janken.join(interact)
                        break
                    case 'janken_check':
                        console.log(interact.member.nickname, '> starting janken_check command');
                        this.janken.check(interact)
                        break
                }
                break
        }
    }
}