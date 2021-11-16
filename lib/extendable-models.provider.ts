import { readdirSync, existsSync } from 'fs';
import path = require('path');
import { ModelCtor } from 'sequelize-typescript';
import { ExtendableModel } from './interfaces/extendable-model.interface';

export class ExtendableModelsProvider {
  protected static extendableModels: { [key: string]: ExtendableModel } = {};

  /**
   * Converts Sequlize Models to ExtendableModels
   */
  static async convertModels(
    models: Function[],
    pluginsDirectory: string,
  ): Promise<ExtendableModel[]> {
    if (!Object.keys(this.extendableModels).length) {
      await this.loadModels(pluginsDirectory);
    }

    const modelNames = models
      .map((model) => model.name)
      .filter((value, index, self) => self.indexOf(value) === index);

    return Object.values(modelNames).map(
      (modelName) => this.extendableModels[modelName],
    );
  }

  /**
   * Load all the models
   */
  protected static async loadModels(pluginsDirectory: string): Promise<void> {
    this.extendableModels = {};

    /**
     * Remove core plugin and load it before others
     */
    const pluginsDirctories = this.getPluginsList(pluginsDirectory)
      .filter((plugin) => plugin !== 'core')
      .map((plugin) => path.join(pluginsDirectory, plugin));

    await this.loadPluginModels(path.join(pluginsDirectory, 'core'));

    const pluginsToLoad: Promise<void>[] = [];
    pluginsDirctories.forEach((pluginsDirctory) => {
      pluginsToLoad.push(this.loadPluginModels(pluginsDirctory));
    });

    await Promise.all(pluginsToLoad);
  }

  /**
   * Retuns plugins list
   */
  protected static getPluginsList(pluginsDirectory: string) {
    return readdirSync(pluginsDirectory);
  }

  /**
   * Load all models from plugin directory
   */
  protected static async loadPluginModels(
    pluginDirectory: string,
  ): Promise<void> {
    const modelImports: Promise<any>[] = [];

    console.debug(`Searching models for plugin ${pluginDirectory}`);
    this.searchModelsInFolder(path.join(pluginDirectory, 'models')).forEach(
      (filePath) => {
        console.debug(`Found ${filePath}`);

        modelImports.push(this.loadModel(filePath));
      },
    );

    return Promise.all(modelImports).then((modelImports) => {
      if (modelImports.length > 0) {
        modelImports.forEach((modelImport) => {
          const modelName = Object.keys(modelImport)[0];
          if (modelName) {
            if (this.extendableModels[modelName]) {
              if (!this.extendableModels[modelName]['extenderModels']) {
                this.extendableModels[modelName]['extenderModels'] = [];
              }
              this.extendableModels[modelName]['extenderModels']?.push(
                modelImport[modelName] as ModelCtor,
              );
            } else {
              this.extendableModels[modelName] = {
                coreModel: modelImport[modelName] as ModelCtor,
              };
            }
            console.debug(`Model '${modelName}' loaded`);
          }
        });
      }
    });
  }

  /**
   * Searches modules from directory
   */
  protected static searchModelsInFolder(modelsDirctory: string): string[] {
    if (!existsSync(modelsDirctory)) return [];

    const files = readdirSync(modelsDirctory);

    return files
      .filter(this.isImportable)
      .map((file) => path.join(modelsDirctory, file));
  }

  /**
   * Checks if specified filename is importable or not;
   * Which means that, it needs to have a specific file extension
   */
  protected static isImportable(file: string): boolean {
    const filePart = file.slice(-9);
    return filePart === '.model.js' || filePart === '.model.ts';
  }

  /**
   * Imports single plugin
   */
  protected static loadModel(modelPath: string): Promise<any> {
    return import(modelPath);
  }
}
