import { SequelizeExtended } from '../../lib/sequelize.extended';
import { ExtendableModel } from '../../lib/interfaces/extendable-model.interface';
import { Customer as CustomerCore } from './plugins/core/models/customer.model';
import { Customer as CustomerA } from './plugins/a/models/customer.model';
import { Customer as CustomerB } from './plugins/b/models/customer.model';
import { FuelCard } from './plugins/a/models/fuelcard.model';
import { PaymentCard } from './plugins/core/models/paymentcard.model';
import { run } from './test-run';
import { Model } from 'sequelize-typescript';

const sequelize = new SequelizeExtended({
  host: '127.0.0.1',
  dialect: 'postgres',
  username: 'postgres',
  password: 'qwerty',
  database: 'test',
});

const extendedModels: ExtendableModel[] = [
  {
    coreModel: CustomerCore,
    extenderModels: [CustomerA, CustomerB],
  },
  {
    coreModel: FuelCard,
  },
  {
    coreModel: PaymentCard,
  },
];

sequelize.addExtendableModels(extendedModels);

const customer = CustomerCore.build({
  id: 1,
  name: 'test',
  age: 10,
  address: 'dsadsa',
});
console.log('customer', customer);

run(customer);
