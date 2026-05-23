function generateMeetCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (n) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg(3)}-${seg(4)}-${seg(3)}`;
}

function generateMeetLink() {
  return `https://meet.google.com/${generateMeetCode()}`;
}

module.exports = { generateMeetCode, generateMeetLink };
