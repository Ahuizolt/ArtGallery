'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('board_images', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      board_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'boards', key: 'id' },
        onDelete: 'CASCADE',
      },
      image_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'images', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Evitar duplicados: una imagen solo puede estar una vez en el mismo tablero
    await queryInterface.addIndex('board_images', ['board_id', 'image_id'], {
      unique: true,
      name: 'unique_board_image',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('board_images');
  },
};
