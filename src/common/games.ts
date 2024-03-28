import { TypedMap } from "../constants"
import { GameEntity } from "../src/Types.gen"


export function createGame(
    liquidityPoolAddress: string,
    rawGameId: BigInt | null,
    ipfsHashBytes: string | null,
    dataBytes: string | null,
    startsAt: BigInt,
    network: string | null,
    txHash: string,
    createBlock: number,
): GameEntity | null {

    let data: TypedMap<string, JSONValue> | null = null

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

    data = data!

    let sportId: bigint | null = null

    // V1
    const sportTypeIdField = data.get('sportTypeId')

    if (sportTypeIdField && sportTypeIdField.kind === JSONValueKind.NUMBER) {
        sportId = sportTypeIdField.toBigInt()
    }

    // V2
    const sportIdField = data.get('sportId')

    if (sportIdField && sportIdField.kind === JSONValueKind.NUMBER) {
        sportId = sportIdField.toBigInt()
    }

    if (sportId === null) {
        log.error('createGame sportId is null', [])

        return null
    }

    let countryName = DEFAULT_COUNTRY.toString()