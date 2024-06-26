import {
  FreeBetFactoryContract_NewFreeBet_loader,
  FreeBetFactoryContract_NewFreeBet_handler,
} from "../../generated/src/Handlers.gen";

import { FreebetContractEntity } from "../../generated/src/Types.gen";

import { createFreebetContractEntity } from "../common/freebets";

FreeBetFactoryContract_NewFreeBet_loader(({ event, context }) => {
  if (event.params.freeBetAddress == undefined) {
    console.log("kjncourscssdj");
  }
  context.contractRegistration.addFreeBetv3(
    event.params.freeBetAddress.toString()
  );
});
FreeBetFactoryContract_NewFreeBet_handler(({ event, context }) => {
  if (
    event.params.freeBetAddress == undefined ||
    event.params.lpAddress == undefined ||
    event.params.affiliate == undefined ||
    event.params.manager == undefined ||
    event.chainId == undefined
  ) {
    console.log("asdlhaciouehace");
  }

  const freeBetAddress = event.params.freeBetAddress.toString();
  const liquidityPoolAddress = event.params.lpAddress.toString();
  const affiliate = event.params.affiliate.toString();
  const manager = event.params.manager.toString();

  // check that each of the above are not empty
  if (!freeBetAddress || !liquidityPoolAddress || !affiliate || !manager) {
    throw new Error(
      `freeBetAddress, liquidityPoolAddress, affiliate, or manager is null ${freeBetAddress}, ${liquidityPoolAddress}, ${affiliate}, ${manager}`
    );
  }

  const chainId = event.chainId.toString();

  if (!chainId) {
    throw new Error(`chainId is null`);
  }

  createFreebetContractEntity(
    chainId,
    freeBetAddress,
    liquidityPoolAddress,
    null,
    affiliate,
    manager,
    context
  );
});
