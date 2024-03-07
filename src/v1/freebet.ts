import {
  XYZFreeBetContract_BettorWin_loader,
  XYZFreeBetContract_BettorWin_handler,
  XYZFreeBetContract_FreeBetMinted_loader,
  XYZFreeBetContract_FreeBetMinted_handler,
  XYZFreeBetContract_FreeBetMintedBatch_loader,
  XYZFreeBetContract_FreeBetMintedBatch_handler,
  XYZFreeBetContract_FreeBetRedeemed_loader,
  XYZFreeBetContract_FreeBetRedeemed_handler,
  XYZFreeBetContract_FreeBetReissued_loader,
  XYZFreeBetContract_FreeBetReissued_handler,
  XYZFreeBetContract_Transfer_loader,
  XYZFreeBetContract_Transfer_handler,
} from "../../generated/src/Handlers.gen";

import { FreebetContractEntity } from "../../generated/src/Types.gen";

import { createFreebetContractEntity } from "../common/freebets";

import { getLPAndNameOfFreebetV1Details } from "../contracts/freebetv1";

async function getOrCreateFreebetContract(
  chainId: number,
  freebetContractAddress: string,
  context: any
): Promise<FreebetContractEntity> {
  let freebetContractEntity = context.FreebetContract.get(
    freebetContractAddress
  );

  if (freebetContractEntity) {
    return freebetContractEntity;
  }

  const { lp, name } = await getLPAndNameOfFreebetV1Details(
    freebetContractAddress,
    chainId
  );

  return createFreebetContractEntity(
    chainId.toString(),
    freebetContractAddress,
    lp,
    name,
    null,
    null
  );
}

XYZFreeBetContract_BettorWin_loader(({ event, context }) => {});
XYZFreeBetContract_BettorWin_handler(({ event, context }) => {});

XYZFreeBetContract_FreeBetMinted_loader(({ event, context }) => {
  context.FreebetContract.load(event.srcAddress);
});
XYZFreeBetContract_FreeBetMinted_handler(async ({ event, context }) => {
  const freebetContractEntity = getOrCreateFreebetContract(
    event.chainId,
    event.srcAddress,
    context
  );
  // const liquidityPoolContractEntity = LiquidityPoolContract.load(freebetContractEntity.liquidityPool)!
  // createFreebet(
  //   VERSION_V1,
  //   freebetContractEntity.id,
  //   event.address.toHexString(),
  //   freebetContractEntity.name,
  //   null,
  //   event.params.id,
  //   event.params.receiver.toHexString(),
  //   event.params.bet.amount,
  //   liquidityPoolContractEntity.tokenDecimals,
  //   event.params.bet.minOdds,
  //   event.params.bet.durationTime,
  //   event.transaction.hash.toHexString(),
  //   null,
  //   null,
  //   event.block,
  // )
});

XYZFreeBetContract_FreeBetMintedBatch_loader(({ event, context }) => {
  context.FreebetContract.load(event.srcAddress);
});
XYZFreeBetContract_FreeBetMintedBatch_handler(async ({ event, context }) => {
  const freebetContractEntity = getOrCreateFreebetContract(
    event.chainId,
    event.srcAddress,
    context
  );
});

XYZFreeBetContract_FreeBetRedeemed_loader(({ event, context }) => {});
XYZFreeBetContract_FreeBetRedeemed_handler(({ event, context }) => {});

XYZFreeBetContract_FreeBetReissued_loader(({ event, context }) => {});
XYZFreeBetContract_FreeBetReissued_handler(({ event, context }) => {});

XYZFreeBetContract_Transfer_loader(({ event, context }) => {});
XYZFreeBetContract_Transfer_handler(({ event, context }) => {});
