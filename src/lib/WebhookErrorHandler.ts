export function WebhookErrorFetch(errorCommand: string, errorMessage: string) {
    const url = process.env['BOTHOOK_URL']
    // error content
    const errorContent = {
        bot: 'anu gaming',
        command: errorCommand,
        error: errorMessage
    }
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            content: errorContent
        })
    }
    return fetch(url, options)
    .catch(err => console.log(`webhook error: ${err}`))
}