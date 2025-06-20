import express from 'express'
import loggers from "notification-loggers"

import { getNotification, getNotifications,  createRequestNotification, deleteNotification, deleteWholeCollection } from '../controllers/notification.js'

const router = express.Router()
loggers()

// GET
router.get('/get/single/:notificationId', getNotification)
router.get('/get/all', getNotifications)

// POST
router.post('/create/request', createRequestNotification)

// DELETE
router.delete('/delete/:notificationId', deleteNotification)
router.delete('/delete/whole-collection', deleteWholeCollection)

export default router