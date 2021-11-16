import { ModelCtor } from 'sequelize-typescript';

export type ExtendableModel = {
  coreModel: ModelCtor;
  extenderModels?: ModelCtor[];
};
