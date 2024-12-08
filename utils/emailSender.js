// utils/emailSender.js
const AWSEmailSender = require('./awsEmailSender');
const dayjs = require('dayjs');

// Initialize email sender with environment variables
const emailSender = new AWSEmailSender(
    process.env.AWS_IAM_USERNAME,
    process.env.AWS_SMTP_USERNAME,
    process.env.AWS_SMTP_PASSWORD
);

// Location to email mapping configuration
const locationEmailMap = {
    // Remote and specific districts group
    remote: {
        locations: [
            'bagakhangai', 'nalaikh', 
            'arkhangai', 'bayankhongor', 'bayan-olgii', 'bulgan', 
            'darkhan-uul', 'dornod', 'dornogovi', 'dundgovi', 
            'govi-altai', 'govisumber', 'khentii', 'khovd', 
            'khovsgol', 'orkhon', 'omnogovi', 'ovorkhangai', 
            'selenge', 'sukhbaatar-aimag', 'tov', 'uvs', 'zavkhan'
        ],
        // recipients: ['dolgor.p@ontime.mn', 'tuguldur.m@ontime.mn']
        recipients: ['ugshanyu@gmail.com']
    },
    // Central districts group 1
    central1: {
        locations: ['songino-khairkhan', 'sukhbaatar', 'chingeltei'],
        // recipients: ['tumen-ulzii.d@ontime.mn', 'tuguldur.m@ontime.mn']
        recipients: ['ugshanyucolab@gmail.com']
    },
    // Central districts group 2
    central2: {
        locations: ['bayangol', 'khan-uul', 'bayanzurkh'],
        recipients: ['zorigtbaatar.ts@ontime.mn', 'tuguldur.m@ontime.mn']
        // recipients: ['soninangilug@gmail.com']
    }
};

// Function to get recipients based on location
function getRecipientsByLocation(location) {
    for (const group of Object.values(locationEmailMap)) {
        if (group.locations.includes(location)) {
            return group.recipients;
        }
    }
    return null; // Return null if location not found
}

// Function to send notification email
async function sendLocationNotification(location, phone) {
    const recipients = getRecipientsByLocation(location);
    
    if (!recipients) {
        console.error(`No recipients found for location: ${location}`);
        return false;
    }

    const locationName = location.charAt(0).toUpperCase() + location.slice(1).replace(/-/g, ' ');
    
    try {
        await emailSender.send_email(
            process.env.AWS_SENDER_EMAIL || 'no-reply@mongolgpt.mn',  // Get sender email from env
            recipients.join(','),
            'Онтайм програм суулгах хүсэлт',
            `Шинэ хүсэлт:\n\nБайршил: ${locationName}\nУтасны дугаар: ${phone}\n\nЭнэхүү имэйл нь автоматаар илгээгдэж байгаа тул хариу бичих шаардлагагүй.`
        );
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

const TRAINING_RECIPIENTS = ['munkhgerel.ts@ontime.mn', 'delgerekh.g@ontime.mn'];
// const TRAINING_RECIPIENTS = ['ugshanyu@gmail.com'];

// Function to send training notification email
async function sendTrainingNotification(date, time, phone) {
    try {
        const formattedDateTime = dayjs.tz(`${date} ${time}`, 'Asia/Ulaanbaatar')
            .format('YYYY-MM-DD HH:mm');
        
        await emailSender.send_email(
            process.env.AWS_SENDER_EMAIL || 'no-reply@mongolgpt.mn',
            TRAINING_RECIPIENTS.join(','),
            'Онтайм сургалтын захиалга',
            `Шинэ сургалтын захиалга:\n\n` +
            `Огноо: ${formattedDateTime}\n` +
            `Утасны дугаар: ${phone}\n\n` +
            `Энэхүү имэйл нь автоматаар илгээгдэж байгаа тул хариу бичих шаардлагагүй.`
        );
        return true;
    } catch (error) {
        console.error('Error sending training notification:', error);
        return false;
    }
}


module.exports = { sendLocationNotification, sendTrainingNotification };
