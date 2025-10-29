// Enhanced operatorRepository using centralized db client
import { db } from '../../lib/dbClient.js';

export const getOperators = async () => {
  try {
    console.log('👥 Fetching all operators...');
    const operators = await db.any('SELECT * FROM operators ORDER BY name');
    console.log(`✅ Found ${operators.length} operators`);
    return operators;
  } catch (error) {
    console.error('❌ Error fetching operators:', error);
    return [];
  }
};

export const getOperatorById = async id => {
  try {
    console.log(`🔍 Fetching operator by ID: ${id}`);
    const operator = await db.oneOrNone('SELECT * FROM operators WHERE id = $1', [id]);
    console.log(`📝 Operator found: ${operator ? 'Yes' : 'No'}`);
    return operator;
  } catch (error) {
    console.error('❌ Error fetching operator by ID:', error);
    return null;
  }
};

export const createOperator = async operatorData => {
  try {
    console.log('🆕 Creating new operator...');
    const result = await db.one(
      `INSERT INTO operators (name, email, phone, specialization, certifications, availability, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [
        operatorData.name,
        operatorData.email,
        operatorData.phone,
        operatorData.specialization,
        operatorData.certifications ? JSON.stringify(operatorData.certifications) : null,
        operatorData.availability || 'available',
      ]
    );
    console.log(`✅ Operator created successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error creating operator:', error);
    throw error;
  }
};

export const updateOperator = async (id, operatorData) => {
  try {
    console.log(`📝 Updating operator: ${id}`);
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (operatorData.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(operatorData.name);
    }
    if (operatorData.email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(operatorData.email);
    }
    if (operatorData.phone) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(operatorData.phone);
    }
    if (operatorData.specialization) {
      updates.push(`specialization = $${paramIndex++}`);
      values.push(operatorData.specialization);
    }
    if (operatorData.certifications) {
      updates.push(`certifications = $${paramIndex++}`);
      values.push(JSON.stringify(operatorData.certifications));
    }
    if (operatorData.availability) {
      updates.push(`availability = $${paramIndex++}`);
      values.push(operatorData.availability);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE operators SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.one(query, values);
    console.log(`✅ Operator updated successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error updating operator:', error);
    throw error;
  }
};

export const deleteOperator = async id => {
  try {
    console.log(`🗑️ Deleting operator: ${id}`);
    await db.none('DELETE FROM operators WHERE id = $1', [id]);
    console.log(`✅ Operator deleted successfully: ${id}`);
  } catch (error) {
    console.error('❌ Error deleting operator:', error);
    throw error;
  }
};
