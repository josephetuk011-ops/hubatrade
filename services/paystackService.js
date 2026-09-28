import axios from 'axios';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const initializePayment = async (amount, email, reference) => {
  try {
    if (!SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        amount: amount * 100, // Paystack expects amount in kobo
        email,
        reference
      },
      {
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyPayment = async (reference) => {
  try {
    if (!SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    throw error;
  }
};

export const createTransferRecipient = async (accountNumber, bankCode, name, type = 'nuban') => {
  try {
    if (!SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transferrecipient`,
      {
        type,
        name,
        account_number: accountNumber,
        bank_code: bankCode
      },
      {
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Transfer recipient creation error:', error.response?.data || error.message);
    throw error;
  }
};

export const initiateTransfer = async (amount, recipientCode, reason) => {
  try {
    if (!SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transfer`,
      {
        source: 'balance',
        amount: amount * 100,
        recipient: recipientCode,
        reason
      },
      {
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Transfer initiation error:', error.response?.data || error.message);
    throw error;
  }
};
