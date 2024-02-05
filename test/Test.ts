import assert = require("assert")
import { MockDb, Core } from "../generated/src/TestHelpers.gen";
import {
  EventsSummaryEntity,
  Core_ConditionCreatedEntity,
} from "../generated/src/Types.gen";

import { Addresses } from "../generated/src/bindings/Ethers.bs";

import { GLOBAL_EVENTS_SUMMARY_KEY } from "../src/EventHandlers";


const MOCK_EVENTS_SUMMARY_ENTITY: EventsSummaryEntity = {
  id: GLOBAL_EVENTS_SUMMARY_KEY,
  core_ConditionCreatedCount: BigInt(0),
  core_ConditionResolvedCount: BigInt(0),
  core_ConditionShiftedCount: BigInt(0),
  core_ConditionStoppedCount: BigInt(0),
  core_LpChangedCount: BigInt(0),
  factory_NewCoreCount: BigInt(0),
  factory_NewPoolCount: BigInt(0),
  freeBet_BettorWinCount: BigInt(0),
  freeBet_FreeBetMintedCount: BigInt(0),
  freeBet_FreeBetMintedBatchCount: BigInt(0),
  freeBet_FreeBetRedeemedCount: BigInt(0),
  freeBet_FreeBetReissuedCount: BigInt(0),
  freeBet_TransferCount: BigInt(0),
  freeBetFactory_NewFreeBetCount: BigInt(0),
  xYZFreeBet_BettorWinCount: BigInt(0),
  xYZFreeBet_FreeBetMintedCount: BigInt(0),
  xYZFreeBet_FreeBetMintedBatchCount: BigInt(0),
  xYZFreeBet_FreeBetRedeemedCount: BigInt(0),
  xYZFreeBet_FreeBetReissuedCount: BigInt(0),
  xYZFreeBet_TransferCount: BigInt(0),
};

describe("Core contract ConditionCreated event tests", () => {
  // Create mock db
  const mockDbInitial = MockDb.createMockDb();

  // Add mock EventsSummaryEntity to mock db
  const mockDbFinal = mockDbInitial.entities.EventsSummary.set(
    MOCK_EVENTS_SUMMARY_ENTITY
  );

  // Creating mock Core contract ConditionCreated event
  const mockCoreConditionCreatedEvent = Core.ConditionCreated.createMockEvent({
    oracleConditionId: 0n,
    conditionId: 0n,
    timestamp: 0n,
    mockEventData: {
      chainId: 1,
      blockNumber: 0,
      blockTimestamp: 0,
      blockHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      srcAddress: Addresses.defaultAddress,
      transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      transactionIndex: 0,
      logIndex: 0,
    },
  });

  // Processing the event
  const mockDbUpdated = Core.ConditionCreated.processEvent({
    event: mockCoreConditionCreatedEvent,
    mockDb: mockDbFinal,
  });

  it("Core_ConditionCreatedEntity is created correctly", () => {
    // Getting the actual entity from the mock database
    let actualCoreConditionCreatedEntity = mockDbUpdated.entities.Core_ConditionCreated.get(
      mockCoreConditionCreatedEvent.transactionHash +
        mockCoreConditionCreatedEvent.logIndex.toString()
    );

    // Creating the expected entity
    const expectedCoreConditionCreatedEntity: Core_ConditionCreatedEntity = {
      id:
        mockCoreConditionCreatedEvent.transactionHash +
        mockCoreConditionCreatedEvent.logIndex.toString(),
      oracleConditionId: mockCoreConditionCreatedEvent.params.oracleConditionId,
      conditionId: mockCoreConditionCreatedEvent.params.conditionId,
      timestamp: mockCoreConditionCreatedEvent.params.timestamp,
      eventsSummary: "GlobalEventsSummary",
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualCoreConditionCreatedEntity, expectedCoreConditionCreatedEntity, "Actual CoreConditionCreatedEntity should be the same as the expectedCoreConditionCreatedEntity");
  });

  it("EventsSummaryEntity is updated correctly", () => {
    // Getting the actual entity from the mock database
    let actualEventsSummaryEntity = mockDbUpdated.entities.EventsSummary.get(
      GLOBAL_EVENTS_SUMMARY_KEY
    );

    // Creating the expected entity
    const expectedEventsSummaryEntity: EventsSummaryEntity = {
      ...MOCK_EVENTS_SUMMARY_ENTITY,
      core_ConditionCreatedCount: MOCK_EVENTS_SUMMARY_ENTITY.core_ConditionCreatedCount + BigInt(1),
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualEventsSummaryEntity, expectedEventsSummaryEntity, "Actual CoreConditionCreatedEntity should be the same as the expectedCoreConditionCreatedEntity");
  });
});
