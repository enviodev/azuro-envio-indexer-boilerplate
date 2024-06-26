import { create } from "domain";
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
  XYZFreeBetContract_FreeBetMintedBatch_handlerAsync,
  XYZFreeBetContract_FreeBetMinted_handlerAsync,
  XYZFreeBetContract_FreeBetRedeemed_handlerAsync,
  XYZFreeBetContract_BettorWin_handlerAsync,
} from "../../generated/src/Handlers.gen";

import { FreebetContractEntity, XYZFreeBetContract_FreeBetMintedBatchEvent_handlerContextAsync, XYZFreeBetContract_FreeBetRedeemedEvent_handlerContext } from "../../generated/src/Types.gen";

import { createFreebetContractEntity, createFreebet, reissueFreebet, redeemFreebet, resolveFreebet, transferFreebet, withdrawFreebet } from "../common/freebets";
import { linkBetWithFreeBet } from "../common/bets";

import { getLPAndNameOfFreebetV1Details } from "../contracts/freebetv1";

import { VERSION_V1, ZERO_ADDRESS } from "../constants";
import { getEntityId } from "../utils/schema";
import { getConfigByChainId } from "../../generated/src/ConfigYAML.bs.js"

async function getOrCreateFreebetContract(
  chainId: number,
  freebetContractAddress: string,
  context: XYZFreeBetContract_FreeBetRedeemedEvent_handlerContext | XYZFreeBetContract_FreeBetMintedBatchEvent_handlerContextAsync
): Promise<FreebetContractEntity> {
  let freebetContractEntity = await context.FreebetContract.get(
    freebetContractAddress
  );

  if (freebetContractEntity) {
    return freebetContractEntity;
  }

  const { lp, name } = await getLPAndNameOfFreebetV1Details(
    freebetContractAddress,
    chainId,
    context
  );

  return createFreebetContractEntity(
    chainId.toString(),
    freebetContractAddress,
    lp,
    name,
    null,
    null,
    context,
  );
}

XYZFreeBetContract_BettorWin_loader(({ event, context }) => { 
  context.FreebetContract.load(event.srcAddress, {loadLiquidityPool: true});
  
  const config = getConfigByChainId(event.chainId)
  const coreAddress = config.contracts.Core.addresses[0]

  context.Bet.load(getEntityId(coreAddress, event.params.azuroBetId.toString()), {});
});
XYZFreeBetContract_BettorWin_handlerAsync(async ({ event, context }) => {
  const freebetContractEntity = await getOrCreateFreebetContract(
    event.chainId,
    event.srcAddress,
    context
  );

  const liquidityPoolContractEntity = (await context.LiquidityPoolContract.get(freebetContractEntity.liquidityPool_id))!;

  const coreAddress = liquidityPoolContractEntity.coreAddresses![0]

  const betEntityId = getEntityId(coreAddress, event.params.azuroBetId.toString())
  const betEntity = await context.Bet.get(betEntityId)

  if (!betEntity) {
    throw new Error(`v1 handleBettorWin betEntity not found in handler of bettorwin. betEntity = ${betEntityId}`)
    return
  }

  const freebetEntityId = betEntity.freebet_id!
  const freebetEntity = await withdrawFreebet(freebetEntityId, event.blockTimestamp, context)

  if (!freebetEntity) {
    throw new Error(`v1 handleBettorWin freebetEntity not found. freebetEntityId = ${freebetEntityId}`)
    return
  }
});

XYZFreeBetContract_FreeBetMinted_loader(({ event, context }) => {
  context.FreebetContract.load(event.srcAddress, {loadLiquidityPool: true});
});
XYZFreeBetContract_FreeBetMinted_handlerAsync(async ({ event, context }) => {
  const freebetContractEntity = await getOrCreateFreebetContract(
    event.chainId,
    event.srcAddress,
    context
  );

  const liquidityPoolContractEntity = await context.LiquidityPoolContract.get(freebetContractEntity.liquidityPool_id);

  if (!liquidityPoolContractEntity) {
    throw new Error(`liquidityPoolContractEntity not found. liquidityPoolContractEntityId = ${freebetContractEntity.liquidityPool_id}`)
    return
  }

  // event.params.bet -> amount uint128, minOdds uint64, durationTime uint64
  // https://gnosisscan.io/address/0xf0A93Ad0184cF1e5f29d7b5579358C99b9010F17#readProxyContract

  createFreebet(
    VERSION_V1,
    freebetContractEntity.id,
    event.srcAddress,
    freebetContractEntity.name,
    undefined,
    event.params.id,
    event.params.receiver,
    event.params.bet[0],
    liquidityPoolContractEntity.tokenDecimals,
    event.params.bet[1],
    event.params.bet[2],
    event.transactionHash,
    undefined,
    undefined,
    BigInt(event.blockNumber),
    context,
  )

});

XYZFreeBetContract_FreeBetMintedBatch_loader(({ event, context }) => {
  context.FreebetContract.load(event.srcAddress, {loadLiquidityPool: true});
});
XYZFreeBetContract_FreeBetMintedBatch_handlerAsync(async ({ event, context }) => {
  
  const freebetContractEntity = await getOrCreateFreebetContract(
    event.chainId,
    event.srcAddress,
    context
  );

  const liquidityPoolContractEntity = await context.LiquidityPoolContract.get(freebetContractEntity.liquidityPool_id);

  if (!liquidityPoolContractEntity) {
    throw new Error(`liquidityPoolContractEntity not found. liquidityPoolContractEntityId = ${freebetContractEntity.liquidityPool_id}`)
    return
  }

  for (let i = 0; i < event.params.ids.length; i++) {
    // parse FreeBetMintedBatch to multiple FreeBetMinted
    createFreebet(
      VERSION_V1,
      freebetContractEntity.id,
      event.srcAddress,
      freebetContractEntity.name,
      undefined,
      event.params.ids[i],
      event.params.receivers[i],
      event.params.bets[i][0],
      liquidityPoolContractEntity.tokenDecimals,
      event.params.bets[i][1],
      event.params.bets[i][2],
      event.transactionHash,
      undefined,
      undefined,
      BigInt(event.blockNumber),
      context 
    )
  }

});

XYZFreeBetContract_FreeBetRedeemed_loader(({ event, context }) => {
  context.FreebetContract.load(event.srcAddress, {loadLiquidityPool: true});
  context.Freebet.load(getEntityId(event.srcAddress, event.params.id.toString()), {});

  const config = getConfigByChainId(event.chainId)
  const coreAddress = config.contracts.Core.addresses[0]
  context.Bet.load(getEntityId(coreAddress, event.params.azuroBetId.toString()), {})
});
XYZFreeBetContract_FreeBetRedeemed_handlerAsync(async ({ event, context }) => {
  // const freebetContractEntity = await context.FreebetContract.get(event.srcAddress);
  // const freebetEntity = context.Freebet.get(event.srcAddress + "_" + event.params.id.toString());

  const freebetContractEntity = await getOrCreateFreebetContract(
    event.chainId,
    event.srcAddress,
    context
  )!

  const liquidityPoolContractEntity = (await context.LiquidityPoolContract.get(freebetContractEntity.liquidityPool_id))!;

  // hack for V1
  const coreAddress = liquidityPoolContractEntity.coreAddresses![0]

  const freebetEntity = await redeemFreebet(
    event.srcAddress,
    event.params.id,
    coreAddress,
    event.params.azuroBetId,
    context,
    event,
  )

  if (!freebetEntity) {
    throw new Error(`v1 handleFreeBetRedeemed freebetEntity not found. freebetId = ${event.params.id}`)
  }

  await linkBetWithFreeBet(
    coreAddress,
    event.params.azuroBetId,
    freebetEntity.id,
    freebetEntity.owner,
    event.blockTimestamp,
    context,
  )

});

XYZFreeBetContract_FreeBetReissued_loader(({ event, context }) => {
  context.FreebetContract.load(event.srcAddress, {});
});
XYZFreeBetContract_FreeBetReissued_handler(({ event, context }) => {
  reissueFreebet(event.srcAddress, event.params.id, event.blockTimestamp, context)
});

XYZFreeBetContract_Transfer_loader(({ event, context }) => {
  context.Freebet.load(getEntityId(event.srcAddress, event.params.tokenId.toString()), {});
});
XYZFreeBetContract_Transfer_handler(({ event, context }) => {
  // create nft
  if (event.params.from === ZERO_ADDRESS) {
    return
  }

  // burn nft
  if (event.params.to === ZERO_ADDRESS) {
    resolveFreebet(
      event.srcAddress,
      event.params.tokenId,
      true,
      event.blockNumber,
      context,
    )
  }
  // real transfer
  else {
    transferFreebet(
      event.srcAddress,
      event.params.tokenId,
      event.params.to,
      event.blockTimestamp,
      context,
    )
  }

});
