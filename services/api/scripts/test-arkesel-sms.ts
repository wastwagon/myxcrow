/**
 * Test Arkesel SMS V2 (sends custom OTP message - our fallback flow)
 * Usage: ARKESEL_API_KEY=your_key pnpm tsx scripts/test-arkesel-sms.ts 0242565695
 */
import axios from 'axios';

const phone = process.argv[2] || '0242565695';
const apiKey = process.env.ARKESEL_API_KEY!;
const recipient = phone.replace(/^\+/, '').replace(/^0/, '233');
const code = String(Math.floor(100000 + Math.random() * 900000));

console.log(`Sending OTP SMS to ${phone} (${recipient}), code: ${code}...`);
axios
  .post(
    'https://sms.arkesel.com/api/v2/sms/send',
    {
      sender: 'MYXCROW',
      message: `Your MYXCROW verification code is: ${code}. Valid for 5 minutes. Do not share with anyone.`,
      recipients: [recipient],
    },
    { headers: { 'api-key': apiKey, 'Content-Type': 'application/json' } },
  )
  .then((res) => {
    console.log('Response:', JSON.stringify(res.data, null, 2));
    if (res.data?.status === 'success') {
      console.log('\n✓ SMS sent! Code:', code);
    }
  })
  .catch((err) => {
    console.error('Error:', err.response?.data || err.message, 'Status:', err.response?.status);
    process.exit(1);
  });
