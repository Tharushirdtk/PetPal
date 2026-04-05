/**
 * Contact Controller Tests
 * Scenarios from: frontend-scenarios-api-guide.md - Contact Form
 */

jest.mock('../config/db');
jest.mock('../utils/helpers', () => {
  const original = jest.requireActual('../utils/helpers');
  return {
    ...original,
    asyncHandler: (fn) => fn,
  };
});

const { query } = require('../config/db');
const contactCtrl = require('../controllers/contact.controller');

function mockReq(body = {}) {
  return { body };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Contact Controller - submitContact', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Successful contact form submission returns 201', async () => {
    query.mockResolvedValue({ insertId: 1 });

    const req = mockReq({
      heading: 'General Inquiry',
      email: 'user@example.com',
      message: 'I love PetPal! How can I volunteer?',
    });
    const res = mockRes();
    await contactCtrl.submitContact(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { message: 'Contact message submitted successfully' },
      })
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO contact_message'),
      ['General Inquiry', 'user@example.com', 'I love PetPal! How can I volunteer?']
    );
  });

  test('SCENARIO: Missing message returns 400', async () => {
    const res = mockRes();
    await contactCtrl.submitContact(mockReq({ heading: 'Test', email: 'a@b.com' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Message is required' })
    );
  });

  test('SCENARIO: Optional fields (heading, email) can be null', async () => {
    query.mockResolvedValue({ insertId: 2 });

    const req = mockReq({ message: 'Just a message' });
    const res = mockRes();
    await contactCtrl.submitContact(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO contact_message'),
      [null, null, 'Just a message']
    );
  });
});
