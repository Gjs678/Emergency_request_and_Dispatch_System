const { z } = require('zod');

const createEmergencySchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  description: z.string().min(3, 'Description must be at least 3 characters'),
});

const assignResponderSchema = z.object({
  request_id: z.string().min(1, 'request_id is required'),
  responder_id: z.string().min(1, 'responder_id is required'),
});

const updateStatusSchema = z.object({
  request_id: z.string().min(1, 'request_id is required'),
  status: z.enum(['PENDING', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED', 'CANCELLED']),
});

const notifyDispatchSchema = z.object({
  request_id: z.string().min(1, 'request_id is required'),
});

const classifyAISchema = z.object({
  description: z.string().min(1, 'description text is required'),
});

function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        });
      }
      next(error);
    }
  };
}

module.exports = {
  validateBody,
  createEmergencySchema,
  assignResponderSchema,
  updateStatusSchema,
  notifyDispatchSchema,
  classifyAISchema,
};
