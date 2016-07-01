/* jshint indent: 4 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('region', { 
		name: {
			type: DataTypes.STRING(64),
			allowNull: false,
			defaultValue: ''
		},
		code: {
			type: DataTypes.STRING(8),
			allowNull: true
		},
		quota: { 
			type: DataTypes.TINYINT,
			allowNull: true
		},
		archdiocese: { 
			type: DataTypes.BOOLEAN,
			allowNull: true
		},
		cooke_points: { 
			type: DataTypes.INTEGER,
			allowNull: true
		},
		sweeps: { 
			type: DataTypes.SMALLINT,
			allowNull: true
		}
	});
};



