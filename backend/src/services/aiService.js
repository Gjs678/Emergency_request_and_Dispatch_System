const logger = require('../utils/logger');

const RISK_DICTIONARY = [
  { keyword: /gunshot|shooting|shooter|weapon/i, factor: 'WEAPON_FIREARM', weight: 5 },
  { keyword: /cardiac|heart attack|unresponsive|no pulse|not breathing/i, factor: 'LIFE_THREATENING_MEDICAL', weight: 5 },
  { keyword: /explosion|bomb|blast|structure collapse/i, factor: 'MASS_CASUALTY_HAZARD', weight: 5 },
  { keyword: /fire|flames|smoke|building on fire/i, factor: 'ACTIVE_FIRE_HAZARD', weight: 4 },
  { keyword: /heavy bleeding|hemorrhage|severed|stabbed/i, factor: 'SEVERE_BLEEDING', weight: 4 },
  { keyword: /crash|collision|trapped|rollover/i, factor: 'VEHICLE_ACCIDENT', weight: 4 },
  { keyword: /choking|airway|suffocating/i, factor: 'AIRWAY_OBSTRUCTION', weight: 4 },
  { keyword: /gas leak|chemical|toxic|fumes/i, factor: 'HAZMAT_EXPOSURE', weight: 3 },
  { keyword: /robbery|burglary|break-in|assault/i, factor: 'ACTIVE_CRIME', weight: 3 },
  { keyword: /fracture|broken bone|fall/i, factor: 'TRAUMA_INJURY', weight: 3 },
  { keyword: /unconscious|passed out|fainted/i, factor: 'ALTERED_MENTAL_STATE', weight: 3 },
  { keyword: /allergic|anaphylaxis/i, factor: 'ALLERGIC_REACTION', weight: 3 },
  { keyword: /minor|scratch|bruise|sprain/i, factor: 'MINOR_INJURY', weight: 1 },
  { keyword: /noise|dispute|theft|lost/i, factor: 'NON_EMERGENCY_CIVIL', weight: 1 },
];

/**
 * Classifies an emergency description into an urgency priority score (1-5)
 * and extracts key risk factors.
 */
function classifyPriority(description = '') {
  if (!description || typeof description !== 'string') {
    return {
      priority_score: 1,
      urgency_level: 'LOW',
      risk_factors: ['UNSPECIFIED'],
      recommendation: 'Standard dispatch evaluation required.',
    };
  }

  const text = description.toLowerCase();
  let maxWeight = 1;
  const detectedFactors = new Set();

  for (const item of RISK_DICTIONARY) {
    if (item.keyword.test(text)) {
      detectedFactors.add(item.factor);
      if (item.weight > maxWeight) {
        maxWeight = item.weight;
      }
    }
  }

  // Sentiment / intensity bonus analysis (e.g. multiple exclamation marks, "urgent", "help", "dying")
  if (/dying|help|immediately|sos|emergency|urgent/i.test(text) && maxWeight < 5) {
    maxWeight = Math.min(5, maxWeight + 1);
    detectedFactors.add('HIGH_URGENCY_SENTIMENT');
  }

  if (detectedFactors.size === 0) {
    detectedFactors.add('GENERAL_ASSISTANCE_NEEDED');
  }

  let urgencyLevel = 'LOW';
  let recommendation = 'Dispatch standard patrol when available.';

  switch (maxWeight) {
    case 5:
      urgencyLevel = 'CRITICAL';
      recommendation = 'IMMEDIATE DISPATCH REQUIRED: Priority 1 units + Paramedics / SWAT.';
      break;
    case 4:
      urgencyLevel = 'HIGH';
      recommendation = 'HIGH PRIORITY: Rapid response unit dispatch within 3 minutes.';
      break;
    case 3:
      urgencyLevel = 'MEDIUM';
      recommendation = 'MEDIUM PRIORITY: Standard emergency dispatch within 10 minutes.';
      break;
    case 2:
      urgencyLevel = 'MODERATE';
      recommendation = 'MODERATE PRIORITY: Queue for next available responder unit.';
      break;
    case 1:
    default:
      urgencyLevel = 'LOW';
      recommendation = 'LOW PRIORITY: Routine response / callback queue.';
      break;
  }

  const result = {
    priority_score: maxWeight,
    urgency_level: urgencyLevel,
    risk_factors: Array.from(detectedFactors),
    recommendation,
  };

  logger.info(`AI Classify Result: score=${result.priority_score}, factors=${result.risk_factors.join(',')}`);
  return result;
}

module.exports = {
  classifyPriority,
};
