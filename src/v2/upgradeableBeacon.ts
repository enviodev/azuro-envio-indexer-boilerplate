import { UpgradeableBeaconContract_Upgraded_handler, UpgradeableBeaconContract_Upgraded_loader } from "../../generated/src/Handlers.gen";


UpgradeableBeaconContract_Upgraded_loader(({ event, context }) => {
    context.contractRegistration.addLPv3(event.params.implementation)

    throw new Error (`catches upgradable beacon ${event.params.implementation}`)
})
UpgradeableBeaconContract_Upgraded_handler(({ event, context }) => {
    // do nothing
})