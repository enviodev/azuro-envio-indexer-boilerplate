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
): Promise<GameEntity | null> {

    let data: IPFSMatchDetails | null = null

    // V2
    if (ipfsHashBytes !== null) {
        const ipfsHash = byte32ToIPFSCIDv0(ipfsHashBytes.slice(2))
        data = await tryFetchIpfsFile(ipfsHash, chainId, context)
        if (data === null) {
            context.log.error(`createGame (v2) IPFS failed to convert to object. Hash: ${ipfsHash}`)
            return null
        }
    }

    // V3
    if (dataBytes !== null) {
        context.log.debug(`v3 createGame bytes data: ${dataBytes}`)
        try {
            data = JSON.parse(dataBytes) as IPFSMatchDetails;
        } catch (error) {
            context.log.error(`createGame (v3) bytes data failed to parse json. data: ${dataBytes}. \n${error}`,);
            return null;
        }

        if (data === null) {
            context.log.error(`createGame (v3) bytes data failed to convert to object. data: ${dataBytes}`);
            return null;
        }
        // Proceed with using 'data' as a JavaScript object
    }

    if (data === null) {
        throw new Error('Couldn\'t fetch createGame data from IPFS')
        // return null
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
        context.log.error('createGame sportId is null')
        return null
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
        context.log.error('createGame leagueName is null')
        return null
    }

    const sportHubName = sportHubs.get(sportId)

    if (!sportHubName) {
        context.log.error('createGame sportHubName is null')
        return null
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
            context.log.error('createGame sportName is null')
            return null
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
            context.log.error('createGame gameIdObjectField is null')
            return null
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

    // TODO delete
    // mock data
    // const sportHubEntity: SportHubEntity = {
    //     id: "1",
    //     name: "Football",
    //     slug: "football",
    // }
    // context.SportHub.set(sportHubEntity)

    // const sportEntity: SportEntity = {
    //     id: "1",
    //     sportId: 1n,
    //     name: "Football",
    //     slug: "football",
    //     sporthub_id: "1",
    // }
    // context.Sport.set(sportEntity)

    // const countryEntity: CountryEntity = {
    //     id: "1",
    //     name: "Football",
    //     sport_id: "1",
    //     turnover: 0n,
    //     slug: "football",
    //     hasActiveLeagues: false,
    //     activeLeaguesEntityIds: [],
    // }
    // context.Country.set(countryEntity)

    // const leagueEntity: LeagueEntity = {
    //     id: "1",
    //     name: "Football",
    //     country_id: "1",
    //     turnover: 0n,
    //     slug: "football",
    //     hasActiveGames: false,
    //     activeGamesEntityIds: [],
    // }
    // context.League.set(leagueEntity)

    // const gameEntity: GameEntity = {
    //     id: "1",
    //     liquidityPool_id: liquidityPoolAddress,
    //     gameId: 0n,
    //     title: "",
    //     slug: "",
    //     league_id: leagueEntity.id,
    //     sport_id: sportEntity.id,
    //     status: GAME_STATUS_CREATED,
    //     // # participants: [Participant!]! @derivedFrom(field: "game"),
    //     // # conditions: [Condition!]! @derivedFrom(field: "game"),
    //     hasActiveConditions: false,
    //     _activeConditionsEntityIds: [],
    //     _resolvedConditionsEntityIds: [],
    //     _canceledConditionsEntityIds: [],
    //     _pausedConditionsEntityIds: [],
    //     startsAt: startsAt,
    //     provider: 0n,
    //     turnover: 0n,
    //     createdBlockNumber: createBlockNumber,
    //     createdBlockTimestamp: createBlockTimestamp,
    //     createdTxHash: txHash,
    //     shiftedBlockNumber: undefined,
    //     shiftedBlockTimestamp: undefined,
    //     shiftedTxHash: undefined,
    //     resolvedBlockNumber: undefined,
    //     resolvedBlockTimestamp: undefined,
    //     resolvedTxHash: undefined,
    //     _updatedAt: createBlockTimestamp,
    // }
    // context.Game.set(gameEntity)

    // const participantEntity: participantEntity = {
    //     id: "1",
    //     name: "",
    //     image: "",
    //     sortOrder: 0,
    //     game_id: gameEntity.id,
    // }
    // context.Participant.set(participantEntity)

    // return gameEntity

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