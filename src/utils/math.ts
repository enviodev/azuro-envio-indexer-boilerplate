import { C1e9, C1e12, VERSION_V2, VERSION_V3 } from '../constants'

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
  const marginEUR = decimals + (margin)
  const a = safeDiv(marginEUR * (revertedOdds - decimals), (odds - decimals))

  const b = safeDiv(safeDiv((revertedOdds - (decimals)) * (decimals), ((odds - decimals) * margin) + (decimals * (margin))), decimals)
  const c = decimals * 2n - (marginEUR)

  const newOdds = safeDiv((BigInt(sqrtBigInt((b ** BigInt(2)) + (BigInt('4') * (a) * (c)))) - b) * decimals, (2n * (a)) + decimals)

  return newOdds
}

// export function toDecimal(x: bigint, decimals: number = 18): BigDecimal {
//   const divisor = new BigDecimal(BigInt(10) ** BigInt(decimals))

//   return new BigDecimal(x) / (divisor)
// }

export function toDecimal(x: bigint, decimals: number = 18): bigint {
  const divisor = BigInt(10) ** BigInt(decimals)

  return x / divisor
}

function ceil(a: bigint, m: bigint, decimals: bigint): bigint {
  if (a < (decimals)) {
    return decimals
  }

  return a + m - (BigInt('1')) / (m) * (m)
}

function v1(fund1: bigint, fund2: bigint, outcomeIndex: number, margin: bigint, decimals: bigint): bigint {

  const amount = BigInt('0')

  if (outcomeIndex === 0) {
    const pe1 = (fund1 + (amount)) / (fund1 + (fund2) + (amount))
    const ps1 = fund1 / (fund1 + fund2)
    const cAmount = ceil(amount * (decimals) / (fund1 / (BigInt('100'))), decimals, decimals) / (decimals)

    if (cAmount === (BigInt('1'))) {
      const left = (ps1 === 0n) ? 0n : decimals ** BigInt(2) / ps1;
      return addMargin(left, margin, decimals)
    }

    const odds = (decimals ** BigInt(3)) / (
      (pe1 * (cAmount) + (ps1 * (BigInt('2'))) - (pe1 * (BigInt('2')))) * (decimals) / (cAmount)
    )
    return addMargin(odds, margin, decimals)
  }

  if (outcomeIndex === 1) {
    const pe2 = fund2 + (amount) * (decimals) / (fund1 + (fund2) + (amount))
    const ps2 = fund2 * (decimals) / (fund1 + (fund2))
    const cAmount = ceil(amount * (decimals) / (fund2 / (BigInt('100'))), decimals, decimals) / decimals

    if (cAmount === (BigInt('1'))) {
      return addMargin(decimals ** BigInt(2) / (ps2), margin, decimals)
    }

    const odds = (decimals ** BigInt(3)) / (
      (pe2 * (cAmount) + (ps2 * (BigInt('2'))) - (pe2 * (BigInt('2')))) * (decimals) / (cAmount)
    )

    return addMargin(odds, margin, decimals)
  }

  return 0n
}

function v2(fund1: bigint, fund2: bigint, outcomeIndex: number, margin: bigint, decimals: bigint): bigint {
  const amount = 0n

  const activeFund = outcomeIndex === 0 ? fund1 : fund2

  const odds = safeDiv((fund1 + (fund2) + (amount)) * (C1e12), activeFund + amount)

  if (odds == C1e12) {
    return BigInt('0')
  }

  return addMargin(odds, margin, decimals)
}

// v3
const MAX_ITERATIONS = 32
const MAX_ODDS = 100n * C1e12
const PRECISION = BigInt('1000000') // million

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
  return (self > other) ? safeDiv(self, other) : safeDiv(other, self)
}

function calcProbability(outcomeFund: bigint, fund: bigint, winningOutcomesCount: number): bigint | null {
  const probability = safeDiv(outcomeFund * BigInt(winningOutcomesCount), fund)

  if (probability < 1000n || probability > C1e12) {
    console.error(`v3 odds probability lower than 100 or greater than 1^12, outcomeFund is ${outcomeFund.toString()}`)
    return null
  }

  return probability
}

// /**BigInt
//  * @notice Implementation of the sigmoid function.
//  * @notice The sigmoid function is commonly used in machine learning to limit output values within a range of 0 to 1.
//  */
function sigmoid(self: bigint): bigint {
  return safeDiv(self, self + C1e12)
}

function getOddsFromProbabilities(probabilities: bigint[], margin: bigint, winningOutcomesCount: number): bigint[] | null {

  const length = probabilities.length

  const odds: bigint[] = []
  const spreads: bigint[] = []

  if (margin < 0n) {

    for (let i = 0; i < length; i++) {
      odds[i] = C1e12 * safeDiv(C1e12, probabilities[i])
    }

    return odds
  }

  for (let i = 0; i < length; i++) {
    spreads[i] = mul(C1e12 - (probabilities[i]), margin)
  }

  let error = margin
  const spreadMultiplier = BigInt(winningOutcomesCount) * C1e12

  for (let k = 0; k < MAX_ITERATIONS; ++k) {

    let oddsSpread = 0n
    {
      let spread = 0n

      for (let i = 0; i < length; i++) {
        const price = safeDiv(C1e12 - (spreads[i]), probabilities[i])
        odds[i] = price
        spread = spread + (safeDiv(C1e12, price))
      }

      oddsSpread = C1e12 - (safeDiv(spreadMultiplier, spread))
    }

    if ((ratio(margin, oddsSpread) - C1e12) < PRECISION) {
      return odds
    }

    if (margin < oddsSpread) {
      console.error('margin <= oddsSpread', [])
      return null
    }

    const newError = margin - (oddsSpread)

    if (newError === error) {
      if ((div(margin, oddsSpread) - C1e12) > PRECISION) {
        console.error('margin / oddsSpread - 1 >= precision', [])
        return null
      }
      return odds
    }

    error = newError

    for (let i = 0; i < length; i++) {

      const sig = sigmoid(
        safeDiv(
          safeDiv(
            safeDiv(
              mul(error, spreads[i]),
              C1e12 - (safeDiv(C1e12, odds[i])),
            ),
            C1e12 - (margin),
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

  if (totalFund == 0n) {
    console.error('v3 totalFund is 0')
    return null
  }

  for (let i = 0; i < funds.length; i++) {

    const probability = calcProbability(funds[i], totalFund, winningOutcomesCount)

    if (probability === null) {
      console.error(`v3 odds probability is null, fund[{}] is ${i.toString(), funds[i].toString()}`)
      return null
    }

    probabilities[i] = probability
  }

  const odds = getOddsFromProbabilities(probabilities, margin, winningOutcomesCount)

  if (odds === null) {
    return null
  }

  for (let i = 0; i < funds.length; i++) {

    if (odds[i] > MAX_ODDS) {
      odds[i] = MAX_ODDS
    }

    if (odds[i] <= C1e12) {
      console.error(`v3 odds[{}] {} lower than 1^12, fund[{}] is ${i.toString(), odds[i].toString(), i.toString(), funds[i].toString()}`)
      return null
    }
  }

  return odds

}

export function getOdds(version: string, funds: bigint[], margin: bigint, winningOutcomesCount: number): bigint[] | null {
  if (version === VERSION_V3) {
    return v3(funds, margin, winningOutcomesCount)
  }

  if (version === VERSION_V2) {
    return [v2(funds[0], funds[1], 0, margin, C1e12), v2(funds[0], funds[1], 1, margin, C1e12)]
  }

  return [v1(funds[0], funds[1], 0, margin, C1e9), v1(funds[0], funds[1], 1, margin, C1e9)]
}
