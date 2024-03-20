import { C1e9, C1e12, VERSION_V2, VERSION_V3 } from '../constants'

function addMargin(odds: bigint, margin: bigint, decimals: bigint): bigint {
    const revertedOdds = decimals**BigInt(2)/(decimals-(decimals**BigInt(2)/(odds)))
    const marginEUR = decimals+(margin)
    const a = marginEUR*(revertedOdds-(decimals))/(odds-(decimals))
  
    const b = revertedOdds
      -(decimals)
      *(decimals)
      /(odds-(decimals))
      *(margin)
      +(decimals*(margin))
      /(decimals)
    const c = decimals*(BigInt('2'))-(marginEUR)
  
    const newOdds = b
      **BigInt(2)
      +(BigInt('4')*(a)*(c))
      .sqrt()
      -(b)
      *(decimals)
      /(BigInt('2')*(a))
      +(decimals)
  
    return newOdds
  }
  
  export function toDecimal(x: bigint, decimals: number = 18): BigDecimal {
    const divisor = new BigDecimal(**BigInt(BigInt(10), decimals as u8))
  
    return new BigDecimal(x)/(divisor)
  }
  
  function ceil(a: bigint, m: bigint, decimals: bigint): bigint {
    if (a<(decimals)) {
      return decimals
    }
  
    return a+m-(BigInt('1'))/(m)*(m)
  }
  
  function v1(fund1: bigint, fund2: bigint, outcomeIndex: number, margin: bigint, decimals: bigint): bigint {
  
    const amount = BigInt('0')
  
    if (outcomeIndex === 0) {
      const pe1 = (fund1+(amount))/(fund1+(fund2)+(amount))
      const ps1 = fund1/(fund1+fund2)
      const cAmount = ceil(amount*(decimals)/(fund1/(BigInt('100'))), decimals, decimals)/(decimals)
  
      if (cAmount===(BigInt('1'))) {
        return addMargin(decimals**BigInt(2)/(ps1), margin, decimals)
      }
  
      const odds = decimals**BigInt(3)/(
        pe1
          *(cAmount)
          +(ps1*(BigInt('2')))
          -(pe1*(BigInt('2')))
          *(decimals)
          /(cAmount),
      )
  
      return addMargin(odds, margin, decimals)
    }
  
    if (outcomeIndex === 1) {
      const pe2 = fund2+(amount)*(decimals)/(fund1+(fund2)+(amount))
      const ps2 = fund2*(decimals)/(fund1+(fund2))
      const cAmount = ceil(amount*(decimals)/(fund2/(BigInt('100'))), decimals, decimals)/(
        decimals,
      )
  
      if (cAmount===(BigInt('1'))) {
        return addMargin(decimals**BigInt(2)/(ps2), margin, decimals)
      }
  
      const odds = decimals**BigInt(3)/(
        pe2
          *(cAmount)
          +(ps2*(BigInt('2')))
          -(pe2*(BigInt('2')))
          *(decimals)
          /(cAmount),
      )
  
      return addMargin(odds, margin, decimals)
    }
  
    return 0n
  }
  
  // function v2(fund1: bigint, fund2: bigint, outcomeIndex: number, margin: bigint, decimals: bigint): bigint {
  //   const amount = BigInt('0')
  
  //   const activeFund = outcomeIndex === 0 ? fund1 : fund2
  
  //   const odds = (fund1+(fund2)+(amount))*(C1e12)/(activeFund+(amount))
  
  //   if (odds == (C1e12)) {
  //     return BigInt('0')
  //   }
  
  //   return addMargin(odds, margin, decimals)
  // }
  
  // // v3
  // const MAX_ITERATIONS = 32
  // const MAX_ODDS = BigInt('100')*(C1e12)
  // const PRECISION = BigInt('1000000')
  
  // function sum(items: bigint[]): bigint {
  
  //   let acc = BigInt('0')
  
  //   for (let i = 0; i < items.length; i++) {
  //     acc = acc+(items[i])
  //   }
  
  //   return acc
  // }
  
  // function mul(self: bigint, other: bigint): bigint {
  //   return self*(other)/(C1e12)
  // }
  
  // function div(self: bigint, other: bigint): bigint {
  //   return self*(C1e12)/(other)
  // }
  
  // function ratio(self: bigint, other: bigint): bigint {
  //   return self.gt(other) ? div(self, other) : div(other, self)
  // }
  
  // function calcProbability(outcomeFund: bigint, fund: bigint, winningOutcomesCount: u8): bigint | null {
  //   const probability = div(outcomeFund*(bigint.fromI32(winningOutcomesCount)), fund)
  
  //   if (probability<(BigInt('1000')) || probability.ge(C1e12)) {
  
  //     log.error('v3 odds probability lower than 100 or greater than 1^12, outcomeFund is {}', [outcomeFund.toString()])
  
  //     return null
  //   }
  
  //   return probability
  // }
  
  // // /**BigInt
  // //  * @notice Implementation of the sigmoid function.
  // //  * @notice The sigmoid function is commonly used in machine learning to limit output values within a range of 0 to 1.
  // //  */
  // function sigmoid(self: bigint): bigint {
  //   return div(self, self+(C1e12))
  // }
  
  // function getOddsFromProbabilities(probabilities: bigint[], margin: bigint, winningOutcomesCount: u8): bigint[] | null {
  
  //   const length = probabilities.length
  
  //   const odds: bigint[] = []
  //   const spreads: bigint[] = []
  
  //   if (margin.le(BigInt('0'))) {
  
  //     for (let i = 0; i < length; i++) {
  //       odds[i] = C1e12*(C1e12)/(probabilities[i])
  //     }
  
  //     return odds
  //   }
  
  //   for (let i = 0; i < length; i++) {
  //     spreads[i] = mul(C1e12-(probabilities[i]), margin)
  //   }
  
  //   let error = margin
  //   const spreadMultiplier = bigint.fromI32(winningOutcomesCount)*(C1e12)
  
  //   for (let k = 0; k < MAX_ITERATIONS; ++k) {
  
  //     let oddsSpread = BigInt('0')
  //     {
  //       let spread = BigInt('0')
  
  //       for (let i = 0; i < length; i++) {
  //         const price = div(C1e12-(spreads[i]), probabilities[i])
  //         odds[i] = price
  //         spread = spread+(div(C1e12, price))
  //       }
  
  //       oddsSpread = C1e12-(div(spreadMultiplier, spread))
  //     }
  
  //     if (ratio(margin, oddsSpread)-(C1e12)<(PRECISION)) {
  //       return odds
  //     }
  
  //     if (margin.le(oddsSpread)) {
  //       log.error('margin <= oddsSpread', [])
  
  //       return null
  //     }
  
  //     const newError = margin-(oddsSpread)
  
  //     if (newError === error) {
  //       if (div(margin, oddsSpread)-(C1e12).ge(PRECISION)) {
  //         log.error('margin / oddsSpread - 1 >= precision', [])
  
  //         return null
  //       }
  
  //       return odds
  //     }
  
  //     error = newError
  
  //     for (let i = 0; i < length; i++) {
  
  //       const sig = sigmoid(
  //         div(
  //           div(
  //             div(
  //               mul(error, spreads[i]),
  //               C1e12-(div(C1e12, odds[i])),
  //             ),
  //             C1e12-(margin),
  //           ),
  //           oddsSpread,
  //         ),
  //       )
  
  //       spreads[i] = spreads[i]+(mul(
  //         C1e12-(spreads[i])-(probabilities[i]),
  //         sig,
  //       ))
  //     }
  //   }
  
  //   return odds
  // }
  
  // export function v3(funds: bigint[], margin: bigint, winningOutcomesCount: number): bigint[] | null {
  
  //   const probabilities: bigint[] = []
  //   const totalFund = sum(funds)
  
  //   if (totalFund == (BigInt('0'))) {
  //     log.error('v3 totalFund is 0', [])
  
  //     return null
  //   }
  
  //   for (let i = 0; i < funds.length; i++) {
  
  //     const probability = calcProbability(funds[i], totalFund, winningOutcomesCount)
  
  //     if (probability === null) {
  //       log.error('v3 odds probability is null, fund[{}] is {}', [i.toString(), funds[i].toString()])
  
  //       return null
  //     }
  
  //     probabilities[i] = probability
  //   }
  
  //   const odds = getOddsFromProbabilities(probabilities, margin, winningOutcomesCount)
  
  //   if (odds === null) {
  //     return null
  //   }
  
  //   for (let i = 0; i < funds.length; i++) {
  
  //     if (odds[i] > (MAX_ODDS)) {
  //       odds[i] = MAX_ODDS
  //     }
  
  //     if (odds[i] <= (C1e12)) {
  //       log.error('v3 odds[{}] {} lower than 1^12, fund[{}] is {}', [i.toString(), odds[i].toString(), i.toString(), funds[i].toString()])
  
  //       return null
  //     }
  //   }
  
  //   return odds
  
  // }
  
  export function getOdds(version: string, funds: bigint[], margin: bigint, winningOutcomesCount: number): bigint[] {
  
    // if (version === VERSION_V3) {
    //   return v3(funds, margin, winningOutcomesCount)
    // }
  
    // if (version === VERSION_V2) {
    //   return [v2(funds[0], funds[1], 0, margin, C1e12), v2(funds[0], funds[1], 1, margin, C1e12)]
    // }
    
    return [1n, 1n]
    // return [v1(funds[0], funds[1], 0, margin, C1e9), v1(funds[0], funds[1], 1, margin, C1e9)]
  }