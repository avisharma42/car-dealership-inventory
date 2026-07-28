'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      make: { type: Sequelize.STRING, allowNull: false },
      model: { type: Sequelize.STRING, allowNull: false },
      category: {
        type: Sequelize.ENUM('sedan', 'suv', 'truck', 'coupe', 'hatchback', 'van'),
        allowNull: false,
      },
      price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addConstraint('vehicles', {
      fields: ['quantity'],
      type: 'check',
      name: 'vehicles_quantity_non_negative',
      where: { quantity: { [Sequelize.Op.gte]: 0 } },
    });
    await queryInterface.addIndex('vehicles', ['make', 'model'], { name: 'vehicles_make_model_idx' });
    await queryInterface.addIndex('vehicles', ['category'], { name: 'vehicles_category_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vehicles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_vehicles_category";');
  },
};
