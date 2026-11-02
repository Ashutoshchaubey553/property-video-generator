/**
 * AI Script Generator for Property Videos
 * Generates voiceover scripts and scene captions from property data
 */

/**
 * Generate a complete video script from property details
 * @param {Object} property - Property data object
 * @returns {Object} Script with scenes array
 */
function generateScript(property) {
  const {
    name,
    location,
    price,
    type,
    features = [],
    bedrooms,
    bathrooms,
    area,
    contact,
    cta = 'Contact us today!',
    description,
  } = property;

  const priceFormatted = formatPrice(price);
  const scenes = [];

  // === SCENE 1: Opening Title ===
  scenes.push({
    id: 'opening',
    duration: 4,
    title: name || 'Luxury Property',
    subtitle: location || '',
    caption: `Introducing ${name || 'This Beautiful Property'}`,
    voiceover: `Welcome to ${name || 'this stunning property'}, located in ${location || 'a prime location'}.`,
    overlay: {
      primary: name || 'Luxury Property',
      secondary: location || '',
      badge: type || 'Property',
    },
  });

  // === SCENE 2: Price & Type ===
  const specLines = [];
  if (bedrooms) specLines.push(`${bedrooms} Bedrooms`);
  if (bathrooms) specLines.push(`${bathrooms} Bathrooms`);
  if (area) specLines.push(`${area}`);

  scenes.push({
    id: 'price',
    duration: 4,
    title: priceFormatted,
    subtitle: specLines.join('  •  '),
    caption: `${type || 'Property'} | ${priceFormatted}`,
    voiceover: `This ${type || 'property'} is priced at ${priceFormatted}${specLines.length ? ', featuring ' + specLines.join(', ') : ''}.`,
    overlay: {
      primary: priceFormatted,
      secondary: specLines.join('  •  '),
      badge: type || 'For Sale',
    },
  });

  // === SCENES 3+: Feature Scenes ===
  const topFeatures = features.slice(0, 5);
  topFeatures.forEach((feature, idx) => {
    scenes.push({
      id: `feature_${idx + 1}`,
      duration: 4,
      title: feature,
      subtitle: '',
      caption: feature,
      voiceover: `${getFeatureVoiceover(feature, idx)}.`,
      overlay: {
        primary: feature,
        secondary: '',
        badge: `Feature ${idx + 1}`,
      },
    });
  });

  // Fill remaining scenes from description if few features
  if (topFeatures.length < 3 && description) {
    const descSentences = description.split('.').filter(s => s.trim().length > 10).slice(0, 2);
    descSentences.forEach((sentence, idx) => {
      if (topFeatures.length + idx < 5) {
        scenes.push({
          id: `desc_${idx + 1}`,
          duration: 4,
          title: sentence.trim(),
          subtitle: '',
          caption: sentence.trim(),
          voiceover: sentence.trim() + '.',
          overlay: {
            primary: sentence.trim(),
            secondary: '',
            badge: 'Highlight',
          },
        });
      }
    });
  }

  // === FINAL SCENE: Call to Action ===
  scenes.push({
    id: 'cta',
    duration: 5,
    title: cta,
    subtitle: contact || '',
    caption: `${cta} | ${contact || ''}`,
    voiceover: `Don't miss this opportunity! ${cta}${contact ? ' Reach us at ' + contact + '.' : ''}`,
    overlay: {
      primary: cta,
      secondary: contact || '',
      badge: 'Contact Us',
    },
  });

  const fullVoiceover = scenes.map(s => s.voiceover).join(' ');
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return {
    title: name || 'Property Video',
    scenes,
    fullVoiceover,
    totalDuration,
    metadata: { property, generatedAt: new Date().toISOString() },
  };
}

function formatPrice(price) {
  if (!price) return 'Price on Request';
  if (typeof price === 'string') return price;
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

function getFeatureVoiceover(feature, index) {
  const openers = [
    `Enjoy the`,
    `Experience the`,
    `Featuring`,
    `This home includes`,
    `Take advantage of the`,
  ];
  const opener = openers[index % openers.length];
  return `${opener} ${feature.toLowerCase()}`;
}

module.exports = { generateScript, formatPrice };

