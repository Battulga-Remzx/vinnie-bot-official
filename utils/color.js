// utils/color.js
module.exports = {
  /**
   * Ботын тохиргооноос өнгө авах эсвэл default өнгө буцаах
   * @param {Object} client - Discord client
   * @param {string} colorName - Өнгөний нэр (primary, success, error, etc)
   * @returns {string} - Hex өнгө
   */
  getColor: (client, colorName = 'primary') => {
    const defaultColors = {
      primary: '#5865F2',
      success: '#57F287',
      warning: '#FEE75C',
      error: '#ED4245',
      economy: '#FFD700'
    };
    
    // Хэрэв client.config.color байгаа бол түүнээс авах
    if (client.config && client.config.color && client.config.color[colorName]) {
      return client.config.color[colorName];
    }
    
    // Default өнгө буцаах
    return defaultColors[colorName] || defaultColors.primary;
  }
};