// In-memory storage for demo - in production, use a database
let messageHistory = global.messageHistory || [];
global.messageHistory = messageHistory;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      messages: messageHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    })
  };
};