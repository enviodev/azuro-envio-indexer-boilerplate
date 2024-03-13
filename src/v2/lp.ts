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
} from "../../generated/src/Handlers.gen";

LPv2Contract_BettorWin_loader(({ event, context }) => {});
LPv2Contract_BettorWin_handler(({ event, context }) => {});

LPv2Contract_GameCanceled_loader(({ event, context }) => {});
LPv2Contract_GameCanceled_handler(({ event, context }) => {});

LPv2Contract_GameShifted_loader(({ event, context }) => {});
LPv2Contract_GameShifted_handler(({ event, context }) => {});

LPv2Contract_LiquidityAdded_loader(({ event, context }) => {});
LPv2Contract_LiquidityAdded_handler(({ event, context }) => {});

LPv2Contract_LiquidityDonated_loader(({ event, context }) => {});
LPv2Contract_LiquidityDonated_handler(({ event, context }) => {});

LPv2Contract_LiquidityManagerChanged_loader(({ event, context }) => {});
LPv2Contract_LiquidityManagerChanged_handler(({ event, context }) => {});

LPv2Contract_LiquidityRemoved_loader(({ event, context }) => {});
LPv2Contract_LiquidityRemoved_handler(({ event, context }) => {});

LPv2Contract_NewGame_loader(({ event, context }) => {});
LPv2Contract_NewGame_handler(({ event, context }) => {
  context.log.info(event.params.ipfsHash);
});

LPv2Contract_Transfer_loader(({ event, context }) => {});
LPv2Contract_Transfer_handler(({ event, context }) => {});

LPv2Contract_WithdrawTimeoutChanged_loader(({ event, context }) => {});
LPv2Contract_WithdrawTimeoutChanged_handler(({ event, context }) => {});
