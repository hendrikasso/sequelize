import { ExtendableModelsProvider } from '../../lib/extendable-models.provider'; 
import { SequelizeExtended } from '../../dist/sequelize.extended';
import { FuelCard } from './plugins/a/models/fuelcard.model';
import { Customer } from './plugins/core/models/customer.model';
import { PaymentCard } from './plugins/core/models/paymentcard.model';

ExtendableModelsProvider.convertModels(
  [Customer, PaymentCard, FuelCard],
  '/home/hendrik/Projects/nestjs-sequelize-module/tests/extended-models/plugins',
).then((extendableModels) => {
  const sequelize = new SequelizeExtended({
    host: '127.0.0.1',
    dialect: 'postgres',
    username: 'postgres',
    password: 'qwerty',
    database: 'test',
  });

  sequelize.addExtendableModels(extendableModels);

  const customer = Customer.build({
    id: 1,
    name: 'test',
    age: 10,
    address: 'dsadsa',
  });
  console.log('customer', customer);
});
