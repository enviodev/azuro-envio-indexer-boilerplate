import { AzuroBetContractEntity, CoreContract_LpChangedEvent_handlerContextAsync } from "../src/Types.gen"


async export function createAzuroBetEntity(
    coreAddress: string,
    azuroBetAddress: string,
    context: CoreContract_LpChangedEvent_handlerContextAsync,
): Promise<azuroBetContractEntity> {
    const azuroBetContractEntity: AzuroBetContractEntity = await context.AzuroBetContract.get(azuroBetAddress)
    
    context.AzuroBetContract.set({
        ...azuroBetContractEntity,
        address: azuroBetAddress,
        core_id: coreAddress,
    })

    return azuroBetContractEntity
}