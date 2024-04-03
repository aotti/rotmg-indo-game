import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from "discord.js";
import { AbcLimaDasar } from "./AbcLimaDasar";
import { IABC_Response_Categories } from "../lib/types";

export class AbcLimaDasarStart extends AbcLimaDasar {
    private categoryAmount: number
    
    constructor(interact: ChatInputCommandInteraction, categoryAmount: number) {
        super(interact)
        this.categoryAmount = categoryAmount
    }

    async start() {
        // defer reply
        await this.interact.deferReply({ ephemeral: true })
        // chosen categories after button interact
        const chosenCategories = []
        // loop to get categories
        for(let i=0; i<this.categoryAmount; i++) {
            // create buttons and interaction for category
            const category = await this.categoryButtonInteraction()
            if(category === null) return // fail to create buttons
            // push category
            chosenCategories.push(category)
        }
        // select categories done
        await this.interact.editReply({ 
            content: `You selected **${chosenCategories.join('** & **')}** categories :sunglasses:` 
        })
        // stuff to insert into abc_rooms
    }

    // ~~ utility method ~~
    protected async categoryButtonInteraction() {
        // fetch stuff
        const fetchOptions: RequestInit = { method: 'GET' }
        const categoryResponse: IABC_Response_Categories = await this.abcFetcher('/word/categories', fetchOptions)
        if(categoryResponse.status === 200) {
            // button stuff
            const categoryButtons = [[], []] as any[][]
            const categoryList = categoryResponse.data.map(v => { return v.category })
            for(let i in categoryList) {
                // create button
                const button = new ButtonBuilder()
                    .setCustomId(categoryList[i])
                    .setLabel(categoryList[i])
                    .setStyle(ButtonStyle.Secondary)
                // push button to array 
                if(+i >= 5) {
                    categoryButtons[1].push(button)
                }
                else {
                    categoryButtons[0].push(button)
                }
            }
            // set button as components
            const categoryRow_1 = new ActionRowBuilder<ButtonBuilder>().addComponents(categoryButtons[0])
            const categoryRow_2 = new ActionRowBuilder<ButtonBuilder>().addComponents(categoryButtons[1])
            // display button
            const buttonResponse = await this.interact.editReply({
                content: `Select categories:`,
                // ### MAX 5 BUTTONS FOR EACH ROW
                components: [categoryRow_1, categoryRow_2]
            })
            // button interaction
            try {
                // ensures that only the user who triggered the interaction can use the buttons
                const collectorFilter = (i: any) => i.user.id === this.interact.user.id
                // waiting player to click a button
                const confirmation = await buttonResponse.awaitMessageComponent({ filter: collectorFilter, time: 20_000 })
                // edit message after clicked a button
                await confirmation.update({ content: `You selected **${confirmation.customId}** category`, components: [] })
                // return selected category
                return confirmation.customId
            } catch (err) {
                // no button response, cancel the game
                await this.interact.editReply({
                    content: 'You only have 20 seconds to select categories :eyes:',
                    components: []
                })
                return null
            }
        }
        else {
            // server side 
            await this.interact.reply({ content: `*server-side error\nerror: ${categoryResponse.message}*`, flags: '4096' })
            return null
        }
    }
}