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
                    case 'start_janken':
                        this.janken.start(interact)
                        break
                    case 'check_janken':
                        this.janken.check(interact)
                        break
                }
                break
        }
    }
}