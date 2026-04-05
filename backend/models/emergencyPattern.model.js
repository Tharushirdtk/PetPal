const { query } = require('../config/db');

const EmergencyPatternModel = {
  /**
   * Get all active emergency patterns ordered by priority
   */
  async getActivePatterns() {
    const sql = `
      SELECT id, name, description, pattern_regex, warning_message,
             severity_level, priority, created_at, updated_at
      FROM emergency_patterns
      WHERE is_active = 1
      ORDER BY priority ASC, created_at ASC
    `;
    return await query(sql);
  },

  /**
   * Get all patterns (for admin management) with pagination
   */
  async getAllPatterns({ page = 1, limit = 20, search = '', severity = '' } = {}) {
    const offset = (page - 1) * limit;
    const params = [];

    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ? OR warning_message LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (severity) {
      whereClause += ' AND severity_level = ?';
      params.push(severity);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM emergency_patterns ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Get paginated results
    const sql = `
      SELECT id, name, description, pattern_regex, warning_message,
             severity_level, priority, is_active, created_at, updated_at,
             created_by, updated_by
      FROM emergency_patterns
      ${whereClause}
      ORDER BY priority ASC, created_at ASC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const patterns = await query(sql, params);

    return {
      patterns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  /**
   * Get a single pattern by ID
   */
  async getById(id) {
    const sql = `
      SELECT * FROM emergency_patterns WHERE id = ?
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Create a new emergency pattern
   */
  async create({ name, description, pattern_regex, warning_message, severity_level = 'HIGH', priority = 10, created_by = null }) {
    const sql = `
      INSERT INTO emergency_patterns
      (name, description, pattern_regex, warning_message, severity_level, priority, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      name, description, pattern_regex, warning_message, severity_level, priority, created_by
    ]);

    // Log audit trail
    await this.auditLog(result.insertId, 'INSERT', null, {
      name, description, pattern_regex, warning_message, severity_level, priority
    }, created_by);

    return { id: result.insertId };
  },

  /**
   * Update an emergency pattern
   */
  async update(id, { name, description, pattern_regex, warning_message, severity_level, priority, is_active, updated_by = null }) {
    // Get old values for audit
    const oldPattern = await this.getById(id);
    if (!oldPattern) {
      throw new Error('Emergency pattern not found');
    }

    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }
    if (pattern_regex !== undefined) {
      fields.push('pattern_regex = ?');
      params.push(pattern_regex);
    }
    if (warning_message !== undefined) {
      fields.push('warning_message = ?');
      params.push(warning_message);
    }
    if (severity_level !== undefined) {
      fields.push('severity_level = ?');
      params.push(severity_level);
    }
    if (priority !== undefined) {
      fields.push('priority = ?');
      params.push(priority);
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    if (updated_by !== undefined) {
      fields.push('updated_by = ?');
      params.push(updated_by);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    params.push(id);

    const sql = `UPDATE emergency_patterns SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    // Log audit trail
    const newValues = { name, description, pattern_regex, warning_message, severity_level, priority, is_active };
    await this.auditLog(id, 'UPDATE', oldPattern, newValues, updated_by);

    return await this.getById(id);
  },

  /**
   * Delete an emergency pattern
   */
  async delete(id, deleted_by = null) {
    // Get pattern for audit before deleting
    const pattern = await this.getById(id);
    if (!pattern) {
      throw new Error('Emergency pattern not found');
    }

    // Log audit trail before deletion
    await this.auditLog(id, 'DELETE', pattern, null, deleted_by);

    const sql = `DELETE FROM emergency_patterns WHERE id = ?`;
    await query(sql, [id]);

    return { deleted: true };
  },

  /**
   * Toggle pattern active status
   */
  async toggleActive(id, updated_by = null) {
    const pattern = await this.getById(id);
    if (!pattern) {
      throw new Error('Emergency pattern not found');
    }

    const newStatus = pattern.is_active ? 0 : 1;
    return await this.update(id, { is_active: newStatus, updated_by });
  },

  /**
   * Check text against all active emergency patterns
   */
  async checkEmergency(text) {
    if (!text || typeof text !== 'string') {
      return { triggered: false, pattern: null, warning: null };
    }

    const patterns = await this.getActivePatterns();

    for (const pattern of patterns) {
      try {
        // Create regex with case-insensitive flag
        const regex = new RegExp(pattern.pattern_regex, 'i');

        if (regex.test(text)) {
          return {
            triggered: true,
            pattern: {
              id: pattern.id,
              name: pattern.name,
              severity: pattern.severity_level,
              priority: pattern.priority
            },
            warning: `⚠️ EMERGENCY: ${pattern.warning_message} Please take your pet to an emergency vet immediately. Do not wait.`
          };
        }
      } catch (error) {
        // Log regex error but continue checking other patterns
        console.error(`Invalid regex pattern in emergency_patterns.id=${pattern.id}:`, error.message);
        continue;
      }
    }

    return { triggered: false, pattern: null, warning: null };
  },

  /**
   * Get statistics for admin dashboard
   */
  async getStats() {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN severity_level = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity_level = 'HIGH' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity_level = 'LOW' THEN 1 ELSE 0 END) as low
      FROM emergency_patterns
    `;

    const result = await query(sql);
    return result[0] || {
      total: 0, active: 0, inactive: 0,
      critical: 0, high: 0, medium: 0, low: 0
    };
  },

  /**
   * Bulk update priorities (for reordering)
   */
  async updatePriorities(priorityUpdates, updated_by = null) {
    // priorityUpdates is an array of { id, priority }
    const promises = priorityUpdates.map(({ id, priority }) =>
      this.update(id, { priority, updated_by })
    );

    return await Promise.all(promises);
  },

  /**
   * Log audit trail for pattern changes
   */
  async auditLog(pattern_id, action, old_values, new_values, changed_by) {
    try {
      const sql = `
        INSERT INTO emergency_patterns_audit
        (pattern_id, action, old_values, new_values, changed_by)
        VALUES (?, ?, ?, ?, ?)
      `;

      await query(sql, [
        pattern_id,
        action,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        changed_by
      ]);
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to log emergency pattern audit:', error);
    }
  },

  /**
   * Get audit history for a pattern
   */
  async getAuditHistory(pattern_id, limit = 50) {
    const sql = `
      SELECT id, action, old_values, new_values, changed_by, changed_at
      FROM emergency_patterns_audit
      WHERE pattern_id = ?
      ORDER BY changed_at DESC
      LIMIT ?
    `;

    return await query(sql, [pattern_id, limit]);
  }
};

module.exports = EmergencyPatternModel;