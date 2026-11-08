module.exports = {
  id: 'fork-pg-0006-user-emos-id',
  phase: 'after',
  description: 'EMOS user id with a case-insensitive unique index',
  async run({ sequelize }) {
    await sequelize.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS emos_id VARCHAR(10)')
    await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS users_emos_id_lower_unique ON users (LOWER(emos_id))')
  }
}
