---
title: Send a message to Slack
input:
  - name: message
    type: string
    description: "The message to send to Slack"
  - name: channelId
    type: string
    description: "The channel to send the message to"
  - name: token
    type: string
    description: "The Slack token to use"
---

## Channel Config

1. Right click on the channel you want to send a message to and select "View Channel Details"
2. Copy the channel ID

## Token Config

You only need to do this once and it'll work for all channels in the workspace that you create it.

1.  Visit [this link](https://api.slack.com/apps) and login to your Slack account
2.  Click 'Create new app' and select 'From an app manifest'
3.  Select the workspace you want to use then paste the following app manifest (delete the triple backticks (```) if they appear at the start and end of the file), then click "Next" then "Create".

```json
{
    "display_information": {
        "name": "Wordware message sender",
        "description": "An app to send messages to Slack channels via API.",
        "background_color": "#000000"
    },
    "features": {
        "bot_user": {
            "display_name": "Wordware bot",
            "always_online": true
        }
    },
    "oauth_config": {
        "scopes": {
            "bot": [
                "chat:write",
                "chat:write.public"
            ]
        }
    },
    "settings": {
        "org_deploy_enabled": false,
        "socket_mode_enabled": false,
        "token_rotation_enabled": false
    }
}
```

4.  Click 'Install your app' then 'Allow'
5.  In the left sidebar select 'OAuth & Permissions' then copy the 'Bot User OAuth Token'. This should start with `xoxb-`. That's the `SLACK_BOT_TOKEN` that you'll need to enter here


```js
const body = {
  channel: aimVariables.frontmatter.input.channelId,
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: aimVariables.frontmatter.input.message,
      }
    },
  ]
};

try {
  const r = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-type": "application/json; charset=utf-8",
      "Authorization": "Bearer " + aimVariables.frontmatter.input.token,
    }
  });

  const data = await r.json();
  console.log(data);
  if (!data.ok) {
    console.error(`Error calling code: '${data.error}'`);
  } else {
    console.log("Your message was sent successfully");
  }
} catch(e) {
  console.error("Something went wrong calling Slack:", e);
  throw e;
}
```