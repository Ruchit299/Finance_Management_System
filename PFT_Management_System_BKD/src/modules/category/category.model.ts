import { sequelize } from "../../config/dbConnect.ts";
import { DataTypes, Model } from "sequelize";
import { User } from "../user/user.model.ts";

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type CategoryAttributes = {
  id: number;
  name: string;
  userId: number | null;
  deleted: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type CategoryCreationAttributes = Optional<
  CategoryAttributes,
  "id" | "deleted" | "createdAt" | "updatedAt" | "deletedAt" | "userId"
>;

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  declare id: number;
  declare name: string;
  declare userId: number | null;
  declare deleted: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    deleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Category",
    tableName: "categories",
    timestamps: true,
    underscored: true,
  }
);

User.hasMany(Category, { foreignKey: "userId" });
Category.belongsTo(User, { foreignKey: "userId" });

export { Category };
export type { CategoryAttributes };
