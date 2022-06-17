import { WETH_USDC_PAIR, WETH_ADDRESS, ADDRESS_ZERO, USDC_ADDRESS, WHITELIST } from '../../packages/constants'
import { Pair, Token, Bundle } from '../types'
import { ZERO_BD, factoryContract, ONE_BD, numberToBigDecimal, bigDecimalToNumber } from './helpers'
import BigDecimal from 'bignumber.js'

export async function getEthPriceInUSD(): Promise<BigDecimal> {
  let usdcPair = await Pair.get(WETH_USDC_PAIR)

  if (usdcPair !== null) {
    let isUsdcFirst = usdcPair.token0Id == USDC_ADDRESS
    return isUsdcFirst 
      ? numberToBigDecimal(usdcPair.token0Price)
      : numberToBigDecimal(usdcPair.token1Price)
  } else {
    logger.warn('No usdcPair', [])
    return ZERO_BD
  }
}

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
let MINIMUM_USD_THRESHOLD_NEW_PAIRS = new BigDecimal('3000')

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = new BigDecimal('5')

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export async function findEthPerToken(token: Token): Promise<BigDecimal> {
  if (token.id == WETH_ADDRESS) {
    return ONE_BD
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(token.id, WHITELIST[i])
    if (pairAddress != ADDRESS_ZERO) {
      let pair = await Pair.get(pairAddress.toHexString())
      if (pair.token0Id == token.id && pair.reserveETH > bigDecimalToNumber(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        let token1 = await Token.get(pair.token1Id)
        return numberToBigDecimal(pair.token1Price * token1.derivedETH) // return token1 per our token * Eth per token 1
      }
      if (pair.token1Id == token.id && pair.reserveETH > bigDecimalToNumber(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        let token0 = await Token.get(pair.token0Id)
        return numberToBigDecimal(pair.token1Price * token0.derivedETH) // return token0 per our token * ETH per token 0
      }
    }
  }
  return ZERO_BD // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export async function getTrackedVolumeUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
  pair: Pair
): Promise<BigDecimal> {
  let bundle = await Bundle.get('1')
  let price0 = token0.derivedETH * bundle.ethPrice
  let price1 = token1.derivedETH * bundle.ethPrice

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  if (Number(pair.liquidityProviderCount) < 5) {
    let reserve0USD = pair.reserve0 * price0
    let reserve1USD = pair.reserve1 * price1
    if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      if ((reserve0USD + reserve1USD) < bigDecimalToNumber(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return ZERO_BD
      }
    }
    if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
      if ((reserve0USD * 2) < bigDecimalToNumber(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return ZERO_BD
      }
    }
    if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      if ((reserve1USD * 2) < bigDecimalToNumber(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return ZERO_BD
      }
    }
  }

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(numberToBigDecimal(price0))
      .plus(tokenAmount1.times(numberToBigDecimal(price1)))
      .div(new BigDecimal('2'))
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(numberToBigDecimal(price0))
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(numberToBigDecimal(price1))
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export async function getTrackedLiquidityUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): Promise<BigDecimal> {
  let bundle = await Bundle.get('1')
  let price0 = token0.derivedETH * bundle.ethPrice
  let price1 = token1.derivedETH * bundle.ethPrice

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(numberToBigDecimal(price0))
      .plus(tokenAmount1.times(numberToBigDecimal(price1)))
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(numberToBigDecimal(price0))
      .times(new BigDecimal('2'))
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1
      .times(numberToBigDecimal(price1))
      .times(new BigDecimal('2'))
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}
