"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
const Janken_1 = require("./Janken");
class Messages {
    constructor() {
        this.janken = new Janken_1.Janken();
    }
    reply(interact) {
        // reply to user who interacted with slash commands
        switch (interact.commandName) {
            case 'greetings':
                console.log(interact.member.nickname, '> starting greetings command');
                interact.reply('gaming gays');
                break;
            // gaming command
            case 'gaming':
                switch (interact.options.getSubcommand()) {
                    // JANKEN GAME
                    // start
                    case 'janken_start':
                        this.janken.start(interact);
                        break;
                    case 'janken_join':
                        this.janken.join(interact);
                        break;
                    case 'janken_check':
                        this.janken.check(interact);
                        break;
                }
                break;
        }
    }
}
exports.Messages = Messages;
