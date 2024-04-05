import { ContractCodeNotStoredError } from "web3"
import { TypedMap } from "../constants"
import { GameEntity } from "../src/Types.gen"


const DEFAULT_GAME: GameEntity = {
    id: "1",
    liquidityPool_id: "",
    gameId: 0n,
    title: "",
    slug: "",
    league_id: "",
    sport_id: "",
    status: "Created",
    // # participants: [Participant!]! @derivedFrom(field: "game"),
    // # conditions: [Condition!]! @derivedFrom(field: "game"),
    hasActiveConditions: false,
    _activeConditionsEntityIds: [""],
    _resolvedConditionsEntityIds: [""],
    _canceledConditionsEntityIds: [""],
    _pausedConditionsEntityIds: [""],
    startsAt: 0n,
    provider: 0n,
    turnover: 0n,
    createdBlockNumber: 0n,
    createdBlockTimestamp:0n ,
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
    rawGameId: BigInt | null,
    ipfsHashBytes: string | null,
    dataBytes: string | null,
    startsAt: BigInt,
    network: string | null,
    txHash: string,
    createBlock: number,
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

    // // V1
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

    return DEFAULT_GAME

}

export function shiftGame(
    gameEntityId: string,
    startsAt: bigint,
    txHash: string,
    shiftedBlockNumber: number,
    shiftedBlockTimestamp: number,
    context: any,
): GameEntity | null {
    const gameEntity: GameEntity = context.Game.get(gameEntityId)

    // TODO remove later
    if (!gameEntity) {
        context.log.error(`shiftGame gameEntity not found. gameEntityId = ${gameEntityId}`, [gameEntityId])
        return null
    }

    context.Game.set({
        ...gameEntity,
        startsAt: startsAt,
        shiftedTxHash: txHash,
        shiftedBlockNumber: shiftedBlockNumber,
        shiftedBlockTimestamp: shiftedBlockTimestamp,
        _updatedAt: shiftedBlockTimestamp,
    })

    return gameEntity
}