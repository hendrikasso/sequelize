import {
  Model,
  Table,
  Column,
  DataType,
  Index,
  BelongsTo,
} from 'sequelize-typescript';
import { Customer } from './customer.model';

@Table({
  tableName: 'paymentcard',
  freezeTableName: true,
  timestamps: false,
})
export class PaymentCard extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true })
  id: number;

  @Index
  @Column({ type: DataType.STRING })
  name: string | null;

  @Column({ type: DataType.INTEGER })
  customer_id: number;

  @BelongsTo(() => Customer, 'id')
  customer: Customer;
}
