/**
 * Copyright 2018-2019 Symlink GmbH
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */



import { STORAGE_TYPES, storageContainer } from "@symlinkde/eco-os-pk-storage";
import { bootstrapperContainer } from "@symlinkde/eco-os-pk-core";
import Config from "config";
import { PkStorage, PkStorageConfig, MsConf } from "@symlinkde/eco-os-pk-models";
import { injectable } from "inversify";

@injectable()
export class ConfigService implements PkStorageConfig.IConfigService {
  private configRepro: PkStorage.IMongoRepository<MsConf.IConfig>;

  public constructor() {
    storageContainer.bind(STORAGE_TYPES.Collection).toConstantValue(Config.get("mongo.collection"));
    storageContainer.bind(STORAGE_TYPES.Database).toConstantValue(Config.get("mongo.db"));
    storageContainer
      .bind(STORAGE_TYPES.StorageTarget)
      .toConstantValue(
        process.env.SECONDLOCK_MONGO_CONF_DATA === undefined ? "" : process.env.SECONDLOCK_MONGO_CONF_DATA,
      );
    storageContainer
      .bind(STORAGE_TYPES.SECONDLOCK_REGISTRY_URI)
      .toConstantValue(bootstrapperContainer.get("SECONDLOCK_REGISTRY_URI"));
    this.configRepro = storageContainer.getTagged<PkStorage.IMongoRepository<MsConf.IConfig>>(
      STORAGE_TYPES.IMongoRepository,
      STORAGE_TYPES.STATE_LESS,
      true,
    );
  }

  public async create(obj: MsConf.IConfig): Promise<MsConf.IConfig> {
    return await this.configRepro.create(obj);
  }
  public async get(key: string): Promise<MsConf.IConfig | null> {
    const result = await this.configRepro.find({ key });
    if (result === undefined || result === null) {
      return null;
    }

    return result[0];
  }
  public async getAll(): Promise<Array<MsConf.IConfig> | null> {
    return await this.configRepro.find({});
  }
  public async delete(key: string): Promise<boolean> {
    const entry = await this.get(key);
    if (entry === null || entry._id === undefined) {
      return false;
    }
    return await this.configRepro.delete(entry._id);
  }
  public async update(key: string, value: string | number | Date | object): Promise<boolean> {
    const entry = await this.get(key);
    if (entry === null || entry._id === undefined) {
      return false;
    }
    return await this.configRepro.updateWithQuery(entry._id, { $set: { content: value } });
  }
  public async deleteAll(): Promise<boolean> {
    return await this.configRepro.deleteMany({});
  }
}
