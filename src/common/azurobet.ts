import { AzuroBetContractEntity, CoreContract_LpChangedEvent_handlerContextAsync, FactoryContract_NewCoreEvent_handlerContext, FactoryContract_NewCoreEvent_handlerContextAsync } from "../src/Types.gen"


export async function createAzuroBetEntity(
    coreAddress: string,
    azuroBetAddress: string,
    context: CoreContract_LpChangedEvent_handlerContextAsync | FactoryContract_NewCoreEvent_handlerContextAsync | FactoryContract_NewCoreEvent_handlerContext,
): Promise<typeof azuroBetContractEntity> {
    const azuroBetContractEntity: AzuroBetContractEntity = {
        id: azuroBetAddress,
        core_id: coreAddress,
        address: azuroBetAddress,
    }

    context.AzuroBetContract.set({
        ...azuroBetContractEntity,
        address: azuroBetAddress,
        core_id: coreAddress,
    })

    return azuroBetContractEntity
}