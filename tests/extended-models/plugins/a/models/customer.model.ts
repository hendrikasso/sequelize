import {
  Model,
  Table,
  Column,
  DataType,
  Index,
  HasOne,
  HasMany,
  Scopes,
  AfterCreate,
  AfterUpdate,
} from 'sequelize-typescript';
import { Customer as CustomerCore } from '../../core/models/customer.model';
import { FuelCard } from './fuelcard.model';

@Scopes(() => ({
  withFuelCards: {
    include: [FuelCard],
  },
}))
@Table({
  tableName: 'customer',
  freezeTableName: true,
  timestamps: false,
})
export class Customer extends CustomerCore {
  @Index('customer-address')
  @Column({ type: DataType.STRING, allowNull: true })
  address?: string | null;

  @HasMany(() => FuelCard, 'customer_id')
  fuelcards?: FuelCard[];

  @AfterCreate
  @AfterUpdate
  static testHook3(instance: Customer) {
    if (instance.address) {
      instance.address += ' 3366';
    }
  }
}
