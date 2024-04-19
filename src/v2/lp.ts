import {
  LPv2Contract_BettorWin_loader,
  LPv2Contract_BettorWin_handler,
  LPv2Contract_GameCanceled_loader,
  LPv2Contract_GameCanceled_handler,
  LPv2Contract_GameShifted_loader,
  LPv2Contract_GameShifted_handler,
  LPv2Contract_LiquidityAdded_loader,
  LPv2Contract_LiquidityAdded_handler,
  LPv2Contract_LiquidityDonated_loader,
  LPv2Contract_LiquidityDonated_handler,
  LPv2Contract_LiquidityManagerChanged_loader,
  LPv2Contract_LiquidityManagerChanged_handler,
  LPv2Contract_LiquidityRemoved_loader,
  LPv2Contract_LiquidityRemoved_handler,
  LPv2Contract_NewGame_loader,
  LPv2Contract_NewGame_handler,
  LPv2Contract_Transfer_loader,
  LPv2Contract_Transfer_handler,
  LPv2Contract_WithdrawTimeoutChanged_loader,
  LPv2Contract_WithdrawTimeoutChanged_handler,
  LPv2Contract_LiquidityRemoved_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { bettorWin } from "../common/bets";
import { cancelGame, createGame, shiftGame } from "../common/games";
import { changeWithdrawalTimeout, depositLiquidity, transferLiquidity, updateLiquidityManager, withdrawLiquidity } from "../common/pool";
import { ZERO_ADDRESS } from "../constants";
import { getNodeWithdrawAmount } from "../contracts/lpv1";
import { getEntityId } from "../utils/schema";

LPv2Contract_BettorWin_loader(({ event, context }) => {
});
LPv2Contract_BettorWin_handler(({ event, context }) => {
  const coreAddress = event.params.core
  bettorWin(coreAddress, event.params.tokenId, event.params.amount, event.transactionHash, event.blockNumber, event.blockTimestamp, context)
});

LPv2Contract_GameCanceled_loader(({ event, context }) => {});
LPv2Contract_GameCanceled_handler(({ event, context }) => {
  const gameEntityId = event.srcAddress + "_" + event.params.gameId.toString()
  cancelGame(gameEntityId, event.transactionHash, event.blockNumber, event.blockTimestamp, context)
});

LPv2Contract_GameShifted_loader(({ event, context }) => {});
LPv2Contract_GameShifted_handler(({ event, context }) => {
  const gameEntityId = getEntityId(event.srcAddress, event.params.gameId.toString())
  shiftGame(gameEntityId, event.params.newStart, event.transactionHash, event.blockNumber, event.blockTimestamp, context)
});

LPv2Contract_LiquidityAdded_loader(({ event, context }) => {
  context.LiquidityPoolContract.load(event.srcAddress)
});
LPv2Contract_LiquidityAdded_handler(({ event, context }) => {
  depositLiquidity(
    event.srcAddress,
    event.params.amount,
    event.params.depositId,
    event.params.account,
    event.blockNumber,
    event.blockTimestamp,
    event.transactionHash,
    event.chainId, 
    context
  )
});

LPv2Contract_LiquidityDonated_loader(({ event, context }) => {
});
LPv2Contract_LiquidityDonated_handler(({ event, context }) => {
    throw new Error('LPv2Contract_LiquidityDonated_handler not implemented')
});

LPv2Contract_LiquidityManagerChanged_loader(({ event, context }) => {});
LPv2Contract_LiquidityManagerChanged_handler(({ event, context }) => {
  let newAddress: string | null = null

  if (event.params.newLiquidityManager != ZERO_ADDRESS) {
    newAddress = event.params.newLiquidityManager
  }

  updateLiquidityManager(
    event.srcAddress,
    newAddress,
    context
  )
});

LPv2Contract_LiquidityRemoved_loader(({ event, context }) => {});
LPv2Contract_LiquidityRemoved_handlerAsync(async ({ event, context }) => {
  let isFullyWithdrawn = false
  
  const { withdrawAmount } = await getNodeWithdrawAmount(event.srcAddress, event.chainId, event.params.depositId)

  if (BigInt(withdrawAmount) === 0n) {
    isFullyWithdrawn = true
  }

  withdrawLiquidity(
    event.srcAddress,
    event.params.amount,
    event.params.depositId,
    event.params.account,
    isFullyWithdrawn,
    event.blockNumber,
    event.blockTimestamp,
    event.transactionHash,
    event.chainId,
    context
  )
});

LPv2Contract_NewGame_loader(({ event, context }) => {
}); // new game v2 vs v3? // assuming v2 for now
LPv2Contract_NewGame_handler(({ event, context }) => {

  const network = 'gnosis'
  context.log.debug(`event.params.data = ${event.params.data}`)
  createGame(
    event.srcAddress,
    event.params.gameId,
    event.params.data,
    null,
    event.params.startsAt,
    network,
    event.transactionHash,
    BigInt(event.blockNumber),
    BigInt(event.blockTimestamp),
    event.chainId,
    context,
  )
});

LPv2Contract_Transfer_loader(({ event, context }) => {
  context.LiquidityPoolNft.load(getEntityId(event.srcAddress, event.params.tokenId.toString()), {})
});
LPv2Contract_Transfer_handler(({ event, context }) => {
  if (event.params.from != ZERO_ADDRESS) {
    return
  }

  transferLiquidity(event.srcAddress, event.params.tokenId, event.params.to, context)
});

LPv2Contract_WithdrawTimeoutChanged_loader(({ event, context }) => {
  context.LiquidityPoolContract.load(event.srcAddress)
});
LPv2Contract_WithdrawTimeoutChanged_handler(({ event, context }) => {
  changeWithdrawalTimeout(event.srcAddress, event.params.newWithdrawTimeout, context)
});
