import {
  Azurobetv1Contract_Transfer_loader,
  Azurobetv1Contract_Transfer_handlerAsync,
} from "../../generated/src/Handlers.gen";
import { transferBet } from "../common/bets";
import { getEntityId } from "../utils/schema";

Azurobetv1Contract_Transfer_loader(({ event, context }) => {
  context.AzuroBetContract.load(event.srcAddress, {});
});
Azurobetv1Contract_Transfer_handlerAsync(async ({ event, context }) => {
  const x = 8
  await transferBet(
    null,
    event.srcAddress,
    event.params.tokenId,
    event.params.from,
    event.params.to,
    event.blockNumber,
    context
  )

  // throw new Error('catches')
});
