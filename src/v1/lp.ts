import { env } from "process";
import {
  LPContract_BetterWin_loader,
  LPContract_BetterWin_handler,
  LPContract_LiquidityAdded_loader,
  LPContract_LiquidityAdded_handler,
  LPContract_LiquidityRemoved_loader,
  LPContract_LiquidityRemoved_handler,
  LPContract_LiquidityRequested_loader,
  LPContract_LiquidityRequested_handler,
  LPContract_NewBet_loader,
  LPContract_NewBet_handler,
  LPContract_Transfer_loader,
  LPContract_Transfer_handler,
  LPContract_WithdrawTimeoutChanged_loader,
  LPContract_WithdrawTimeoutChanged_handler,
} from "../../generated/src/Handlers.gen";

import { createBet, bettorWin } from "../common/bets";

import { depositLiquidity, withdrawLiquidity, transferLiquidity, changeWithdrawalTimeout } from "../common/pool";

import { VERSION_V1, BET_TYPE_ORDINAR, ZERO_ADDRESS } from "../constants";
import { getEntityId } from "../utils/schema";
import { getNodeWithdrawAmount } from "../contracts/lpv1";

LPContract_BetterWin_loader(({ event, context }) => {
  context.LiquidityPoolContract.load(event.srcAddress);
});
LPContract_BetterWin_handler(({ event, context }) => {
  // const liquidityPoolContractEntity = context.LiquidityPoolContract.get(event.srcAddress)!;
  // // hack for V1
  // const coreAddress = liquidityPoolContractEntity.coreAddresses![0]

  // bettorWin(
  //   coreAddress,
  //   event.params.tokenId,
  //   event.params.amount,
  //   event.transactionHash,
  //   event.blockNumber,
  //   event.blockTimestamp,
  //   context,
  // )
});

LPContract_LiquidityAdded_loader(({ event, context }) => {
  context.LiquidityPoolContract.load(event.srcAddress);
});
LPContract_LiquidityAdded_handler(({ event, context }) => {
  depositLiquidity(
    event.srcAddress,
    event.params.amount,
    event.params.leaf,
    event.params.account,
    event.blockNumber,
    event.blockTimestamp,
    event.transactionHash,
    event.chainId,
    context,
  )
});

LPContract_LiquidityRemoved_loader(({ event, context }) => {

});
LPContract_LiquidityRemoved_handler(async ({ event, context }) => {

  const nodeWithdrawView = await getNodeWithdrawAmount(
    event.srcAddress,
    event.chainId,
    event.params.leaf
  )
  const isFullyWithdrawn = nodeWithdrawView.withdrawAmount === 0n ? true : false

  withdrawLiquidity(
    event.srcAddress,
    event.params.amount,
    event.params.leaf,
    event.params.account,
    isFullyWithdrawn,
    event.blockNumber,
    event.blockTimestamp,
    event.transactionHash,
    event.chainId,
    context,
  )
});

LPContract_LiquidityRequested_loader(({ event, context }) => { });
LPContract_LiquidityRequested_handler(({ event, context }) => { });

LPContract_NewBet_loader(({ event, context }) => {
  context.LiquidityPoolContract.load(event.srcAddress);
});
LPContract_NewBet_handler(({ event, context }) => {
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(event.srcAddress)!;

  if (!liquidityPoolContractEntity) {
    context.log.error(`liquidityPoolContractEntity not found. liquidityPoolContractEntityId = ${event.srcAddress}`);
  }

  const coreAddress = liquidityPoolContractEntity?.coreAddresses![0]

  const conditionEntityId = getEntityId(coreAddress,event.params.conditionId.toString())
  const conditionEntity = context.Condition.get(conditionEntityId)

  if (!conditionEntity) {
    context.log.error(`v1 handleNewBet conditionEntity not found. conditionEntityId = ${conditionEntityId}`)
    return
  }

  const outcomeEntityId = getEntityId(conditionEntity.id,event.params.outcomeId.toString())
  const outcomeEntity = context.Outcome.get(outcomeEntityId)!

  createBet(
    VERSION_V1,
    BET_TYPE_ORDINAR.toString(),
    [conditionEntity],
    [outcomeEntity],
    [event.params.odds],
    event.params.odds,
    conditionEntity.coreAddress,
    event.params.owner,
    null,
    event.params.betId,
    liquidityPoolContractEntity.tokenDecimals,
    event.params.amount,
    event.transactionHash,
    event.blockTimestamp,
    event.blockNumber,
    [event.params.fund1, event.params.fund2],
    context,
  )
});

LPContract_Transfer_loader(({ event, context }) => {
  context.LiquidityPoolNft.load(getEntityId(event.srcAddress, event.params.tokenId.toString()), {})
});
LPContract_Transfer_handler(({ event, context }) => {
  if (event.params.from === ZERO_ADDRESS) {
    return
  }

  transferLiquidity(
    event.srcAddress,
    event.params.tokenId,
    event.params.to,
    context,
  )
});

LPContract_WithdrawTimeoutChanged_loader(({ event, context }) => { });
LPContract_WithdrawTimeoutChanged_handler(({ event, context }) => { 
  changeWithdrawalTimeout(event.srcAddress, event.params.newWithdrawTimeout, context)
});
