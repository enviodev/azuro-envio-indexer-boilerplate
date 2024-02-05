import {
  CoreContract_ConditionCreated_loader,
  CoreContract_ConditionCreated_handler,
  CoreContract_ConditionResolved_loader,
  CoreContract_ConditionResolved_handler,
  CoreContract_ConditionShifted_loader,
  CoreContract_ConditionShifted_handler,
  CoreContract_ConditionStopped_loader,
  CoreContract_ConditionStopped_handler,
  CoreContract_LpChanged_loader,
  CoreContract_LpChanged_handler,
} from "../../generated/src/Handlers.gen";

CoreContract_ConditionCreated_loader(({ event, context }) => {});
CoreContract_ConditionCreated_handler(({ event, context }) => {});

CoreContract_ConditionResolved_loader(({ event, context }) => {});
CoreContract_ConditionResolved_handler(({ event, context }) => {});

CoreContract_ConditionShifted_loader(({ event, context }) => {});
CoreContract_ConditionShifted_handler(({ event, context }) => {});

CoreContract_ConditionStopped_loader(({ event, context }) => {});
CoreContract_ConditionStopped_handler(({ event, context }) => {});

CoreContract_LpChanged_loader(({ event, context }) => {
  context.contractRegistration.addLP(event.params.newLp);
});

CoreContract_LpChanged_handler(({ event, context }) => {});
