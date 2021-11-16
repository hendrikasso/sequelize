import {
  Model,
  Table,
  Column,
  DataType,
  Index,
  HasMany,
  DefaultScope,
  Scopes,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { PaymentCard } from './paymentcard.model';

@DefaultScope(() => ({
  attributes: ['id', 'name'],
}))
@Scopes(() => ({
  withPaymentCards: {
    include: [PaymentCard],
  },
  named: {
    where: { named: { [Op.not]: null } },
  },
}))
@Table({
  tableName: 'customer',
  freezeTableName: true,
  timestamps: false,
})
export class Customer extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true })
  id: number;

  @Index
  @Column({ type: DataType.STRING })
  name: string | null;

  @HasMany(() => PaymentCard, 'customer_id')
  paymentCards?: PaymentCard[];

  @BeforeCreate
  @BeforeUpdate
  static testHook1(instance: Customer) {
    if (instance.name) {
      instance.name = instance.name.toUpperCase();
    }
  }
}
