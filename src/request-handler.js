const modalBuilder = require("./block-kit/modal-builder");
const responseBuilder = require("./block-kit/response-builder");
const sheets = require('./google-sheets/sheets');
const { createHash } = require('crypto');

const SUPPORT_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL;

function requestHandler(app, logger) {
  async function buildSupportModal(client, user, trigger_id) {
    logger.debug('buildSupportModal()');

    const options = await sheets.getOptions();

    const view = modalBuilder.buildSupportModal(user, options);

    const result = await client.views.open({
      trigger_id,
      view,
    });

    logger.debug(`user: ${user}`);
    logger.trace(result);
  }

  // Listens to incoming messages that contain "hello"
  app.message("hello", async ({ message, say }) => {
    logger.debug(message.user);
    await say(`Hey there <@${message.user}>!`);
  });

  // Listens to any message
  app.message('', async (obj) => {
    const { message, say } = obj;

    // TODO:
    // If the message is a reply, check to see if the thread hasn't been
    // replied to.  If not, update a timestamp.
    if (message.thread_ts) {
      logger.debug(message);
      // await say(`Hello, <@${message.user}>`);
      sheets.updateReplyTimeStampForMessage(hashMessageId(message.thread_ts.replace('.', '')));
    }
  });

  app.command("/help", async ({ ack, body, client, command }) => {
    // Message the user
    try {
      await ack();

      let msg = `Hey there <@${body.user_id}>!  To submit a new support request, use the /support command.  Simply type /support in the chat.`;
  
      await client.chat.postMessage({
        channel: body.channel_id,
        text: msg,
      });
    } catch (error) {
      logger.error(error);
    }
  });

  app.command("/support", async ({ ack, body, client }) => {
    try {
      // Acknowledge the command request
      await ack();

      logger.info('/support command invoked.');

      // Call views.open with the built-in client
      buildSupportModal(client, body.user_id, body.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  // The open_modal shortcut opens a plain old modal
  app.shortcut("support", async ({ shortcut, ack, client }) => {
    try {
      // Acknowledge shortcut request
      await ack();

      logger.info('support shortcut invoked.');

      // Call views.open with the built-in client
      buildSupportModal(client, shortcut.user.id, shortcut.trigger_id);
    } catch (error) {
      logger.error(error);
    }
  });

  // Handle Form Submission
  app.view("support_modal_view", async ({ ack, body, view, client }) => {
    // Message the user
    try {
      await ack();

      const { id, username: whoSubmitted } = body.user;
      const { users_requesting_support : users, topic, summary } = view.state.values;
  
      const whoNeedsSupport = users.users.selected_users;
      const selectedTeam = topic.selected.selected_option.value;
      const summaryDescription = summary.value.value;
  
      logger.trace("whoNeedsSupport", whoNeedsSupport);
      logger.trace("selectedTeam", selectedTeam);
      logger.trace("summaryDescription", summaryDescription);
  
      const dateTime = new Date(Date.now());

      const postedMessage = await client.chat.postMessage({
        channel: SUPPORT_CHANNEL_ID,
        link_names: 1,
        blocks: responseBuilder.buildSupportResponse(id, selectedTeam, summaryDescription),
        text: `Hey there <@${id}>!`,
        unfurl_links: false,
      });
      
      if (!postedMessage.ok) {
        logger.error(`Unable to post message. ${JSON.stringify(postedMessage)}`);
        return;
      }

      const messageId = postedMessage.ts.replace('.', '');
      const messageLink = `https://adhoc.slack.com/archives/${postedMessage.channel}/p${messageId}`;

      const hashedMessageId = hashMessageId(messageId);

      logger.trace(postedMessage);
      logger.debug(`Posted Message ID: ${messageId}`);
      logger.debug(`Posted Message ID Hashed: ${hashedMessageId}`);

      const slackUsers = await Promise.all(whoNeedsSupport.map(async id => await getSlackUser(client, id)));

      const usernames = slackUsers.map(user => user.user.name);

      sheets.captureResponses(hashedMessageId, whoSubmitted, dateTime, usernames, selectedTeam, summaryDescription, messageLink);
    } catch (error) {
      logger.error(error);
    }
  });

  const getSlackUser = async (client, userId) => {
    try {
      // Call the users.info method using the WebClient
      return await client.users.info({
        user: userId
      });
    }
    catch (error) {
      // If it fails to retreive the username, just return the user Id
      logger.error(error);
  
      return userId;
    }
  }

  const hashMessageId = (messageId) => {
    const hash = createHash('md5');
    return hash.update(messageId).digest('hex');
  }
}

module.exports = requestHandler;
