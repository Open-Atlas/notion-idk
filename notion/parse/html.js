import get from '../get/static';

module.exports = (pageId) => {
  blocks = get.blockChildren(pageId);
  return blocks;
};

// get blockchildren
// loop through blocks
// parse as HTML

// later implement shortcode for custom blocks
