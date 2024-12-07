// routes/ontime.js
const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const { sendLocationNotification, sendTrainingNotification } = require('../utils/emailSender');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// Get available slots
router.get('/get-available-slots/:date', async (req, res) => {
    try {
        const selectedDate = dayjs(req.params.date).tz('Asia/Ulaanbaatar');

        // Check if weekend
        if (selectedDate.day() >= 5) {
            return res.status(400).json({
                status: 'error',
                message: 'Зөвхөн Даваа-Баасан гарагт сургалт явагдана'
            });
        }

        // Get start and end of selected date
        const startOfDay = selectedDate.startOf('day').toDate();
        const endOfDay = selectedDate.endOf('day').toDate();

        // Get booked slots
        const bookedSlots = await Schedule.find({
            key: 'ontime',
            scheduled_at: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        const bookedHours = bookedSlots.map(slot => 
            dayjs(slot.scheduled_at).tz('Asia/Ulaanbaatar').hour()
        );

        // Generate available slots (8:00 - 16:00)
        const availableSlots = [];
        for (let hour = 8; hour < 16; hour++) {
            if (!bookedHours.includes(hour)) {
                availableSlots.push(`${hour.toString().padStart(2, '0')}:00`);
            }
        }

        return res.json({
            status: 'success',
            available_slots: availableSlots
        });

    } catch (error) {
        console.error('Error in available-slots:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});


router.post('/schedule', async (req, res) => {
    try {
        const { date, time, phone } = req.body;

        // Validate phone number
        if (!/^[0-9]{8}$/.test(phone)) {
            return res.status(400).json({
                status: 'error',
                message: 'Утасны дугаар буруу байна'
            });
        }

        const selectedDateTime = dayjs.tz(`${date} ${time}`, 'Asia/Ulaanbaatar');
        
        // Check if weekend
        if (selectedDateTime.day() >= 5) {
            return res.status(400).json({
                status: 'error',
                message: 'Зөвхөн Даваа-Баасан гарагт сургалт явагдана'
            });
        }

        // Check time range (8:00-16:00)
        const hour = selectedDateTime.hour();
        if (hour < 8 || hour >= 16) {
            return res.status(400).json({
                status: 'error',
                message: 'Сургалт 08:00-16:00 цагийн хооронд явагдана'
            });
        }

        // Check if slot is already booked
        const existing = await Schedule.findOne({
            key: 'ontime',
            scheduled_at: selectedDateTime.toDate()
        });

        if (existing) {
            return res.status(400).json({
                status: 'error',
                message: 'Энэ цаг өөр захиалгатай байна'
            });
        }

        // Create new booking
        await Schedule.create({
            key: 'ontime',
            phone,
            scheduled_at: selectedDateTime.toDate(),
            created_at: dayjs().tz('Asia/Ulaanbaatar').toDate()
        });

        // Send email notification
        const emailSent = await sendTrainingNotification(date, time, phone);
        
        if (!emailSent) {
            return res.status(500).json({status: 'error', message: 'Алдаа гарлаа'});
        }

        return res.json({
            status: 'success',
            message: 'Амжилттай'
        });

    } catch (error) {
        console.error('Error in schedule:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

router.post('/business', async (req, res) => {
    try {
        const { location, phone } = req.body;

        // Validate phone number
        if (!/^[0-9]{8}$/.test(phone)) {
            return res.status(400).json({
                status: 'error',
                message: 'Утасны дугаар буруу байна'
            });
        }

        // Send email notification
        const emailSent = await sendLocationNotification(location, phone);
        
        if (!emailSent) {
            console.warn('Email notification failed but continuing with request processing');
            return res.status(500).json({
                status: 'error',
                message: 'Алдаа гарлаа'
            });
        }
        
        return res.json({
            status: 'success',
            message: 'Мэдээлэл амжилттай илгээгдлээ'
        });

    } catch (error) {
        console.error('Error in business:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

module.exports = router;