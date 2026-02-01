document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-menu-btn');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');
    const applyBtn = document.getElementById('apply-btn');

    // Function to toggle the menu visibility
    function toggleMenu() {
        sidebarMenu.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    // Event listeners for opening and closing the menu
    hamburgerBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // Event listener for the "Apply" button to open the Tally form popup
    applyBtn.addEventListener('click', () => {
        // You need to replace 'YOUR_FORM_ID' with the actual ID from your Tally form share link.
        const formId = 'rjP6Xo'; 
        if (typeof Tally !== 'undefined' && formId !== 'rjP6Xo') {
            Tally.open(formId, {
                width: 500,
                hideTitle: true,
                autoClose: true
            });
        } else if (formId === 'rjP6Xo') {
            alert('Please update the YOUR_FORM_ID in script.js with your actual Tally form ID.');
        } else {
            alert('Tally script not loaded.');
        }
    });
});

