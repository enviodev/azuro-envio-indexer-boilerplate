import { UpgradeableBeaconContract_Upgraded_handler, UpgradeableBeaconContract_Upgraded_loader } from "../../generated/src/Handlers.gen";


UpgradeableBeaconContract_Upgraded_loader(({ event, context }) => {
    // 30_179_675
    // if (event.blockNumber === 29_704_715){
    //     context.contractRegistration.addLPv3(event.params.implementation)
    //     context.log.error(`UpgradeableBeaconContract_Upgraded_loader found in correct block: ${event.params.implementation}`)
    // } else {
    //     context.log.debug(`UpgradeableBeaconContract_Upgraded_loader outside correct block: ${event.params.implementation}`)
    // }
})
UpgradeableBeaconContract_Upgraded_handler(({ event, context }) => {
    // do nothing
    if (event.blockNumber === 29_704_715){
        context.log.error(`UpgradeableBeaconContract_Upgraded_loader found in correct block: ${event.params.implementation}`)
    } else {
        context.log.debug(`UpgradeableBeaconContract_Upgraded_loader outside correct block: ${event.params.implementation}`)
    }
})