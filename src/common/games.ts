import { DEFAULT_COUNTRY, GAME_STATUS_CANCELED, GAME_STATUS_CREATED } from "../constants"
import { CoreContract_ConditionCreatedEvent_handlerContextAsync, CountryEntity, GameEntity, LPv2Contract_GameCanceledEvent_handlerContext, LPv2Contract_GameShiftedEvent_handlerContext, LPv2Contract_NewGameEvent_handlerContext, LPv2Contract_NewGameEvent_handlerContextAsync, LeagueEntity, ParticipantEntity, SportEntity, SportHubEntity, participantEntity } from "../src/Types.gen"
import { encodeBase58 } from "ethers"
import { sportHubs } from "../dictionaries/sportHubs"
import { toSlug } from "../utils/text"
import { sports } from "../dictionaries/sports"
import { getEntityId, isPlainObject } from "../utils/schema"
import { getImageUrl } from "../utils/images"
import { byte32ToIPFSCIDv0, tryFetchIpfsFile } from "../utils/ipfs"
import { IPFSMatchDetails } from "../utils/types"
import { Cache, CacheCategory } from "../lib/cache"

// TODO delete
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

function decodeJSON(hexStr: string): IPFSMatchDetails {
    let plainStr = "";
    for (let i = 0; i < hexStr.length; i += 2) {
        const hexByte = hexStr.substring(i, i + 2);
        plainStr += String.fromCharCode(parseInt(hexByte, 16));
    }

    // Quick check for JSON-like structures
    if (plainStr.startsWith("{") || plainStr.includes(":")) {
        try {
            return JSON.parse(plainStr);
        } catch {
            throw new Error('Invalid JSON');
        }
    }

    throw new Error('Invalid JSON');
}


export async function createGame(
    liquidityPoolAddress: string,
    rawGameId: bigint | null,
    ipfsHashBytes: string | null,
    dataBytes: string | null,
    startsAt: bigint,
    network: string | null,
    txHash: string,
    createBlockNumber: bigint,
    createBlockTimestamp: bigint,
    chainId: number,
    context: CoreContract_ConditionCreatedEvent_handlerContextAsync | LPv2Contract_NewGameEvent_handlerContext,
): Promise<GameEntity> {

    let data: IPFSMatchDetails | null = null

    // V2
    if (ipfsHashBytes !== null) {
        if (!ipfsHashBytes.startsWith("0x")) {
            throw new Error('createGame (v2) IPFS hash doesn\'t start with 0x')
        }

        const hexStr = ipfsHashBytes.slice(2);

        // Identifier or hash
        const ipfsHash = byte32ToIPFSCIDv0(hexStr)

        if (ipfsHash[0] !== 'Q') {
            throw new Error(`createGame (v2) IPFS hash doesn\'t start with Q ${ipfsHash}`)
        }

        data = await tryFetchIpfsFile(ipfsHash, chainId, context)

        if (data === null) {
            throw new Error(`createGame (v2) IPFS failed to convert to object. Hash: ${ipfsHash}`)
        }
    }

    // V3
    if (dataBytes !== null) {
        try {
            // JSON Data already
            data = decodeJSON(dataBytes.slice(2)) as IPFSMatchDetails;
        } catch (error) {
            throw new Error(`createGame (v3) bytes data failed to parse json. data: ${dataBytes}. \n${error}`,);
        }

        if (data === null) {
            throw new Error(`createGame (v3) bytes data failed to convert to object. data: ${dataBytes}`);
        }
        // Proceed with using 'data' as a JavaScript object

        context.log.debug(`v3 data: ${JSON.stringify(data)}`)
    }

    if (data === null) {
        throw new Error('createGame data is null')
    }

    let sportId: bigint | null = null

    // V1
    const sportTypeIdField = data.sportTypeId
    if (typeof sportTypeIdField == 'number') {
        sportId = BigInt(sportTypeIdField)
    }

    // V2
    const sportIdField = data.sportId
    if (typeof sportIdField === 'number') {
        sportId = BigInt(sportIdField)
    }

    if (sportId === null) {
        throw new Error('createGame sportId is null')
    }

    let countryName = DEFAULT_COUNTRY

    // V1
    const titleCountryField = data.titleCountry
    if (typeof titleCountryField === 'string') {
        countryName = titleCountryField.toString()
    }

    // V2
    const countryObject = data.country

    if (isPlainObject(countryObject) && countryObject !== undefined) {
        const countryObjectNameField = countryObject.name

        if (typeof countryObjectNameField === 'string') {
            countryName = countryObjectNameField
        }
    }

    let leagueName: string | null = null

    // V1
    const titleLeagueField = data.titleLeague

    if (typeof titleLeagueField === 'string') {
        leagueName = titleLeagueField.toString()
    }

    // V2
    const leagueObjectField = data.league

    if (isPlainObject(leagueObjectField) && leagueObjectField !== undefined) {
        const leagueObjectNameField = leagueObjectField.name

        if (typeof leagueObjectNameField === 'string') {
            leagueName = leagueObjectNameField
        }
    }

    if (leagueName === null) {
        throw new Error('createGame leagueName is null')
    }

    const sportHubName = sportHubs.get(sportId)

    if (!sportHubName) {
        throw new Error('createGame sportHubName is null')
    }

    let sportHubEntity = await context.SportHub.get(sportHubName!)

    if (!sportHubEntity) {
        sportHubEntity = {
            id: sportHubName,
            name: sportHubName,
            slug: toSlug(sportHubName),
        } as SportHubEntity
        context.SportHub.set(sportHubEntity)
    }

    let sportEntity = await context.Sport.get(sportId.toString())

    if (!sportEntity) {
        const sportName = sports.get(sportId)
        if (!sportName) {
            throw new Error('createGame sportName is null')
        }

        sportEntity = {
            id: sportId.toString(),
            sportId: sportId,
            name: sportName,
            slug: toSlug(sportName),
            sporthub_id: sportHubEntity.id,
        } as SportEntity
        context.Sport.set(sportEntity)
    }

    const countryEntityId = getEntityId(sportId.toString(), countryName)
    let countryEntity = await context.Country.get(countryEntityId)

    if (!countryEntity) {
        countryEntity = {
            id: countryEntityId,
            name: countryName,
            sport_id: sportEntity.id,
            turnover: 0n,
            slug: toSlug(countryName),
            hasActiveLeagues: false,
            activeLeaguesEntityIds: [],
        } as CountryEntity
        context.Country.set(countryEntity)
    }

    let leagueEntityId = getEntityId(sportId.toString(), countryName, leagueName)
    let leagueEntity = await context.League.get(leagueEntityId)

    if (!leagueEntity) {
        leagueEntity = {
            id: leagueEntityId,
            name: leagueName,
            country_id: countryEntity.id,
            turnover: 0n,
            slug: toSlug(leagueName),
            hasActiveGames: false,
            activeGamesEntityIds: [],
        } as LeagueEntity
        context.League.set(leagueEntity)
    }

    // V1 - gameId from ipfs
    let gameId = rawGameId
    if (gameId === null) {
        const gameIdObjectField = data.gameId
        if (!gameIdObjectField || typeof gameIdObjectField !== 'number') {
            throw new Error('createGame gameIdObjectField is null')
        }
        gameId = BigInt(gameIdObjectField)
    }
    // end V1 - gameId from ipfs

    // V2
    const extraObjectField = data.extra
    let provider = BigInt('1')

    if (isPlainObject(extraObjectField) && extraObjectField !== undefined) {
        const extraObjectProviderField = extraObjectField.provider

        if (typeof extraObjectProviderField === 'number') {
            provider = BigInt(extraObjectProviderField)
        }
    }

    const gameEntityId = getEntityId(liquidityPoolAddress, gameId.toString())

    let gameEntity = await context.Game.get(gameEntityId)

    if (!gameEntity) {
        gameEntity = {
            id: gameEntityId,
            liquidityPool_id: liquidityPoolAddress,
            gameId: gameId,
            title: undefined,
            slug: undefined,
            league_id: leagueEntity.id,
            sport_id: sportEntity.id,
            status: GAME_STATUS_CREATED,
            hasActiveConditions: false,
            _activeConditionsEntityIds: [],
            _resolvedConditionsEntityIds: [],
            _canceledConditionsEntityIds: [],
            _pausedConditionsEntityIds: [],
            startsAt: startsAt,
            provider: provider,
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
        } as GameEntity
        context.Game.set(gameEntity)
    }

    let participantsNames: string[] = []

    // V1
    for (let i = 0; i <= 1; i++) {
        let participantEntityId = getEntityId(gameEntity.id, BigInt(i).toString())

        let participantNameKey = 'entity'.concat((i + 1).toString()).concat('Name')
        let participantNameValue = data[participantNameKey]

        if (!participantNameValue) {
            continue
        }
        const participantName = participantNameValue.toString()

        participantsNames = participantsNames.concat([participantName])

        let participantImageKey = 'entity'.concat((i + 1).toString()).concat('Image')
        let participantImageValue = data[participantImageKey]
        const participantImage = typeof participantImageValue === 'string'
            ? participantImageValue.toString()
            : null

        let participantEntity = await context.Participant.get(participantEntityId)

        if (!participantEntity) {
            participantEntity = {
                id: participantEntityId,
                game_id: gameEntity.id,
                name: participantName,
                image: participantImage,
                sortOrder: i,
            } as participantEntity
            context.Participant.set(participantEntity)
        }
    }

    // V2
    let participantsArray = data.participants

    if (Array.isArray(participantsArray)) {
        for (let i = 0; i < participantsArray.length; i++) {
            let participantEntityId = getEntityId(gameEntity.id, BigInt(i).toString())

            const mappedParticipant = participantsArray[i]
            const participantNameValue = mappedParticipant.name

            if (!participantNameValue) {
                continue
            }

            const participantName = participantNameValue
            participantsNames = participantsNames.concat([participantName])

            const participantImageValue = mappedParticipant.image
            const participantImage = typeof participantImageValue === 'string'
                ? participantImageValue.toString()
                : getImageUrl(network, sportId, gameId, participantName)

            const participantEntity: ParticipantEntity = {
                id: participantEntityId,
                game_id: gameEntity.id,
                name: participantName,
                image: participantImage ? participantImage : undefined,
                sortOrder: i,
            }
            context.Participant.set(participantEntity)
        }
    }

    const gameTitle = participantsNames[0].concat(' - ').concat(participantsNames[1])
    const gameSlug = gameTitle.concat('-').concat(gameEntity.gameId.toString())

    context.Game.set({
        ...gameEntity,
        title: gameTitle,
        slug: toSlug(gameSlug),
        _updatedAt: createBlockTimestamp,
    })

    return gameEntity
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
        throw new Error(`shiftGame gameEntity not found. gameEntityId = ${gameEntityId}`)
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
        throw new Error(`cancelGame gameEntity not found. gameEntityId = ${gameEntityId}`)
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