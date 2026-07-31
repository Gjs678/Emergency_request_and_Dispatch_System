const express = require('express');
const {
  createEmergency,
  getPendingEmergencies,
  assignResponder,
  updateStatus,
  getActiveEmergencies,
  notifyExternalDispatchController,
  getResponders,
} = require('../controllers/emergencyController');
const {
  validateBody,
  createEmergencySchema,
  assignResponderSchema,
  updateStatusSchema,
  notifyDispatchSchema,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

// API #1: POST /api/emergency/create
router.post('/create', validateBody(createEmergencySchema), createEmergency);

// API #2: GET /api/emergency/pending
router.get('/pending', getPendingEmergencies);

// API #3: POST /api/emergency/assign
router.post('/assign', validateBody(assignResponderSchema), assignResponder);

// API #4: PATCH /api/emergency/status
router.patch('/status', validateBody(updateStatusSchema), updateStatus);

// API #5: GET /api/emergency/active
router.get('/active', getActiveEmergencies);

// API #6: POST /api/emergency/notify-dispatch
router.post('/notify-dispatch', validateBody(notifyDispatchSchema), notifyExternalDispatchController);

// Auxiliary endpoint: GET /api/emergency/responders
router.get('/responders', getResponders);

module.exports = router;
