import {
  FreeBetContract_BettorWin_loader,
  FreeBetContract_BettorWin_handler,
  FreeBetContract_FreeBetMinted_loader,
  FreeBetContract_FreeBetMinted_handler,
  FreeBetContract_FreeBetMintedBatch_loader,
  FreeBetContract_FreeBetMintedBatch_handler,
  FreeBetContract_FreeBetRedeemed_loader,
  FreeBetContract_FreeBetRedeemed_handler,
  FreeBetContract_FreeBetReissued_loader,
  FreeBetContract_FreeBetReissued_handler,
  FreeBetContract_Transfer_loader,
  FreeBetContract_Transfer_handler,
} from "../../generated/src/Handlers.gen";
import { linkBetWithFreeBet } from "../common/bets";
import { createFreebet, createFreebetContractEntity, redeemFreebet, reissueFreebet, resolveFreebet, transferFreebet, withdrawFreebet } from "../common/freebets";
import { VERSION_V2, ZERO_ADDRESS } from "../constants";
import { FreeBetContract_FreeBetMintedEvent_handlerContext, FreebetContractEntity } from "../src/Types.gen";
import { getEntityId } from "../utils/schema";

function getOrCreateFreebetContract(
  freebetContractAddress: string,
  chainId: number,
  context: FreeBetContract_FreeBetMintedEvent_handlerContext,
): FreebetContractEntity | null {
  let freebetContractEntity = context.FreebetContract.get(freebetContractAddress)

  if (freebetContractEntity) {
    return freebetContractEntity
  }

  const freebetSC = Freebet.bind(freebetContractAddress)

  const lp = freebetSC.try_lp()

  if (lp.reverted) {
    context.log.error(`v2 getOrCreateFreebetContract lp call reverted.`)

    return null
  }

  const name = freebetSC.try_name()

  if (name.reverted) {
    context.log.error(`v2 getOrCreateFreebetContract name call reverted.`)
    return null
  }

  return createFreebetContractEntity(chainId.toString(), freebetContractAddress, lp.value.toHexString(), name.value.toString(), null, null)
}

FreeBetContract_BettorWin_loader(({ event, context }) => { });
FreeBetContract_BettorWin_handler(({ event, context }) => {
  const coreContractEntity = context.CoreContract.get(event.params.core)

  if (!coreContractEntity) {
    context.log.error(`v2 handleBettorWin coreContractEntity not found. coreContractEntityId = ${event.params.core}`)
    return
  }

  const betEntityId = getEntityId(coreContractEntity.id, event.params.azuroBetId.toString())
  const betEntity = context.Bet.get(betEntityId)

  if (!betEntity) {
    context.log.error(`v2 handleBettorWin betEntity not found. betEntity = ${betEntityId}`)
    return
  }

  const freebetEntityId = betEntity.freebet_id!

  const freebetEntity = withdrawFreebet(freebetEntityId, event.blockTimestamp, context)

  if (!freebetEntity) {
    context.log.error(`v2 handleBettorWin freebetEntity not found. freebetEntityId = ${freebetEntityId}`)
    return
  }
});

FreeBetContract_FreeBetMinted_loader(({ event, context }) => { });
FreeBetContract_FreeBetMinted_handler(({ event, context }) => {
  const freebetContractEntity = getOrCreateFreebetContract(event.srcAddress, event.chainId, context)

  if (!freebetContractEntity) {
    return
  }

  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(freebetContractEntity.liquidityPool)!

  createFreebet(
    VERSION_V2,
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
    event.blockNumber,
    context,
  )
});

FreeBetContract_FreeBetMintedBatch_loader(({ event, context }) => { });
FreeBetContract_FreeBetMintedBatch_handler(({ event, context }) => {
  const freebetContractEntity = getOrCreateFreebetContract(event.srcAddress, event.chainId, context)

  if (!freebetContractEntity) {
    return
  }

  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(freebetContractEntity.liquidityPool)!

  for (let i = 0; i < event.params.ids.length; i++) {
    // parse FreeBetMintedBatch to multiple FreeBetMinted

    createFreebet(
      VERSION_V2,
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
      event.blockNumber,
      context,
    )
  }
});

FreeBetContract_FreeBetRedeemed_loader(({ event, context }) => { });
FreeBetContract_FreeBetRedeemed_handler(({ event, context }) => {
  const coreContractEntity = context.CoreContract.get(event.params.core)

  if (!coreContractEntity) {
    context.log.error(`v2 handleFreeBetRedeemed coreContractEntity not found. coreContractEntityId = ${event.params.core}`)
    return
  }

  const freebetEntity = redeemFreebet(
    event.srcAddress,
    event.params.id,
    coreContractEntity.id,
    event.params.azuroBetId,
    context,
    event,
  )

  if (!freebetEntity) {
    context.log.error(`v2 handleFreeBetRedeemed freebetEntity not found. freebetId = ${event.params.id.toString()}`)
    return
  }

  linkBetWithFreeBet(
    coreContractEntity.id,
    event.params.azuroBetId,
    freebetEntity.id,
    freebetEntity.owner,
    event.blockTimestamp,
    context,
  )
});

FreeBetContract_FreeBetReissued_loader(({ event, context }) => { });
FreeBetContract_FreeBetReissued_handler(({ event, context }) => {
  reissueFreebet(event.srcAddress, event.params.id, event.blockNumber, context)
});

FreeBetContract_Transfer_loader(({ event, context }) => { });
FreeBetContract_Transfer_handler(({ event, context }) => {
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
      event.blockTimestamp,
      context,
    )
  }
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
