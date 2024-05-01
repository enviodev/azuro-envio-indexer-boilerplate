import {
  AzurobetsContract_Transfer_loader,
  AzurobetsContract_Transfer_handler,
  AzurobetsContract_Transfer_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { transferBet } from "../common/bets";
import { getEntityId } from "../utils/schema";

AzurobetsContract_Transfer_loader(({ event, context }) => {
  context.AzuroBetContract.load(event.srcAddress, {});
});
AzurobetsContract_Transfer_handlerAsync(async ({ event, context }) => {
  const x = 2
  await transferBet(
    null,
    event.srcAddress,
    event.params.tokenId,
    event.params.from,
    event.params.to,
    event.blockNumber,
    context
  )
});
