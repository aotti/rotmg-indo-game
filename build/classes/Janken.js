"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Janken_instances, _a, _Janken_checkPlayerId;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Janken = void 0;
const discord_js_1 = require("discord.js");
class Janken {
    constructor() {
        _Janken_instances.add(this);
    }
    // start the game
    start(interact) {
        // check some stuff before start the game
        if (__classPrivateFieldGet(this, _Janken_instances, "m", _Janken_checkPlayerId).call(this, interact) !== -1) {
            // player id exist
            return interact.reply({ content: 'You already start the game :expressionless:', ephemeral: true });
        }
        else if (_a.playerArray.length > 0) {
            // game already started
            return interact.reply({ content: 'There is a running game :expressionless:', ephemeral: true });
        }
        // all stuff checked and no error found
        // set player data
        const firstPlayer = {
            id: interact.member.user.id,
            username: interact.member.nickname,
            finger: interact.options.get('finger').value.toLowerCase(),
            result: null
        };
        _a.playerArray.push(firstPlayer);
        // create embed message
        const embedMessage = new discord_js_1.EmbedBuilder()
            .setTitle('Janken (aduan jari)')
            .setDescription('waiting other player...')
            .addFields({
            name: `${firstPlayer.username}`,
            value: `Finger: ${firstPlayer.finger}`
        });
        // reply message
        // flags [4096] = silent message
        // interact.reply({ embeds: [embedMessage], flags: [4096], ephemeral: true })
        interact.reply({ embeds: [embedMessage], ephemeral: true });
    }
    // join the existing game
    join(interact) {
        // ### CEK PLAYER SBLM JOIN GAME, UNTUK MENGHINDARI USER YG SAMA
        // ### CEK PLAYER SBLM JOIN GAME, UNTUK MENGHINDARI USER YG SAMA
        // set player data
        const secondPlayer = {
            id: interact.member.user.id,
            username: interact.member.nickname,
            finger: interact.options.get('finger').value.toLowerCase(),
            result: null
        };
    }
    // look for a running game
    check(interact) {
        if (_a.playerArray.length === 0) {
            // no one playing
            interact.reply({ content: 'There is no game in progress :sob:', ephemeral: true });
        }
        else if (_a.playerArray.length > 0) {
            // someone is playing
            interact.reply({ content: 'There is a player waiting :eyes:', ephemeral: true });
        }
    }
}
exports.Janken = Janken;
_a = Janken, _Janken_instances = new WeakSet(), _Janken_checkPlayerId = function _Janken_checkPlayerId(interact) {
    const checkPlayer = _a.playerArray.map(v => { return v.id; }).indexOf(interact.member.user.id);
    return checkPlayer;
};
Janken.playerArray = [];
