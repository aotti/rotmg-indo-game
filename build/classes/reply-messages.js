"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
class Message {
    reply(interact) {
        // reply to user who interacted with slash commands
        switch (interact.commandName) {
            case 'greetings':
                console.log(interact.member.nickname, '> starting greetings command');
                interact.reply('gaming gays');
                break;
        }
    }
}
exports.Message = Message;
