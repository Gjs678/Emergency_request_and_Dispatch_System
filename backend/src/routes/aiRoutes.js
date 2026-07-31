const express = require('express');
const { handleClassifyPriority } = require('../controllers/aiController');
const { validateBody, classifyAISchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

// API #7: POST /api/ai/classify-priority
router.post('/classify-priority', validateBody(classifyAISchema), handleClassifyPriority);

module.exports = router;
