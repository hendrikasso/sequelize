import {
  Model,
  Table,
  Column,
  DataType,
  Scopes,
  AfterCreate,
  AfterUpdate,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Customer as CustomerCore } from '../../core/models/customer.model';

@Scopes(() => ({
  underage: {
    where: {
      age: { [Op.lt]: 18 },
    },
  },
}))
@Table({
  tableName: 'customer',
  freezeTableName: true,
  timestamps: false,
})
export class Customer extends CustomerCore {
  @Column({ type: DataType.INTEGER, allowNull: true })
  age?: number | null;

  @AfterCreate
  @AfterUpdate
  static testHook2(instance: Customer) {
    if (instance.age) {
      instance.age += 1;
    }
  }
}
