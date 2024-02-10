import { Janken } from "./Janken";

export class JankenNormal extends Janken {
    constructor(interact: any, mode: string) {
        super(interact, mode)
    }

    protected fingerEmoji(finger: string): string {
        const emoji = []
        switch(finger) {
            case 'rock': emoji.push(':punch:'); break
            case 'paper': emoji.push(':hand_splayed:'); break
            case 'scissor': emoji.push(':v:'); break
        }
        return emoji[0]
    }
    

    protected compareFingers(): string[] {
        if(Janken.playerArray[this.mode].length < 2) {
            // not enough player
            return this.interact.reply({ content: 'Not enough player to compare :nerd:', ephemeral: true })
        }
        const firstFinger = Janken.playerArray[this.mode][0].finger
        const secondFinger = Janken.playerArray[this.mode][1].finger
        // // check if finger is for normal mode
        // if(this.fingerNormal(firstFinger) === false || this.fingerNormal(secondFinger) === false) {
        //     // finger is not normal
        //     return this.interact.reply({ content: `Please use appropriate finger (${this.mode})`, flags: [4096] })
        // }
        const tempResult = []
        // compare finger
        // draw condition
        if(firstFinger === secondFinger) {
            tempResult.push('draw', 'draw')
        }
        else if(firstFinger !== secondFinger) {
            switch(true) {
                // win condition
                case firstFinger === 'rock' && secondFinger === 'scissor':
                case firstFinger === 'paper' && secondFinger === 'rock':
                case firstFinger === 'scissor' && secondFinger === 'paper':
                    tempResult.push('win', 'lose')
                    break
                // lose condition
                case firstFinger === 'rock' && secondFinger === 'paper':
                case firstFinger === 'paper' && secondFinger === 'scissor':
                case firstFinger === 'scissor' && secondFinger === 'rock':
                    tempResult.push('lose', 'win')
                    break
            }
        }
        return tempResult
    }
}