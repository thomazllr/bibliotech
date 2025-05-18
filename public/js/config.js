// Get base URL dynamically based on current location
const getBaseUrl = () => {
    // Get the origin (protocol + hostname + port)
    const origin = window.location.origin;
    // Get pathname and find the position of "/bibliotech"
    const pathname = window.location.pathname;
    const bibliotechIndex = pathname.indexOf('/bibliotech');
    
    // If "/bibliotech" is in the path, use it in the API URL
    if (bibliotechIndex !== -1) {
      return `${origin}/bibliotech/api`;
    }
    
    // If "/bibliotech" isn't in the path (like in Docker), just use /api
    return `${origin}/api`;
  };
  
  export const API_BASE = getBaseUrl();
  