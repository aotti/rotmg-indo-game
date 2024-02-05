"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
class Messages {
    reply(interact) {
        // reply to user who interacted with slash commands
        switch (interact.commandName) {
            case 'greetings':
                console.log(interact.member.nickname, '> starting greetings command');
                interact.reply('gaming gays');
                break;
            case 'start_janken':
                break;
        }
    }
}
exports.Messages = Messages;
