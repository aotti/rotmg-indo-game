export function WebhookErrorFetch(errorMessage: string) {
    const url = process.env['BOTHOOK_URL']
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            content: `command error: ${errorMessage}`
        })
    }
    return fetch(url, options)
    .catch(err => console.log(`webhook error: ${err}`))
}