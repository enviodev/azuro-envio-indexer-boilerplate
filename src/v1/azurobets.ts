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
  const start = process.hrtime.bigint(); // Get start time
  await transferBet(
    null,
    event.srcAddress,
    event.params.tokenId,
    event.params.from,
    event.params.to,
    event.blockNumber,
    context
  );

  const end = process.hrtime.bigint(); // Get end time

  const elapsedTime = Number(end - start) / 1e6; // Calculate elapsed time in milliseconds

  console.log(`v1, Azurobets, Transfer, ${elapsedTime}, ${event.blockNumber}`);
});
