/**
 * 🚀 APP INITIALIZATION: stem-lab Entrypoint
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initiating stem-lab App...');
    
    // 1. Initialize LocalStorage database tables with seed data if empty
    StorageEngine.init();
    
    // 2. Initialize UI Engine rendering and event listeners binding
    UIEngine.init();
    
    console.log('✅ stem-lab App is ready to use!');
});
