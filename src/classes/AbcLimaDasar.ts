export class AbcLimaDasar {
    protected text: string

    constructor(text: string) {
        this.setText(text)
    }

    getText() {
        return this.text
    }

    setText(text: string) {
        text = text.trim()
        if(text === '')
            return 'text cant be empty'
        this.text = text
    }
}