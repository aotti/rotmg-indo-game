export class Messages {
    reply(interact: any) {
        // reply to user who interacted with slash commands
        switch(interact.commandName) {
            case 'greetings':
                console.log(interact.member.nickname, '> starting greetings command');
                interact.reply('gaming gays')
                break
            case 'start_janken':
                break
        }
    }
}