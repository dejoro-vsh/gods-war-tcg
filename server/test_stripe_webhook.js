const stripe = require('stripe')('sk_test_dummy');
const http = require('http');

// Configuration
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_dummy';
const SERVER_URL = 'http://localhost:3000/api/webhook/stripe';

// Mock Payload for checkout.session.completed
const payload = {
    id: "evt_test_webhook",
    object: "event",
    type: "checkout.session.completed",
    data: {
        object: {
            id: "cs_test_dummy",
            object: "checkout.session",
            client_reference_id: "test_player_id_123", // Player ID to test
            payment_status: "paid",
            status: "complete"
        }
    }
};

const payloadString = JSON.stringify(payload, null, 2);

// Generate Stripe Signature
const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret: WEBHOOK_SECRET,
});

console.log('Sending mock webhook event to:', SERVER_URL);
console.log('Using Secret:', WEBHOOK_SECRET);
console.log('Client Reference ID:', payload.data.object.client_reference_id);
console.log('---');

// Send HTTP POST
const req = http.request(SERVER_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': header,
        'Content-Length': Buffer.byteLength(payloadString)
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        if (res.statusCode === 200) {
            console.log('✅ Webhook successfully processed!');
        } else {
            console.log('❌ Webhook failed:');
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Problem with request: ${e.message}`);
    console.log('Make sure your local server is running on port 3000!');
});

req.write(payloadString);
req.end();
