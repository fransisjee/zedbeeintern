const bcrypt = require('bcryptjs');
const fs = require('fs');

const password = '123456789';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

const users = [
    {
        username: 'zedbee',
        password: hash
    }
];

fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
console.log('users.json created successfully');
