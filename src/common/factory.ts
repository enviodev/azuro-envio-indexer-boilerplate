import { CoreContractEntity } from "../../generated/src/Types.gen";


export function createCoreContractEntity(
    coreAddress: string,
    liquidityPoolContractAddress: string,
    coreType: string,
  ): CoreContractEntity {

    const coreContractEntity: CoreContractEntity = {
      id : coreAddress,
      liquidityPool_id: liquidityPoolContractAddress,
      address: coreAddress,
      type_: coreType
    }
  
    return coreContractEntity
  }