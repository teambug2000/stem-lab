/**
 * 🚀 APP INITIALIZATION: stem-lab Entrypoint
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize LocalStorage database tables with seed data if empty
    StorageEngine.init();
    
    // 2. Initialize UI Engine rendering and event listeners binding
    UIEngine.init();
});
