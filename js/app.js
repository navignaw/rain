'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

const GameData = require('./game-data.js');
const Story = require('./story.js');

const ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const ADMIN = process.env.FB_ADMIN;
const REQUEST_URI = 'https://graph.facebook.com/v2.6/me/messages';

let RUNNING_EVENTS = {};
let TESTING = false;

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Serve landing page.
app.get('/', (req, res) => {
  // TODO: create HTML landing page.
  res.send('my name is rain.');
});

app.get('/test', (req, res) => {
  TESTING = true;
  receivedMessage({
    sender: {id: 'test'},
    recipient: {id: 'rain'},
    timestamp: '',
    message: 'message',
  });
});

// Read and response to requests.
app.post('/webhook/', (req, res) => {
  const data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    data.entry.forEach((pageEntry) => {
      const pageId = pageEntry.id;
      const timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach((messagingEvent) => {
        if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        }
        return;  // For now, stop processing future messages.
      });
    });
  }
  res.sendStatus(200);
});


/**
 * Process message data and respond accordingly.
 */
function receivedMessage(event) {
  const senderId = event.sender.id;
  const recipientId = event.recipient.id;
  const timeOfMessage = event.timestamp;
  const message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderId, recipientId, timeOfMessage);
  console.log(JSON.stringify(message));

  if (senderId == ADMIN && tryDebugMessage(message)) {
    return;
  }

  // Check if we are already processing an event to avoid duplicate messages.
  if (RUNNING_EVENTS[senderId]) {
    return;
  }

  // Run the events in sequence.
  RUNNING_EVENTS[senderId] = true;
  let progress = GameData.getProgress(senderId);
  let responses = Story.getResponse(progress, message);
  let result = Promise.resolve();
  responses.forEach((response) => {
    result = result.then(() => executeResponse(senderId, response));
  });
  result.then(() => {
    RUNNING_EVENTS[senderId] = false;
  });
}


/**
 * Debug for admin only. Returns true if debug, false otherwise.
 */
function tryDebugMessage(message) {
  if (message.text == 'RESET') {
    GameData.resetProgress(ADMIN);
    return true;
  }
  return false;
}


/**
 * Creates and sends a JSON message with the appropriate action or delay.
 */
function executeResponse(playerId, response) {
  if (response.MESSAGE) {
    callSendAPI(getTextTemplate(playerId, response.MESSAGE));
  } else if (response.TYPING) {
    callSendAPI(getSenderActionTemplate(playerId, 'typing_' + (response.TYPING ? 'on' : 'off')));
  }

  if (response.PROGRESS) {
    // Update progress. If unspecified, increment story progress by 1 and leave
    // sanity unchanged.
    GameData.saveProgress(playerId, response.PROGRESS.storyProgress || 1, response.PROGRESS.sanity || 0);
  }
  if (response.DELAY) {
    return new Promise((resolve) => setTimeout(resolve, response.DELAY));
  }
  return Promise.resolve();
}


/**
 * Creates a json object for a generic Send API action using the provided
 * recipient id and sender action.
 */
function getSenderActionTemplate(recipientId, senderAction) {
  return {
    recipient: {
      id: recipientId
    },
    sender_action: senderAction
  };
}


/**
 * Creates a json object for a generic Send API message using the provided
 * recipient id and text string.
 */
function getTextTemplate(recipientId, messageText) {
  return {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    },
  };
}


/**
 * Call the Send API with a response.
 */
function callSendAPI(messageData) {
  if (TESTING) {
    console.log(messageData);
    return;
  }
  request({
    uri: REQUEST_URI,
    qs: {access_token: ACCESS_TOKEN},
    method: 'POST',
    json: messageData,
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const recipientId = body.recipient_id;
      const messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s",
            messageId, recipientId);
      } else {
        console.log("Successfully called Send API for recipient %s",
            recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });
}


// Spin up the server.
app.listen(app.get('port'), () => {
  console.log('running on port', app.get('port'))
});
