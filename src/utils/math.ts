import { C1e9, C1e12, VERSION_V2, VERSION_V3, VERSION_V1 } from '../constants'
import { Version } from './types';
import Decimal from 'decimal.js';

export function safeDiv(numerator: bigint, divisor: bigint): bigint {
  const bigNumerator = BigInt(numerator);
  const bigDivisor = BigInt(divisor);

  if (bigDivisor === 0n) {
    return 0n;
  } else {
    return bigNumerator / bigDivisor;
  }
}

export function sqrtBigInt(n: bigint): bigint {
  if (n < 0n) {
    throw 'Square root of negative numbers is not supported.';
  }

  if (n < 2n) {
    return n;
  }

  // Using the Newton's method to approximate the square root
  let x0 = n;
  let x1 = (n / 2n) + 1n; // Initial guess

  while (x1 < x0) {
    x0 = x1;
    x1 = ((n / x1) + x1) / 2n;
  }

  return x0;
}


function addMargin(odds: bigint, margin: bigint, decimals: bigint): bigint {
  const revertedOdds = safeDiv(decimals ** BigInt(2), (decimals - (safeDiv(decimals ** BigInt(2), odds))))
  const marginEUR = decimals + margin
  const a = safeDiv(marginEUR * (revertedOdds - decimals), (odds - decimals))

  const b = safeDiv((safeDiv((revertedOdds - decimals) * decimals, ((odds - decimals))) * margin) + (decimals * margin), decimals)
  const c = decimals * 2n - marginEUR

  const newOdds = safeDiv((sqrtBigInt((b ** BigInt(2)) + (4n * a * c)) - b) * decimals, (2n * a) + decimals)

  return newOdds
}

export function toDecimal(x: bigint, decimals: number = 18): string {
  const divisor = new Decimal((BigInt(10) ** BigInt(decimals)).toString())
  const numerator = new Decimal(x.toString())
  return numerator.div(divisor).toString()
}

function ceil(a: bigint, m: bigint, decimals: bigint): bigint {
  if (a < (decimals)) {
    return decimals
  }

  return (a + m - 1n) / m * m
}

function v1(fund1: bigint, fund2: bigint, outcomeIndex: number, margin: bigint, decimals: bigint): bigint {

  const amount = 0n

  if (outcomeIndex === 0) {
    const pe1 = safeDiv((fund1 + amount) * decimals, (fund1 + fund2 + amount))
    const ps1 = safeDiv(fund1 * decimals, (fund1 + fund2))
    const cAmount = safeDiv(ceil(safeDiv(amount * decimals, safeDiv(fund1, 100n)), decimals, decimals), decimals)

    if (cAmount === 1n) {
      return addMargin(safeDiv(decimals ** BigInt(2), ps1), margin, decimals)
    }

    const odds = safeDiv((decimals ** BigInt(3)), (
      safeDiv(((((pe1 * cAmount) + (ps1 * 2n) - (pe1 * 2n)))) * decimals, cAmount)
    ))
    return addMargin(odds, margin, decimals)
  }

  if (outcomeIndex === 1) {
    const pe2 = safeDiv((fund2 + amount) * decimals, (fund1 + fund2 + amount))
    const ps2 = safeDiv(fund2 * decimals, (fund1 + fund2))
    const cAmount = safeDiv(ceil(safeDiv(amount * decimals, safeDiv(fund2, 100n)), decimals, decimals), decimals)

    if (cAmount === 1n) {
      return addMargin(safeDiv(decimals ** BigInt(2), ps2), margin, decimals)
    }

    const odds = safeDiv(decimals ** BigInt(3), (
      safeDiv((((pe2 * cAmount) + (ps2 * 2n) - (pe2 * 2n))) * decimals, cAmount)
    ))

    return addMargin(odds, margin, decimals)
  }

  return 0n
}

function v2(fund1: bigint, fund2: bigint, outcomeIndex: number, margin: bigint, decimals: bigint): bigint {
  const amount = 0n

  const activeFund = outcomeIndex === 0 ? fund1 : fund2

  const odds = safeDiv((fund1 + fund2 + amount) * C1e12, activeFund + amount)

  if (odds == C1e12) {
    return 0n
  }

  return addMargin(odds, margin, decimals)
}

// v3
const MAX_ITERATIONS = 32
const MAX_ODDS = 100n * C1e12
const PRECISION = 1_000_000n // million

function sum(items: bigint[]): bigint {

  let acc = 0n

  for (let i = 0; i < items.length; i++) {
    acc = acc + items[i]
  }

  return acc
}

function mul(self: bigint, other: bigint): bigint {
  return safeDiv(self * other, C1e12)
}

function div(self: bigint, other: bigint): bigint {
  return safeDiv(self * C1e12, other)
}

function ratio(self: bigint, other: bigint): bigint {
  return (self > other) ? div(self, other) : div(other, self)
}

function calcProbability(outcomeFund: bigint, fund: bigint, winningOutcomesCount: number): bigint | null {
  const probability = div(outcomeFund * BigInt(winningOutcomesCount), fund)

  if (probability < 1000n){
    // TODO throw error
    // console.log(`v3 odds probability lower than 1000, outcomeFund is ${outcomeFund.toString()}, probability is ${probability.toString()}, fund is ${fund.toString()}, winningOutcomesCount is ${winningOutcomesCount.toString()}`)
  }

  if (probability >= C1e12) {
    // TODO throw error
    // console.log(`v3 odds probability greater than 1^12, probability is ${probability}, outcomeFund is ${outcomeFund.toString()}, probability is ${probability.toString()}, fund is ${fund.toString()}, winningOutcomesCount is ${winningOutcomesCount.toString()}`)
  }
  return probability
}

// /**BigInt
//  * @notice Implementation of the sigmoid function.
//  * @notice The sigmoid function is commonly used in machine learning to limit output values within a range of 0 to 1.
//  */
function sigmoid(self: bigint): bigint {
  return div(self, self + C1e12)
}

function getOddsFromProbabilities(probabilities: bigint[], margin: bigint, winningOutcomesCount: number): bigint[] | null {

  const length = probabilities.length

  const odds: bigint[] = []
  const spreads: bigint[] = []

  if (margin <= 0n) {

    for (let i = 0; i < length; i++) {
      odds[i] = safeDiv(C1e12 * C1e12, probabilities[i])
    }

    return odds
  }

  for (let i = 0; i < length; i++) {
    spreads[i] = mul(C1e12 - probabilities[i], margin)
  }

  let error = margin
  const spreadMultiplier = BigInt(winningOutcomesCount) * C1e12

  for (let k = 0; k < MAX_ITERATIONS; ++k) {

    let oddsSpread = 0n
    {
      let spread = 0n

      for (let i = 0; i < length; i++) {
        const price = div(C1e12 - spreads[i], probabilities[i])
        odds[i] = price
        spread = spread + div(C1e12, price)
      }

      oddsSpread = C1e12 - div(spreadMultiplier, spread)
    }

    if ((ratio(margin, oddsSpread) - C1e12) < PRECISION) {
      return odds
    }

    if (margin <= oddsSpread) {
      throw new Error('margin <= oddsSpread')
    }

    const newError = margin - oddsSpread

    if (newError === error) {
      if ((div(margin, oddsSpread) - C1e12) >= PRECISION) {
        // throw new Error('margin / oddsSpread - 1 >= precision')
        return null
      }
      return odds
    }

    error = newError

    for (let i = 0; i < length; i++) {

      const sig = sigmoid(
        div(
          div(
            div(
              mul(error, spreads[i]),
              C1e12 - div(C1e12, odds[i]),
            ),
            C1e12 - margin,
          ),
          oddsSpread,
        ),
      )

      spreads[i] = spreads[i] + (mul(
        C1e12 - spreads[i] - probabilities[i],
        sig,
      ))
    }
  }

  return odds
}

export function v3(funds: bigint[], margin: bigint, winningOutcomesCount: number): bigint[] | null {

  const probabilities: bigint[] = []
  const totalFund = sum(funds)

  if (totalFund === 0n) {
    throw new Error('v3 totalFund is 0')
  }

  for (let i = 0; i < funds.length; i++) {

    const probability = calcProbability(funds[i], totalFund, winningOutcomesCount)

    if (!probability) {
      throw new Error(`v3 odds probability is null, fund[{}] is ${i.toString(), funds[i].toString()}`)
    }

    probabilities[i] = probability
  }

  const odds = getOddsFromProbabilities(probabilities, margin, winningOutcomesCount)

  if (!odds) {
    console.log('v3 odds is null')
    return null
  }

  for (let i = 0; i < funds.length; i++) {

    if (odds[i] > MAX_ODDS) {
      odds[i] = MAX_ODDS
    }

    if (odds[i] <= C1e12) {
      // console.log(`v3 odds lower than 1^12, fund is ${funds[i]}. Odds are ${odds[i]}. i is ${i}. Odds list is ${odds}`)
      // return null
    }
  }

  return odds

}

export function getOdds(version: Version, funds: bigint[], margin: bigint, winningOutcomesCount: number): bigint[] | null {
  if (version === VERSION_V3) {
    return v3(funds, margin, winningOutcomesCount)
  } else if (version === VERSION_V2) {
    return [v2(funds[0], funds[1], 0, margin, C1e12), v2(funds[0], funds[1], 1, margin, C1e12)]
  } else if (version === VERSION_V1) {
    return [v1(funds[0], funds[1], 0, margin, C1e9), v1(funds[0], funds[1], 1, margin, C1e9)]
  } else {
    throw new Error(`Unsupported version: ${version}`)
  }
}
