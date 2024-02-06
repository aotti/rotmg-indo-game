"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Janken_instances, _a, _Janken_checkPlayerId, _Janken_compareFingers;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Janken = void 0;
const discord_js_1 = require("discord.js");
class Janken {
    constructor() {
        _Janken_instances.add(this);
    }
    // start the game
    start(interact) {
        // set player data
        const firstPlayer = {
            id: interact.member.user.id,
            username: interact.member.nickname,
            finger: interact.options.get('finger').value.toLowerCase(),
            result: null
        };
        // check some stuff before start the game
        if (__classPrivateFieldGet(this, _Janken_instances, "m", _Janken_checkPlayerId).call(this, firstPlayer.id) !== -1) {
            // player id exist
            return interact.reply({ content: 'You already start the game :expressionless:', ephemeral: true });
        }
        else if (_a.playerArray.length > 0) {
            // game already started
            return interact.reply({ content: 'There is a running game :expressionless:', ephemeral: true });
        }
        // all stuff checked and no error found
        // push player data to array
        _a.playerArray.push(firstPlayer);
        // create embed message
        const fingerEmoji = firstPlayer.finger === 'rock'
            ? ':punch:'
            : firstPlayer.finger === 'paper'
                ? ':hand_splayed:'
                : ':v:';
        const embedMessage = new discord_js_1.EmbedBuilder()
            .setTitle('Janken (aduan jari)')
            .setDescription('waiting other player\n───────────────────')
            .addFields({
            name: `${firstPlayer.username}`,
            value: `Finger: ${firstPlayer.finger} ${fingerEmoji}`
        });
        // reply message
        // interact.reply({ embeds: [embedMessage], flags: [4096], ephemeral: true })
        interact.reply({ embeds: [embedMessage], ephemeral: true });
    }
    // join the existing game
    join(interact) {
        // set player data
        const secondPlayer = {
            id: interact.member.user.id,
            username: interact.member.nickname,
            finger: interact.options.get('finger').value.toLowerCase(),
            result: null
        };
        // check some stuff before start the game
        if (__classPrivateFieldGet(this, _Janken_instances, "m", _Janken_checkPlayerId).call(this, secondPlayer.id) !== -1) {
            // player id exist and prevent same player doing solo game
            return interact.reply({ content: 'You already join the game :expressionless:', ephemeral: true });
        }
        else if (_a.playerArray.length < 1) {
            // no running game 
            return interact.reply({ content: 'There is no running game :expressionless:', ephemeral: true });
        }
        // push 2nd player to array
        _a.playerArray.push(secondPlayer);
        // compare finger from 1st and 2nd player
        const compareResult = __classPrivateFieldGet(this, _Janken_instances, "m", _Janken_compareFingers).call(this, interact);
        _a.playerArray.map((v, i) => { v.result = compareResult[i]; });
        // create embed result
        const embedResult = new discord_js_1.EmbedBuilder()
            .setTitle('Janken (aduan jari)')
            .setDescription(`game over <:daily_suicid:710973707241390202>\n───────────────────`);
        for (let player of _a.playerArray) {
            const fingerEmoji = player.finger === 'rock'
                ? ':punch:'
                : player.finger === 'paper'
                    ? ':hand_splayed:'
                    : ':v:';
            embedResult.addFields({
                name: `${player.username} (${player.result})`,
                value: `Finger: ${player.finger} ${fingerEmoji}`
            });
        }
        // display result
        // flags [4096] = silent message
        interact.reply({ embeds: [embedResult], flags: [4096] });
        // reset playerArray
        _a.playerArray = [];
    }
    // look for a running game
    check(interact) {
        if (_a.playerArray.length === 0) {
            // no one playing
            interact.reply({ content: 'There is no game in progress :sob:', ephemeral: true });
        }
        else if (_a.playerArray.length > 0) {
            // someone is playing
            const waitingPlayer = _a.playerArray[0];
            interact.reply({ content: `${waitingPlayer.username} is waiting :eyes:`, ephemeral: true });
        }
    }
}
exports.Janken = Janken;
_a = Janken, _Janken_instances = new WeakSet(), _Janken_checkPlayerId = function _Janken_checkPlayerId(playerId) {
    const checkPlayer = _a.playerArray.map(v => { return v.id; }).indexOf(playerId);
    return checkPlayer;
}, _Janken_compareFingers = function _Janken_compareFingers(interact) {
    if (_a.playerArray.length < 2) {
        // not enough player
        return interact.reply({ content: 'Not enough player to compare :nerd:', ephemeral: true });
    }
    const firstFinger = _a.playerArray[0].finger;
    const secondFinger = _a.playerArray[1].finger;
    const tempResult = [];
    // compare finger
    // draw condition
    if (firstFinger === secondFinger) {
        tempResult.push('draw', 'draw');
    }
    else if (firstFinger !== secondFinger) {
        switch (true) {
            // win condition
            case firstFinger === 'rock' && secondFinger === 'scissor':
            case firstFinger === 'paper' && secondFinger === 'rock':
            case firstFinger === 'scissor' && secondFinger === 'paper':
                tempResult.push('win', 'lose');
                break;
            // lose condition
            case firstFinger === 'rock' && secondFinger === 'paper':
            case firstFinger === 'paper' && secondFinger === 'scissor':
            case firstFinger === 'scissor' && secondFinger === 'rock':
                tempResult.push('lose', 'win');
                break;
        }
    }
    return tempResult;
};
Janken.playerArray = [];
