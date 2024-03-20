import {
  AzurobetsContract_Transfer_loader,
  AzurobetsContract_Transfer_handler,
} from "../../generated/src/Handlers.gen";
import { transferBet } from "../common/bets";

AzurobetsContract_Transfer_loader(({ event, context }) => {
  context.Bet.load(event.srcAddress, {});
  context.AzuroBetContract.load(event.srcAddress, {}); // correct this
});
AzurobetsContract_Transfer_handler(({ event, context }) => {
  const betEntity = transferBet(
    null,
    event.srcAddress,
    event.params.tokenId,
    event.params.from,
    event.params.to,
    event.blockNumber,
    context
  )
});
