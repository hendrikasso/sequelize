import {
  getAssociations,
  getAttributes,
  getIndexes,
  getModelName,
  getOptions,
  getHooks,
  ModelCtor,
  Sequelize,
  Model,
  getScopeOptionsGetters,
  resolveScope,
} from 'sequelize-typescript';
import { InitOptions } from 'sequelize';
import { ExtendableModel } from './interfaces/extendable-model.interface';
import { HookMeta } from 'sequelize-typescript/dist/hooks/shared/hook-meta';

export class SequelizeExtended extends Sequelize {
  /**
   * Replacement for sequelize-typescript.addModels
   */
  public addExtendableModels(extendableModels: ExtendableModel[]): void {
    const definedModels = this.defineExtendableModels(extendableModels);
    this.associateExtendableModels(definedModels);
    this.resolveScopes(definedModels);
    this.installHooks(definedModels);
  }

  /**
   * Replacement for sequelize-typescript.defineModels
   */
  public defineExtendableModels(
    extendableModels: ExtendableModel[],
  ): ExtendableModel[] {
    return extendableModels.map((extendableModel) => {
      const { coreModel, extenderModels } = extendableModel;

      const modelName = getModelName(coreModel.prototype);
      const modelOptions = getOptions(coreModel.prototype);
      const coreAttributes = getAttributes(coreModel.prototype);
      const coreIndexes = getIndexes(coreModel.prototype);

      if (!modelOptions)
        throw new Error(
          `@Table annotation is missing on class "${coreModel['name']}"`,
        );

      let attributes = coreAttributes;
      let indexes = coreIndexes;

      if (extenderModels) {
        extenderModels.forEach((model) => {
          const modelAttributes = getAttributes(model.prototype);
          const modelIndexes = getIndexes(model.prototype);

          attributes = { ...attributes, ...modelAttributes };
          indexes.named = { ...indexes.named, ...modelIndexes.named };

          const indexesFields: Array<string> = indexes.unnamed.map(
            (index: any) => index.fields.map((field) => field.name).join(''),
          );

          indexes.unnamed = [
            ...indexes.unnamed,
            ...modelIndexes.unnamed.filter(
              (index: any) =>
                indexesFields.length == 0 ||
                indexesFields.indexOf(
                  index.fields.map((field) => field.name).join(''),
                ) < 0,
            ),
          ];
        });
      }

      const indexArray = Object.keys(indexes.named)
        .map((key) => indexes.named[key])
        .concat(indexes.unnamed);

      const initOptions: InitOptions & { modelName } = {
        ...(indexArray.length > 0 && { indexes: indexArray }),
        ...modelOptions,
        modelName,
        sequelize: this,
      };

      extendableModel.coreModel = this.repositoryMode
        ? this.createRepositoryExtendableModel(coreModel)
        : coreModel;
      extendableModel.coreModel.initialize(attributes, initOptions);

      return extendableModel;
    });
  }

  /**
   * Replacement for sequelize-typescript.associateModels
   */
  protected associateExtendableModels(
    extendableModels: ExtendableModel[],
  ): void {
    extendableModels.forEach((extendableModel) => {
      const { coreModel, extenderModels } = extendableModel;

      const coreAssociations = getAssociations(coreModel.prototype);
      const associations = coreAssociations ? coreAssociations : [];
      const associationFields = associations.map(
        (association) => association.getSequelizeOptions(coreModel, this).as,
      );
      if (extenderModels) {
        extenderModels.forEach((model) => {
          const modelAssociations = getAssociations(model.prototype);

          if (modelAssociations) {
            modelAssociations.forEach((association) => {
              const options = association.getSequelizeOptions(model, this);

              if (!associationFields.some((a) => a === options.as)) {
                associations.push(association);
                associationFields.push(options.as);
              }
            });
          }
        });
      }

      if (!associations) return;

      associations.forEach((association) => {
        const options = association.getSequelizeOptions(coreModel, this);
        const associatedClass = this.model(association.getAssociatedClass());

        if (!associatedClass.isInitialized) {
          throw new ModelNotInitializedError(
            associatedClass,
            `Association between ${associatedClass.name} and ${coreModel.name} cannot be resolved.`,
          );
        }
        coreModel[association.getAssociation()](
          associatedClass,
          options as any,
        );
      });
    });
  }

  /**
   * Replacement for (import resolveScopes from sequelize-typescript)
   */
  protected resolveScopes(extendableModels: ExtendableModel[]): void {
    extendableModels.forEach((extendableModel) => {
      const { coreModel, extenderModels } = extendableModel;
      const models = [coreModel, ...(extenderModels ? extenderModels : [])];

      let options = {};
      models.forEach((model) => {
        const { getDefaultScope, getScopes } = getScopeOptionsGetters(
          model.prototype,
        );

        if (getDefaultScope) {
          options = { ...options, ...{ defaultScope: getDefaultScope() } };
        }
        if (getScopes) {
          options = { ...options, ...getScopes() };
        }
      });

      Object.keys(options).forEach((key) =>
        resolveScope(key, coreModel, options[key]),
      );
    });
  }

  /**
   * Replacement for (import installHooks from sequelize-typescript)
   */
  protected installHooks(extendableModels: ExtendableModel[]): void {
    extendableModels.forEach((extendableModel) => {
      const { coreModel, extenderModels } = extendableModel;

      const coreHooks = getHooks(coreModel);
      const hooks = coreHooks ? coreHooks : [];

      if (extenderModels) {
        extenderModels.forEach((extenderModel) => {
          const modelHooks = getHooks(extenderModel);
          if (modelHooks) {
            modelHooks.forEach((modelHook) => {
              if (
                !hooks.some(
                  (hook) =>
                    hook.hookType == modelHook.hookType &&
                    hook.methodName == modelHook.methodName,
                )
              ) {
                hooks.push(modelHook);
              }
            });
          }
        });
      }

      if (hooks.length) {
        hooks.forEach((hook) => {
          this.installHook(coreModel, hook);
        });
      }
    });
  }

  /**
   * Install a hook
   */
  protected installHook(model: ModelCtor, hook: HookMeta): void {
    if (hook.options && hook.options.name) {
      model.addHook(hook.hookType, hook.options.name, model[hook.methodName]);
      return;
    }

    model.addHook(hook.hookType, model[hook.methodName]);
  }

  /**
   * Replacement for sequelize-typescript.createRepositoryModel
   */
  protected createRepositoryExtendableModel(modelClass: ModelCtor): ModelCtor {
    return class extends modelClass {};
  }
}

export class ModelNotInitializedError extends Error {
  message: string;

  constructor(modelClass: typeof Model, additionalMessage: string) {
    super();
    this.message =
      `Model not initialized: ${additionalMessage} "${modelClass.name}" ` +
      `needs to be added to a Sequelize instance.`;
  }
}
