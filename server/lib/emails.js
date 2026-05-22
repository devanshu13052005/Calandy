const transporter = require('./mailer');

async function sendConfirmationEmail(booking, eventType, host) {
  const tz = eventType.host_timezone || booking.host_timezone || 'Asia/Kolkata';
  const start = new Date(booking.start_time).toLocaleString('en-IN', {
    timeZone: tz,
    dateStyle: 'full',
    timeStyle: 'short',
  });
  await transporter.sendMail({
    from: `"${host.name}" <${process.env.GMAIL_USER}>`,
    to: booking.invitee_email,
    subject: `Confirmed: ${eventType.name} with ${host.name}`,
    html: `<h2>Your meeting is confirmed</h2>
           <p>Hi ${booking.invitee_name},</p>
           <p><strong>${eventType.name}</strong> with ${host.name}</p>
           <p><strong>When:</strong> ${start}</p>
           <p><strong>Duration:</strong> ${eventType.duration_minutes} minutes</p>
           <hr>
           <a href="${process.env.APP_URL}/reschedule/${booking.reschedule_token}">Reschedule</a>
           &nbsp;|&nbsp;
           <a href="${process.env.APP_URL}/cancel/${booking.cancel_token}">Cancel</a>`,
  });
}

async function sendCancellationEmail(booking, eventType, cancelledBy) {
  await transporter.sendMail({
    from: `"Scheduler" <${process.env.GMAIL_USER}>`,
    to: booking.invitee_email,
    subject: `Cancelled: ${eventType.name}`,
    html: `<h2>Meeting cancelled</h2>
           <p>Hi ${booking.invitee_name},</p>
           <p>Your <strong>${eventType.name}</strong> on ${new Date(booking.start_time).toLocaleString('en-IN', { timeZone: eventType.host_timezone || 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })} has been cancelled ${cancelledBy === 'host' ? 'by the host' : 'as requested'}.</p>
           <p><a href="${process.env.APP_URL}/${eventType.slug}">Book a new time</a></p>`,
  });
}

async function sendRescheduleEmail(oldBooking, newBooking, eventType) {
  const tz = eventType.host_timezone || newBooking.host_timezone || 'Asia/Kolkata';
  const fmt = (iso) =>
    new Date(iso).toLocaleString('en-IN', { timeZone: tz, dateStyle: 'full', timeStyle: 'short' });
  const newStart = fmt(newBooking.start_time);
  await transporter.sendMail({
    from: `"Scheduler" <${process.env.GMAIL_USER}>`,
    to: newBooking.invitee_email,
    subject: `Rescheduled: ${eventType.name}`,
    html: `<h2>Meeting rescheduled</h2>
           <p>Hi ${newBooking.invitee_name},</p>
           <p><strong>Old time:</strong> ${fmt(oldBooking.start_time)}</p>
           <p><strong>New time:</strong> ${newStart}</p>
           <hr>
           <a href="${process.env.APP_URL}/reschedule/${newBooking.reschedule_token}">Reschedule again</a>
           &nbsp;|&nbsp;
           <a href="${process.env.APP_URL}/cancel/${newBooking.cancel_token}">Cancel</a>`,
  });
}

module.exports = { sendConfirmationEmail, sendCancellationEmail, sendRescheduleEmail };
