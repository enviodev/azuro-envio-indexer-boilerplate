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
  LPContract_LiquidityRemoved_handlerAsync,
  LPContract_NewBet_handlerAsync,
  LPContract_LiquidityAdded_handlerAsync,
  LPContract_BetterWin_handlerAsync,
} from "../../generated/src/Handlers.gen";

import { createBet, bettorWin } from "../common/bets";

import {
  depositLiquidity,
  withdrawLiquidity,
  transferLiquidity,
  changeWithdrawalTimeout,
} from "../common/pool";

import { VERSION_V1, BET_TYPE_ORDINAR, ZERO_ADDRESS } from "../constants";
import { getEntityId } from "../utils/schema";
import { getNodeWithdrawAmount } from "../contracts/lpv1";
import { getConfigByChainId } from "../../generated/src/ConfigYAML.bs.js";

// LPContract_BetterWin_loader(({ event, context }) => {
//   // context.LiquidityPoolContract.load(event.srcAddress);

//   // const config = getConfigByChainId(event.chainId)
//   // const coreAddress = config.contracts.Core.addresses[0]

//   // context.CoreContract.load(coreAddress, {})

//   // const betEntityId = getEntityId(coreAddress, event.params.tokenId.toString());
//   // context.Bet.load(betEntityId, {});
//   // context.LiveBet.load(betEntityId, {});
// });
LPContract_BetterWin_handlerAsync(async ({ event, context }) => {
  const liquidityPoolContractEntity = await context.LiquidityPoolContract.get(
    event.srcAddress
  );

  if (!liquidityPoolContractEntity) {
    throw new Error(
      `liquidityPoolContractEntity not found. liquidityPoolContractEntityId = ${event.srcAddress}`
    );
  }

  // hack for V1
  const coreAddress = liquidityPoolContractEntity.coreAddresses![0];

  await bettorWin(
    coreAddress,
    event.params.tokenId,
    event.params.amount,
    event.transactionHash,
    event.blockNumber,
    event.blockTimestamp,
    context
  );
});

// LPContract_LiquidityAdded_loader(({ event, context }) => {
//   context.LiquidityPoolContract.load(event.srcAddress);
// });
LPContract_LiquidityAdded_handlerAsync(async ({ event, context }) => {
  await depositLiquidity(
    event.srcAddress,
    event.params.amount,
    event.params.leaf,
    event.params.account,
    event.blockNumber,
    event.blockTimestamp,
    event.transactionHash,
    event.chainId,
    context
  );
});

// LPContract_LiquidityRemoved_loader(({ event, context }) => {
//   context.LiquidityPoolContract.load(event.srcAddress)
// });
LPContract_LiquidityRemoved_handlerAsync(async ({ event, context }) => {
  const nodeWithdrawView = await getNodeWithdrawAmount(
    event.srcAddress,
    event.chainId,
    event.params.leaf
  );
  const isFullyWithdrawn =
    BigInt(nodeWithdrawView.withdrawAmount) === 0n ? true : false;

  await withdrawLiquidity(
    event.srcAddress,
    event.params.amount,
    event.params.leaf,
    event.params.account,
    isFullyWithdrawn,
    event.blockNumber,
    event.blockTimestamp,
    event.transactionHash,
    event.chainId,
    context
  );
});

LPContract_LiquidityRequested_loader(({ event, context }) => {});
LPContract_LiquidityRequested_handler(({ event, context }) => {});

// LPContract_NewBet_loader(({ event, context }) => {
//   context.LiquidityPoolContract.load(event.srcAddress);

//   const config = getConfigByChainId(event.chainId)
//   const coreAddress = config.contracts.Core.addresses[0]

//   context.CoreContract.load(coreAddress, {})

//   const conditionEntityId = getEntityId(coreAddress,event.params.conditionId.toString())
//   context.Condition.load(conditionEntityId, {loadGame: {loadLeague: {loadCountry: {}}}});

//   const outComeEntityId = getEntityId(conditionEntityId, event.params.outcomeId.toString())
//   context.Outcome.load(outComeEntityId, {})

// });
LPContract_NewBet_handlerAsync(async ({ event, context }) => {
  const liquidityPoolContractEntity = await context.LiquidityPoolContract.get(
    event.srcAddress
  );

  if (!liquidityPoolContractEntity) {
    throw new Error(
      `liquidityPoolContractEntity not found. liquidityPoolContractEntityId = ${event.srcAddress}`
    );
  }

  const coreAddress = liquidityPoolContractEntity?.coreAddresses![0];

  const conditionEntityId = getEntityId(
    coreAddress,
    event.params.conditionId.toString()
  );
  const conditionEntity = await context.Condition.get(conditionEntityId);

  if (!conditionEntity) {
    throw new Error(
      `v1 handleNewBet conditionEntity not found. conditionEntityId = ${conditionEntityId}`
    );
    return;
  }

  const outcomeEntityId = getEntityId(
    conditionEntityId,
    event.params.outcomeId.toString()
  );
  const outcomeEntity = await context.Outcome.get(outcomeEntityId);

  if (!outcomeEntity) {
    throw new Error(`Outcome not found with id ${outcomeEntityId}`);
  }

  await createBet(
    VERSION_V1,
    BET_TYPE_ORDINAR,
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
    BigInt(event.blockTimestamp),
    BigInt(event.blockNumber),
    [event.params.fund1, event.params.fund2],
    context,
    `lpv1. loaded outcomeEntityId is ${outcomeEntityId}`
  );
});

LPContract_Transfer_loader(({ event, context }) => {
  context.LiquidityPoolNft.load(
    getEntityId(event.srcAddress, event.params.tokenId.toString()),
    {}
  );
});
LPContract_Transfer_handler(({ event, context }) => {
  if (event.params.from === ZERO_ADDRESS) {
    return;
  }

  transferLiquidity(
    event.srcAddress,
    event.params.tokenId,
    event.params.to,
    context
  );
});

LPContract_WithdrawTimeoutChanged_loader(({ event, context }) => {
  context.LiquidityPoolContract.load(event.srcAddress);
});
LPContract_WithdrawTimeoutChanged_handler(({ event, context }) => {
  changeWithdrawalTimeout(
    event.srcAddress,
    event.params.newWithdrawTimeout,
    context
  );
});
