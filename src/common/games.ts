import { ContractCodeNotStoredError } from "web3"
import { GAME_STATUS_CANCELED, GAME_STATUS_CREATED, TypedMap } from "../constants"
import { CoreContract_ConditionCreatedEvent_handlerContextAsync, CountryEntity, GameEntity, LPv2Contract_GameCanceledEvent_handlerContext, LPv2Contract_GameShiftedEvent_handlerContext, LPv2Contract_NewGameEvent_handlerContext, LPv2Contract_NewGameEvent_handlerContextAsync, LeagueEntity, SportEntity, SportHubEntity, participantEntity } from "../src/Types.gen"


const DEFAULT_GAME: GameEntity = {
    id: "1",
    liquidityPool_id: "",
    gameId: 0n,
    title: "",
    slug: "",
    league_id: "1",
    sport_id: "",
    status: "Created",
    // # participants: [Participant!]! @derivedFrom(field: "game"),
    // # conditions: [Condition!]! @derivedFrom(field: "game"),
    hasActiveConditions: false,
    _activeConditionsEntityIds: ["1"],
    _resolvedConditionsEntityIds: [""],
    _canceledConditionsEntityIds: [""],
    _pausedConditionsEntityIds: [""],
    startsAt: 0n,
    provider: 0n,
    turnover: 0n,
    createdBlockNumber: 0n,
    createdBlockTimestamp: 0n,
    createdTxHash: "",
    shiftedBlockNumber: 0n,
    shiftedBlockTimestamp: 0n,
    shiftedTxHash: "",
    resolvedBlockNumber: 0n,
    resolvedBlockTimestamp: 0n,
    resolvedTxHash: "",
    _updatedAt: 0n,
}


export function createGame(
    liquidityPoolAddress: string,
    rawGameId: bigint | null,
    ipfsHashBytes: string | null,
    dataBytes: string | null,
    startsAt: bigint,
    network: string | null,
    txHash: string,
    createBlockNumber: bigint,
    createBlockTimestamp: bigint,
    context: CoreContract_ConditionCreatedEvent_handlerContextAsync | LPv2Contract_NewGameEvent_handlerContext,
): GameEntity {

    // let data: TypedMap<string, JSONValue> | null = null

    // // V2
    // if (ipfsHashBytes !== null) {
    //     const ipfsHashHex = ipfsHashBytes.toHexString()
    //     const bytesArr = ByteArray.fromHexString(`0x1220${ipfsHashHex.slice(2)}`)

    //     const ipfsHash = bytesArr.toBase58()

    //     const ipfsJson = getIPFSJson(ipfsHash)

    //     if (!ipfsJson) {
    //         log.error('createGame IPFS failed to get JSON. Hash: {}', [ipfsHash.toString()])

    //         return null
    //     }

    //     data = ipfsJson.toObject()

    //     if (data === null) {
    //         log.error('createGame IPFS failed to convert to object. Hash: {}', [ipfsHash.toString()])

    //         return null
    //     }

    // }

    // // V3

    // if (dataBytes !== null) {

    //     const dataJson = json.try_fromBytes(dataBytes)

    //     if (!dataJson.isOk) {
    //         log.error('createGame bytes data failed to parse json. data: {}', [dataBytes.toString()])

    //         return null
    //     }

    //     data = dataJson.value.toObject()

    //     if (data === null) {
    //         log.error('createGame bytes data failed to convert to object. data: {}', [dataBytes.toString()])

    //         return null
    //     }

    // }

    // data = data!

    // let sportId: bigint | null = null

    // V1
    // const sportTypeIdField = data.get('sportTypeId')

    // if (sportTypeIdField && sportTypeIdField.kind === JSONValueKind.NUMBER) {
    //     sportId = sportTypeIdField.toBigInt()
    // }

    // // V2
    // const sportIdField = data.get('sportId')

    // if (sportIdField && sportIdField.kind === JSONValueKind.NUMBER) {
    //     sportId = sportIdField.toBigInt()
    // }

    // if (sportId === null) {
    //     log.error('createGame sportId is null', [])

    //     return null
    // }

    // let countryName = DEFAULT_COUNTRY.toString()


    // mock data
    const sportHubEntity: SportHubEntity = {
        id: "1",
        name: "Football",
        slug: "football",
    }
    context.SportHub.set(sportHubEntity)

    const sportEntity: SportEntity = {
        id: "1",
        sportId: 1n,
        name: "Football",
        slug: "football",
        sporthub_id: "1",
    }
    context.Sport.set(sportEntity)

    const countryEntity: CountryEntity = {
        id: "1",
        name: "Football",
        sport_id: "1",
        turnover: 0n,
        slug: "football",
        hasActiveLeagues: false,
        activeLeaguesEntityIds: [],
    }
    context.Country.set(countryEntity)

    const leagueEntity: LeagueEntity = {
        id: "1",
        name: "Football",
        country_id: "1",
        turnover: 0n,
        slug: "football",
        hasActiveGames: false,
        activeGamesEntityIds: [],
    }
    context.League.set(leagueEntity)

    const gameEntity: GameEntity = {
        id: "1",
        liquidityPool_id: liquidityPoolAddress,
        gameId: 0n,
        title: "",
        slug: "",
        league_id: leagueEntity.id,
        sport_id: sportEntity.id,
        status: GAME_STATUS_CREATED,
        // # participants: [Participant!]! @derivedFrom(field: "game"),
        // # conditions: [Condition!]! @derivedFrom(field: "game"),
        hasActiveConditions: false,
        _activeConditionsEntityIds: [],
        _resolvedConditionsEntityIds: [],
        _canceledConditionsEntityIds: [],
        _pausedConditionsEntityIds: [],
        startsAt: startsAt,
        provider: 0n,
        turnover: 0n,
        createdBlockNumber: createBlockNumber,
        createdBlockTimestamp: createBlockTimestamp,
        createdTxHash: txHash,
        shiftedBlockNumber: undefined,
        shiftedBlockTimestamp: undefined,
        shiftedTxHash: undefined,
        resolvedBlockNumber: undefined,
        resolvedBlockTimestamp: undefined,
        resolvedTxHash: undefined,
        _updatedAt: createBlockTimestamp,
    }
    context.Game.set(gameEntity)

    const participantEntity: participantEntity = {
        id: "1",
        name: "",
        image: "",
        sortOrder: 0,
        game_id: gameEntity.id,
    }
    context.Participant.set(participantEntity)

    return gameEntity

    // context.Game.set(DEFAULT_GAME)
    // return DEFAULT_GAME

}

export function shiftGame(
    gameEntityId: string,
    startsAt: bigint,
    txHash: string,
    shiftedBlockNumber: number,
    shiftedBlockTimestamp: number,
    context: LPv2Contract_GameShiftedEvent_handlerContext,
): GameEntity | null {
    const gameEntity = context.Game.get(gameEntityId)

    // TODO remove later
    if (!gameEntity) {
        context.log.error(`shiftGame gameEntity not found. gameEntityId = ${gameEntityId}`)
        return null
    }

    context.Game.set({
        ...gameEntity,
        startsAt: startsAt,
        shiftedTxHash: txHash,
        shiftedBlockNumber: BigInt(shiftedBlockNumber),
        shiftedBlockTimestamp: BigInt(shiftedBlockTimestamp),
        _updatedAt: BigInt(shiftedBlockTimestamp),
    })

    return gameEntity
}

export function cancelGame(
    gameEntityId: string,
    txHash: string,
    resolvedBlockNumber: number,
    resolvedBlockTimestamp: number,
    context: LPv2Contract_GameCanceledEvent_handlerContext,
): GameEntity | null {
    const gameEntity = context.Game.get(gameEntityId)

    // TODO remove later
    if (!gameEntity) {
        context.log.error(`cancelGame gameEntity not found. gameEntityId = ${gameEntityId}`)
        return null
    }

    context.Game.set({
        ...gameEntity,
        resolvedTxHash: txHash,
        resolvedBlockNumber: BigInt(resolvedBlockNumber),
        resolvedBlockTimestamp: BigInt(resolvedBlockTimestamp),
        status: GAME_STATUS_CANCELED,
        _updatedAt: BigInt(resolvedBlockTimestamp),
    })

    return gameEntity
}