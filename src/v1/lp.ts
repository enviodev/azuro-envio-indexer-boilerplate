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

import { depositLiquidity } from "../common/pool";

import { VERSION_V1, BET_TYPE_ORDINAR } from "../constants";

LPContract_BetterWin_loader(({ event, context }) => {
  context.LiquidityPoolContract.load(event.srcAddress);
});
LPContract_BetterWin_handler(({ event, context }) => {
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(event.srcAddress)!;
  // hack for V1
  const coreAddress = liquidityPoolContractEntity.coreAddresses![0]

  bettorWin(
    coreAddress,
    event.params.tokenId,
    event.params.amount,
    event.transactionHash,
    event.blockNumber,
    event.blockTimestamp,
    context,
  )
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
LPContract_LiquidityRemoved_handler(({ event, context }) => {
  let isFullyWithdrawn = false

  const liquidityPoolSC = LPV1Abi.bind(event.address)
  const nodeWithdrawView = liquidityPoolSC.try_nodeWithdrawView(event.params.leaf)

  if (!nodeWithdrawView.reverted && nodeWithdrawView.value.equals(BigInt.zero())) {
    isFullyWithdrawn = true
  }

  withdrawLiquidity(
    event.srcAddress,
    event.params.amount,
    event.params.leaf,
    event.params.account,
    isFullyWithdrawn,
    event.blockNumber,
    event.transactionHash,
  )
});

LPContract_LiquidityRequested_loader(({ event, context }) => {});
LPContract_LiquidityRequested_handler(({ event, context }) => {});

LPContract_NewBet_loader(({ event, context }) => {
  context.LiquidityPoolContract.load(event.srcAddress);
});
LPContract_NewBet_handler(({ event, context }) => {
  const liquidityPoolContractEntity = context.LiquidityPoolContract.get(event.srcAddress)!;

  if (!liquidityPoolContractEntity) {
    context.log.error(`liquidityPoolContractEntity not found. liquidityPoolContractEntityId = ${event.srcAddress}`);
  }

  const coreAddress = liquidityPoolContractEntity?.coreAddresses![0]

  const conditionEntityId = coreAddress + "_" + event.params.conditionId.toString()
  const conditionEntity = context.Condition.get(conditionEntityId)

  if (!conditionEntity) {
    context.log.error(`v1 handleNewBet conditionEntity not found. conditionEntityId = {conditionEntityId}`)
    return
  }

  const outcomeEntityId = conditionEntity.id + "_" + event.params.outcomeId.toString()
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
  
});
LPContract_Transfer_handler(({ event, context }) => {
  
});

LPContract_WithdrawTimeoutChanged_loader(({ event, context }) => {});
LPContract_WithdrawTimeoutChanged_handler(({ event, context }) => {});
