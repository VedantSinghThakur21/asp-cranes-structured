export const findUsersByRole = async role => {
  try {
    console.log(`🔍 Looking for users with role: ${role}`);
    const users = await db.any(
      'SELECT uid, display_name, email FROM users WHERE role = $1 ORDER BY display_name ASC',
      [role]
    );
    console.log(`✅ Found ${users.length} users with role ${role}`);
    return users;
  } catch (error) {
    console.error('❌ Error finding users by role:', error);
    throw error;
  }
};
// Auth repository using centralized database client
import { db } from '../../lib/dbClient.js';
import bcrypt from 'bcrypt';

export const findUserByEmail = async email => {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    console.log(`📝 User found: ${user ? 'Yes' : 'No'}`);
    return user;
  } catch (error) {
    console.error('❌ Error finding user by email:', error);
    throw error;
  }
};

export const validatePassword = async (password, hashedPassword) => {
  try {
    console.log('🔐 Validating password...');
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`✅ Password valid: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error('❌ Error validating password:', error);
    return false;
  }
};

export const createUser = async userData => {
  try {
    console.log(`🆕 Creating new user: ${userData.email}`);
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const result = await db.one(
      'INSERT INTO users (email, password, name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [userData.email, hashedPassword, userData.name, userData.role || 'user']
    );
    console.log(`✅ User created successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    console.log(`📝 Updating user: ${id}`);
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (userData.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(userData.name);
    }
    if (userData.email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    if (userData.role) {
      updates.push(`role = $${paramIndex++}`);
      values.push(userData.role);
    }
    if (userData.password) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      updates.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.one(query, values);
    console.log(`✅ User updated successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    console.log(`🗑️ Deleting user: ${id}`);
    await db.none('DELETE FROM users WHERE id = $1', [id]);
    console.log(`✅ User deleted successfully: ${id}`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    console.log('📋 Fetching all users...');
    const users = await db.any(
      'SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    console.log(`✅ Found ${users.length} users`);
    return users;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
};

export const findUserById = async id => {
  try {
    console.log(`🔍 Looking for user with ID: ${id}`);
    const user = await db.oneOrNone(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    console.log(`📝 User found: ${user ? 'Yes' : 'No'}`);
    return user;
  } catch (error) {
    console.error('❌ Error finding user by ID:', error);
    throw error;
  }
};
