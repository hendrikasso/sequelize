import { Customer as CustomerCore } from './plugins/core/models/customer.model';
import { Customer } from './plugins/a/models/customer.model';

export function run(customer: Customer) {
  customer as Customer;
  customer.address = 'Yes';

  console.log('customer', customer.get());

  const customer2 = Customer.build({
    name: 'test',
    address: 'No address',
    test: 'yes',
    age: 15,
  });
  console.log('customer2', customer2);
  console.log('customer2', customer2.get());
}
