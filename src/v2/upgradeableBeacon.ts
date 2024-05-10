import { UpgradeableBeaconContract_Upgraded_handler, UpgradeableBeaconContract_Upgraded_loader } from "../../generated/src/Handlers.gen";


UpgradeableBeaconContract_Upgraded_loader(({ event, context }) => {
    context.contractRegistration.addLPv3(event.params.implementation)

    context.log.error(`UpgradeableBeaconContract_Upgraded_loader: ${event.params.implementation}`)
})
UpgradeableBeaconContract_Upgraded_handler(({ event, context }) => {
    // do nothing
})