const bcrypt = require('bcryptjs');
const hash = '$2b$10$kYNGdnQGjJzyV2ptnqLWleH.21tU3i7nVoV9DYMwZS1KXD8NvyF/6';
const passwords = ['12345', '123456789', 'zedbee'];

passwords.forEach(p => {
    const match = bcrypt.compareSync(p, hash);
    console.log(`Password "${p}" matches: ${match}`);
});
