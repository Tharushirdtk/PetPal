const { query } = require('../config/db');
const { asyncHandler, ok, fail } = require('../utils/helpers');

exports.submitContact = asyncHandler(async (req, res) => {
  const { heading, email, message } = req.body;

  if (!message) {
    return fail(res, 'Message is required');
  }

  await query(
    'INSERT INTO contact_message (heading, email, message, created_by) VALUES (?, ?, ?, NULL)',
    [heading || null, email || null, message]
  );

  return ok(res, { message: 'Contact message submitted successfully' }, 201);
});
