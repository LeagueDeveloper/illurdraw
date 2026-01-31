/**
 * Illurdraw CDN Tag Processor
 * 
 * Usage: 
 *   <i class="illur-2D ghost-pumpkin m color-1"></i>
 *   
 * Format: 
 *   <i class="[category] [image-name] [size] [color-option]"></i>
 * 
 * Categories: illur-bg, illur-2D, illur-people, illur-classic
 * Sizes: xxs, xs, s, m, l, xl, xxl
 * Color: color, color-1, color-2, color-3, etc.
 */

const SIZE_MAP = {
  'xxs': '16px',
  'xs': '24px',
  's': '32px',
  'm': '48px',
  'l': '64px',
  'xl': '96px',
  'xxl': '128px'
};

const CATEGORY_TAG_MAP = {
  'illur-bg': 'background',
  'illur-2D': '2D',
  'illur-people': 'People',
  'illur-classic': 'classic'
};

let illustrationsCache = null;

async function loadIllustrations() {
  if (illustrationsCache) return illustrationsCache;
  try {
    const response = await fetch('https://illurdraw.vercel.app/backend/js/json/illustrations.json');
    const data = await response.json();
    illustrationsCache = data.illustrations || [];
    return illustrationsCache;
  } catch (err) {
    console.error('Failed to load illustrations for CDN:', err);
    return [];
  }
}

function normalizeImageUrl(url) {
  if (!url) return '';
  return url.replace(/^\.\.\//, '/Public/').replace(/^\.\//, '/Public/');
}

function parseTag(classStr) {
  const parts = classStr.split(/\s+/);
  const result = {
    category: null,
    imageName: null,
    size: 'm',
    colorOption: 'color'
  };

  for (const part of parts) {
    if (part.startsWith('illur-')) {
      result.category = part;
    } else if (['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl'].includes(part)) {
      result.size = part;
    } else if (part.startsWith('color')) {
      result.colorOption = part;
    } else if (part && !part.startsWith('illur-')) {
      result.imageName = part;
    }
  }

  return result;
}

function findIllustrationByNameAndCategory(imageName, category) {
  if (!illustrationsCache) return null;
  const categoryTag = CATEGORY_TAG_MAP[category];
  return illustrationsCache.find(item => {
    const titleMatch = item.title && item.title.toLowerCase().includes(imageName.toLowerCase());
    const urlMatch = item.url && item.url.toLowerCase().includes(imageName.toLowerCase());
    const categoryMatch = categoryTag && item.tags && item.tags.some(t => t.toLowerCase() === categoryTag.toLowerCase());
    return (titleMatch || urlMatch) && (categoryMatch || !categoryTag);
  });
}

async function replaceCdnTags() {
  const illustrations = await loadIllustrations();
  if (!illustrations.length) return;

  const tags = document.querySelectorAll('i[class*="illur-"]');
  
  for (const tag of tags) {
    const classStr = tag.className || '';
    const parsed = parseTag(classStr);

    if (!parsed.imageName) continue;

    const illust = findIllustrationByNameAndCategory(parsed.imageName, parsed.category);
    if (!illust) {
      console.warn(`CDN: Could not find illustration "${parsed.imageName}" in category "${parsed.category}"`);
      continue;
    }

    const src = normalizeImageUrl(illust.url);
    const size = SIZE_MAP[parsed.size] || SIZE_MAP.m;
    const sizeNum = parseInt(size);
    
    // Create img element
    const img = document.createElement('img');
    img.src = src;
    img.alt = illust.title;
    img.style.width = size;
    img.style.height = size;
    img.style.display = 'inline-block';
    img.style.objectFit = 'contain';
    img.style.verticalAlign = 'middle';
    
    // Apply color filter if applicable (for SVGs with fill)
    if (parsed.colorOption && parsed.colorOption.startsWith('color') && illust.customizable) {
      // For now, just add a data attribute; styling can be applied via CSS or JS
      img.setAttribute('data-color-option', parsed.colorOption);
      // Optional: add filter for tinting (this is a simple approach)
      // img.style.filter = `hue-rotate(${colorToHue(parsed.colorOption)})`;
    }

    img.title = illust.title;
    img.className = `illur-icon illur-${parsed.size} ${parsed.colorOption}`;
    
    // Replace tag with img
    tag.replaceWith(img);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', replaceCdnTags);
} else {
  replaceCdnTags();
}

// Export for manual use
export { replaceCdnTags, loadIllustrations, parseTag };
