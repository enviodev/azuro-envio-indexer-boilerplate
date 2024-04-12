import { DEFAULT_COUNTRY, GAME_STATUS_CANCELED, GAME_STATUS_CREATED } from "../constants"
import { CoreContract_ConditionCreatedEvent_handlerContextAsync, CountryEntity, GameEntity, LPv2Contract_GameCanceledEvent_handlerContext, LPv2Contract_GameShiftedEvent_handlerContext, LPv2Contract_NewGameEvent_handlerContext, LPv2Contract_NewGameEvent_handlerContextAsync, LeagueEntity, ParticipantEntity, SportEntity, SportHubEntity, participantEntity } from "../src/Types.gen"
import { JSONValue, JSONValueKind, TypedMap } from "../utils/mapping"
import { encodeBase58 } from "ethers"
import { sportHubs } from "../dictionaries/sportHubs"
import { toSlug } from "../utils/text"
import { sports } from "../dictionaries/sports"
import { getEntityId } from "../utils/schema"
import { getImageUrl } from "../utils/images"
import { byte32ToIPFSCIDv0, tryFetchIpfsFile } from "../utils/ipfs"


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
    context: CoreContract_ConditionCreatedEvent_handlerContextAsync | LPv2Contract_NewGameEvent_handlerContext,
): Promise<GameEntity | null> {

    let data: any = null

    // V2
    if (ipfsHashBytes !== null) {
        const ipfsHash = byte32ToIPFSCIDv0(ipfsHashBytes.slice(2))
        const data = await tryFetchIpfsFile(ipfsHash, context)
        if (data === null) {
            context.log.error(`createGame IPFS failed to convert to object. Hash: ${ipfsHash}`)
            return null
        }
    }

    // V3

    if (dataBytes !== null) {
        context.log.debug(`v3 createGame bytes data: ${dataBytes}`)
        let data;
        try {
            data = JSON.parse(dataBytes);
        } catch (error) {
            context.log.error(`createGame bytes data failed to parse json. data: ${dataBytes}. \n${error}`,);
            return null;
        }

        if (data === null) {
            context.log.error(`createGame bytes data failed to convert to object. data: ${dataBytes}`);
            return null;
        }

        // Proceed with using 'data' as a JavaScript object
    }

    data = data!

    let sportId: bigint | null = null

    // V1
    const sportTypeIdField = data.sportTypeId

    if (sportTypeIdField && sportTypeIdField.kind === JSONValueKind.NUMBER) {
        sportId = BigInt(sportTypeIdField)
    }

    // 
    const sportIdField = data.sportId

    if (sportIdField && sportIdField.kind === JSONValueKind.NUMBER) {
        sportId = BigInt(sportIdField)
    }

    if (sportId === null) {
        context.log.error('createGame sportId is null')
        return null
    }


    let countryName = DEFAULT_COUNTRY

    // V1
    const titleCountryField = data.titleCountry

    if (titleCountryField && titleCountryField.kind === JSONValueKind.STRING) {
        countryName = titleCountryField.toString()
    }

    // V2
    const countryObjectField = data.country

    if (countryObjectField && countryObjectField.kind === JSONValueKind.OBJECT) {
        const countryObject = JSON.parse(countryObjectField)
        const countryObjectNameField = countryObject.name

        if (countryObjectNameField && countryObjectNameField.kind === JSONValueKind.STRING) {
            countryName = countryObjectNameField.toString()
        }
    }

    let leagueName: string | null = null

    // V1
    const titleLeagueField = data.titleLeague

    if (titleLeagueField && titleLeagueField.kind === JSONValueKind.STRING) {
        leagueName = titleLeagueField.toString()
    }

    // V2
    const leagueObjectField = data.league

    if (leagueObjectField && leagueObjectField.kind === JSONValueKind.OBJECT) {
        const leagueObject = JSON.parse(leagueObjectField)

        const leagueObjectNameField = leagueObject.name

        if (leagueObjectNameField && leagueObjectNameField.kind === JSONValueKind.STRING) {
            leagueName = leagueObjectNameField.toString()
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
        if (!gameIdObjectField || gameIdObjectField.kind !== JSONValueKind.NUMBER) {
            context.log.error('createGame gameIdObjectField is null')
            return null
        }
        gameId = BigInt(gameIdObjectField)
    }
    // end V1 - gameId from ipfs

    // V2
    const extraObjectField = data.extra
    let provider = BigInt('1')

    if (extraObjectField && extraObjectField.kind === JSONValueKind.OBJECT) {
        const extraObject = JSON.parse(extraObjectField)

        const extraObjectProviderField = extraObject.get('provider')

        if (extraObjectProviderField && extraObjectProviderField.kind === JSONValueKind.NUMBER) {
            provider = extraObjectProviderField.toBigInt()
        }
    }

    const gameEntityId = getEntityId(liquidityPoolAddress, gameId.toString())

    let gameEntity = await context.Game.get(gameEntityId)

    if (!gameEntity) {
        gameEntity = {
            id: gameEntityId,
            liquidityPool_id: liquidityPoolAddress,
            gameId: gameId,
            title: "",
            slug: "",
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
            shiftedBlockNumber: 0n,
            shiftedBlockTimestamp: 0n,
            shiftedTxHash: "",
            resolvedBlockNumber: 0n,
            resolvedBlockTimestamp: 0n,
            resolvedTxHash: "",
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
        let participantImageValue = data.get(participantImageKey)
        const participantImage = participantImageValue && participantImageValue.kind === JSONValueKind.STRING
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
        }
    }

    // V2
    let participants = data.get('participants')

    if (participants && participants.kind === JSONValueKind.ARRAY) {
        const participantsArray = participants.toArray()

        for (let i = 0; i < participantsArray.length; i++) {
            let participantEntityId = getEntityId(gameEntity.id, BigInt(i).toString())

            const mappedParticipant = JSON.parse(participantsArray[i])

            const participantNameValue = mappedParticipant.get('name')

            if (!participantNameValue) {
                continue
            }

            const participantName = participantNameValue.toString()
            participantsNames = participantsNames.concat([participantName])

            const participantImageValue = mappedParticipant.get('image')
            const participantImage = participantImageValue && participantImageValue.kind === JSONValueKind.STRING
                ? participantImageValue.toString()
                : getImageUrl(network, sportId, gameId, participantName)

            const participantEntity: ParticipantEntity = {
                id: participantEntityId,
                game_id: gameEntity.id,
                name: participantName,
                image: participantImage,
                sortOrder: i,
            }
            context.Participant.set(participantEntity)
        }
    }

    const gameSlug = participantsNames[0].concat('-').concat(participantsNames[1])

    context.Game.set({
        ...gameEntity,
        title: gameSlug,
        slug: toSlug(gameSlug),
        _updatedAt: createBlockTimestamp,
    })

    return gameEntity

    // TODO delete
    // // mock data
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