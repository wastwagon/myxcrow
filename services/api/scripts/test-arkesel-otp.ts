/**
 * Test script to send OTP via Arkesel API.
 * Usage: ARKESEL_API_KEY=your_key pnpm tsx scripts/test-arkesel-otp.ts 0242565695
 */
import axios from 'axios';

const phone = process.argv[2] || '0242565695';
const apiKey = process.env.ARKESEL_API_KEY;

if (!apiKey) {
  console.error('Error: ARKESEL_API_KEY env var is required');
  console.error('Usage: ARKESEL_API_KEY=your_key pnpm tsx scripts/test-arkesel-otp.ts [phone]');
  process.exit(1);
}

const recipient = phone.replace(/^\+/, '').replace(/^0/, '233');
if (!recipient.startsWith('233')) {
  console.error('Error: Phone must be Ghana format (0XXXXXXXXX)');
  process.exit(1);
}

async function main() {
  console.log(`Sending OTP to ${phone} (${recipient})...`);
  try {
    const res = await axios.post(
      'https://sms.arkesel.com/api/otp/generate',
      {
        sender_id: 'MYXCROW',
        message: 'Your MYXCROW verification code is: %otp_code%. Valid for 5 minutes. Do not share with anyone.',
        number: recipient,
        expiry: 5,
        type: 'numeric',
        length: 6,
        medium: 'sms',
      },
      {
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      },
    );
    console.log('Response:', JSON.stringify(res.data, null, 2));
    const code = res.data?.code ?? res.data?.status;
    if (code === 1000 || code === '1000' || res.data?.status === 'success') {
      console.log('\n✓ OTP sent successfully! Check the phone for the code.');
    } else {
      console.log('\n✗ Unexpected response code:', code);
    }
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Headers:', JSON.stringify(err.response.headers, null, 2));
    }
    process.exit(1);
  }
}

main();
