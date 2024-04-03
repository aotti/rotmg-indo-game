import { ChatInputCommandInteraction } from "discord.js";
import { Janken } from "./Janken";

export class JankenAdvanced extends Janken {
    constructor(interact: ChatInputCommandInteraction, mode: string) {
        super(interact)
        this.mode = mode
    }

    protected fingerEmoji(finger: string) {
        const emoji = []
        switch(finger) {
            case 'rock': emoji.push(':punch:'); break
            case 'paper': emoji.push(':hand_splayed:'); break
            case 'scissor': emoji.push(':v:'); break
            case 'fire': emoji.push(':fire:'); break
            case 'water': emoji.push(':shower:'); break
            case 'air': emoji.push(':tornado:'); break
            case 'sponge': emoji.push(':sponge:'); break
        }
        return emoji[0]
    }

    protected compareFingers(): string[] {
        function compare(myFinger: string, enemyFinger: string): boolean {
            let result = false
            const winCondition = {
                rock: ['fire', 'scissor', 'sponge'],
                fire: ['scissor', 'sponge', 'paper'],
                scissor: ['sponge', 'paper', 'air'],
                sponge: ['paper', 'air', 'water'],
                paper: ['air', 'water', 'rock'],
                air: ['water', 'rock', 'fire'],
                water: ['rock', 'fire', 'scissor']
            }
            // find my finger
            for(let [key, value] of Object.entries(winCondition)) {
                // find enemy finger
                for(let val of value) {
                    // compare my finger & enemy finger
                    if(key === myFinger && val === enemyFinger) 
                        result = true
                }
            }
            return result
        }
        // get player fingers
        const firstFinger = Janken.playerArray[this.mode][0].finger
        const secondFinger = Janken.playerArray[this.mode][1].finger
        const tempResult = []
        // compare finger
        // draw condition
        if(firstFinger === secondFinger) {
            tempResult.push('draw', 'draw')
        }
        else if(firstFinger !== secondFinger) {
            switch(true) {
                // win condition
                case compare(firstFinger, secondFinger):
                    tempResult.push('win', 'lose')
                    break
                // lose condition
                default:
                    tempResult.push('lose', 'win')
                    break
            }
        }
        return tempResult
    }
}