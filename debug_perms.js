const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
require('dotenv').config();

async function debugPermissions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'admin@test.com' });
        if (!user) {
            console.log('User not found');
            process.exit(0);
        }

        const perms = await user.getEffectivePermissions();
        console.log('Permisos:', perms.join(', '));

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

debugPermissions();
