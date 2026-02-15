// Test creating a care_request directly
const response = await fetch('http://localhost:3002/api/care-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    service: 'nursing',
    description: 'Test request from script',
    requested_start: new Date('2026-02-16T10:00:00').toISOString(),
    lat: 37.44,
    lng: -122.17
  })
});

const result = await response.json();
console.log('Status:', response.status);
console.log('Result:', result);
