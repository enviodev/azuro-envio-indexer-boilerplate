// import {
//     Azurobetv2Contract_Transfer_loader,
//     Azurobetv2Contract_Transfer_handler,
//   } from "../../generated/src/Handlers.gen";
//   import { transferBet } from "../common/bets";
  
//   Azurobetv2Contract_Transfer_loader(({ event, context }) => {
//     context.Bet.load(event.srcAddress, {});
//     // context.AzuroBetContract.load(event.srcAddress, {}); // correct this
//   });
//   Azurobetv2Contract_Transfer_handler(({ event, context }) => {
//     transferBet(
//       null,
//       event.srcAddress,
//       event.params.tokenId,
//       event.params.from,
//       event.params.to,
//       event.blockNumber,
//       context
//     )
//   });
  