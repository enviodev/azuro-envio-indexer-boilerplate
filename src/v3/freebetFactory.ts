import {
  FreeBetFactoryContract_NewFreeBet_loader,
  FreeBetFactoryContract_NewFreeBet_handler,
} from "../../generated/src/Handlers.gen";

import { FreebetContractEntity } from "../../generated/src/Types.gen";

import { createFreebetContractEntity } from "../common/freebets";

FreeBetFactoryContract_NewFreeBet_loader(({ event, context }) => {});
FreeBetFactoryContract_NewFreeBet_handler(({ event, context }) => {
  // const freeBetAddress = event.params.freeBetAddress.toString();
  // const liquidityPoolAddress = event.params.lpAddress.toString();
  // const affiliate = event.params.affiliate.toString();
  // const manager = event.params.manager.toString();

  // let freebetContractEntity: FreebetContractEntity =
  //   createFreebetContractEntity(
  //     event.chainId.toString(),
  //     freeBetAddress,
  //     liquidityPoolAddress,
  //     null,
  //     affiliate,
  //     manager
  //   );

  // context.FreebetContract.set(freebetContractEntity);

  // FreebetV3.create(event.params.freeBetAddress) // todo: add contract dynamically in loader
});
