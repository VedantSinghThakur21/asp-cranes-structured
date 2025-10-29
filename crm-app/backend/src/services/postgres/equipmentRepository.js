// Get equipment by category
export const getEquipmentByCategory = async category => {
  try {
    console.log(`📋 Fetching equipment by category: ${category}`);
    const equipment = await db.any('SELECT * FROM equipment WHERE category = $1 ORDER BY name', [
      category,
    ]);
    console.log(`✅ Found ${equipment.length} equipment items for category ${category}`);

    // Transform the data to match frontend expectations
    const transformedEquipment = equipment.map(item => ({
      id: item.id,
      equipmentId: item.equipment_id,
      name: item.name,
      category: item.category,
      manufacturingDate: item.manufacturing_date,
      registrationDate: item.registration_date,
      maxLiftingCapacity: item.max_lifting_capacity,
      unladenWeight: item.unladen_weight,
      baseRates: {
        micro: parseFloat(item.base_rate_micro) || 0,
        small: parseFloat(item.base_rate_small) || 0,
        monthly: parseFloat(item.base_rate_monthly) || 0,
        yearly: parseFloat(item.base_rate_yearly) || 0,
      },
      runningCostPerKm: parseFloat(item.running_cost_per_km) || 0,
      description: item.description,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    console.log(`🔄 Transformed equipment data:`, transformedEquipment[0]);
    return transformedEquipment;
  } catch (error) {
    console.error('❌ Error fetching equipment by category:', error);
    return [];
  }
};
// Enhanced equipmentRepository using centralized db client
import { db } from '../../lib/dbClient.js';

export const getAllEquipment = async () => {
  try {
    console.log('📋 Fetching all equipment...');
    const equipment = await db.any('SELECT * FROM equipment ORDER BY name');
    console.log(`✅ Found ${equipment.length} equipment items`);

    // Transform the data to match frontend expectations
    const transformedEquipment = equipment.map(item => ({
      id: item.id,
      equipmentId: item.equipment_id,
      name: item.name,
      category: item.category,
      manufacturingDate: item.manufacturing_date,
      registrationDate: item.registration_date,
      maxLiftingCapacity: item.max_lifting_capacity,
      unladenWeight: item.unladen_weight,
      baseRates: {
        micro: parseFloat(item.base_rate_micro) || 0,
        small: parseFloat(item.base_rate_small) || 0,
        monthly: parseFloat(item.base_rate_monthly) || 0,
        yearly: parseFloat(item.base_rate_yearly) || 0,
      },
      runningCostPerKm: parseFloat(item.running_cost_per_km) || 0,
      description: item.description,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return transformedEquipment;
  } catch (error) {
    console.error('❌ Error fetching equipment:', error);
    return [];
  }
};

export const getEquipmentById = async id => {
  try {
    console.log(`🔍 Fetching equipment by ID: ${id}`);
    const equipment = await db.oneOrNone('SELECT * FROM equipment WHERE id = $1', [id]);
    console.log(`📝 Equipment found: ${equipment ? 'Yes' : 'No'}`);

    if (!equipment) return null;

    // Transform the data to match frontend expectations
    const transformedEquipment = {
      id: equipment.id,
      equipmentId: equipment.equipment_id,
      name: equipment.name,
      category: equipment.category,
      manufacturingDate: equipment.manufacturing_date,
      registrationDate: equipment.registration_date,
      maxLiftingCapacity: equipment.max_lifting_capacity,
      unladenWeight: equipment.unladen_weight,
      baseRates: {
        micro: parseFloat(equipment.base_rate_micro) || 0,
        small: parseFloat(equipment.base_rate_small) || 0,
        monthly: parseFloat(equipment.base_rate_monthly) || 0,
        yearly: parseFloat(equipment.base_rate_yearly) || 0,
      },
      runningCostPerKm: parseFloat(equipment.running_cost_per_km) || 0,
      description: equipment.description,
      status: equipment.status,
      createdAt: equipment.created_at,
      updatedAt: equipment.updated_at,
    };

    return transformedEquipment;
  } catch (error) {
    console.error('❌ Error fetching equipment by ID:', error);
    return null;
  }
};

export const createEquipment = async equipmentData => {
  try {
    console.log('🆕 Creating new equipment...');
    const result = await db.one(
      `INSERT INTO equipment (
        equipment_id, name, category, manufacturing_date, registration_date, max_lifting_capacity, unladen_weight,
        base_rate_micro, base_rate_small, base_rate_monthly, base_rate_yearly, running_cost_per_km, description, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
      ) RETURNING *`,
      [
        equipmentData.equipmentId,
        equipmentData.name,
        equipmentData.category,
        equipmentData.manufacturingDate,
        equipmentData.registrationDate,
        equipmentData.maxLiftingCapacity,
        equipmentData.unladenWeight,
        equipmentData.baseRates?.micro,
        equipmentData.baseRates?.small,
        equipmentData.baseRates?.monthly,
        equipmentData.baseRates?.yearly,
        equipmentData.runningCostPerKm,
        equipmentData.description,
        equipmentData.status || 'available',
      ]
    );
    console.log(`✅ Equipment created successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error creating equipment:', error);
    throw error;
  }
};

export const updateEquipment = async (id, equipmentData) => {
  try {
    console.log(`📝 Updating equipment: ${id}`);
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (equipmentData.equipmentId) {
      updates.push(`equipment_id = $${paramIndex++}`);
      values.push(equipmentData.equipmentId);
    }
    if (equipmentData.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(equipmentData.name);
    }
    if (equipmentData.category) {
      updates.push(`category = $${paramIndex++}`);
      values.push(equipmentData.category);
    }
    if (equipmentData.manufacturingDate) {
      updates.push(`manufacturing_date = $${paramIndex++}`);
      values.push(equipmentData.manufacturingDate);
    }
    if (equipmentData.registrationDate) {
      updates.push(`registration_date = $${paramIndex++}`);
      values.push(equipmentData.registrationDate);
    }
    if (equipmentData.maxLiftingCapacity !== undefined) {
      updates.push(`max_lifting_capacity = $${paramIndex++}`);
      values.push(equipmentData.maxLiftingCapacity);
    }
    if (equipmentData.unladenWeight !== undefined) {
      updates.push(`unladen_weight = $${paramIndex++}`);
      values.push(equipmentData.unladenWeight);
    }
    if (equipmentData.baseRates?.micro !== undefined) {
      updates.push(`base_rate_micro = $${paramIndex++}`);
      values.push(equipmentData.baseRates.micro);
    }
    if (equipmentData.baseRates?.small !== undefined) {
      updates.push(`base_rate_small = $${paramIndex++}`);
      values.push(equipmentData.baseRates.small);
    }
    if (equipmentData.baseRates?.monthly !== undefined) {
      updates.push(`base_rate_monthly = $${paramIndex++}`);
      values.push(equipmentData.baseRates.monthly);
    }
    if (equipmentData.baseRates?.yearly !== undefined) {
      updates.push(`base_rate_yearly = $${paramIndex++}`);
      values.push(equipmentData.baseRates.yearly);
    }
    if (equipmentData.runningCostPerKm !== undefined) {
      updates.push(`running_cost_per_km = $${paramIndex++}`);
      values.push(equipmentData.runningCostPerKm);
    }
    if (equipmentData.description) {
      updates.push(`description = $${paramIndex++}`);
      values.push(equipmentData.description);
    }
    if (equipmentData.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(equipmentData.status);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE equipment SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.one(query, values);
    console.log(`✅ Equipment updated successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error updating equipment:', error);
    throw error;
  }
};

export const deleteEquipment = async id => {
  try {
    console.log(`🗑️ Deleting equipment: ${id}`);
    await db.none('DELETE FROM equipment WHERE id = $1', [id]);
    console.log(`✅ Equipment deleted successfully: ${id}`);
  } catch (error) {
    console.error('❌ Error deleting equipment:', error);
    throw error;
  }
};
