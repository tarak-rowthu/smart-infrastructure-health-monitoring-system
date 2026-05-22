const db = require('../config/db');

const UserModel = {
    // Get user by email from the existing 'user' table
    getUserByEmail: async (email) => {
        const query = 'SELECT * FROM user WHERE email = ?';
        const [rows] = await db.execute(query, [email]);
        return rows[0];
    },

    // Create a new user in the existing 'user' table
    createUser: async (name, email, hashedPassword, role = 'user') => {
        const query = 'INSERT INTO user (name, email, Password, role) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [name, email, hashedPassword, role]);
        return result;
    }
};

module.exports = UserModel;
