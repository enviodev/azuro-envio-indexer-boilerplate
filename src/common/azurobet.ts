import { AzuroBetContractEntity, CoreContract_LpChangedEvent_handlerContextAsync, FactoryContract_NewCoreEvent_handlerContext, FactoryContract_NewCoreEvent_handlerContextAsync } from "../src/Types.gen"


export async function createAzuroBetEntity(
    coreAddress: string,
    azuroBetAddress: string,
    context: CoreContract_LpChangedEvent_handlerContextAsync | FactoryContract_NewCoreEvent_handlerContextAsync | FactoryContract_NewCoreEvent_handlerContext,
): Promise<typeof azuroBetContractEntity> {
    const azuroBetContractEntity = await context.AzuroBetContract.get(azuroBetAddress)

    if (!azuroBetContractEntity) {
        context.log.error(`createAzuroBetEntity azuroBetContractEntity not found. azuroBetAddress = ${azuroBetAddress}`)
        throw new Error(`createAzuroBetEntity azuroBetContractEntity not found. azuroBetAddress = ${azuroBetAddress}`)
    }
    
    context.AzuroBetContract.set({
        ...azuroBetContractEntity,
        address: azuroBetAddress,
        core_id: coreAddress,
    })

    return azuroBetContractEntity
}