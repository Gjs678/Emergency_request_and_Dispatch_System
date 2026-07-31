const { classifyPriority } = require('../services/aiService');

/**
 * API #7: POST /api/ai/classify-priority
 * Accepts description text and returns NLP urgency score (1-5) and risk factors
 */
async function handleClassifyPriority(req, res, next) {
  try {
    const { description } = req.body;
    const aiResult = classifyPriority(description);
    return res.status(200).json({
      success: true,
      data: aiResult,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleClassifyPriority,
};
