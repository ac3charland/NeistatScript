const fs = require('fs')
const readline = require('readline')
const {google} = require('googleapis')
const moment = require('moment')
require('dotenv').config()
const keys = require('./keys')

// If modifying these scopes, delete token.json.
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/youtube.readonly'
]
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json'

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err)
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), createNewVlogRow)
})

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0])

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback)
        oAuth2Client.setCredentials(JSON.parse(token))
        callback(oAuth2Client)
    })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    })
    console.log('Authorize this app by visiting this url:', authUrl)
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close()
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err)
            oAuth2Client.setCredentials(token)
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err)
                console.log('Token stored to', TOKEN_PATH)
            })
            callback(oAuth2Client)
        })
    })
}

async function createNewVlogRow(auth) {
    const sheets = google.sheets({version: 'v4', auth})
    const nextVlogIndex = await getNextVlogNumber(sheets)
    const nextVlog = await getNextVlog(auth, nextVlogIndex)

    const nextVlogNumber = nextVlogIndex + 1
    const nextVlogNumberText = `VLOG_${'0'.repeat(3 - nextVlogNumber.toString().length)}${nextVlogNumber}`
    const cataloguedDate = moment().format('M/D/YYYY')
    const {title, publishedAt, resourceId} = nextVlog?.snippet
    const url = `https://www.youtube.com/watch?v=${resourceId.videoId}`
    const uploaded = moment(publishedAt).format('M/D/YYYY')
    const notesUrl = keys.list.notesUrl

    const data = [
        {
            range: `Vlogs!A${nextVlogNumber + 1}:I${nextVlogNumber + 1}`,
            values: [[nextVlogNumberText], [title], [uploaded], [cataloguedDate], [], [], [], [notesUrl], [url]],
            majorDimension: 'COLUMNS'
        }
    ]

    const resource = {
        data,
        valueInputOption: 'USER_ENTERED'
    }

    updateSheet(sheets, resource)
}

async function getNextVlogNumber(sheets) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: keys.list.spreadsheetId,
        range: 'Vlogs!A2:A',
    })
    return response.data.values.length
}

async function getNextVlog(auth, index) {
    const response = await google.youtube('v3').playlistItems.list({
        auth,
        part: [
            "snippet"
        ],
        maxResults: 365,
        playlistId: "PLTHOlLMWEwVy52FUngq91krMkQDQBagYw"
    })
    const vlogs = response.data.items
    return vlogs[index]
}

function updateSheet(sheets, resource) {
    sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: keys.list.spreadsheetId,
        resource: resource,
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err)
        console.log('Update successful!')
    })
}
