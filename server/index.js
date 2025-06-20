import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { existsSync } from 'fs';
import mongoose from 'mongoose';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import approvalRoutes from './routes/approval.js';
import authRoutes from './routes/auth.js';
import cashbookRoutes from './routes/cashbook.js';
import deductionRoutes from './routes/deduction.js';
import eventRoutes from './routes/event.js';
import followUpRoutes from './routes/followUp.js';
import inventoryRoutes from './routes/inventory.js';
import leadRoutes from './routes/lead.js';
import notificationRoutes from './routes/notification.js';
import projectRoutes from './routes/project.js';
import refundRoutes from './routes/refund.js';
import saleRoutes from './routes/sale.js';
import societyRoutes from './routes/society.js';
import taskRoutes from './routes/task.js';
import transcriptRoutes from './routes/transcript.js';
import uploadRoutes from './routes/upload.js';
import userRoutes from './routes/user.js';
import voucherRoutes from './routes/voucher.js';

// Load environment variables with priority: .env.local > .env
if (existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' })
} else {
    dotenv.config()
}

const app = express()
const CONNECTION_URL = process.env.ATLAS_URL
// const CONNECTION_URL = process.env.COMPASS_URL

const PORT = process.env.PORT || 4000
app.use(cors())
app.use(express.json())

// serving static files | images
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/uploads', express.static(join(__dirname, 'uploads')));

app.use('/api/v1', uploadRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/user', userRoutes)
app.use('/api/v1/notification', notificationRoutes)
app.use('/api/v1/task', taskRoutes)
app.use('/api/v1/event', eventRoutes)
app.use('/api/v1/approval', approvalRoutes)
app.use('/api/v1/sale', saleRoutes)
app.use('/api/v1/lead', leadRoutes)
app.use('/api/v1/project', projectRoutes)
app.use('/api/v1/society', societyRoutes)
app.use('/api/v1/inventory', inventoryRoutes)
app.use('/api/v1/followUp', followUpRoutes)
app.use('/api/v1/cashbook', cashbookRoutes)
app.use('/api/v1/refund', refundRoutes)
app.use('/api/v1/voucher', voucherRoutes)
app.use('/api/v1/deduction', deductionRoutes)
app.use('/api/v1/trasncript', transcriptRoutes)

app.get('/', (req, res) => {
    res.send('Welcome to the server')
})

app.use((err, req, res, next) => {
    const message = err.message || 'Something went wrong.'
    const status = err.status || 500
    res.status(status).json({ message, status, stack: err.stack })
    next()
})

mongoose.connect(CONNECTION_URL)
    .then(() => app.listen(PORT, () => console.log('listening at port ' + PORT)))
    .catch((err) => console.log('error in connection with mongoDB = \n', err))